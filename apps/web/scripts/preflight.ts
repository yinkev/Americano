// Preflight assertions for personal deploy of Epic 4
// - Validates required env vars
// - Pins embedding model/dimension from env
// - Verifies DB vector dimensions (1536) if data present
//
// Usage:
//   npx tsx apps/web/scripts/preflight.ts
//
// References:
// - docs/deployments/epic4-db-verification.md (§6 vector dims)
// - apps/web/src/lib/ai/gemini-client.ts (env model/dim pin)
// - apps/web/src/lib/embedding-service.ts (env dim check)

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

type Check = {
  name: string
  ok: boolean
  details?: string
}

async function main() {
  const checks: Check[] = []

  // 1) Env: GEMINI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  checks.push({
    name: 'Env:GEMINI_API_KEY',
    ok: Boolean(geminiKey && geminiKey.length > 0),
    details: geminiKey ? 'present' : 'missing'
  })

  // 2) Env: GEMINI_EMBEDDING_MODEL (optional, will default), GEMINI_EMBEDDING_DIM (recommended)
  const model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
  const dimStr = process.env.GEMINI_EMBEDDING_DIM
  let dimOk = true
  let dim = 1536
  if (dimStr) {
    const parsed = parseInt(dimStr, 10)
    if (Number.isNaN(parsed) || parsed <= 0) {
      dimOk = false
    } else {
      dim = parsed
    }
  }

  checks.push({
    name: 'Env:GEMINI_EMBEDDING_MODEL',
    ok: true,
    details: model
  })
  checks.push({
    name: 'Env:GEMINI_EMBEDDING_DIM',
    ok: dimOk,
    details: dimStr ? (dimOk ? dimStr : 'invalid number') : 'not set (will skip strict DB dim match)'
  })

  // 3) DB vector dims check (content_chunks)
  //    This is robust to empty tables or missing embeddings; only strict if env dim is set and rows exist.
  const prisma = new PrismaClient()
  try {
    const rows = await prisma.$queryRawUnsafe<{ dims: number; count: string }[]>(
      `
        SELECT vector_dims(embedding) AS dims, COUNT(*)::text
        FROM content_chunks
        WHERE embedding IS NOT NULL
        GROUP BY 1
        ORDER BY 1
      `
    )

    if (!rows || rows.length === 0) {
      checks.push({
        name: 'DB:vector_dims(content_chunks)',
        ok: true,
        details: 'no embeddings found (OK for fresh DB)'
      })
    } else {
      // If env dim set, require exact match; else just report found dims
      if (dimStr) {
        const uniqueDims = new Set(rows.map(r => r.dims))
        const onlyOne = uniqueDims.size === 1
        const matches = onlyOne && [...uniqueDims][0] === dim
        checks.push({
          name: 'DB:vector_dims(content_chunks) == GEMINI_EMBEDDING_DIM',
          ok: matches,
          details: rows.map(r => `dims=${r.dims} count=${r.count}`).join(', ')
        })
      } else {
        checks.push({
          name: 'DB:vector_dims(content_chunks)',
          ok: true,
          details: rows.map(r => `dims=${r.dims} count=${r.count}`).join(', ')
        })
      }
    }
  } catch (err: any) {
    // If vector_dims() or table is missing, do not hard-fail in personal setup—report as warning
    checks.push({
      name: 'DB:vector_dims(content_chunks)',
      ok: false,
      details: `query failed (${err?.message || 'unknown error'})`
    })
  } finally {
    await prisma.$disconnect()
  }

  // 4) Rate limiter + PII logger files existence check (lightweight)
  const fs = await import('node:fs')
  const filesToCheck = [
    'apps/web/src/lib/rate-limiter.ts',
    'apps/web/src/lib/logger-pii-redaction.ts'
  ]
  for (const f of filesToCheck) {
    const exists = fs.existsSync(f)
    checks.push({
      name: `FS:${f}`,
      ok: exists,
      details: exists ? 'present' : 'missing'
    })
  }

  // Summary
  const failures = checks.filter(c => !c.ok)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Preflight Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  for (const c of checks) {
    console.log(`${c.ok ? '✅' : '❌'} ${c.name}${c.details ? ` — ${c.details}` : ''}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (failures.length > 0) {
    console.error(`Preflight FAILED (${failures.length} checks)`)
    process.exit(1)
  } else {
    console.log('Preflight PASSED')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Preflight crashed:', err)
  process.exit(1)
})