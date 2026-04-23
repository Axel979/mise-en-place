import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';
import { supabase } from '@/lib/supabase/client';

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._]{2,19}$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Client-side format validation. Synchronous.
 */
export function validateUsernameFormat(username: string): ValidationResult {
  if (!username || username.length < MIN_LENGTH) {
    return { valid: false, error: 'Username needs to be at least 3 characters' };
  }
  if (username.length > MAX_LENGTH) {
    return { valid: false, error: 'Username can be at most 20 characters' };
  }
  if (!USERNAME_REGEX.test(username)) {
    if (!/^[a-zA-Z]/.test(username)) {
      return { valid: false, error: 'Username must start with a letter' };
    }
    return { valid: false, error: 'Usernames can only use letters, numbers, dots and underscores' };
  }
  return { valid: true };
}

/**
 * Returns true if the username contains profanity or slurs.
 */
export function checkUsernameProfanity(username: string): boolean {
  return matcher.hasMatch(username);
}

/**
 * Checks Supabase to see if the username is already taken or reserved.
 * Returns true if available, false if taken.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = username.toLowerCase().trim();

  // Check reserved list
  const { data: reserved } = await supabase
    .from('reserved_usernames')
    .select('username')
    .eq('username', normalized)
    .maybeSingle();

  if (reserved) return false;

  // Check existing profiles
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .maybeSingle();

  return !existing;
}
