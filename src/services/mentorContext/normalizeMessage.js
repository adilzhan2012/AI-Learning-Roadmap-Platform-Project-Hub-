/**
 * @file normalizeMessage.js
 * @description Standardizes messages across different storage schemas into a single shape:
 * { role: 'user' | 'assistant', content: string, id?: string }
 */

/**
 * Normalizes any chat message object to the standard platform contract.
 * Ensures role is strictly 'user' or 'assistant', content is string, and optional id is preserved.
 *
 * @param {any} msg - Raw input message from any storage source
 * @returns {import('./types.js').NormalizedMessage | null} Normalized message object or null if invalid
 */
export function normalizeMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    return null;
  }

  const rawRole = String(msg.role || '').toLowerCase().trim();
  const role = rawRole === 'assistant' ? 'assistant' : 'user';

  const content = typeof msg.content === 'string'
    ? msg.content
    : msg.content !== undefined && msg.content !== null
      ? String(msg.content)
      : '';

  const normalized = {
    role,
    content
  };

  if (msg.id !== undefined && msg.id !== null) {
    normalized.id = String(msg.id);
  }

  return normalized;
}
