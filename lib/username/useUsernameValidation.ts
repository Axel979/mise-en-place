'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  validateUsernameFormat,
  checkUsernameProfanity,
  isUsernameAvailable,
  usernameErrorMessage,
  UsernameValidationError,
} from './validate';

export type UsernameStatus =
  | 'idle'
  | 'format_error'
  | 'profanity'
  | 'checking'
  | 'available'
  | 'taken'
  | 'reserved'
  | 'error';

interface UsernameValidationState {
  input: string;
  status: UsernameStatus;
  message: string;
  canSubmit: boolean;
  isChecking: boolean;
}

const isDev = process.env.NODE_ENV === 'development';

export function useUsernameValidation() {
  const [input, setInputRaw] = useState('');
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const [message, setMessage] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  const updateStatus = useCallback((newStatus: UsernameStatus, newMessage: string) => {
    if (!mountedRef.current) return;
    if (isDev) console.log(`[useUsernameValidation] status: ${newStatus}, message: "${newMessage}"`);
    setStatus(newStatus);
    setMessage(newMessage);
  }, []);

  const setInput = useCallback((raw: string) => {
    // Strip invalid chars before storing
    const cleaned = raw.replace(/[^a-zA-Z0-9._]/g, '');
    setInputRaw(cleaned);

    if (isDev) console.log('[useUsernameValidation] setInput:', cleaned);

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Empty input → idle
    if (!cleaned) {
      updateStatus('idle', '');
      return;
    }

    // Format check (synchronous)
    const formatResult = validateUsernameFormat(cleaned);
    if (!formatResult.valid) {
      updateStatus('format_error', formatResult.message ?? '');
      return;
    }

    // Profanity check (synchronous, safe)
    if (checkUsernameProfanity(cleaned)) {
      updateStatus('profanity', usernameErrorMessage(UsernameValidationError.CONTAINS_PROFANITY));
      return;
    }

    // Format is valid — show checking immediately (before debounce fires)
    updateStatus('checking', '');

    // Debounced availability check
    debounceRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      if (isDev) console.log('[useUsernameValidation] debounce fired, checking availability for:', cleaned);

      const result = await isUsernameAvailable(cleaned);

      if (!mountedRef.current) return;

      switch (result.status) {
        case 'available':
          updateStatus('available', '');
          break;
        case 'taken':
          updateStatus('taken', usernameErrorMessage(UsernameValidationError.TAKEN));
          break;
        case 'reserved':
          updateStatus('reserved', usernameErrorMessage(UsernameValidationError.RESERVED));
          break;
        case 'error':
          updateStatus('error', usernameErrorMessage(UsernameValidationError.NETWORK_ERROR));
          break;
      }
    }, 400);
  }, [updateStatus]);

  const isChecking = status === 'checking';
  const canSubmit = status === 'available';

  const state: UsernameValidationState = {
    input,
    status,
    message,
    canSubmit,
    isChecking,
  };

  return {
    ...state,
    setInput,
  };
}
