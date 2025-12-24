import crypto from "crypto";

/**
 * Generates HMAC-SHA256 signature matching API implementation
 * If data is empty, signs only timestamp (no dot)
 * If data exists, signs timestamp.data
 * @param data - Data to sign (empty string for GET requests, JSON string for POST requests)
 * @param secret - Secret key for signing
 * @param timestamp - Timestamp as number (from Date.now())
 * @returns Generated hex signature
 */
export function generateSignature(
  data: string,
  secret: string,
  timestamp: number
): string {
  const hmac = crypto.createHmac("sha256", secret);
  const toSign = data ? `${timestamp}.${data}` : timestamp.toString();
  hmac.update(toSign);
  return hmac.digest("hex");
}

/**
 * Verifies webhook signature
 * @param data - Encrypted payload data (as string)
 * @param signature - Signature from x-signature header
 * @param timestamp - Timestamp from x-timestamp header
 * @param secret - Signature secret
 * @returns True if signature is valid
 */
export function verifySignature(
  data: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  const expected = generateSignature(data, secret, parseInt(timestamp, 10));
  return signature === expected;
}

/**
 * Decrypts webhook payload using AES-256-GCM
 * @param encryptedPayload - Encrypted payload object with iv, data, and tag
 * @param encryptionSecret - Base64-encoded encryption secret
 * @param encryptionSalt - Encryption salt
 * @returns Decrypted JSON string
 */
export function decryptPayload(
  encryptedPayload: { iv: string; data: string; tag: string },
  encryptionSecret: string,
  encryptionSalt: string
): string {
  const key = crypto.pbkdf2Sync(
    Buffer.from(encryptionSecret, "base64"),
    encryptionSalt,
    10000,
    32,
    "sha256"
  );

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encryptedPayload.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(encryptedPayload.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPayload.data, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return decrypted;
}
