/**
 * Migrated to Trigger.dev. This function is a no-op kept for backwards compatibility.
 * All automation is now handled via trigger/ task files.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function triggerN8n(
  _baseUrl: string | null | undefined,
  _event: string,
  _payload: Record<string, unknown>
): Promise<void> {
  // No-op: automation migrated to Trigger.dev
}
