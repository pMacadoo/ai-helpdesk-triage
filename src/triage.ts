import { PLAYBOOK } from './kb.js';
import { decidePriority } from './priority.js';
import { scoreCategories } from './rules.js';
import type { Category, Ticket, Triage } from './types.js';

const MIN_SCORE = 2;

/** Triage one ticket with rules only. Fast, free, offline and explainable. */
export function triage(ticket: Ticket): Triage {
  const text = `${ticket.subject}\n${ticket.body}`;
  // A lone device noun ("desktop", "mouse") is not enough to call a category.
  const scores = scoreCategories(text).filter((s) => s.score >= MIN_SCORE);
  const top = scores[0];
  const second = scores[1];

  // Security wins any tie: a phishing ticket that also mentions a password is still security.
  const security = scores.find((s) => s.category === 'security');
  const chosen = security && security.score >= (top?.score ?? 0) - 1 ? security : top;
  const category: Category = chosen?.category ?? 'other';

  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const confidence = chosen ? round(chosen.score / total) : 0;

  const reasons: string[] = [];
  if (chosen) reasons.push(`Category "${category}" from: ${chosen.matched.join(', ')}.`);
  else reasons.push('No clear signals: needs a person to read it.');
  if (second && chosen && second.category !== chosen.category && second.score >= chosen.score - 1) {
    reasons.push(`Also looks like "${second.category}": check before assigning.`);
  }

  const { priority, reasons: why } = decidePriority(ticket, category);
  const play = PLAYBOOK[category];
  return {
    id: ticket.id,
    category,
    priority,
    reasons: [...reasons, ...why],
    firstSteps: play.firstSteps,
    askReporter: play.askReporter,
    confidence,
    source: 'rules',
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
