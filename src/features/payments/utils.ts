/**
 * Payment & Checkout Utility Helpers
 */

/**
 * Generate a collision-resistant, human-readable order number.
 * Format: PATEMON-<SHORT_WEDDING_ID>-<TIMESTAMP_BASE36>-<RANDOM>
 * Example: PATEMON-8E4A02F1-LNW3K8-A9B2
 */
export function generateOrderNumber(weddingId: string): string {
  const cleanId = weddingId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const shortId = cleanId.slice(0, 8) || "BALI";
  const timePart = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `PATEMON-${shortId}-${timePart}-${randomSuffix}`;
}
