/**
 * Token Encryption Utility
 * Story 5.3 Task 6: Calendar Integration - Token Security
 *
 * AES-256-GCM encryption for storing OAuth tokens at rest
 * Implements encryption/decryption with secure key derivation
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 16
const TAG_LENGTH = 16

/**
 * Get encryption key from environment variable
 * Key should be a 32-byte hex string (64 characters)
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.TOKEN_ENCRYPTION_KEY

  if (!keyEnv) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable not set')
  }

  // Derive key using scrypt for additional security
  const salt = Buffer.from(process.env.TOKEN_ENCRYPTION_SALT || 'americano-salt-v1', 'utf8')
  const key = scryptSync(keyEnv, salt, KEY_LENGTH)

  return key
}

/**
 * Encrypt OAuth token using AES-256-GCM
 * Story 5.3 constraint: Encrypt calendar tokens at rest (AES-256)
 *
 * @param plaintext Token to encrypt
 * @returns Encrypted token with IV and auth tag (format: iv:encrypted:tag)
 */
export function encryptToken(plaintext: string): string {
  try {
    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    // Return format: iv:encrypted:tag (all hex encoded)
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`
  } catch (error) {
    console.error('Token encryption failed:', error)
    throw new Error('Failed to encrypt token')
  }
}

/**
 * Decrypt OAuth token using AES-256-GCM
 *
 * @param encryptedToken Encrypted token (format: iv:encrypted:tag)
 * @returns Decrypted plaintext token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedToken.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format')
    }

    const [ivHex, encryptedHex, tagHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Token decryption failed:', error)
    throw new Error('Failed to decrypt token')
  }
}

/**
 * Validate that encryption/decryption works correctly
 * Used for testing and initialization checks
 */
export function validateEncryption(): boolean {
  try {
    const testToken = 'test-token-' + Date.now()
    const encrypted = encryptToken(testToken)
    const decrypted = decryptToken(encrypted)

    return testToken === decrypted
  } catch (error) {
    console.error('Encryption validation failed:', error)
    return false
  }
}
