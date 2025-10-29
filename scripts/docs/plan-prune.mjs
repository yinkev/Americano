#!/usr/bin/env node
// Skeleton: read docs/_migration/docs-inventory.txt and suggest basic counts
import fs from 'node:fs'
import path from 'node:path'

const inv = 'docs/_migration/docs-inventory.txt'
if (!fs.existsSync(inv)) {
  console.error('Missing docs/_migration/docs-inventory.txt')
  process.exit(1)
}
const lines = fs.readFileSync(inv, 'utf8').trim().split('\n').filter(Boolean)
const totals = { all: lines.length }
for (const p of lines) {
  const top = p.split('/')[1]
  if (!top || top === '_migration') continue
  totals[top] = (totals[top] || 0) + 1
}
console.log(JSON.stringify({ totals }, null, 2))
console.log('\nTarget reduction: 40-60% active docs; archive stories/sessions/retros; consolidate API/backend/ops.')

