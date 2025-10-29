"use client"
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { rqDefaults } from '../../lib/query/defaults'
import { useHealth } from '../../lib/api/queries'

function HealthInner() {
  const { data, isLoading, isError, error } = useHealth()
  if (isLoading) {
    return (
      <div className="rounded-md border border-gray-200 p-4 text-sm text-gray-600">Checking service health…</div>
    )
  }
  if (isError) {
    const e = error as any
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="font-medium">Health check failed</div>
        <div>{e?.message ?? 'Unknown error'}</div>
      </div>
    )
  }
  return (
    <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4">
      <div className="text-sm text-emerald-800">Service: {data?.service ?? 'api'}</div>
      <div className="text-sm font-medium text-emerald-900">Status: {data?.status ?? 'ok'}</div>
      {/* synthesized: exact fields depend on backend response shape */}
    </div>
  )
}

export default function Page() {
  const [client] = React.useState(() => new QueryClient({ defaultOptions: rqDefaults }))
  return (
    <QueryClientProvider client={client}>
      <main className="mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-xl font-semibold">Health</h1>
        <HealthInner />
      </main>
    </QueryClientProvider>
  )
}

