'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqjkxmrhalrlbfackydv.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamt4bXJoYWxybGJmYWNreWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzUwMjIsImV4cCI6MjA4OTkxMTAyMn0.3lR3Bvo9pFX1PvBF6XlXGiqEixC_l_G5gocX4MIETv0';

const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);

const AVATARS = ['🧑‍🍳','👩‍🍳','🧔','👩‍🦱','👨‍🦰','👩‍🦰','🧑‍🦱','👴','👩','👨','🧒','👧'];

const S = {
  page:    { minHeight:'100vh', background:'#FAF4EE', fontFamily:'Georgia,serif', padding:'24px 20px' },
  card:    { background:'#FFF8F0', borderRadius:20, padding:'28px 22px', border:'2px solid #EEE5DC', marginBottom:16 },
  label:   { fontSize:12, fontWeight:700, color:'#9E8C7E', display:'block', marginBottom:6, textTransform:'uppercase' as const, letterSpacing:'.07em' },
  input:   { width:'100%', padding:'12px 14px', borderRadius:14, border:'2px solid #EEE5DC', background:'#FAF4EE', fontSize:14, color:'#3B2A1A', outline:'none', boxSizing:'border-box' as const, fontFamily:'Georgia,serif' },
  btn:     { width:'100%', padding:'13px', borderRadius:14, border:'none', background:'#FF4D1C', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'Georgia,serif', transition:'all .18s' },
  btnGrey: { width:'100%', padding:'13px', borderRadius:14, border:'2px solid #EEE5DC', background:'transparent', color:'#9E8C7E', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Georgia,serif' },
  err:     { fontSize:13, color:'#FF4D1C', padding:'9px 12px', background:'#FF4D1C18', borderRadius:10, marginBottom:12 },
  ok:      { fontSize:13, color:'#5C7A4E', padding:'9px 12px', background:'#5C7A4E18', borderRadius:10, marginBottom:12 },
};

export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'signup'|'onboard'>( 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean|null>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const checkUsername = async (val: string) => {
    setUsername(val);
    setUsernameAvailable(null);
    if (val.length < 3) return;
    setCheckingUsername(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', val.toLowerCase().trim())
      .single();
    setUsernameAvailable(!data);
    setCheckingUsername(false);
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

  const handleOnboard = async () => {
    if (!username.trim() || !avatar || !usernameAvailable) return;
    setLoading(true); setError('');
    const userId = pendingUser?.id;
    if (!userId) { setError('Something went wrong. Please try again.'); setLoading(false); return; }

    // Check username one more time
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (existing) { setError('Username taken — please choose another'); setUsernameAvailable(false); setLoading(false); return; }

    // Upsert profile
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username: username.toLowerCase().trim(),
      avatar_url: avatar,
      xp: 0,
      level: 1,
      updated_at: new Date().toISOString(),
    });

    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = '/';
  };

  const Header = () => (
    <div style={{ textAlign:'center', marginBottom:28 }}>
      <div style={{ fontSize:52, marginBottom:10 }}>🍳</div>
      <div style={{ fontSize:26, fontWeight:900, color:'#3B2A1A' }}>
        mise<span style={{ color:'#FF4D1C' }}>.</span>en<span style={{ color:'#FF4D1C' }}>.</span>place
      </div>
      <div style={{ fontSize:13, color:'#9E8C7E', marginTop:3 }}>your daily cooking habit</div>
    </div>
  );

  // ── ONBOARDING SCREEN ──────────────────────────────────────────────────
  if (mode === 'onboard') return (
    <div style={S.page}>
      <Header/>
      <div style={{ background:'#5C7A4E18', border:'2px solid #5C7A4E33', borderRadius:14, padding:'11px 14px', marginBottom:16, fontSize:13, color:'#5C7A4E', fontWeight:600 }}>
        ✅ Account created! Now set up your profile.
      </div>

      <div style={S.card}>
        <div style={{ fontWeight:900, fontSize:18, color:'#3B2A1A', marginBottom:4, fontFamily:'Georgia,serif' }}>Pick your avatar</div>
        <div style={{ fontSize:12, color:'#9E8C7E', marginBottom:14 }}>This is how friends will see you</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:4 }}>
          {AVATARS.map(a => (
            <button key={a} onClick={() => setAvatar(a)} style={{
              fontSize:28, background:avatar===a?'#FF4D1C18':'#F0EBE6',
              border:`2px solid ${avatar===a?'#FF4D1C':'#EEE5DC'}`,
              borderRadius:12, padding:'8px 4px', cursor:'pointer',
              transition:'all .15s', aspectRatio:'1'
            }}>{a}</button>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <label style={S.label}>Choose a username</label>
        <div style={{ position:'relative' }}>
          <input
            value={username}
            onChange={e => checkUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g,''))}
            placeholder="e.g. chef_axel"
            maxLength={20}
            style={{
              ...S.input,
              borderColor: usernameAvailable===true?'#5C7A4E':usernameAvailable===false?'#FF4D1C':'#EEE5DC',
              paddingRight:40,
            }}
          />
          <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>
            {checkingUsername?'⏳':usernameAvailable===true?'✅':usernameAvailable===false?'❌':''}
          </div>
        </div>
        {username.length>0&&username.length<3&&<div style={{ fontSize:11, color:'#9E8C7E', marginTop:5 }}>At least 3 characters</div>}
        {usernameAvailable===true&&<div style={{ fontSize:11, color:'#5C7A4E', marginTop:5, fontWeight:700 }}>✓ Available!</div>}
        {usernameAvailable===false&&<div style={{ fontSize:11, color:'#FF4D1C', marginTop:5, fontWeight:700 }}>✗ Already taken — try another</div>}
        <div style={{ fontSize:11, color:'#9E8C7E', marginTop:6 }}>Letters, numbers, _ and . only. Cannot be changed later.</div>
      </div>

      {error&&<div style={S.err}>{error}</div>}

      <button
        onClick={handleOnboard}
        disabled={!avatar||!username||username.length<3||!usernameAvailable||loading}
        style={{
          ...S.btn,
          background:(!avatar||!username||username.length<3||!usernameAvailable||loading)?'#D8D0C8':'#FF4D1C',
          cursor:(!avatar||!username||username.length<3||!usernameAvailable||loading)?'not-allowed':'pointer',
        }}
      >
        {loading?'Setting up your profile…':'Start Cooking 🍳'}
      </button>
    </div>
  );

  // ── LOGIN SCREEN ───────────────────────────────────────────────────────
  if (mode === 'login') return (
    <div style={S.page}>
      <Header/>
      <div style={S.card}>
        <div style={{ fontWeight:900, fontSize:18, color:'#3B2A1A', marginBottom:16 }}>Sign in</div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:12 }}>
            <label style={S.label}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={S.input}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={S.input}/>
          </div>
          {error&&<div style={S.err}>{error}</div>}
          {info&&<div style={S.ok}>{info}</div>}
          <button type="submit" disabled={loading||!email||!password} style={{...S.btn,background:loading||!email||!password?'#D8D0C8':'#FF4D1C',cursor:loading||!email||!password?'not-allowed':'pointer'}}>
            {loading?'Signing in…':'Sign In'}
          </button>
        </form>
      </div>

      <button onClick={()=>setMode('signup')} style={S.btnGrey}>
        No account? Create one →
      </button>
    </div>
  );

  // ── SIGNUP SCREEN ──────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <Header/>
      <div style={S.card}>
        <div style={{ fontWeight:900, fontSize:18, color:'#3B2A1A', marginBottom:16 }}>Create account</div>
        <form onSubmit={handleSignup}>
          <div style={{ marginBottom:12 }}>
            <label style={S.label}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={S.input}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" required style={S.input}/>
          </div>
          {error&&<div style={S.err}>{error}</div>}
          <button type="submit" disabled={loading||!email||!password} style={{...S.btn,background:loading||!email||!password?'#D8D0C8':'#FF4D1C',cursor:loading||!email||!password?'not-allowed':'pointer',marginBottom:12}}>
            {loading?'Creating account…':'Create Account →'}
          </button>
        </form>
        <button onClick={()=>setMode('login')} style={S.btnGrey}>
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}