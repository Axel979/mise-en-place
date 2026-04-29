'use client';
import React from 'react';
import { useUsernameValidation } from '@/lib/username/useUsernameValidation';
import type { OnboardingAction } from '../OnboardingFlow';

const C = {
  flame: 'var(--flame)', bark: 'var(--bark)', cream: 'var(--cream)', paper: 'var(--paper)',
  muted: 'var(--muted)', sage: 'var(--sage)', border: 'var(--border)',
};
const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";

interface StepUsernameProps {
  dispatch: React.Dispatch<OnboardingAction>;
  userId: string;
  usernameSubmitLoading: boolean;
  usernameSubmitError: string | null;
  onSubmit: (username: string) => void;
}

export default function StepUsername({
  dispatch,
  userId,
  usernameSubmitLoading,
  usernameSubmitError,
  onSubmit,
}: StepUsernameProps) {
  const { input, setInput, status, message, canSubmit, isChecking } = useUsernameValidation();

  const handleSubmit = () => {
    if (!canSubmit || usernameSubmitLoading) return;
    onSubmit(input);
  };

  const showError = message || usernameSubmitError;
  const borderColor = showError
    ? C.flame
    : status === 'available'
      ? C.sage
      : C.border;

  const buttonDisabled = !canSubmit || usernameSubmitLoading;
  const buttonLabel = usernameSubmitLoading ? 'Saving...' : 'Continue';

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSubmit && !usernameSubmitLoading) {
            handleSubmit();
          }
        }}
        placeholder="Pick a username"
        autoFocus
        maxLength={20}
        aria-label="Username"
        aria-describedby={showError ? 'username-error' : undefined}
        aria-invalid={!!showError}
        style={{
          width: '100%',
          padding: '16px 18px',
          borderRadius: 14,
          border: `1px solid ${showError ? C.flame : C.border}`,
          background: C.cream,
          fontSize: 17,
          color: C.bark,
          outline: 'none',
          fontFamily: BF,
          marginBottom: 8,
        }}
      />

      {/* Validation feedback */}
      {isChecking && (
        <div style={{ fontSize: 13, color: C.muted, paddingLeft: 4, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 20 20" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="10" cy="10" r="8" fill="none" stroke={C.muted} strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round" />
          </svg>
          Checking...
        </div>
      )}
      {!isChecking && status === 'available' && input.length >= 3 && (
        <div style={{ fontSize: 13, color: C.sage, paddingLeft: 4, marginBottom: 8 }}>
          Username available
        </div>
      )}
      {showError && (
        <div id="username-error" role="alert" style={{ fontSize: 13, color: C.flame, marginBottom: 8, paddingLeft: 4 }}>
          {showError}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={buttonDisabled}
        aria-label={buttonLabel}
        style={{
          width: '100%',
          padding: '14px 20px',
          borderRadius: 14,
          border: 'none',
          background: buttonDisabled ? C.pill : C.flame,
          color: '#fff',
          fontWeight: 800,
          fontSize: 14,
          fontFamily: 'inherit',
          cursor: buttonDisabled ? 'not-allowed' : 'pointer',
          opacity: buttonDisabled ? 0.55 : 1,
          boxShadow: buttonDisabled ? 'none' : `0 4px 14px ${C.flame}44`,
          transition: 'all .18s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {usernameSubmitLoading && (
          <svg width="16" height="16" viewBox="0 0 20 20" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="10" cy="10" r="8" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round" />
          </svg>
        )}
        {buttonLabel}
      </button>
    </div>
  );
}
