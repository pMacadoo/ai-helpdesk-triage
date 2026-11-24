/**
 * Remove personal details before any text leaves the machine.
 * Tickets often contain emails, phone numbers and sometimes passwords.
 */
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')
    .replace(/(password|passcode|pin)\s*(is|:|=)\s*\S+/gi, '$1 $2 [redacted]');
}
