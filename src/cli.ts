#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { withClaude } from './claude.js';
import { triage } from './triage.js';
import type { Ticket, Triage } from './types.js';

const args = process.argv.slice(2);
const json = args.includes('--json');
const useClaude = args.includes('--claude');
const file = args.find((a) => !a.startsWith('--'));

if (!file) {
  console.error('Usage: triage <tickets.json> [--json] [--claude]\n  --claude needs ANTHROPIC_API_KEY set.');
  process.exit(1);
}

const tickets = JSON.parse(readFileSync(file, 'utf8')) as Ticket[];
const key = process.env.ANTHROPIC_API_KEY;
if (useClaude && !key) {
  console.error('--claude was given but ANTHROPIC_API_KEY is not set. Running rules only.');
}

const results: Triage[] = [];
for (const t of tickets) {
  const r = triage(t);
  results.push(useClaude && key ? await withClaude(t, r, key).catch(() => r) : r);
}

const order = { P1: 0, P2: 1, P3: 2, P4: 3 } as const;
results.sort((a, b) => order[a.priority] - order[b.priority]);

if (json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    const t = tickets.find((x) => x.id === r.id);
    console.log(`${r.priority}  ${r.category.padEnd(14)} ${r.id}  ${t?.subject ?? ''}`);
    console.log(`    why:   ${r.reasons.join(' ')}`);
    console.log(`    first: ${r.firstSteps[0]}`);
  }
}
