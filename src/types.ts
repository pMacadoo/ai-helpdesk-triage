export type Category =
  | 'hardware'
  | 'software'
  | 'network'
  | 'account-access'
  | 'printing'
  | 'email'
  | 'security'
  | 'other';

/** P1 = stop everything, P4 = when there's time. */
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  /** How many people the reporter says are affected, if known. */
  usersAffected?: number;
}

export interface Triage {
  id: string;
  category: Category;
  priority: Priority;
  /** Plain-language reasons, so a person can check the call. */
  reasons: string[];
  /** What a technician should try first. */
  firstSteps: string[];
  /** Questions to ask the reporter before going further. */
  askReporter: string[];
  /** 0–1: how sure the rules are about the category. */
  confidence: number;
  source: 'rules' | 'rules+claude';
}
