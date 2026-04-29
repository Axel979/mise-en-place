'use client';
import React from 'react';

const C = {
  flame: 'var(--flame)', bark: 'var(--bark)', cream: 'var(--cream)',
  muted: 'var(--muted)', border: 'var(--border)',
};
const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";

const GOAL_OPTIONS = [
  { label: 'Every day', value: 'daily' },
  { label: '5 times a week', value: '5x_week' },
  { label: '3 times a week', value: '3x_week' },
  { label: 'Just weekends', value: 'weekends' },
  { label: 'Whenever I can', value: 'flexible' },
];

interface StepGoalProps {
  onAnswer: (label: string, value: string) => void;
  onSkip: () => void;
}

export default function StepGoal({ onAnswer, onSkip }: StepGoalProps) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {GOAL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onAnswer(opt.label, opt.value)}
            aria-label={opt.label}
            style={{
              width: '100%',
              padding: '15px 18px',
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              background: C.cream,
              color: C.bark,
              fontWeight: 700,
              fontSize: 15,
              fontFamily: BF,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all .15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div
        onClick={onSkip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSkip(); }}
        aria-label="Skip this step"
        style={{ textAlign: 'center', fontSize: 13, color: C.muted, cursor: 'pointer', padding: 4 }}
      >
        Skip for now
      </div>
    </div>
  );
}

export { GOAL_OPTIONS };
