import type { PopData } from './types';

// PSA doesn't have a public API. Pop data is entered manually
// via the /api/pop route or through an Apify scraper integration.
// This module provides types and helper functions.

export interface PopSubmission {
  cardSlug: string;
  grader: 'PSA' | 'BGS' | 'CGC' | 'SGC';
  total: number;
  grade10: number;
  blackLabel?: number;
  grade95?: number;
  grade9?: number;
  grade85?: number;
  grade8?: number;
  grade7AndBelow?: number;
  authentic?: number;
}

export function validatePopSubmission(data: unknown): data is PopSubmission {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.cardSlug === 'string' &&
    typeof d.grader === 'string' &&
    ['PSA', 'BGS', 'CGC', 'SGC'].includes(d.grader as string) &&
    typeof d.total === 'number' &&
    typeof d.grade10 === 'number'
  );
}

export function toPopData(submission: PopSubmission): Omit<PopData, 'grader'> {
  return {
    total: submission.total,
    grade10: submission.grade10,
    blackLabel: submission.blackLabel ?? 0,
    grade95: submission.grade95 ?? 0,
    grade9: submission.grade9 ?? 0,
    grade85: submission.grade85 ?? 0,
    grade8: submission.grade8 ?? 0,
    grade7AndBelow: submission.grade7AndBelow ?? 0,
    authentic: submission.authentic ?? 0,
  };
}
