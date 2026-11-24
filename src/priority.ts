import type { Category, Priority, Ticket } from './types.js';

const OUTAGE = /\b(everyone|whole (office|team|floor)|all users|nobody can|entire|outage|down for)\b/i;
const BLOCKED = /\b(can'?t work|cannot work|blocked|stopped working|urgent|asap|deadline|client (is )?waiting)\b/i;
const DEAD = /\b(won'?t (turn|power|boot) on|won'?t boot|no power|black screen|blue screen|bsod)\b/i;
const MINOR = /\b(when you (get a|have) (chance|minute)|no rush|not urgent|nice to have|cosmetic|question)\b/i;

export interface PriorityResult {
  priority: Priority;
  reasons: string[];
}

/**
 * Impact first, then urgency. Security incidents are never below P2,
 * because the cost of waiting grows by the minute.
 */
export function decidePriority(ticket: Ticket, category: Category): PriorityResult {
  const text = `${ticket.subject}\n${ticket.body}`;
  const reasons: string[] = [];
  const many = (ticket.usersAffected ?? 0) >= 5 || OUTAGE.test(text);

  if (category === 'security') {
    reasons.push('Possible security incident: handled ahead of routine work.');
    if (many) {
      reasons.push('More than one person may be affected.');
      return { priority: 'P1', reasons };
    }
    return { priority: 'P2', reasons };
  }
  if (many) {
    reasons.push('Affects several people or a whole site.');
    return { priority: 'P1', reasons };
  }
  if (DEAD.test(text)) {
    reasons.push("The person's main device won't start, so they can't work.");
    return { priority: 'P2', reasons };
  }
  if (BLOCKED.test(text)) {
    reasons.push('The reporter says they are blocked or up against a deadline.');
    return { priority: 'P2', reasons };
  }
  if (MINOR.test(text)) {
    reasons.push('The reporter says it can wait.');
    return { priority: 'P4', reasons };
  }
  reasons.push('One person affected, with a workaround likely.');
  return { priority: 'P3', reasons };
}
