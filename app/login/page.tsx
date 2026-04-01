'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqjkxmrhalrlbfackydv.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamt4bXJoYWxybGJmYWNreWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzUwMjIsImV4cCI6MjA4OTkxMTAyMn0.3lR3Bvo9pFX1PvBF6XlXGiqEixC_l_G5gocX4MIETv0';
const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);

const AVATARS = ['🧑‍🍳','👩‍🍳','🧔','👩‍🦱','👨‍🦰','👩‍🦰','🧑‍🦱','👴','👩','👨','🧒','👧'];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:wght@300;400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1A0F08; font-family: 'Source Serif 4', Georgia, serif; }
  input, button, textarea { font-family: inherit; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
  @keyframes shimmer { 0%,100% { opacity:.4; } 50% { opacity:.7; } }
  .fade { animation: fadeUp .5s cubic-bezier(.4,0,.2,1) both; }
  .fade2 { animation: fadeUp .5s .1s cubic-bezier(.4,0,.2,1) both; }
  .fade3 { animation: fadeUp .5s .2s cubic-bezier(.4,0,.2,1) both; }
  .fade4 { animation: fadeUp .5s .3s cubic-bezier(.4,0,.2,1) both; }
  input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #2A1A0E inset !important; -webkit-text-fill-color: #F5E6D3 !important; }
`;

export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'signup'|'onboard'|'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [checkingUser, setCheckingUser] = useState(false);
  const [userAvailable, setUserAvailable] = useState<boolean|null>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [focusedField, setFocusedField] = useState('');

  const checkUsername = async (val: string) => {
    setUsername(val);
    setUserAvailable(null);
    if (val.length < 3) return;
    setCheckingUser(true);
    const { data } = await supabase.from('profiles').select('id').eq('username', val.toLowerCase().trim()).single();
    setUserAvailable(!data);
    setCheckingUser(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else window.location.href = '/';
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) { setPendingUser(data.user); setMode('onboard'); }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setInfo('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) setError(error.message);
    else setInfo('Check your email for a reset link.');
    setLoading(false);
  };

  const handleOnboard = async () => {
    if (!username.trim() || !avatar || !userAvailable) return;
    setLoading(true); setError('');
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase().trim()).single();
    if (existing) { setError('Username taken'); setUserAvailable(false); setLoading(false); return; }
    const { error } = await supabase.from('profiles').upsert({
      id: pendingUser?.id, username: username.toLowerCase().trim(),
      avatar_url: avatar, xp: 0, level: 1, updated_at: new Date().toISOString(),
    });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = '/';
  };

  const inputStyle = (field: string) => ({
    width: '100%' as const,
    padding: '16px 18px',
    borderRadius: 16,
    border: `1.5px solid ${focusedField===field ? '#C4814A' : 'rgba(255,255,255,.08)'}`,
    background: 'rgba(255,255,255,.04)',
    fontSize: 15,
    color: '#F5E6D3',
    outline: 'none',
    transition: 'border-color .2s',
    letterSpacing: '.01em',
  });

  const primaryBtn = (disabled=false) => ({
    width: '100%' as const,
    padding: '16px',
    borderRadius: 16,
    border: 'none',
    background: disabled ? 'rgba(196,129,74,.3)' : 'linear-gradient(135deg, #C4814A, #A0622E)',
    color: disabled ? 'rgba(245,230,211,.3)' : '#FAF4EE',
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '.03em',
    transition: 'all .2s',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(196,129,74,.35)',
  });

  const ghostBtn = {
    width: '100%' as const,
    padding: '15px',
    borderRadius: 16,
    border: '1.5px solid rgba(255,255,255,.1)',
    background: 'transparent',
    color: 'rgba(245,230,211,.5)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    letterSpacing: '.02em',
    transition: 'all .2s',
  };

  // ── SHARED LAYOUT ─────────────────────────────────────────────────────
  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', background: '#1A0F08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
      <style>{css}</style>
      {/* Background texture */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(196,129,74,.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(92,122,78,.08) 0%, transparent 50%)', pointerEvents: 'none' }}/>
      <div style={{ width: '100%', maxWidth: 390, position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );

  const Logo = () => (
    <div className="fade" style={{ textAlign: 'center', marginBottom: 44 }}>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 900, color: '#F5E6D3', letterSpacing: '-.02em', lineHeight: 1 }}>
        mise<span style={{ color: '#C4814A' }}>.</span>en<span style={{ color: '#C4814A' }}>.</span>place
      </div>
      <div style={{ fontSize: 12, color: 'rgba(245,230,211,.35)', marginTop: 8, letterSpacing: '.15em', textTransform: 'uppercase' }}>
        your daily cooking habit
      </div>
    </div>
  );

  const Err = ({ msg }: { msg: string }) => msg ? (
    <div style={{ fontSize: 13, color: '#E07A5F', padding: '10px 14px', background: 'rgba(224,122,95,.1)', borderRadius: 12, marginBottom: 14, border: '1px solid rgba(224,122,95,.2)' }}>
      {msg}
    </div>
  ) : null;

  const Info = ({ msg }: { msg: string }) => msg ? (
    <div style={{ fontSize: 13, color: '#92B383', padding: '10px 14px', background: 'rgba(146,179,131,.1)', borderRadius: 12, marginBottom: 14, border: '1px solid rgba(146,179,131,.2)' }}>
      {msg}
    </div>
  ) : null;

  const Divider = ({ label }: { label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }}/>
      <span style={{ fontSize: 11, color: 'rgba(245,230,211,.25)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }}/>
    </div>
  );

  // ── ONBOARDING ────────────────────────────────────────────────────────
  if (mode === 'onboard') return (
    <Wrap>
      <Logo/>
      <div className="fade2" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'rgba(245,230,211,.4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 of 2</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#F5E6D3', marginBottom: 6 }}>Choose your avatar</div>
        <div style={{ fontSize: 14, color: 'rgba(245,230,211,.45)', lineHeight: 1.5 }}>How friends will see you across the app</div>
      </div>
      <div className="fade3" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 28 }}>
        {AVATARS.map(a => (
          <button key={a} onClick={() => setAvatar(a)} style={{
            fontSize: 26, background: avatar===a ? 'rgba(196,129,74,.2)' : 'rgba(255,255,255,.04)',
            border: `1.5px solid ${avatar===a ? '#C4814A' : 'rgba(255,255,255,.07)'}`,
            borderRadius: 14, padding: '10px 4px', cursor: 'pointer', transition: 'all .15s', aspectRatio: '1',
            boxShadow: avatar===a ? '0 0 0 3px rgba(196,129,74,.15)' : 'none',
          }}>{a}</button>
        ))}
      </div>

      <div className="fade3" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: 'rgba(245,230,211,.4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>Step 2 of 2 — Choose a username</div>
        <div style={{ position: 'relative' }}>
          <input
            value={username}
            onChange={e => checkUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g,''))}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField('')}
            placeholder="e.g. chef_axel" maxLength={20}
            style={{ ...inputStyle('username'), borderColor: userAvailable===true?'rgba(146,179,131,.6)':userAvailable===false?'rgba(224,122,95,.6)':focusedField==='username'?'#C4814A':'rgba(255,255,255,.08)', paddingRight: 44 }}
          />
          <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: userAvailable===true?'#92B383':userAvailable===false?'#E07A5F':'transparent' }}>
            {checkingUser ? '…' : userAvailable===true ? '✓' : userAvailable===false ? '✗' : ''}
          </div>
        </div>
        {userAvailable===true && <div style={{ fontSize: 12, color: '#92B383', marginTop: 6 }}>Available</div>}
        {userAvailable===false && <div style={{ fontSize: 12, color: '#E07A5F', marginTop: 6 }}>Already taken — try another</div>}
        <div style={{ fontSize: 11, color: 'rgba(245,230,211,.25)', marginTop: 8 }}>Letters, numbers, _ and . only</div>
      </div>

      <Err msg={error}/>
      <div className="fade4">
        <button onClick={handleOnboard} disabled={!avatar||!username||username.length<3||!userAvailable||loading}
          style={primaryBtn(!avatar||!username||username.length<3||!userAvailable||loading)}>
          {loading ? 'Setting up your profile…' : 'Start cooking'}
        </button>
      </div>
    </Wrap>
  );

  // ── RESET ────────────────────────────────────────────────────────────
  if (mode === 'reset') return (
    <Wrap>
      <Logo/>
      <div className="fade2" style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#F5E6D3', marginBottom: 6 }}>Reset password</div>
        <div style={{ fontSize: 14, color: 'rgba(245,230,211,.45)', lineHeight: 1.6 }}>Enter your email and we'll send you a link.</div>
      </div>
      <form onSubmit={handleReset} className="fade3">
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
          onFocus={()=>setFocusedField('email')} onBlur={()=>setFocusedField('')}
          placeholder="Email address" required
          style={{ ...inputStyle('email'), marginBottom: 16 }}/>
        <Err msg={error}/>
        <Info msg={info}/>
        <button type="submit" disabled={loading||!email} style={primaryBtn(loading||!email)}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <Divider label="or"/>
      <button onClick={()=>setMode('login')} style={ghostBtn} className="fade4">Back to sign in</button>
    </Wrap>
  );

  // ── SIGNUP ────────────────────────────────────────────────────────────
  if (mode === 'signup') return (
    <Wrap>
      <Logo/>
      <div className="fade2" style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#F5E6D3', marginBottom: 6 }}>Create an account</div>
        <div style={{ fontSize: 14, color: 'rgba(245,230,211,.45)' }}>Join the community of home cooks.</div>
      </div>
      <form onSubmit={handleSignup}>
        <input className="fade2" type="email" value={email} onChange={e=>setEmail(e.target.value)}
          onFocus={()=>setFocusedField('email')} onBlur={()=>setFocusedField('')}
          placeholder="Email address" required style={{ ...inputStyle('email'), marginBottom: 12 }}/>
        <input className="fade3" type="password" value={password} onChange={e=>setPassword(e.target.value)}
          onFocus={()=>setFocusedField('password')} onBlur={()=>setFocusedField('')}
          placeholder="Password — at least 6 characters" required style={{ ...inputStyle('password'), marginBottom: 20 }}/>
        <Err msg={error}/>
        <button type="submit" disabled={loading||!email||!password} className="fade4" style={primaryBtn(loading||!email||!password)}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <Divider label="already have an account"/>
      <button onClick={()=>setMode('login')} style={ghostBtn}>Sign in</button>
    </Wrap>
  );

  // ── LOGIN ────────────────────────────────────────────────────────────
  return (
    <Wrap>
      <Logo/>
      <div className="fade2" style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#F5E6D3', marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 14, color: 'rgba(245,230,211,.45)' }}>Sign in to continue cooking.</div>
      </div>
      <form onSubmit={handleLogin}>
        <input className="fade2" type="email" value={email} onChange={e=>setEmail(e.target.value)}
          onFocus={()=>setFocusedField('email')} onBlur={()=>setFocusedField('')}
          placeholder="Email address" required style={{ ...inputStyle('email'), marginBottom: 12 }}/>
        <input className="fade3" type="password" value={password} onChange={e=>setPassword(e.target.value)}
          onFocus={()=>setFocusedField('password')} onBlur={()=>setFocusedField('')}
          placeholder="Password" required style={{ ...inputStyle('password'), marginBottom: 8 }}/>
        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <button type="button" onClick={()=>setMode('reset')} style={{ background: 'none', border: 'none', color: 'rgba(196,129,74,.7)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            Forgot password?
          </button>
        </div>
        <Err msg={error}/>
        <Info msg={info}/>
        <button type="submit" disabled={loading||!email||!password} className="fade4" style={primaryBtn(loading||!email||!password)}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <Divider label="new here"/>
      <button onClick={()=>setMode('signup')} style={ghostBtn} className="fade4">Create an account</button>
    </Wrap>
  );
}