/**
 * Escapes user-controlled strings before inserting into HTML email templates.
 * Prevents XSS injection in outbound alert/notification emails.
 */
export function escHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
