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
