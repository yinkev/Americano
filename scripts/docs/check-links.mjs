#!/usr/bin/env node
// Skeleton: list active docs and show how to run markdown-link-check
import fs from 'node:fs'
import path from 'node:path'

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (p.includes('docs/deprecated/')) continue
    if (e.isDirectory()) yield* walk(p)
    else if (e.isFile() && p.endsWith('.md')) yield p
  }
}

const root = process.cwd()
const docs = path.join(root, 'docs')
if (!fs.existsSync(docs)) {
  console.error('docs/ not found')
  process.exit(1)
}

const files = Array.from(walk(docs))
console.log(JSON.stringify({ count: files.length, files }, null, 2))
console.log('\n# To run:\n# npx markdown-link-check -q -c .markdown-link-check.json <file>')

