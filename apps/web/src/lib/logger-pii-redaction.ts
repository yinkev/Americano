/**
 * PII Redaction Utilities for Structured Logging
 *
 * Epic 3 - Observability Infrastructure
 *
 * Features:
 * - Email address redaction
 * - Query hashing (for searchable audit trails)
 * - Medical PHI detection and redaction
 * - Sensitive pattern matching
 * - GDPR/HIPAA compliance
 *
 * Usage:
 * ```typescript
 * import { redactPII, hashSensitiveData } from '@/lib/logger-pii-redaction'
 *
 * const safeMessage = redactPII('User john@example.com searched for diabetes')
 * // => 'User [EMAIL_REDACTED] searched for diabetes'
 *
 * const queryHash = hashSensitiveData('cardiac conduction system')
 * // => 'sha256:a3f2b...'
 * ```
 */

import { createHash } from 'crypto'

/**
 * Common PII patterns
 */
const PII_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone numbers (various formats)
  phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,

  // SSN (XXX-XX-XXXX)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

  // Credit card numbers (simplified)
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // IP addresses (may contain location info)
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

  // Medical Record Numbers (MRN) - common patterns
  mrn: /\bMRN[-:\s]?\d{6,10}\b/gi,

  // Patient identifiers (case-insensitive)
  patientId: /\b(?:patient|pt)[-_\s]?(?:id)?[-:\s]?\w{6,20}\b/gi,
}

/**
 * Medical PHI keywords that may contain sensitive information
 * These are logged as hashes to maintain audit trails while protecting PHI
 */
const MEDICAL_PHI_KEYWORDS = [
  'patient',
  'diagnosis',
  'condition',
  'medication',
  'prescription',
  'treatment',
  'symptom',
  'allergy',
  'procedure',
  'surgery',
  'vital signs',
  'lab result',
  'imaging',
]

/**
 * Redact PII from text
 *
 * @param text - Text that may contain PII
 * @param preserveLength - Whether to preserve original length with asterisks
 * @returns Text with PII redacted
 *
 * @example
 * ```typescript
 * redactPII('Contact me at john@example.com')
 * // => 'Contact me at [EMAIL_REDACTED]'
 *
 * redactPII('Phone: 555-123-4567', true)
 * // => 'Phone: [PHONE_REDACTED]'
 * ```
 */
export function redactPII(text: string, preserveLength = false): string {
  if (!text) return text

  let redacted = text

  // Redact emails
  redacted = redacted.replace(PII_PATTERNS.email, (match) =>
    preserveLength ? '*'.repeat(match.length) : '[EMAIL_REDACTED]',
  )

  // Redact phone numbers
  redacted = redacted.replace(PII_PATTERNS.phone, (match) =>
    preserveLength ? '*'.repeat(match.length) : '[PHONE_REDACTED]',
  )

  // Redact SSN
  redacted = redacted.replace(PII_PATTERNS.ssn, (match) =>
    preserveLength ? '*'.repeat(match.length) : '[SSN_REDACTED]',
  )

  // Redact credit cards
  redacted = redacted.replace(PII_PATTERNS.creditCard, (match) =>
    preserveLength ? '*'.repeat(match.length) : '[CARD_REDACTED]',
  )

  // Redact IP addresses (may reveal location)
  redacted = redacted.replace(PII_PATTERNS.ipAddress, (match) =>
    preserveLength ? '*'.repeat(match.length) : '[IP_REDACTED]',
  )

  // Redact MRN
  redacted = redacted.replace(PII_PATTERNS.mrn, (match) =>
    preserveLength ? '*'.repeat(match.length) : '[MRN_REDACTED]',
  )

  // Redact patient IDs
  redacted = redacted.replace(PII_PATTERNS.patientId, (match) =>
    preserveLength ? '*'.repeat(match.length) : '[PATIENT_ID_REDACTED]',
  )

  return redacted
}

/**
 * Hash sensitive data for audit trails
 * Use this for search queries, concept names, etc. where you need to:
 * - Track that a search occurred
 * - Correlate multiple searches of the same term
 * - Avoid storing actual medical terms that may be PHI
 *
 * @param data - Sensitive data to hash
 * @param algorithm - Hash algorithm (default: sha256)
 * @returns Hash with algorithm prefix
 *
 * @example
 * ```typescript
 * hashSensitiveData('cardiac conduction system')
 * // => 'sha256:a3f2b8c...'
 *
 * // Same query always produces same hash
 * hashSensitiveData('diabetes mellitus') === hashSensitiveData('diabetes mellitus')
 * // => true
 * ```
 */
export function hashSensitiveData(
  data: string,
  algorithm: 'sha256' | 'md5' = 'sha256',
): string {
  if (!data) return ''

  const hash = createHash(algorithm).update(data.toLowerCase().trim()).digest('hex')

  // Return with algorithm prefix for clarity
  return `${algorithm}:${hash.substring(0, 16)}...` // Shortened for log readability
}

/**
 * Check if text contains medical PHI keywords
 *
 * @param text - Text to check
 * @returns True if text contains PHI keywords
 */
export function containsMedicalPHI(text: string): boolean {
  if (!text) return false

  const lowerText = text.toLowerCase()
  return MEDICAL_PHI_KEYWORDS.some((keyword) => lowerText.includes(keyword))
}

