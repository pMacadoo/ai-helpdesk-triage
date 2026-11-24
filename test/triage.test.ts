import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { triage } from '../src/triage.js';
import { merge, parseOpinion } from '../src/claude.js';
import { redact } from '../src/redact.js';
import type { Ticket } from '../src/types.js';

const tickets = JSON.parse(readFileSync(new URL('../samples/tickets.json', import.meta.url), 'utf8')) as Ticket[];
const byId = (id: string) => triage(tickets.find((t) => t.id === id)!);

describe('triage rules', () => {
  it('treats a site-wide outage as P1 network', () => {
    const r = byId('T-1001');
    expect(r.category).toBe('network');
    expect(r.priority).toBe('P1');
  });
  it('puts phishing ahead of a password mention', () => {
    const r = byId('T-1002');
    expect(r.category).toBe('security');
    expect(r.priority).toBe('P2');
  });
  it('flags a lockout with a waiting client as P2 account access', () => {
    const r = byId('T-1003');
    expect(r.category).toBe('account-access');
    expect(r.priority).toBe('P2');
  });
  it('respects "no rush"', () => {
    const r = byId('T-1004');
    expect(r.category).toBe('printing');
    expect(r.priority).toBe('P4');
  });
  it('routes power and spills to hardware', () => {
    expect(byId('T-1005').category).toBe('hardware');
    expect(byId('T-1005').priority).toBe('P2');
  });
  it('routes app crashes to software and a deadline to P2', () => {
    const r = byId('T-1006');
    expect(r.category).toBe('software');
    expect(r.priority).toBe('P2');
  });
  it('routes VPN and Outlook correctly', () => {
    expect(byId('T-1007').category).toBe('network');
    expect(byId('T-1008').category).toBe('email');
  });
  it('sends unclear tickets to a person', () => {
    const r = byId('T-1010');
    expect(r.category).toBe('other');
    expect(r.confidence).toBe(0);
  });
  it('always explains itself and gives first steps', () => {
    for (const t of tickets) {
      const r = triage(t);
      expect(r.reasons.length).toBeGreaterThan(0);
      expect(r.firstSteps.length).toBeGreaterThan(0);
    }
  });
  it('makes a security incident affecting many people P1', () => {
    const r = triage({ id: 'x', subject: 'Phishing', body: 'Everyone got a phishing email and several clicked it.', usersAffected: 20 });
    expect(r.priority).toBe('P1');
  });
});

describe('redaction', () => {
  it('removes emails, phones, IPs and passwords', () => {
    const out = redact('Reach me at jo@example.com or (555) 123-4567 from 10.0.0.12, password: hunter2');
    expect(out).not.toMatch(/example\.com|123-4567|10\.0\.0\.12|hunter2/);
  });
});

describe('Claude second opinion', () => {
  const base = byId('T-1004');
  it('parses valid JSON and rejects junk', () => {
    expect(parseOpinion('{"category":"printing","priority":"P3","reason":"ok"}')?.priority).toBe('P3');
    expect(parseOpinion('{"category":"made-up","priority":"P3"}')).toBeNull();
    expect(parseOpinion('no json here')).toBeNull();
  });
  it('may raise priority but never lowers it', () => {
    expect(merge(base, { category: 'printing', priority: 'P2', reason: 'r' }).priority).toBe('P2');
    const sec = byId('T-1002');
    expect(merge(sec, { category: 'security', priority: 'P4', reason: 'r' }).priority).toBe('P2');
  });
  it('keeps a confident rules category', () => {
    expect(merge(base, { category: 'hardware', priority: 'P4', reason: 'r' }).category).toBe('printing');
  });
});
