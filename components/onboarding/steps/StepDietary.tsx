'use client';
import React, { useState } from 'react';

const C = {
  flame: 'var(--flame)', bark: 'var(--bark)', cream: 'var(--cream)',
  muted: 'var(--muted)', border: 'var(--border)',
};
const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";

const DIETARY_OPTIONS = [
  'No restrictions', 'Vegetarian', 'Vegan', 'Pescatarian',
  'Gluten-free', 'Dairy-free', 'Nut-free',
];

const DIETARY_VALUES: Record<string, string> = {
  'Vegetarian': 'vegetarian',
  'Vegan': 'vegan',
  'Pescatarian': 'pescatarian',
  'Gluten-free': 'gluten_free',
  'Dairy-free': 'dairy_free',
  'Nut-free': 'nut_free',
};

interface StepDietaryProps {
  onAnswer: (label: string, values: string[]) => void;
  onSkip: () => void;
}

export default function StepDietary({ onAnswer, onSkip }: StepDietaryProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleToggle = (opt: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const isNoRestrictions = opt === 'No restrictions';

      if (isNoRestrictions) {
        return next.has('none') ? new Set() : new Set(['none']);
      }

      next.delete('none');
      if (next.has(opt)) {
        next.delete(opt);
      } else {
        next.add(opt);
      }
      return next;
    });
  };

  const handleContinue = () => {
    const values = selected.has('none')
      ? []
      : Array.from(selected).map((d) => DIETARY_VALUES[d] || d);
    const label = selected.has('none')
      ? 'No restrictions'
      : Array.from(selected).join(', ');
    onAnswer(label, values);
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:C.cream,border:`1px solid ${C.border}`,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <img src="/lemon.png" alt="Lemon" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
        </div>
        <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:500,color:C.muted}}>Lemon</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {DIETARY_OPTIONS.map((opt) => {
          const isNoRestrictions = opt === 'No restrictions';
          const isSelected = isNoRestrictions
            ? selected.size === 0 || selected.has('none')
            : selected.has(opt);

          return (
            <button
              key={opt}
              aria-label={opt}
              aria-pressed={isSelected}
              onClick={() => handleToggle(opt)}
              style={{
                padding: '9px 16px',
                borderRadius: 99,
                border: `1.5px solid ${isSelected ? 'transparent' : C.muted}`,
                background: isSelected ? C.flame : C.cream,
                color: isSelected ? '#fff' : C.bark,
                fontWeight: 600,
                fontSize: 14,
                fontFamily: BF,
                cursor: 'pointer',
                transition: 'all .15s',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <button
          onClick={handleContinue}
          aria-label="Continue with dietary selections"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            border: 'none',
            background: C.flame,
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            fontFamily: DF,
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          Continue
        </button>
      )}

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

export { DIETARY_OPTIONS, DIETARY_VALUES };
