#!/usr/bin/env node
/**
 * docs_frontmatter_fix.mjs (skeleton)
 * - Dry-run by default; add --write to apply
 * - Enforces minimal fields: title, description, type, status, owner, created_date, last_updated
 * - Skips docs/deprecated/**
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const write = process.argv.includes('--write')

/** Simple frontmatter parser (skeleton) */
function parseFrontmatter(src) {
  if (!src.startsWith('---')) return { data: {}, body: src }
  const end = src.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: src }
  const fm = src.slice(3, end).trim()
  const body = src.slice(end + 4).replace(/^\n/, '')
  // naive YAML: key: value lines only (sufficient for scaffold)
  const data = {}
  fm.split('\n').forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/)
    if (m) data[m[1]] = m[2].replace(/^"|"$/g, '')
  })
  return { data, body }
}

function stringifyFrontmatter(data, body) {
  const keys = [
    'title','description','type','status','owner','review_cadence','created_date','last_updated','tags'
  ]
  const header = ['---', ...keys.map(k => `${k}: ${JSON.stringify(data[k] ?? '')}`), '---'].join('\n')
  return `${header}\n\n${body}`
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (p.includes('docs/deprecated/')) continue
    if (e.isDirectory()) walk(p, out)
    else if (e.isFile() && p.endsWith('.md')) out.push(p)
  }
  return out
}

function isoNow() {
  return new Date().toISOString()
}

const docsRoot = path.join(root, 'docs')
if (!fs.existsSync(docsRoot)) {
  console.error('docs/ not found')
  process.exit(1)
}

const files = walk(docsRoot)
let changed = 0
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const { data, body } = parseFrontmatter(src)
  const next = { ...data }
  next.title = next.title || path.basename(file).replace(/\.md$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  next.description = next.description || ''
  next.type = next.type || inferType(file)
  next.status = next.status || 'Active'
  next.owner = next.owner || 'Kevy'
  next.review_cadence = next.review_cadence || 'Per Change'
  next.created_date = next.created_date || isoNow()
  next.last_updated = isoNow()
  next.tags = next.tags || []

  const out = stringifyFrontmatter(next, body)
  if (out !== src) {
    changed++
    if (write) fs.writeFileSync(file, out, 'utf8')
    else console.log(`[DRY RUN] would fix frontmatter: ${file}`)
  }
}

console.log(write ? `Updated ${changed} files` : `Would update ${changed} files`)

function inferType(p) {
  if (p.includes('/architecture/')) return 'Architecture'
  if (p.includes('/backend/')) return 'Guide'
  if (p.includes('/frontend/')) return 'Guide'
  if (p.includes('/operations/')) return 'Guide'
  if (p.includes('/setup/')) return 'Guide'
  return 'Guide'
}

