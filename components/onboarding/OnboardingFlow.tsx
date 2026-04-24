'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { validateUsernameFormat, checkUsernameProfanity, isUsernameAvailable } from '@/lib/username/validate';

// ── Design tokens (mirrored from app/page.tsx) ─────────────────────────
const C = {
  flame:'#FF4D1C', bark:'#3B2A1A', cream:'#FFF8F0', paper:'#FAF4EE',
  muted:'#9E8C7E', gold:'#F5C842', sage:'#5C7A4E', border:'#EEE5DC',
};
const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";

// ── Types ──────────────────────────────────────────────────────────────
interface OnboardingAnswers {
  username?: string;
  goal?: string;
  dietary?: string[];
  skill_level?: string;
}
interface OnboardingProgress {
  currentStep: number;
  answers: OnboardingAnswers;
}
interface ChatMessage {
  id: string;
  from: 'app' | 'user';
  text: string;
}

const SKIP_ACKS = [
  "No worries, you can set that up later",
  "All good, you can change this anytime in Settings",
  "Cool, moving on",
];

const GOAL_OPTIONS = [
  { label: 'Every day', value: 'daily' },
  { label: '5 times a week', value: '5x_week' },
  { label: '3 times a week', value: '3x_week' },
  { label: 'Just weekends', value: 'weekends' },
  { label: 'Whenever I can', value: 'flexible' },
];

const DIETARY_OPTIONS = [
  'No restrictions', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Dairy-free', 'Nut-free',
];
const DIETARY_VALUES: Record<string, string> = {
  'Vegetarian': 'vegetarian', 'Vegan': 'vegan', 'Pescatarian': 'pescatarian',
  'Gluten-free': 'gluten_free', 'Dairy-free': 'dairy_free', 'Nut-free': 'nut_free',
};

const SKILL_OPTIONS = [
  { label: 'Just starting out', value: 'just_starting' },
  { label: 'I can make a few dishes', value: 'few_dishes' },
  { label: 'Comfortable in the kitchen', value: 'comfortable' },
  { label: 'I cook most days', value: 'cook_most_days' },
];

const QUESTIONS = [
  "Hey! Welcome to mise.en" + ".place. I'm here to help you get set up.\n\nWhat should we call you?",
  "How often are you hoping to cook?",
  "Any dietary preferences? Tap all that apply.",
  "Last one — how would you describe your cooking?",
];

// ── Sub-components ─────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:10,marginBottom:12}} aria-label="Assistant is typing">
      <div style={{width:32,height:32,borderRadius:'50%',background:`${C.flame}10`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        {/* TODO: Mascot slot — swap SVG for animated mascot component when ready */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke={C.flame} strokeWidth="1.5" opacity=".6"/></svg>
      </div>
      <div style={{background:C.cream,borderRadius:'16px 16px 16px 4px',padding:'12px 16px',display:'flex',gap:4}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:6,height:6,borderRadius:'50%',background:C.muted,animation:`typingBounce .6s ease-in-out ${i*150}ms infinite`}}/>
        ))}
      </div>
    </div>
  );
}

function AppBubble({text,animate}:{text:string;animate:boolean}) {
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:10,marginBottom:12,animation:animate?'bubbleIn .3s ease-out both':'none'}}>
      <div style={{width:32,height:32,borderRadius:'50%',background:`${C.flame}10`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke={C.flame} strokeWidth="1.5" opacity=".6"/></svg>
      </div>
      <div style={{background:C.cream,color:C.bark,borderRadius:'16px 16px 16px 4px',padding:'12px 16px',maxWidth:'75%',fontSize:15,lineHeight:1.55,fontFamily:BF,whiteSpace:'pre-line'}}>
        {text}
      </div>
    </div>
  );
}

function UserBubble({text,animate}:{text:string;animate:boolean}) {
  return (
    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12,animation:animate?'bubbleInRight .3s ease-out both':'none'}}>
      <div style={{background:C.flame,color:'#fff',borderRadius:'16px 16px 4px 16px',padding:'12px 16px',maxWidth:'75%',fontSize:15,lineHeight:1.55,fontFamily:BF}}>
        {text}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

