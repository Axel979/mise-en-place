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
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:C.cream,border:`1px solid ${C.border}`,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <img src="/lemon.png" alt="Lemon" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
        </div>
        <span style={{fontFamily:DF,fontSize:14,fontWeight:500,color:C.muted}}>Lemon</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
            flex: 1,
            padding: '13px 16px',
            borderRadius: 14,
            border: `1.5px solid ${borderColor}`,
            background: C.paper,
            fontSize: 15,
            color: C.bark,
            outline: 'none',
            fontFamily: BF,
          }}
        />

        {/* Status indicator */}
        {isChecking && (
          <div
            style={{ alignSelf: 'center', fontSize: 12, color: C.muted }}
            aria-label="Checking availability"
          >
            {/* Spinner */}
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="10" cy="10" r="8" fill="none" stroke={C.muted} strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round" />
            </svg>
          </div>
        )}
        {!isChecking && status === 'available' && (
          <div style={{ alignSelf: 'center' }} aria-label="Username available">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {!isChecking && (status === 'taken' || status === 'reserved' || status === 'error') && (
          <div style={{ alignSelf: 'center' }} aria-label="Username unavailable">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.flame} strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}
      </div>

      {showError && (
        <div
          id="username-error"
          role="alert"
          style={{ fontSize: 13, color: C.flame, marginBottom: 8, paddingLeft: 4 }}
        >
          {showError}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={buttonDisabled}
        aria-label={buttonLabel}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          border: 'none',
          background: buttonDisabled ? '#D8D0C8' : C.flame,
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          fontFamily: DF,
          cursor: buttonDisabled ? 'not-allowed' : 'pointer',
          transition: 'background .18s',
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
