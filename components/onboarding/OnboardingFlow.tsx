'use client';
import React, { useReducer, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import StepUsername from './steps/StepUsername';
import StepGoal, { GOAL_OPTIONS } from './steps/StepGoal';
import StepDietary, { DIETARY_OPTIONS, DIETARY_VALUES } from './steps/StepDietary';
import StepSkill, { SKILL_OPTIONS } from './steps/StepSkill';

// ── Auth token helper (raw fetch needs the JWT from cookie) ───
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').find(c => c.trim().match(/^sb-[^=]+-auth-token=/));
  if (!match) return null;
  try {
    let raw = match.split('=').slice(1).join('=');
    if (raw.startsWith('base64-')) raw = atob(raw.slice(7));
    const parsed = JSON.parse(decodeURIComponent(raw));
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

// ── Design tokens ─────────────────────────────────────────────
const C = {
  flame: '#FF4D1C', bark: '#1A1A1A', cream: '#FFFFFF', paper: '#FAFAFA',
  muted: '#757575', gold: '#F5C842', sage: '#5C7A4E', border: '#E5E5E5',
};
const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";

const isDev = process.env.NODE_ENV === 'development';

// ── Analytics stub ────────────────────────────────────────────
function trackEvent(name: string, props?: Record<string, unknown>) {
  if (isDev) console.log(`[analytics] ${name}`, props ?? '');
}

// ── Types ─────────────────────────────────────────────────────
interface OnboardingAnswers {
  username?: string;
  goal?: string;
  dietary?: string[];
  skill_level?: string;
}

interface ChatMessage {
  id: string;
  from: 'app' | 'user';
  text: string;
}

// Exported so step components can reference it
export type OnboardingAction =
  | { type: 'SET_REDUCED_MOTION'; value: boolean }
  | { type: 'SHOW_TYPING' }
  | { type: 'HIDE_TYPING' }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SHOW_OPTIONS' }
  | { type: 'HIDE_OPTIONS' }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_ANSWERS'; answers: Partial<OnboardingAnswers> }
  | { type: 'USERNAME_SUBMIT_START' }
  | { type: 'USERNAME_SUBMIT_SUCCESS' }
  | { type: 'USERNAME_SUBMIT_ERROR'; error: string }
  | { type: 'FINALIZE_START' }
  | { type: 'FINALIZE_SUCCESS' }
  | { type: 'FINALIZE_ERROR'; error: string }
  | { type: 'FINALIZE_RETRY' }
  | { type: 'RESTORE_PROGRESS'; step: number; answers: OnboardingAnswers; messages: ChatMessage[] };

interface OnboardingState {
  step: number;
  messages: ChatMessage[];
  showTyping: boolean;
  showOptions: boolean;
  answers: OnboardingAnswers;
  completing: boolean;
  finalizeError: string | null;
  finalizeLoading: boolean;
  usernameSubmitLoading: boolean;
  usernameSubmitError: string | null;
  reducedMotion: boolean;
}

const initialState: OnboardingState = {
  step: 0,
  messages: [],
  showTyping: false,
  showOptions: false,
  answers: {},
  completing: false,
  finalizeError: null,
  finalizeLoading: false,
  usernameSubmitLoading: false,
  usernameSubmitError: null,
  reducedMotion: false,
};

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  if (isDev) console.log('[OnboardingReducer] action:', action.type, action);

  switch (action.type) {
    case 'SET_REDUCED_MOTION':
      return { ...state, reducedMotion: action.value };

    case 'SHOW_TYPING':
      return { ...state, showTyping: true };

    case 'HIDE_TYPING':
      return { ...state, showTyping: false };

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };

    case 'SHOW_OPTIONS':
      return { ...state, showOptions: true };

    case 'HIDE_OPTIONS':
      return { ...state, showOptions: false };

    case 'SET_STEP':
      return { ...state, step: action.step, showOptions: false };

    case 'SET_ANSWERS':
      return { ...state, answers: { ...state.answers, ...action.answers } };

    case 'USERNAME_SUBMIT_START':
      return { ...state, usernameSubmitLoading: true, usernameSubmitError: null };

    case 'USERNAME_SUBMIT_SUCCESS':
      return { ...state, usernameSubmitLoading: false, usernameSubmitError: null };

    case 'USERNAME_SUBMIT_ERROR':
      return { ...state, usernameSubmitLoading: false, usernameSubmitError: action.error };

    case 'FINALIZE_START':
      return { ...state, completing: true, finalizeLoading: true, finalizeError: null };

    case 'FINALIZE_SUCCESS':
      return { ...state, finalizeLoading: false, finalizeError: null };

    case 'FINALIZE_ERROR':
      return { ...state, finalizeLoading: false, completing: false, finalizeError: action.error };

    case 'FINALIZE_RETRY':
      return {
        ...state,
        finalizeError: null,
        messages: state.messages.filter(m => m.id !== 'done'),
      };

    case 'RESTORE_PROGRESS':
      return {
        ...state,
        step: action.step,
        answers: action.answers,
        messages: action.messages,
      };

    default:
      return state;
  }
}

