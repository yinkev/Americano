// Golden-path smoke script (personal/staging)
// Usage:
//   API_URL=http://localhost:8000 pnpm --filter @americano/web smoke
//
// Checks (non-destructive):
// 1) Analytics service health
// 2) Adaptive: next question (mock bank)
// 3) Validation: scenarios metrics (mock data)
// 4) Validation: get scenario by ID (mock retrieval)
// 5) Analytics: dashboard summary (DB-backed; may WARN if DB not ready)

type CheckResult = {
  name: string
  ok: boolean
  status: string
  details?: string
  critical?: boolean
}

const API = process.env.API_URL || 'http://localhost:8000'

async function httpGet(path: string) {
  const res = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    // leave as text
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

async function httpPost(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

function summarizeData(data: unknown): string {
  if (data == null) return 'no body'
  if (typeof data === 'string') return data.slice(0, 120)
  if (typeof data === 'object') {
    try {
      const keys = Object.keys(data as Record<string, unknown>)
      return `keys=[${keys.slice(0, 6).join(', ')}]`
    } catch {
      return 'object'
    }
  }
  return typeof data
}

async function run(): Promise<number> {
  const checks: CheckResult[] = []

  // 1) Analytics health (critical)
  try {
    const r = await httpGet('/analytics/health')
    checks.push({
      name: 'Analytics:health',
      ok: r.ok,
      status: `${r.status}`,
      details: summarizeData(r.data),
      critical: true,
    })
  } catch (e: any) {
    checks.push({
      name: 'Analytics:health',
      ok: false,
      status: 'crash',
      details: e?.message || String(e),
      critical: true,
    })
  }

  // 2) Adaptive next question (mock data; critical)
  try {
    const body = {
      session_id: 'smoke-session',
      objective_id: 'obj_smoke',
      // first question path doesn't require current_difficulty
    }
    const r = await httpPost('/adaptive/question/next', body)
    checks.push({
      name: 'Adaptive:question/next',
      ok: r.ok,
      status: `${r.status}`,
      details: summarizeData(r.data),
      critical: true,
    })
  } catch (e: any) {
    checks.push({
      name: 'Adaptive:question/next',
      ok: false,
      status: 'crash',
      details: e?.message || String(e),
      critical: true,
    })
  }

  // 3) Validation scenarios metrics (mock, safe)
  try {
    const r = await httpGet('/validation/scenarios/metrics?dateRange=7days')
    checks.push({
      name: 'Validation:scenarios/metrics',
      ok: r.ok,
      status: `${r.status}`,
      details: summarizeData(r.data),
    })
  } catch (e: any) {
    checks.push({
      name: 'Validation:scenarios/metrics',
      ok: false,
      status: 'crash',
      details: e?.message || String(e),
    })
  }

  // 4) Validation get scenario by ID (mock retrieval, ID must start with "scenario_")
  try {
    const r = await httpGet('/validation/scenarios/scenario_smoke')
    checks.push({
      name: 'Validation:scenarios/{id}',
      ok: r.ok,
      status: `${r.status}`,
      details: summarizeData(r.data),
    })
  } catch (e: any) {
    checks.push({
      name: 'Validation:scenarios/{id}',
      ok: false,
      status: 'crash',
      details: e?.message || String(e),
    })
  }

  // 5) Analytics dashboard (DB-backed; may WARN if DB not ready/empty)
  try {
    const r = await httpGet('/analytics/understanding/dashboard?user_id=smoke-user')
    checks.push({
      name: 'Analytics:dashboard',
      ok: r.ok,
      status: `${r.status}`,
      details: summarizeData(r.data),
    })
  } catch (e: any) {
    checks.push({
      name: 'Analytics:dashboard',
      ok: false,
      status: 'crash',
      details: e?.message || String(e),
    })
  }

  // Output
  const pass = checks.filter((c) => c.ok).length
  const fail = checks.length - pass
  const criticalFail = checks.some((c) => c.critical && !c.ok)

  // Pretty print
  const pad = (s: string, n: number) =>
    s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length)
  console.log('\nGolden-path Smoke Results')
  console.log('=========================')
  console.log(pad('Check', 34), pad('OK', 4), 'Status  Details')
  for (const c of checks) {
    console.log(pad(c.name, 34), pad(c.ok ? '✔' : '✘', 4), pad(c.status, 7), c.details || '')
  }
  console.log('-------------------------')
  console.log(`Total: ${checks.length}, PASS: ${pass}, FAIL: ${fail}`)
  if (criticalFail) {
    console.error('Smoke FAILED (critical checks).')
    return 1
  }
  if (fail > 0) {
    console.warn('Smoke completed with non-critical failures.')
  } else {
    console.log('Smoke PASSED.')
  }
  return 0
}

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Smoke crashed:', err)
    process.exit(1)
  })
