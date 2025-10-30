/**
 * Jest Setup: Polyfills (runs BEFORE test modules are loaded)
 *
 * This file runs before jest.setup.ts and before individual test files are imported.
 * It's used to expose Node.js Web Crypto API globals that jsdom doesn't provide.
 * Next.js's NextRequest expects these to be available.
 */

// Import Node.js Web API globals into jsdom environment
// Node.js 18+ provides these as globals
try {
  // @ts-expect-error - Node.js globals
  const { fetch, Request, Response, Headers, FormData, Blob, File } = globalThis

  // Ensure these are available to test code
  ;(global as any).fetch = fetch || (global as any).fetch
  ;(global as any).Request = Request || (global as any).Request
  ;(global as any).Response = Response || (global as any).Response
  ;(global as any).Headers = Headers || (global as any).Headers
  ;(global as any).FormData = FormData || (global as any).FormData
  ;(global as any).Blob = Blob || (global as any).Blob
  ;(global as any).File = File || (global as any).File
} catch (e) {
  // Fallback: if nodes globals aren't available, define minimal stubs
  // This shouldn't happen in Node 18+
}

// Ensure crypto API is available
if (typeof (global as any).crypto === 'undefined') {
  try {
    ;(global as any).crypto = require('crypto').webcrypto
  } catch (e) {
    // Fallback crypto
    ;(global as any).crypto = {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      },
    }
  }
}

// Ensure TextEncoder/TextDecoder are available
if (
  typeof (global as any).TextEncoder === 'undefined' ||
  typeof (global as any).TextDecoder === 'undefined'
) {
  try {
    const { TextEncoder, TextDecoder } = require('util')
    ;(global as any).TextEncoder = TextEncoder
    ;(global as any).TextDecoder = TextDecoder
  } catch (e) {
    // Ignore
  }
}
