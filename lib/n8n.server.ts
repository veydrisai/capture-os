/**
 * Fires an event webhook to n8n.
 * Pass the n8nWebhookUrl from workspace settings (the base URL),
 * and the function appends the event path automatically.
 */
export async function triggerN8n(
  baseUrl: string | null | undefined,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!baseUrl) return;
  try {
    await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...payload, timestamp: new Date().toISOString() }),
    });
  } catch (err) {
    console.error(`[n8n] Failed to fire event "${event}":`, err);
  }
}
