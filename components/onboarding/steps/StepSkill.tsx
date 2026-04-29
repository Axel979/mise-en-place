'use client';
import React from 'react';

const C = {
  flame: '#FF4D1C', bark: '#1A1A1A', cream: '#FFFFFF',
  muted: '#757575', border: '#E5E5E5',
};
const BF = "'Source Serif 4',Georgia,serif";

const SKILL_OPTIONS = [
  { label: 'Just starting out', value: 'just_starting' },
  { label: 'I can make a few dishes', value: 'few_dishes' },
  { label: 'Comfortable in the kitchen', value: 'comfortable' },
  { label: 'I cook most days', value: 'cook_most_days' },
];

interface StepSkillProps {
  onAnswer: (label: string, value: string) => void;
  onSkip: () => void;
}

export default function StepSkill({ onAnswer, onSkip }: StepSkillProps) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {SKILL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onAnswer(opt.label, opt.value)}
            aria-label={opt.label}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: 14,
              border: `1.5px solid ${C.border}`,
              background: C.cream,
              color: C.bark,
              fontWeight: 600,
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

export { SKILL_OPTIONS };
