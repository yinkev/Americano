/**
 * Encryption Utilities
 * For encrypting sensitive data like OAuth tokens
 *
 * Uses AES-256-GCM for encryption
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Get encryption key from environment variable
 * In production, use a secure key management service (AWS KMS, Vault, etc.)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable not set. Generate with: openssl rand -hex 32',
    )
  }

  // Ensure key is 32 bytes (64 hex chars)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a string value
 *
 * @param text Plain text to encrypt
 * @returns Encrypted text (base64)
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    // Combine iv + encrypted + tag
    const combined = iv.toString('hex') + encrypted + tag.toString('hex')

    return Buffer.from(combined, 'hex').toString('base64')
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt an encrypted string
 *
 * @param encrypted Encrypted text (base64)
 * @returns Decrypted plain text
 */
export function decrypt(encrypted: string): string {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encrypted, 'base64').toString('hex')

    // Extract components
    const iv = Buffer.from(combined.slice(0, IV_LENGTH * 2), 'hex')
    const tag = Buffer.from(combined.slice(-TAG_LENGTH * 2), 'hex')
    const encryptedText = combined.slice(IV_LENGTH * 2, -TAG_LENGTH * 2)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Generate a new encryption key
 * Use this to generate ENCRYPTION_KEY for .env
 *
 * Usage: node -e "console.log(require('./lib/encryption').generateKey())"
 */
export function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}
