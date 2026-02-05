/**
 * ShadowSwap Crypto Utilities
 * 
 * Provides encryption utilities for private intent submission.
 * Uses Web Crypto API (native) for key derivation and AES-GCM encryption.
 * 
 * Flow:
 * 1. User signs a message with their wallet
 * 2. The signature is used to derive a deterministic encryption key
 * 3. Intent data is encrypted before being sent to the backend
 * 4. Only the user can decrypt their own intents (using the same signature)
 */

/**
 * Generate a deterministic encryption key from a wallet signature.
 * Uses HKDF (HMAC-based Key Derivation Function) for secure key derivation.
 * 
 * @param signature - The hex signature from wallet (0x prefixed)
 * @returns Base64 encoded derived key
 */
export async function generateKeyFromSignature(signature: string): Promise<string> {
  // Remove 0x prefix if present and convert to bytes
  const sigBytes = hexToBytes(signature.startsWith('0x') ? signature.slice(2) : signature);
  
  // Import signature as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    sigBytes.buffer as ArrayBuffer,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );
  
  // Derive an AES-GCM key using HKDF
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('ShadowSwap-v1'), // Fixed salt for determinism
      info: new TextEncoder().encode('intent-encryption'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // extractable (for storage)
    ['encrypt', 'decrypt']
  );
  
  // Export the key as raw bytes and encode to Base64
  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  return bytesToBase64(new Uint8Array(exportedKey));
}

/**
 * Encrypt intent data using AES-GCM.
 * Produces a compact, URL-safe encrypted string.
 * 
 * @param data - The intent object to encrypt
 * @param keyBase64 - Base64 encoded encryption key (from generateKeyFromSignature)
 * @returns Encrypted string in format: base64(iv:ciphertext)
 */
export async function encryptIntent(data: object, keyBase64: string): Promise<string> {
  const keyBytes = base64ToBytes(keyBase64);
  
  // Import the key for encryption
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );
  
  // Combine IV and ciphertext: iv (12 bytes) + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return bytesToBase64(combined);
}

/**
 * Decrypt intent data using AES-GCM.
 * Reverses the encryption performed by encryptIntent.
 * 
 * @param encryptedData - Encrypted string from encryptIntent
 * @param keyBase64 - Base64 encoded encryption key
 * @returns Decrypted intent object
 */
export async function decryptIntent<T = object>(encryptedData: string, keyBase64: string): Promise<T> {
  const keyBytes = base64ToBytes(keyBase64);
  const combined = base64ToBytes(encryptedData);
  
  // Import the key for decryption
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext.buffer as ArrayBuffer
  );
  
  return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * Generate a unique intent ID using crypto.randomUUID.
 * Falls back to timestamp-based ID if randomUUID is not available.
 * 
 * @returns Unique intent identifier
 */
export function generateIntentId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `intent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Hash data using SHA-256.
 * Useful for creating intent fingerprints.
 * 
 * @param data - String data to hash
 * @returns Hex encoded hash
 */
export async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// ============ Helper Functions ============

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert Uint8Array to Base64 string (URL-safe)
 */
function bytesToBase64(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  // Make URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert Base64 string to Uint8Array (handles URL-safe)
 */
function base64ToBytes(base64: string): Uint8Array {
  // Restore standard Base64
  let normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (normalized.length % 4) {
    normalized += '=';
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ============ Type Exports ============

export interface EncryptedIntent {
  id: string;
  encryptedData: string;
  timestamp: number;
  userAddress: string;
}