export default function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [completing, setCompleting] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipAckIdx = useRef(0);
  const initialized = useRef(false);

  // Username validation state
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Dietary multi-select
  const [dietarySelected, setDietarySelected] = useState<Set<string>>(new Set());

  // Check reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showTyping]);

  // Resume from localStorage
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('mep_onboarding_progress');
      if (saved) {
        const progress: OnboardingProgress = JSON.parse(saved);
        if (progress.answers) setAnswers(progress.answers);
        if (progress.answers?.username) setUsernameInput(progress.answers.username);

        // Rebuild message history
        const history: ChatMessage[] = [];
        for (let i = 0; i < progress.currentStep; i++) {
          history.push({ id: `q-${i}`, from: 'app', text: QUESTIONS[i] });
          const ans = getAnswerText(i, progress.answers);
          if (ans) history.push({ id: `a-${i}`, from: 'user', text: ans });
          else history.push({ id: `s-${i}`, from: 'app', text: SKIP_ACKS[i % SKIP_ACKS.length] });
        }
        setMessages(history);
        startStep(progress.currentStep);
        return;
      }
    } catch { /* no saved progress */ }

    startStep(0);
  }, []);

  function getAnswerText(stepIdx: number, ans: OnboardingAnswers): string | null {
    switch (stepIdx) {
      case 0: return ans.username || null;
      case 1: return GOAL_OPTIONS.find(o => o.value === ans.goal)?.label || null;
      case 2: return ans.dietary?.length ? ans.dietary.map(d => {
        const entry = Object.entries(DIETARY_VALUES).find(([, v]) => v === d);
        return entry ? entry[0] : d;
      }).join(', ') : null;
      case 3: return SKILL_OPTIONS.find(o => o.value === ans.skill_level)?.label || null;
      default: return null;
    }
  }

  const saveProgress = useCallback((currentStep: number, newAnswers: OnboardingAnswers) => {
    try {
      localStorage.setItem('mep_onboarding_progress', JSON.stringify({ currentStep, answers: newAnswers }));
    } catch { /* storage full or unavailable */ }
  }, []);

  function startStep(stepIdx: number) {
    if (stepIdx >= 4) {
      finishOnboarding();
      return;
    }
    setStep(stepIdx);
    setShowOptions(false);

    const delay = reducedMotion ? 0 : 700;
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      setMessages(prev => [...prev, { id: `q-${stepIdx}`, from: 'app', text: QUESTIONS[stepIdx] }]);
      setTimeout(() => setShowOptions(true), reducedMotion ? 0 : 200);
    }, delay);
  }

  function handleAnswer(stepIdx: number, answerText: string, answerValue: Partial<OnboardingAnswers>) {
    setShowOptions(false);
    setMessages(prev => [...prev, { id: `a-${stepIdx}`, from: 'user', text: answerText }]);
    const newAnswers = { ...answers, ...answerValue };
    setAnswers(newAnswers);
    saveProgress(stepIdx + 1, newAnswers);
    setTimeout(() => startStep(stepIdx + 1), reducedMotion ? 100 : 400);
  }

  function handleSkip(stepIdx: number) {
    setShowOptions(false);
    const ack = SKIP_ACKS[skipAckIdx.current % SKIP_ACKS.length];
    skipAckIdx.current++;

    setTimeout(() => {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        setMessages(prev => [...prev, { id: `s-${stepIdx}`, from: 'app', text: ack }]);
        setTimeout(() => {
          saveProgress(stepIdx + 1, answers);
          startStep(stepIdx + 1);
        }, reducedMotion ? 100 : 500);
      }, reducedMotion ? 0 : 600);
    }, reducedMotion ? 0 : 300);
  }

  async function finishOnboarding() {
    setShowOptions(false);
    setCompleting(true);
    setFinalizeError(null);
    const username = answers.username || usernameInput;

    // Final app bubble
    setShowTyping(true);
    await new Promise(r => setTimeout(r, reducedMotion ? 0 : 700));
    setShowTyping(false);
    setMessages(prev => [...prev, { id: 'done', from: 'app', text: `You're all set, ${username}. Let's cook.` }]);

    // Update profile in Supabase
    try {
      const { error } = await supabase.from('profiles').update({
        goal: answers.goal || null,
        dietary: answers.dietary || [],
        skill_level: answers.skill_level || null,
        onboarded_at: new Date().toISOString(),
      }).eq('id', userId);

      if (error) throw error;
    } catch (e) {
      console.error('[Onboarding] Failed to finalize:', e);
      setFinalizeError('Something went wrong saving your profile. Please try again.');
      setCompleting(false);
      return;
    }

    // Clean up localStorage
    try { localStorage.removeItem('mep_onboarding_progress'); } catch {}
    try { localStorage.setItem('mep_onboarded', 'true'); } catch {}

    await new Promise(r => setTimeout(r, reducedMotion ? 200 : 800));
    onComplete();
  }

  // ── Username validation (debounced) ────────────────────────────────
  const validateUsername = useCallback((val: string) => {
    setUsernameInput(val);
    setUsernameAvailable(null);
    setUsernameError('');

    const fmt = validateUsernameFormat(val);
    if (!fmt.valid) {
      setUsernameError(fmt.error || '');
      return;
    }
    if (checkUsernameProfanity(val)) {
      setUsernameError("That username isn't available");
      return;
    }

    setCheckingUsername(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const available = await isUsernameAvailable(val);
      setCheckingUsername(false);
      if (available) {
        setUsernameAvailable(true);
        setUsernameError('');
      } else {
        setUsernameAvailable(false);
        setUsernameError("That one's taken — try another");
      }
    }, 400);
  }, []);

  async function handleUsernameSubmit() {
    if (!usernameAvailable || usernameError) return;
    setShowOptions(false);

    // Insert profile row with username
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        username: usernameInput.toLowerCase().trim(),
        xp: 0,
        level: 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) {
        console.error('[Onboarding] Username insert failed:', error);
        setUsernameError(error.message.includes('username') ? "That username isn't available" : 'Failed to save username. Please try again.');
        setShowOptions(true);
        return;
      }
    } catch (e) {
      console.error('[Onboarding] Username insert threw:', e);
      setUsernameError('Failed to save username. Please try again.');
      setShowOptions(true);
      return;
    }

    handleAnswer(0, usernameInput, { username: usernameInput });
  }

  // ── Progress bar ───────────────────────────────────────────────────
  const progress = useMemo(() => {
    if (completing) return 100;
    return Math.round(((step) / 4) * 100);
  }, [step, completing]);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{position:'fixed',inset:0,zIndex:9000,background:C.paper,display:'flex',flexDirection:'column',fontFamily:BF}}>
      <style>{`
        @keyframes typingBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes bubbleIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes bubbleInRight{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.98)}}
      `}</style>

      {/* Progress bar */}
      <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}
        style={{width:'100%',height:3,background:C.cream,flexShrink:0}}>
        <div style={{width:`${progress}%`,height:'100%',background:C.flame,transition:'width .5s ease-out',borderRadius:'0 2px 2px 0'}}/>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} style={{flex:1,overflowY:'auto',padding:'24px 16px 0',maxWidth:480,width:'100%',margin:'0 auto',WebkitOverflowScrolling:'touch'}}>
        {messages.map(msg => (
          msg.from === 'app'
            ? <AppBubble key={msg.id} text={msg.text} animate={!reducedMotion} />
            : <UserBubble key={msg.id} text={msg.text} animate={!reducedMotion} />
        ))}
        {showTyping && <TypingIndicator />}
        <div style={{height:16}} />
      </div>

      {/* Bottom input/options area */}
      {/* Error state with retry */}
      {finalizeError && (
        <div style={{flexShrink:0,borderTop:`1px solid ${C.border}`,background:'#fff',padding:'16px',maxWidth:480,width:'100%',margin:'0 auto',textAlign:'center'}}>
          <div style={{color:C.flame,fontSize:14,fontFamily:BF,marginBottom:12}}>{finalizeError}</div>
          <button onClick={()=>finishOnboarding()} style={{padding:'14px 32px',borderRadius:14,border:'none',background:C.flame,color:'#fff',fontWeight:700,fontSize:15,fontFamily:DF,cursor:'pointer'}}>
            Try Again
          </button>
        </div>
      )}

      {showOptions && !completing && (
        <div style={{flexShrink:0,borderTop:`1px solid ${C.border}`,background:'#fff',padding:'16px',maxWidth:480,width:'100%',margin:'0 auto'}}>

          {/* Step 0: Username */}
          {step === 0 && (
            <div>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => validateUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter' && usernameAvailable && !usernameError) handleUsernameSubmit(); }}
                  placeholder="Pick a username"
                  autoFocus
                  maxLength={20}
                  style={{flex:1,padding:'13px 16px',borderRadius:14,border:`1.5px solid ${usernameError ? C.flame : usernameAvailable ? C.sage : C.border}`,background:C.paper,fontSize:15,color:C.bark,outline:'none',fontFamily:BF}}
                />
                {checkingUsername && <div style={{alignSelf:'center',fontSize:12,color:C.muted}}>...</div>}
                {!checkingUsername && usernameAvailable === true && (
                  <div style={{alignSelf:'center'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <div style={{alignSelf:'center'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.flame} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </div>
                )}
              </div>
              {usernameError && <div style={{fontSize:13,color:C.flame,marginBottom:8,paddingLeft:4}}>{usernameError}</div>}
              <button
                onClick={handleUsernameSubmit}
                disabled={!usernameAvailable || !!usernameError || checkingUsername}
                aria-label="Continue with this username"
                style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:usernameAvailable && !usernameError ? C.flame : '#D8D0C8',color:'#fff',fontWeight:700,fontSize:15,fontFamily:DF,cursor:usernameAvailable && !usernameError ? 'pointer' : 'not-allowed',transition:'background .18s'}}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 1: Goal */}
          {step === 1 && (
            <div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
                {GOAL_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => handleAnswer(1, opt.label, { goal: opt.value })} aria-label={opt.label}
                    style={{width:'100%',padding:'13px 16px',borderRadius:14,border:`1.5px solid ${C.border}`,background:C.cream,color:C.bark,fontWeight:600,fontSize:15,fontFamily:BF,cursor:'pointer',textAlign:'left',transition:'all .15s'}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div onClick={() => handleSkip(1)} style={{textAlign:'center',fontSize:13,color:C.muted,cursor:'pointer',padding:4}}>Skip for now</div>
            </div>
          )}

          {/* Step 2: Dietary */}
          {step === 2 && (
            <div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
                {DIETARY_OPTIONS.map(opt => {
                  const isNoRestrictions = opt === 'No restrictions';
                  const isSelected = isNoRestrictions ? dietarySelected.size === 0 || dietarySelected.has('none') : dietarySelected.has(opt);
                  return (
                    <button key={opt} aria-label={opt} onClick={() => {
                      setDietarySelected(prev => {
                        const next = new Set(prev);
                        if (isNoRestrictions) {
                          return next.has('none') ? new Set() : new Set(['none']);
                        }
                        next.delete('none');
                        if (next.has(opt)) next.delete(opt); else next.add(opt);
                        return next;
                      });
                    }}
                      style={{padding:'9px 16px',borderRadius:99,border:`1.5px solid ${isSelected ? 'transparent' : C.muted}`,background:isSelected ? C.flame : C.cream,color:isSelected ? '#fff' : C.bark,fontWeight:600,fontSize:14,fontFamily:BF,cursor:'pointer',transition:'all .15s',transform:isSelected ? 'scale(1.02)' : 'scale(1)'}}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {(dietarySelected.size > 0) && (
                <button onClick={() => {
                  const values = dietarySelected.has('none') ? [] : Array.from(dietarySelected).map(d => DIETARY_VALUES[d] || d);
                  const label = dietarySelected.has('none') ? 'No restrictions' : Array.from(dietarySelected).join(', ');
                  handleAnswer(2, label, { dietary: values });
                }}
                  style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:C.flame,color:'#fff',fontWeight:700,fontSize:15,fontFamily:DF,cursor:'pointer',marginBottom:8}}
                >
                  Continue
                </button>
              )}
              <div onClick={() => handleSkip(2)} style={{textAlign:'center',fontSize:13,color:C.muted,cursor:'pointer',padding:4}}>Skip for now</div>
            </div>
          )}

          {/* Step 3: Skill */}
          {step === 3 && (
            <div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
                {SKILL_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => handleAnswer(3, opt.label, { skill_level: opt.value })} aria-label={opt.label}
                    style={{width:'100%',padding:'13px 16px',borderRadius:14,border:`1.5px solid ${C.border}`,background:C.cream,color:C.bark,fontWeight:600,fontSize:15,fontFamily:BF,cursor:'pointer',textAlign:'left',transition:'all .15s'}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div onClick={() => handleSkip(3)} style={{textAlign:'center',fontSize:13,color:C.muted,cursor:'pointer',padding:4}}>Skip for now</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
