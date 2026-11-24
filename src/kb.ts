import type { Category } from './types.js';

/** A small, generic first-response playbook. Swap in your own knowledge base. */
export const PLAYBOOK: Record<Category, { firstSteps: string[]; askReporter: string[] }> = {
  security: {
    firstSteps: [
      'Have the user disconnect from the network (Wi-Fi off) but leave the device powered on.',
      'Reset the account password and revoke active sessions.',
      'Check sign-in logs for unfamiliar locations, then report to the security lead.',
    ],
    askReporter: ['Did you enter a password or approve a sign-in prompt?', 'When did it happen?'],
  },
  'account-access': {
    firstSteps: [
      'Confirm the user\'s identity with your verification process before any reset.',
      'Check whether the account is locked, disabled or has an expired password.',
      'Unlock or reset, then have the user sign in while you are on the call.',
    ],
    askReporter: ['Which app or site is it?', 'What exact message do you see?'],
  },
  network: {
    firstSteps: [
      'Ask whether others nearby have the same problem (one device or the whole site?).',
      'Restart the device\'s network adapter; forget and rejoin Wi-Fi.',
      'Check VPN status and test a wired connection if available.',
    ],
    askReporter: ['Wi-Fi or cable? Office or home?', 'Does any website load at all?'],
  },
  printing: {
    firstSteps: [
      'Check the printer\'s screen for jams, paper or toner errors.',
      'Clear the print queue and restart the print spooler.',
      'Re-add the printer from the print server or by IP.',
    ],
    askReporter: ['Which printer (name or location)?', 'Does anyone else print to it successfully?'],
  },
  email: {
    firstSteps: [
      'Check the mail service status page for an outage.',
      'Test webmail: if it works there, the problem is the local client.',
      'Restart the mail app; rebuild the profile or cache if it persists.',
    ],
    askReporter: ['Sending, receiving, or both?', 'Any bounce-back message?'],
  },
  hardware: {
    firstSteps: [
      'Check power: different outlet, known-good charger, battery indicator.',
      'Unplug accessories and docks, then try again.',
      'Note any beep codes, lights or error screens before replacing parts.',
    ],
    askReporter: ['Make and model?', 'Any drops, spills or recent changes?'],
  },
  software: {
    firstSteps: [
      'Get the exact error message or a screenshot.',
      'Close and reopen the app; restart the computer if it is still stuck.',
      'Check for pending updates, then repair or reinstall the app.',
    ],
    askReporter: ['When did it start? Any recent update?', 'Does it happen on another computer?'],
  },
  other: {
    firstSteps: ['Reply to gather details: what they expected, what happened, and when.'],
    askReporter: ['What were you trying to do?', 'What happened instead?'],
  },
};
