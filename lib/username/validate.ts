import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';
import { supabase } from '@/lib/supabase/client';

// ── Error types ───────────────────────────────────────────────
export enum UsernameValidationError {
  FORMAT_INVALID = 'FORMAT_INVALID',
  TOO_SHORT = 'TOO_SHORT',
  TOO_LONG = 'TOO_LONG',
  CONTAINS_PROFANITY = 'CONTAINS_PROFANITY',
  RESERVED = 'RESERVED',
  TAKEN = 'TAKEN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface FormatValidationResult {
  valid: boolean;
  error?: UsernameValidationError;
  message?: string;
}

export type AvailabilityResult =
  | { status: 'available' }
  | { status: 'taken' }
  | { status: 'reserved' }
  | { status: 'error'; error: Error };

// ── Constants ─────────────────────────────────────────────────
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._]{2,19}$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

const isDev = process.env.NODE_ENV === 'development';

// ── Obscenity matcher (initialized safely) ────────────────────
let matcher: RegExpMatcher | null = null;
try {
  matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });
} catch (e) {
  console.error('[validate] Failed to initialize obscenity matcher:', e);
}

// ── User-facing error messages ────────────────────────────────
const ERROR_MESSAGES: Record<UsernameValidationError, string> = {
  [UsernameValidationError.TOO_SHORT]: 'Username needs to be at least 3 characters',
  [UsernameValidationError.TOO_LONG]: 'Username can be at most 20 characters',
  [UsernameValidationError.FORMAT_INVALID]: 'Usernames can only use letters, numbers, dots and underscores',
  [UsernameValidationError.CONTAINS_PROFANITY]: "That username isn't available",
  [UsernameValidationError.RESERVED]: "That username isn't available",
  [UsernameValidationError.TAKEN]: "That one's taken — try another",
  [UsernameValidationError.NETWORK_ERROR]: 'Could not check username. Please try again.',
  [UsernameValidationError.UNKNOWN_ERROR]: 'Something went wrong. Please try again.',
};

export function usernameErrorMessage(error: UsernameValidationError): string {
  return ERROR_MESSAGES[error] ?? ERROR_MESSAGES[UsernameValidationError.UNKNOWN_ERROR];
}

// ── Format validation (synchronous) ──────────────────────────
export function validateUsernameFormat(username: string): FormatValidationResult {
  if (isDev) console.log('[validate] validateUsernameFormat input:', username);

  if (!username || username.length < MIN_LENGTH) {
    const result: FormatValidationResult = {
      valid: false,
      error: UsernameValidationError.TOO_SHORT,
      message: ERROR_MESSAGES[UsernameValidationError.TOO_SHORT],
    };
    if (isDev) console.log('[validate] validateUsernameFormat result:', result);
    return result;
  }

  if (username.length > MAX_LENGTH) {
    const result: FormatValidationResult = {
      valid: false,
      error: UsernameValidationError.TOO_LONG,
      message: ERROR_MESSAGES[UsernameValidationError.TOO_LONG],
    };
    if (isDev) console.log('[validate] validateUsernameFormat result:', result);
    return result;
  }

  if (!USERNAME_REGEX.test(username)) {
    const message = !/^[a-zA-Z]/.test(username)
      ? 'Username must start with a letter'
      : ERROR_MESSAGES[UsernameValidationError.FORMAT_INVALID];
    const result: FormatValidationResult = {
      valid: false,
      error: UsernameValidationError.FORMAT_INVALID,
      message,
    };
    if (isDev) console.log('[validate] validateUsernameFormat result:', result);
    return result;
  }

  const result: FormatValidationResult = { valid: true };
  if (isDev) console.log('[validate] validateUsernameFormat result:', result);
  return result;
}

// ── Profanity check (synchronous, safe) ──────────────────────
export function checkUsernameProfanity(username: string): boolean {
  if (isDev) console.log('[validate] checkUsernameProfanity input:', username);

  if (!matcher) {
    if (isDev) console.log('[validate] checkUsernameProfanity: matcher not initialized, returning false');
    return false;
  }

  try {
    const result = matcher.hasMatch(username);
    if (isDev) console.log('[validate] checkUsernameProfanity result:', result);
    return result;
  } catch (e) {
    console.error('[validate] checkUsernameProfanity threw, treating as non-profane:', e);
    return false;
  }
}

// ── Availability check (async, Supabase) ─────────────────────
export async function isUsernameAvailable(username: string): Promise<AvailabilityResult> {
  if (isDev) console.log('[validate] isUsernameAvailable input:', username);

  const normalized = username.toLowerCase().trim();

  try {
    // Check reserved list
    const { data: reserved, error: reservedError } = await supabase
      .from('reserved_usernames')
      .select('username')
      .eq('username', normalized)
      .maybeSingle();

    if (reservedError) {
      console.error('[validate] isUsernameAvailable reserved_usernames query error:', reservedError);
      return { status: 'error', error: new Error(reservedError.message) };
    }

    if (reserved) {
      if (isDev) console.log('[validate] isUsernameAvailable result: reserved');
      return { status: 'reserved' };
    }

    // Check existing profiles
    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalized)
      .maybeSingle();

    if (existingError) {
      console.error('[validate] isUsernameAvailable profiles query error:', existingError);
      return { status: 'error', error: new Error(existingError.message) };
    }

    if (existing) {
      if (isDev) console.log('[validate] isUsernameAvailable result: taken');
      return { status: 'taken' };
    }

    if (isDev) console.log('[validate] isUsernameAvailable result: available');
    return { status: 'available' };
  } catch (e) {
    console.error('[validate] isUsernameAvailable threw:', e);
    return { status: 'error', error: e instanceof Error ? e : new Error(String(e)) };
  }
}
