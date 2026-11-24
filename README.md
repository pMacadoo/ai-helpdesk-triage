# AI Help Desk Triage

Reads incoming help desk tickets and decides three things a technician needs first: **what kind of problem it is, how urgent it is, and what to try first.** It works offline with clear rules, and can optionally ask Claude for a second opinion.

I built this from years on a repair and support counter. The first five minutes of a ticket decide whether a user waits an hour or a day. Most of that time goes on sorting, not fixing.

## What it does

- **Category:** hardware, software, network, account access, printing, email, security or other.
- **Priority:** P1 to P4. It looks at impact (how many people), then urgency (blocked, deadline, "no rush"). Security tickets never drop below P2.
- **Explains itself:** every call comes with the words that triggered it, so a person can check it in two seconds.
- **First steps and questions:** a short playbook per category. Replace it with your own knowledge base.
- **Unsure? Says so.** Tickets with no clear signal go to "other" with confidence 0, for a person to read.

## Example

```
$ npm run triage -- samples/tickets.json
P1  network        T-1001  Whole office lost internet
    why:   Category "network" from: internet. Affects several people or a whole site.
    first: Ask whether others nearby have the same problem (one device or the whole site?).
P2  security       T-1002  Weird email from 'IT team'
    why:   Category "security" from: suspicious email, clicked the link. Possible security incident: handled ahead of routine work.
    first: Have the user disconnect from the network (Wi-Fi off) but leave the device powered on.
P2  account-access T-1003  Locked out
    why:   Category "account-access" from: locked out, can't log in. The reporter says they are blocked or up against a deadline.
    first: Confirm the user's identity with your verification process before any reset.
P2  hardware       T-1005  Laptop won't turn on
    why:   Category "hardware" from: laptop, won't turn on, charger. The person's main device won't start, so they can't work.
    first: Check power: different outlet, known-good charger, battery indicator.
```

## Optional: Claude second opinion

```
ANTHROPIC_API_KEY=... npm run triage -- samples/tickets.json --claude
```

Guardrails, because tickets contain personal details:

- **Redaction first:** emails, phone numbers, IP addresses and anything after "password:" are removed before the text leaves the machine.
- **Claude can't overrule confident rules:** it may change the category only when the rules were unsure (confidence under 0.6).
- **Priority only goes up:** Claude may raise a priority, never lower one, so a security ticket can't be talked down.
- **Rules are the fallback:** if the API fails, the rules result stands.

## Run it

```
npm install
npm test            # 14 tests
npm run triage -- samples/tickets.json [--json] [--claude]
```

Node 20 or newer. All sample tickets are invented.

## How it's built

| File | Job |
| --- | --- |
| `src/rules.ts` | Weighted keyword signals per category, readable on purpose |
| `src/priority.ts` | Impact then urgency, with the security floor |
| `src/kb.ts` | First steps and questions per category |
| `src/triage.ts` | Combines them and explains the result |
| `src/claude.ts` | Optional second opinion with redaction and merge rules |
| `test/` | Tests for every rule and guardrail |

Related: [repair-checkin-demo](https://github.com/pMacadoo/repair-checkin-demo), a repair counter check-in with a condition checklist and printable receipt.