// ── Constants ─────────────────────────────────────────────────
const SAVED_PROGRESS_VERSION = 1;

const SKIP_ACKS = [
  "No worries, you can set that up later",
  "All good, you can change this anytime in Settings",
  "Cool, moving on",
];

const QUESTIONS = [
  "Hey! Welcome to mise.en" + ".place. I'm here to help you get set up.\n\nWhat should we call you?",
  "How often are you hoping to cook?",
  "Any dietary preferences? Tap all that apply.",
  "Last one — how would you describe your cooking?",
];

const STEP_NAMES = ['username', 'goal', 'dietary', 'skill'] as const;

// ── Sub-components (chat bubbles) ─────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12 }} aria-label="Assistant is typing">
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${C.flame}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {/* TODO: Mascot slot — swap SVG for animated mascot component when ready */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke={C.flame} strokeWidth="1.5" opacity=".6" />
        </svg>
      </div>
      <div style={{ background: C.cream, borderRadius: '16px 16px 16px 4px', padding: '12px 16px', display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6, height: 6, borderRadius: '50%', background: C.muted,
              animation: `typingBounce .6s ease-in-out ${i * 150}ms infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AppBubble({ text, animate }: { text: string; animate: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12, animation: animate ? 'bubbleIn .3s ease-out both' : 'none' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${C.flame}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {/* TODO: Mascot slot — swap SVG for animated mascot component when ready */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke={C.flame} strokeWidth="1.5" opacity=".6" />
        </svg>
      </div>
      <div style={{ background: C.cream, color: C.bark, borderRadius: '16px 16px 16px 4px', padding: '12px 16px', maxWidth: '75%', fontSize: 15, lineHeight: 1.55, fontFamily: BF, whiteSpace: 'pre-line' }}>
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text, animate }: { text: string; animate: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, animation: animate ? 'bubbleInRight .3s ease-out both' : 'none' }}>
      <div style={{ background: C.flame, color: '#fff', borderRadius: '16px 16px 4px 16px', padding: '12px 16px', maxWidth: '75%', fontSize: 15, lineHeight: 1.55, fontFamily: BF }}>
        {text}
      </div>
    </div>
  );
}

// ── Error boundary ────────────────────────────────────────────
class OnboardingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[OnboardingErrorBoundary] Caught error:', error, info);
    trackEvent('onboarding_error_boundary', { error: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000, background: C.paper,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: BF, padding: 32,
        }}>
          <div style={{ fontSize: 18, fontFamily: DF, color: C.bark, marginBottom: 12 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, textAlign: 'center' }}>
            Please refresh the page to try again.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 32px', borderRadius: 14, border: 'none',
              background: C.flame, color: '#fff', fontWeight: 700,
              fontSize: 15, fontFamily: DF, cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main component ────────────────────────────────────────────

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

function OnboardingFlowInner({ userId, onComplete }: OnboardingFlowProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipAckIdx = useRef(0);
  const initialized = useRef(false);
  const completedRef = useRef(false);

  const {
    step, messages, showTyping, showOptions, answers,
    completing, finalizeError, finalizeLoading,
    usernameSubmitLoading, usernameSubmitError, reducedMotion,
  } = state;

  // Keep a ref to answers so async functions always read the latest
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // ── Reduced motion ────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      dispatch({ type: 'SET_REDUCED_MOTION', value: mq.matches });
    }
  }, []);

  // ── Scroll to bottom ─────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showTyping]);

  // ── Analytics: track unmount before completion ────────────
  useEffect(() => {
    trackEvent('onboarding_started');
    return () => {
      if (!completedRef.current) {
        trackEvent('onboarding_abandoned', { lastStep: STEP_NAMES[step] ?? step });
      }
    };
  }, []);

  // ── Helper: get display text for a past answer ────────────
  function getAnswerText(stepIdx: number, ans: OnboardingAnswers): string | null {
    switch (stepIdx) {
      case 0: return ans.username || null;
      case 1: return GOAL_OPTIONS.find((o) => o.value === ans.goal)?.label || null;
      case 2: return ans.dietary?.length
        ? ans.dietary.map((d) => {
            const entry = Object.entries(DIETARY_VALUES).find(([, v]) => v === d);
            return entry ? entry[0] : d;
          }).join(', ')
        : null;
      case 3: return SKILL_OPTIONS.find((o) => o.value === ans.skill_level)?.label || null;
      default: return null;
    }
  }

  // ── localStorage save/load ────────────────────────────────
  const saveProgress = useCallback((currentStep: number, newAnswers: OnboardingAnswers) => {
    try {
      const payload = { version: SAVED_PROGRESS_VERSION, currentStep, answers: newAnswers };
      localStorage.setItem('mep_onboarding_progress', JSON.stringify(payload));
    } catch (e) {
      if (isDev) console.log('[OnboardingFlow] saveProgress failed:', e);
    }
  }, []);

  // ── Step orchestration ────────────────────────────────────
  const startStep = useCallback((stepIdx: number) => {
    if (isDev) console.log('[OnboardingFlow] startStep:', stepIdx);

    if (stepIdx >= 4) {
      finishOnboarding();
      return;
    }

    dispatch({ type: 'SET_STEP', step: stepIdx });
    trackEvent('step_viewed', { step: STEP_NAMES[stepIdx] });

    const delay = reducedMotion ? 0 : 700;
    dispatch({ type: 'SHOW_TYPING' });

    setTimeout(() => {
      dispatch({ type: 'HIDE_TYPING' });
      dispatch({ type: 'ADD_MESSAGE', message: { id: `q-${stepIdx}`, from: 'app', text: QUESTIONS[stepIdx] } });
      setTimeout(() => dispatch({ type: 'SHOW_OPTIONS' }), reducedMotion ? 0 : 200);
    }, delay);
  }, [reducedMotion]);

  // ── Resume from localStorage on mount ─────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('mep_onboarding_progress');
      if (raw) {
        const saved = JSON.parse(raw);

        // Version check — discard if mismatched
        if (saved.version !== SAVED_PROGRESS_VERSION) {
          if (isDev) console.log('[OnboardingFlow] Discarding saved progress — version mismatch:', saved.version);
          localStorage.removeItem('mep_onboarding_progress');
          startStep(0);
          return;
        }

        const restoredAnswers: OnboardingAnswers = saved.answers ?? {};
        if (isDev) console.log('[OnboardingFlow] Restoring progress:', saved);

        // Rebuild message history
        const history: ChatMessage[] = [];
        for (let i = 0; i < saved.currentStep; i++) {
          history.push({ id: `q-${i}`, from: 'app', text: QUESTIONS[i] });
          const ansText = getAnswerText(i, restoredAnswers);
          if (ansText) {
            history.push({ id: `a-${i}`, from: 'user', text: ansText });
          } else {
            history.push({ id: `s-${i}`, from: 'app', text: SKIP_ACKS[i % SKIP_ACKS.length] });
          }
        }

        dispatch({ type: 'RESTORE_PROGRESS', step: saved.currentStep, answers: restoredAnswers, messages: history });
        // Use setTimeout to avoid startStep referencing stale reducedMotion
        setTimeout(() => startStep(saved.currentStep), 0);
        return;
      }
    } catch (e) {
      if (isDev) console.log('[OnboardingFlow] Failed to load saved progress:', e);
    }

    startStep(0);
  }, [startStep]);

  // ── Handle answer from a step ─────────────────────────────
  const handleAnswer = useCallback((stepIdx: number, answerText: string, answerValue: Partial<OnboardingAnswers>) => {
    dispatch({ type: 'HIDE_OPTIONS' });
    dispatch({ type: 'ADD_MESSAGE', message: { id: `a-${stepIdx}`, from: 'user', text: answerText } });
    const newAnswers = { ...answers, ...answerValue };
    dispatch({ type: 'SET_ANSWERS', answers: answerValue });
    saveProgress(stepIdx + 1, newAnswers);
    trackEvent('step_completed', { step: STEP_NAMES[stepIdx] });
    setTimeout(() => startStep(stepIdx + 1), reducedMotion ? 100 : 400);
  }, [answers, reducedMotion, saveProgress, startStep]);

  // ── Handle skip ───────────────────────────────────────────
  const handleSkip = useCallback((stepIdx: number) => {
    dispatch({ type: 'HIDE_OPTIONS' });
    const ack = SKIP_ACKS[skipAckIdx.current % SKIP_ACKS.length];
    skipAckIdx.current++;
    trackEvent('step_skipped', { step: STEP_NAMES[stepIdx] });

    setTimeout(() => {
      dispatch({ type: 'SHOW_TYPING' });
      setTimeout(() => {
        dispatch({ type: 'HIDE_TYPING' });
        dispatch({ type: 'ADD_MESSAGE', message: { id: `s-${stepIdx}`, from: 'app', text: ack } });
        setTimeout(() => {
          saveProgress(stepIdx + 1, answers);
          startStep(stepIdx + 1);
        }, reducedMotion ? 100 : 500);
      }, reducedMotion ? 0 : 600);
    }, reducedMotion ? 0 : 300);
  }, [answers, reducedMotion, saveProgress, startStep]);

  // ── Username submit (profile INSERT) ──────────────────────
  const handleUsernameSubmit = useCallback(async (username: string) => {
    if (isDev) console.log('[OnboardingFlow] handleUsernameSubmit:', username);
    dispatch({ type: 'USERNAME_SUBMIT_START' });

    try {
      const payload = {
        id: userId,
        username: username.toLowerCase().trim(),
        xp: 0,
        level: 1,
        updated_at: new Date().toISOString(),
      };
      console.log('[Onboarding] About to upsert profile:', payload);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upsert timeout')), 10000)
      );
      const upsertPromise = supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      const { data, error } = await Promise.race([upsertPromise, timeoutPromise]) as Awaited<typeof upsertPromise>;
      console.log('[Onboarding] Upsert returned, error:', error);

      if (error) {
        console.error('[OnboardingFlow] Username insert error:', error);
        const message = error.message.includes('username')
          ? "That username isn't available"
          : 'Failed to save username. Please try again.';
        dispatch({ type: 'USERNAME_SUBMIT_ERROR', error: message });
        dispatch({ type: 'SHOW_OPTIONS' });
        trackEvent('username_validation_error', { error: 'insert_failed' });
        return;
      }

      if (isDev) console.log('[OnboardingFlow] Username insert success:', data);
      dispatch({ type: 'USERNAME_SUBMIT_SUCCESS' });
      handleAnswer(0, username, { username });
    } catch (e) {
      const isTimeout = e instanceof Error && e.message === 'Upsert timeout';
      if (isTimeout) {
        console.error('[Onboarding] Upsert TIMEOUT after 10s');
      } else {
        console.error('[OnboardingFlow] Username insert threw:', e);
      }
      dispatch({ type: 'USERNAME_SUBMIT_ERROR', error: isTimeout ? 'Request timed out. Please try again.' : 'Failed to save username. Please try again.' });
      dispatch({ type: 'SHOW_OPTIONS' });
      trackEvent('username_validation_error', { error: isTimeout ? 'timeout' : 'insert_threw' });
    }
  }, [userId, handleAnswer]);

  // ── Finalize onboarding (profile UPDATE) ──────────────────
  async function finishOnboarding() {
    // Read from ref to avoid stale closure
    const currentAnswers = answersRef.current;
    console.log('[Onboarding] finishOnboarding called with answers:', currentAnswers);
    console.log('[Onboarding] userId:', userId);
    dispatch({ type: 'FINALIZE_START' });

    const username = currentAnswers.username || '';

    // Show final bubble
    dispatch({ type: 'SHOW_TYPING' });
    await new Promise((r) => setTimeout(r, reducedMotion ? 0 : 700));
    dispatch({ type: 'HIDE_TYPING' });
    dispatch({ type: 'ADD_MESSAGE', message: { id: 'done', from: 'app', text: `You're all set, ${username}. Let's cook.` } });

    // Update profile in Supabase
    const payload = {
      goal: currentAnswers.goal || null,
      dietary: currentAnswers.dietary || [],
      skill_level: currentAnswers.skill_level || null,
      onboarded_at: new Date().toISOString(),
    };

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqjkxmrhalrlbfackydv.supabase.co';
    const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const token = getAuthToken() || SUPABASE_ANON;

    console.log('[Onboarding] About to finalize UPDATE:', payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[Onboarding] Finalize via raw fetch FAILED:', err);
      dispatch({
        type: 'FINALIZE_ERROR',
        error: err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Something went wrong. Please try again.',
      });
      return;
    }

    clearTimeout(timeoutId);
    console.log('[Onboarding] Finalize via raw fetch, status:', res.status);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[Onboarding] Finalize non-OK response:', res.status, body);
      dispatch({ type: 'FINALIZE_ERROR', error: 'Could not save your profile. Please try again.' });
      return;
    }

    dispatch({ type: 'FINALIZE_SUCCESS' });

    // Clean up localStorage
    try { localStorage.removeItem('mep_onboarding_progress'); } catch {}
    try { localStorage.setItem('mep_onboarded', 'true'); } catch {}

    completedRef.current = true;
    trackEvent('onboarding_completed');

    await new Promise((r) => setTimeout(r, reducedMotion ? 200 : 800));
    onComplete();
  }

  // ── Retry finalize ────────────────────────────────────────
  const handleRetryFinalize = useCallback(async () => {
    dispatch({ type: 'FINALIZE_RETRY' });
    await finishOnboarding();
  }, [reducedMotion, userId, onComplete]);

  // ── Progress bar value ────────────────────────────────────
  const progress = useMemo(() => {
    if (completing) return 100;
    return Math.round((step / 4) * 100);
  }, [step, completing]);

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: C.paper, display: 'flex', flexDirection: 'column', fontFamily: BF }}>
      <style>{`
        @keyframes typingBounce { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-4px) } }
        @keyframes bubbleIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
        @keyframes bubbleInRight { from { opacity:0; transform:translateX(8px) } to { opacity:1; transform:translateX(0) } }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Onboarding progress: ${progress}%`}
        style={{ width: '100%', height: 3, background: C.cream, flexShrink: 0 }}
      >
        <div style={{ width: `${progress}%`, height: '100%', background: C.flame, transition: 'width .5s ease-out', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Onboarding conversation"
        style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 0', maxWidth: 480, width: '100%', margin: '0 auto', WebkitOverflowScrolling: 'touch' }}
      >
        {messages.map((msg) => (
          msg.from === 'app'
            ? <AppBubble key={msg.id} text={msg.text} animate={!reducedMotion} />
            : <UserBubble key={msg.id} text={msg.text} animate={!reducedMotion} />
        ))}
        {showTyping && <TypingIndicator />}
        <div style={{ height: 16 }} />
      </div>

      {/* Finalize error with retry */}
      {finalizeError && (
        <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: '#fff', padding: '16px', maxWidth: 480, width: '100%', margin: '0 auto', textAlign: 'center' }}>
          <div role="alert" style={{ color: C.flame, fontSize: 14, fontFamily: BF, marginBottom: 12 }}>
            {finalizeError}
          </div>
          <button
            onClick={handleRetryFinalize}
            aria-label="Retry saving profile"
            style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: C.flame, color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: DF, cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Bottom input/options area */}
      {showOptions && !completing && (
        <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: '#fff', padding: '16px', maxWidth: 480, width: '100%', margin: '0 auto' }}>

          {step === 0 && (
            <StepUsername
              dispatch={dispatch}
              userId={userId}
              usernameSubmitLoading={usernameSubmitLoading}
              usernameSubmitError={usernameSubmitError}
              onSubmit={handleUsernameSubmit}
            />
          )}

          {step === 1 && (
            <StepGoal
              onAnswer={(label, value) => handleAnswer(1, label, { goal: value })}
              onSkip={() => handleSkip(1)}
            />
          )}

          {step === 2 && (
            <StepDietary
              onAnswer={(label, values) => handleAnswer(2, label, { dietary: values })}
              onSkip={() => handleSkip(2)}
            />
          )}

          {step === 3 && (
            <StepSkill
              onAnswer={(label, value) => handleAnswer(3, label, { skill_level: value })}
              onSkip={() => handleSkip(3)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Wrapped export with error boundary ──────────────────────
export default function OnboardingFlow(props: OnboardingFlowProps) {
  return (
    <OnboardingErrorBoundary>
      <OnboardingFlowInner {...props} />
    </OnboardingErrorBoundary>
  );
}