/**
 * Redact medical PHI from text
 * More aggressive redaction for medical content
 *
 * @param text - Text that may contain medical PHI
 * @returns Text with medical PHI redacted or hashed
 */
export function redactMedicalPHI(text: string): string {
  if (!text) return text

  // First apply standard PII redaction
  const redacted = redactPII(text)

  // If contains medical PHI keywords, hash the entire text
  if (containsMedicalPHI(redacted)) {
    return `[MEDICAL_CONTENT:${hashSensitiveData(text)}]`
  }

  return redacted
}

/**
 * Sanitize query string for logging
 * Redacts PII but preserves query structure for analytics
 *
 * @param query - Search query
 * @returns Sanitized query or hash
 *
 * @example
 * ```typescript
 * sanitizeQuery('cardiac conduction system')
 * // => 'sha256:a3f2b...'
 *
 * sanitizeQuery('Contact Dr. Smith at john@example.com')
 * // => 'Contact Dr. Smith at [EMAIL_REDACTED]'
 * ```
 */
export function sanitizeQuery(query: string): string {
  if (!query) return ''

  // Hash medical queries to protect PHI while maintaining audit trail
  if (containsMedicalPHI(query)) {
    return hashSensitiveData(query)
  }

  // Redact any PII in non-medical queries
  return redactPII(query)
}

/**
 * Sanitize URL for logging
 * Removes query parameters that may contain PII
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL
 */
export function sanitizeURL(url: string): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url, 'http://dummy.com')

    // Remove sensitive query parameters
    const sensitiveParams = ['email', 'token', 'api_key', 'apiKey', 'password', 'session', 'ssn']

    for (const param of sensitiveParams) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]')
      }
    }

    // Return path + sanitized query params (no protocol/host)
    return `${urlObj.pathname}${urlObj.search}`
  } catch {
    // If URL parsing fails, redact the entire thing
    return redactPII(url)
  }
}

/**
 * Sanitize error message for logging
 * Removes stack traces that may contain file paths with usernames
 *
 * @param error - Error object or message
 * @returns Sanitized error message
 */
export function sanitizeError(error: unknown): string {
  if (!error) return ''

  let message = ''

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else {
    message = String(error)
  }

  // Redact PII from error message
  message = redactPII(message)

  // Remove file paths that may contain usernames
  message = message.replace(/\/Users\/[^/]+\//g, '/Users/[USER]/')
  message = message.replace(/C:\\Users\\[^\\]+\\/g, 'C:\\Users\\[USER]\\')

  return message
}

/**
 * Create a safe metadata object by redacting PII from all string values
 *
 * @param metadata - Metadata object
 * @returns Sanitized metadata
 */
export function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      // Hash queries and search terms
      if (key.toLowerCase().includes('query') || key.toLowerCase().includes('search')) {
        sanitized[key] = sanitizeQuery(value)
      }
      // Redact URLs
      else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('path')) {
        sanitized[key] = sanitizeURL(value)
      }
      // Redact errors
      else if (key.toLowerCase().includes('error')) {
        sanitized[key] = sanitizeError(value)
      }
      // Generic PII redaction
      else {
        sanitized[key] = redactPII(value)
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>)
    } else {
      // Keep non-string values as-is (numbers, booleans, etc.)
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Check if a field name suggests it contains PII
 *
 * @param fieldName - Field name to check
 * @returns True if field name suggests PII
 */
export function isPIIField(fieldName: string): boolean {
  const piiFieldPatterns = [
    'email',
    'phone',
    'ssn',
    'password',
    'token',
    'api_key',
    'apikey',
    'secret',
    'credit_card',
    'creditcard',
    'patient_name',
    'patientname',
    'address',
    'dob',
    'birthdate',
    'medical_record',
  ]

  const lowerFieldName = fieldName.toLowerCase()
  return piiFieldPatterns.some((pattern) => lowerFieldName.includes(pattern))
}

/**
 * Redact PII from JSON object
 * Recursively redacts PII from object properties
 *
 * @param obj - Object to redact
 * @returns Redacted object
 */
export function redactPIIFromObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj

  // Use a writable, indexable accumulator to avoid TS2862 when assigning by dynamic keys
  const redactedRecord: Record<string, unknown> = { ...obj }

  for (const [key, value] of Object.entries(obj)) {
    // If field name suggests PII, redact completely
    if (isPIIField(key)) {
      redactedRecord[key] = '[REDACTED]'
    }
    // If value is string, apply PII redaction
    else if (typeof value === 'string') {
      redactedRecord[key] = redactPII(value)
    }
    // If value is nested object, recurse
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      redactedRecord[key] = redactPIIFromObject(value as Record<string, unknown>)
    } else {
      // Preserve non-string primitives and arrays as-is
      redactedRecord[key] = value
    }
  }

  return redactedRecord as T
}

/**
 * Export all redaction utilities
 */
export const PIIRedaction = {
  redactPII,
  hashSensitiveData,
  containsMedicalPHI,
  redactMedicalPHI,
  sanitizeQuery,
  sanitizeURL,
  sanitizeError,
  sanitizeMetadata,
  isPIIField,
  redactPIIFromObject,
}
