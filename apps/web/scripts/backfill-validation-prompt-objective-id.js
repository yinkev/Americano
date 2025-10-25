#!/usr/bin/env node
// Backfill ValidationPrompt.objectiveId by matching conceptName → LearningObjective.objective
// Usage: node scripts/backfill-validation-prompt-objective-id.js [--apply]

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

function similarity(a, b) {
  const A = normalize(a), B = normalize(b)
  if (!A.length && !B.length) return 1
  const dist = levenshtein(A, B)
  const maxLen = Math.max(A.length, B.length) || 1
  return 1 - dist / maxLen
}

async function main() {
  const apply = process.argv.includes('--apply')
  const threshold = 0.9

  const prompts = await prisma.validationPrompt.findMany({
    where: { objectiveId: null },
    select: { id: true, conceptName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  if (prompts.length === 0) {
    console.log('No prompts require backfill. Done.')
    return
  }

  const objectives = await prisma.learningObjective.findMany({
    select: { id: true, objective: true },
  })

  const objectiveMap = new Map()
  for (const lo of objectives) {
    objectiveMap.set(normalize(lo.objective), lo)
  }

  let exactMatches = 0
  let fuzzyMatches = 0
  const unmatched = []
  const updates = []

  for (const p of prompts) {
    const norm = normalize(p.conceptName)
    if (!norm) {
      unmatched.push({ id: p.id, conceptName: p.conceptName })
      continue
    }

    const exact = objectiveMap.get(norm)
    if (exact) {
      exactMatches++
      updates.push({ id: p.id, objectiveId: exact.id })
      continue
    }

    let best = null, bestScore = 0
    for (const lo of objectives) {
      const s = similarity(p.conceptName, lo.objective)
      if (s > bestScore) { bestScore = s; best = lo }
    }

    if (best && bestScore >= threshold) {
      fuzzyMatches++
      updates.push({ id: p.id, objectiveId: best.id })
    } else {
      unmatched.push({ id: p.id, conceptName: p.conceptName })
    }
  }

  console.log('\nBackfill summary:')
  console.log(`  Prompts needing backfill: ${prompts.length}`)
  console.log(`  Exact matches: ${exactMatches}`)
  console.log(`  Fuzzy matches (>= ${threshold}): ${fuzzyMatches}`)
  console.log(`  Unmatched: ${unmatched.length}`)

  if (!apply) {
    if (unmatched.length) {
      console.log('\nSample unmatched (up to 10):')
      unmatched.slice(0, 10).forEach(u => console.log(`  - ${u.id} :: ${u.conceptName}`))
    }
    console.log('\nDry run only. Re-run with --apply to persist updates.')
    return
  }

  const BATCH = 100
  let applied = 0
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH)
    await prisma.$transaction(slice.map(u =>
      prisma.validationPrompt.update({ where: { id: u.id }, data: { objectiveId: u.objectiveId } })
    ))
    applied += slice.length
  }
  console.log(`\nApplied updates: ${applied}`)
  if (unmatched.length > 0) {
    console.log(`Unmatched remaining: ${unmatched.length}. Keeping objectiveId nullable for now.`)
    process.exitCode = 2
  }
}

main()
  .catch((e) => { console.error('Backfill failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

