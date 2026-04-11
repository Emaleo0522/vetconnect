import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
} from "node:crypto";
import { env } from "./env.js";

// ---------------------------------------------------------------------------
// AES-256-GCM encryption / decryption
// Format: base64(iv):base64(authTag):base64(ciphertext)
// ---------------------------------------------------------------------------

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const KEY_LENGTH = 32; // 256-bit key
const SALT = "vetconnect-salt-v1"; // Static salt — key derived per deployment

// Derive a 32-byte key from ENCRYPTION_KEY using PBKDF2
let _derivedKey: Buffer | null = null;

function getDerivedKey(): Buffer {
  if (_derivedKey) return _derivedKey;

  const rawKey = env.ENCRYPTION_KEY;

  // If already 32 bytes (64 hex chars), use directly
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    _derivedKey = Buffer.from(rawKey, "hex");
  } else {
    // Derive with PBKDF2
    _derivedKey = pbkdf2Sync(rawKey, SALT, 100_000, KEY_LENGTH, "sha256");
  }

  return _derivedKey;
}

// ---------------------------------------------------------------------------
// encrypt — AES-256-GCM
// ---------------------------------------------------------------------------

export function encrypt(plaintext: string): string {
  const key = getDerivedKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: base64(iv):base64(authTag):base64(ciphertext)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

// ---------------------------------------------------------------------------
// decrypt — AES-256-GCM
// ---------------------------------------------------------------------------

export function decrypt(ciphertext: string): string {
  const key = getDerivedKey();

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const encrypted = Buffer.from(parts[2], "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// ---------------------------------------------------------------------------
// encryptIfPresent / decryptIfPresent — helpers for nullable fields
// ---------------------------------------------------------------------------

export function encryptIfPresent(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  return encrypt(value);
}

export function decryptIfPresent(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  try {
    return decrypt(value);
  } catch {
    // If decryption fails, the value might be plaintext (pre-encryption data)
    return value;
  }
}
