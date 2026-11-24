import { redact } from './redact.js';
import type { Category, Priority, Ticket, Triage } from './types.js';

const CATEGORIES: Category[] = ['hardware', 'software', 'network', 'account-access', 'printing', 'email', 'security', 'other'];
const PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

interface ClaudeOpinion {
  category: Category;
  priority: Priority;
  reason: string;
}

/**
 * Ask Claude for a second opinion on a rules result. Personal details are
 * redacted first. Claude may change the category only when the rules were
 * unsure, and may raise a priority but never lower a security ticket.
 */
export async function withClaude(ticket: Ticket, rules: Triage, apiKey: string, model = 'claude-haiku-5-5'): Promise<Triage> {
  const prompt = [
    'You triage IT help desk tickets. Reply with JSON only:',
    '{"category": one of ' + JSON.stringify(CATEGORIES) + ', "priority": one of ' + JSON.stringify(PRIORITIES) + ', "reason": one short sentence}.',
    'P1 = many people blocked or active security incident. P2 = one person blocked or possible security issue. P3 = normal. P4 = can wait.',
    `A rules engine said: category ${rules.category}, priority ${rules.priority}.`,
    '',
    `Subject: ${redact(ticket.subject)}`,
    `Body: ${redact(ticket.body)}`,
  ].join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 200, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
  const opinion = parseOpinion(text);
  return opinion ? merge(rules, opinion) : rules;
}

export function parseOpinion(text: string): ClaudeOpinion | null {
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  try {
    const o = JSON.parse(json) as Partial<ClaudeOpinion>;
    if (!o.category || !CATEGORIES.includes(o.category)) return null;
    if (!o.priority || !PRIORITIES.includes(o.priority)) return null;
    return { category: o.category, priority: o.priority, reason: String(o.reason ?? '').slice(0, 200) };
  } catch {
    return null;
  }
}

export function merge(rules: Triage, o: ClaudeOpinion): Triage {
  const out: Triage = { ...rules, reasons: [...rules.reasons], source: 'rules+claude' };
  if (o.category !== rules.category && rules.confidence < 0.6) {
    out.category = o.category;
    out.reasons.push(`Claude re-categorized as "${o.category}": ${o.reason}`);
  }
  const raise = PRIORITIES.indexOf(o.priority) < PRIORITIES.indexOf(rules.priority);
  if (raise) {
    out.priority = o.priority;
    out.reasons.push(`Claude raised priority to ${o.priority}: ${o.reason}`);
  } else if (o.reason) {
    out.reasons.push(`Claude: ${o.reason}`);
  }
  return out;
}
