#!/usr/bin/env tsx
/**
 * Backfill ValidationPrompt.objectiveId by matching conceptName → LearningObjective.objective
 *
 * Usage:
 *   - Dry run (default): npx tsx scripts/backfill-validation-prompt-objective-id.ts
 *   - Apply updates:      npx tsx scripts/backfill-validation-prompt-objective-id.ts --apply
 */

import * as path from 'path'
import { config as dotenvConfig } from 'dotenv'
// Load env BEFORE importing prisma to ensure DATABASE_URL is set
dotenvConfig({ path: path.resolve(__dirname, '../.env') })
console.log(`[backfill] DATABASE_URL=${process.env.DATABASE_URL}`)
import { prisma } from '@/lib/db'

type Prompt = { id: string; conceptName: string; createdAt: Date }
type LO = { id: string; objective: string }

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      )
    }
  }
  return dp[m][n]
}

function similarity(a: string, b: string): number {
  const A = normalize(a)
  const B = normalize(b)
  if (!A.length && !B.length) return 1
  const dist = levenshtein(A, B)
  const maxLen = Math.max(A.length, B.length) || 1
  return 1 - dist / maxLen
}

async function main() {
  const apply = process.argv.includes('--apply')
  const threshold = 0.9

  const prompts = (await prisma.validationPrompt.findMany({
    where: { objectiveId: null },
    select: { id: true, conceptName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })) as Prompt[]

  if (prompts.length === 0) {
    console.log('No prompts require backfill. Done.')
    return
  }

  const objectives = (await prisma.learningObjective.findMany({
    select: { id: true, objective: true },
  })) as LO[]

  const objectiveMap = new Map<string, LO>()
  for (const lo of objectives) {
    objectiveMap.set(normalize(lo.objective), lo)
  }

  let exactMatches = 0
  let fuzzyMatches = 0
  const unmatched: Array<{ id: string; conceptName: string }> = []
  const updates: Array<{ id: string; objectiveId: string }> = []

  for (const p of prompts) {
    const norm = normalize(p.conceptName || '')
    if (!norm) {
      unmatched.push({ id: p.id, conceptName: p.conceptName })
      continue
    }

    // 1) exact normalized match
    const exact = objectiveMap.get(norm)
    if (exact) {
      exactMatches++
      updates.push({ id: p.id, objectiveId: exact.id })
      continue
    }

    // 2) fuzzy best match over all objectives
    let best: LO | null = null
    let bestScore = 0
    for (const lo of objectives) {
      const s = similarity(p.conceptName, lo.objective)
      if (s > bestScore) {
        bestScore = s
        best = lo
      }
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
      unmatched.slice(0, 10).forEach((u) => console.log(`  - ${u.id} :: ${u.conceptName}`))
    }
    console.log('\nDry run only. Re-run with --apply to persist updates.')
    return
  }

  // Apply updates in batches
  const BATCH = 100
  let applied = 0
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH)
    await prisma.$transaction(
      slice.map((u) =>
        prisma.validationPrompt.update({ where: { id: u.id }, data: { objectiveId: u.objectiveId } })
      )
    )
    applied += slice.length
  }

  console.log(`\nApplied updates: ${applied}`)
  if (unmatched.length > 0) {
    console.log(`Unmatched remaining: ${unmatched.length}. Keep objectiveId nullable until resolved.`)
    process.exitCode = 2
  }
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
