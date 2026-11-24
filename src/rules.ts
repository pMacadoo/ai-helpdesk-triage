import type { Category } from './types.js';

/**
 * Keyword signals per category. Weights are deliberately simple and readable:
 * a technician should be able to see why a ticket landed where it did.
 */
export const CATEGORY_SIGNALS: Record<Exclude<Category, 'other'>, Array<[RegExp, number]>> = {
  security: [
    [/\bphish(ing)?\b/i, 3],
    [/\b(suspicious|strange) (email|link|login|sign-?in)\b/i, 3],
    [/\b(ransom|malware|virus|trojan|hacked|compromised)\b/i, 3],
    [/\bclicked (a|the) link\b/i, 2],
    [/\bmfa (prompt|request)s?\b.*\b(didn'?t|did not)\b/i, 3],
  ],
  'account-access': [
    [/\b(password|passcode)\b/i, 2],
    [/\b(locked out|lockout|account (is )?locked)\b/i, 3],
    [/\b(can'?t|cannot|unable to) (log ?in|sign ?in)\b/i, 3],
    [/\b(mfa|2fa|two-factor|authenticator)\b/i, 2],
    [/\b(permission|access denied|no access)\b/i, 2],
  ],
  network: [
    [/\b(wi-?fi|wireless|ethernet|internet|network)\b/i, 2],
    [/\b(vpn)\b/i, 3],
    [/\b(no connection|disconnect(s|ed|ing)?|offline|dropping)\b/i, 2],
    [/\b(dns|ip address|router|switch|firewall)\b/i, 2],
    [/\bslow (internet|network|connection)\b/i, 2],
  ],
  printing: [
    [/\bprint(er|ing|s)?\b/i, 3],
    [/\b(paper jam|toner|scanner|scan to)\b/i, 3],
  ],
  email: [
    [/\b(outlook|inbox|mailbox|calendar invite|shared mailbox)\b/i, 2],
    [/\b(email|e-mail)s? (not|won'?t|isn'?t) (send|sending|arriving|syncing|coming)\b/i, 3],
  ],
  hardware: [
    [/\b(laptop|desktop|monitor|keyboard|mouse|dock(ing station)?|headset|webcam)\b/i, 1],
    [/\b(won'?t (turn|power) on|no power|black screen|blue screen|bsod)\b/i, 3],
    [/\b(battery|charger|charging|overheat(ing)?|fan noise|cracked|spilled)\b/i, 2],
    [/\b(beep(ing|s)?|flicker(ing|s)?)\b/i, 2],
  ],
  software: [
    [/\b(install|update|upgrade|license|activation)\b/i, 2],
    [/\b(crash(es|ed|ing)?|freez(es|ing)|not responding|error (code|message))\b/i, 2],
    [/\b(excel|word|teams|zoom|chrome|edge|adobe|quickbooks)\b/i, 2],
  ],
};

export interface CategoryScore {
  category: Category;
  score: number;
  matched: string[];
}

export function scoreCategories(text: string): CategoryScore[] {
  const scores: CategoryScore[] = [];
  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS) as Array<[Category, Array<[RegExp, number]>]>) {
    let score = 0;
    const matched: string[] = [];
    for (const [pattern, weight] of signals) {
      const m = text.match(pattern);
      if (m) {
        score += weight;
        matched.push(m[0].toLowerCase());
      }
    }
    if (score > 0) scores.push({ category, score, matched });
  }
  return scores.sort((a, b) => b.score - a.score);
}
