'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AVATAR_COLORS = ['#E05C7A','#4A90D9','#5C7A4E','#FF8C42','#9B5DE5','#F5C842','#FF4D1C','#CC2200','#4A7A8A','#8BAF78','#C4814A','#6B4A8A'];
const AVATAR_LABELS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{--bg-page:#1A0F08;--bg-card:#2A1A0E;--text-primary:#F5E6D3;--text-muted:#9E8C7E;--accent:#FF4D1C}
  body{background:var(--bg-page);font-family:'Source Serif 4',Georgia,serif;}
  input,button{font-family:inherit;}
  .mep-input{
    width:100%;padding:16px 18px;border-radius:16px;
    border:1.5px solid rgba(255,255,255,.12);
    background:rgba(255,255,255,.04);
    font-size:15px;color:#F5E6D3;outline:none;
    letter-spacing:.01em;transition:border-color .2s;
    display:block;margin-bottom:12px;
  }
  .mep-input:focus{border-color:#C4814A;}
  .mep-input::placeholder{color:rgba(245,230,211,.3);}
  input:-webkit-autofill{
    -webkit-box-shadow:0 0 0 100px #2A1A0E inset !important;
    -webkit-text-fill-color:#F5E6D3 !important;
  }
  .mep-btn-primary{
    width:100%;padding:16px;border-radius:16px;border:none;
    background:linear-gradient(135deg,#C4814A,#A0622E);
    color:#FAF4EE;font-weight:700;font-size:15px;cursor:pointer;
    letter-spacing:.03em;transition:opacity .2s;
    box-shadow:0 4px 20px rgba(196,129,74,.35);
    font-family:inherit;
  }
  .mep-btn-primary:disabled{
    background:rgba(196,129,74,.25);color:rgba(245,230,211,.3);
    box-shadow:none;cursor:not-allowed;
  }
  .mep-btn-ghost{
    width:100%;padding:15px;border-radius:16px;
    border:1.5px solid rgba(255,255,255,.1);background:transparent;
    color:rgba(245,230,211,.45);font-weight:600;font-size:14px;
    cursor:pointer;letter-spacing:.02em;font-family:inherit;
    transition:border-color .2s;
  }
  .mep-btn-ghost:hover{border-color:rgba(255,255,255,.2);}
  .mep-link{
    background:none;border:none;color:rgba(196,129,74,.8);
    font-size:13px;cursor:pointer;padding:0;font-family:inherit;
  }
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  .f1{animation:fadeUp .45s .0s both cubic-bezier(.4,0,.2,1);}
  .f2{animation:fadeUp .45s .08s both cubic-bezier(.4,0,.2,1);}
  .f3{animation:fadeUp .45s .16s both cubic-bezier(.4,0,.2,1);}
  .f4{animation:fadeUp .45s .24s both cubic-bezier(.4,0,.2,1);}
  .avatar-btn{
    font-size:26px;border-radius:14px;padding:10px 4px;
    cursor:pointer;transition:all .15s;aspect-ratio:1;
    background:rgba(255,255,255,.04);
    border:1.5px solid rgba(255,255,255,.07);
  }
  .avatar-btn.selected{
    background:rgba(196,129,74,.18);
    border-color:#C4814A;
    box-shadow:0 0 0 3px rgba(196,129,74,.12);
  }
`;

const page: React.CSSProperties = {
  minHeight:'100dvh', background:'var(--bg-page, #1A0F08)',
  display:'flex', flexDirection:'column',
  alignItems:'center', justifyContent:'flex-start',
  paddingTop:'15dvh', padding:'15dvh 24px 32px', position:'relative', overflow:'hidden',
};

const bg: React.CSSProperties = {
  position:'absolute', inset:0,
  background:'radial-gradient(ellipse at 30% 20%,rgba(196,129,74,.1) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(92,122,78,.07) 0%,transparent 50%)',
  pointerEvents:'none',
};

const inner: React.CSSProperties = {
  width:'100%', maxWidth:390, position:'relative', zIndex:1,
};

const divider: React.CSSProperties = {
  display:'flex', alignItems:'center', gap:12, margin:'18px 0',
};

// ── SUB-COMPONENTS defined OUTSIDE main export ────────────────────────────
function Logo() {
  return (
    <div className="f1" style={{textAlign:'center',marginBottom:44}}>
      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:32,fontWeight:900,color:'#F5E6D3',letterSpacing:'-.02em',lineHeight:1}}>
        mise<span style={{color:'#C4814A'}}>.</span>en<span style={{color:'#C4814A'}}>.</span>place
      </div>
      <div style={{fontSize:11,color:'rgba(245,230,211,.3)',marginTop:8,letterSpacing:'.15em',textTransform:'uppercase'}}>
        your daily cooking habit
      </div>
    </div>
  );
}

function Err({msg}:{msg:string}) {
  if (!msg) return null;
  return <div style={{fontSize:13,color:'#E07A5F',padding:'10px 14px',background:'rgba(224,122,95,.08)',borderRadius:12,marginBottom:14,border:'1px solid rgba(224,122,95,.15)'}}>{msg}</div>;
}

function InfoMsg({msg}:{msg:string}) {
  if (!msg) return null;
  return <div style={{fontSize:13,color:'#92B383',padding:'10px 14px',background:'rgba(146,179,131,.08)',borderRadius:12,marginBottom:14,border:'1px solid rgba(146,179,131,.15)'}}>{msg}</div>;
}

function Divider({label}:{label:string}) {
  return (
    <div style={divider}>
      <div style={{flex:1,height:1,background:'rgba(255,255,255,.06)'}}/>
      <span style={{fontSize:11,color:'rgba(245,230,211,.2)',letterSpacing:'.1em',textTransform:'uppercase'}}>{label}</span>
      <div style={{flex:1,height:1,background:'rgba(255,255,255,.06)'}}/>
    </div>
  );
}

// ── SCREENS defined OUTSIDE main export ──────────────────────────────────
function LoginScreen({onSignup, onReset}:{onSignup:()=>void, onReset:()=>void}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setLoading(false); return; }

    // Check if account is soft-deleted
    const userId = signInData?.user?.id;
    if (userId) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('deleted_at')
          .eq('id', userId)
          .maybeSingle();
        if (profileData?.deleted_at) {
          await supabase.auth.signOut();
          try { localStorage.clear(); } catch {}
          setError('This account has been deleted. Email hello@yourmiseenplace.app within 30 days to restore.');
          setLoading(false);
          return;
        }
      } catch {
        // Profile fetch failed — don't block login on network errors
      }
    }

    router.push('/');
  };

  return (
    <>
      <div className="f2" style={{marginBottom:28}}>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:700,color:'#F5E6D3',marginBottom:6}}>Welcome back</div>
        <div style={{fontSize:14,color:'rgba(245,230,211,.4)'}}>Sign in to continue cooking.</div>
      </div>
      <form onSubmit={handleSubmit} className="f3">
        <input className="mep-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" required/>
        <input className="mep-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required style={{marginBottom:8}}/>
        <div style={{textAlign:'right',marginBottom:20}}>
          <button type="button" className="mep-link" onClick={onReset}>Forgot password?</button>
        </div>
        <Err msg={error}/>
        <button type="submit" className="mep-btn-primary" disabled={loading||!email||!password}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <Divider label="new here"/>
      <button className="mep-btn-ghost f4" onClick={onSignup}>Create an account</button>
    </>
  );
}

function SignupScreen({onLogin}:{onLogin:()=>void}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) window.location.href = '/';
    setLoading(false);
  };

  return (
    <>
      <div className="f2" style={{marginBottom:28}}>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:700,color:'#F5E6D3',marginBottom:6}}>Create an account</div>
        <div style={{fontSize:14,color:'rgba(245,230,211,.4)'}}>Join the community of home cooks.</div>
      </div>
      <form onSubmit={handleSubmit} className="f3">
        <input className="mep-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" required/>
        <input className="mep-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password — at least 6 characters" required/>
        <Err msg={error}/>
        <button type="submit" className="mep-btn-primary" disabled={loading||!email||!password} style={{marginTop:8}}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <Divider label="already have an account"/>
      <button className="mep-btn-ghost f4" onClick={onLogin}>Sign in</button>
    </>
  );
}

function ResetScreen({onBack}:{onBack:()=>void}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email'|'otp'>('email');
  const [otp, setOtp] = useState(['','','','','','']);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = Array.from({length:6},()=>({current:null as HTMLInputElement|null}));

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({ email, options:{ shouldCreateUser:false } });
    setLoading(false);
    if (error) setError(error.message);
    else setStep('otp');
  };

  const handleOtpChange = (idx:number, val:string) => {
    if(val.length>1){
      // Paste support
      const digits=val.replace(/\D/g,'').slice(0,6).split('');
      const next=[...otp];
      digits.forEach((d,i)=>{if(idx+i<6)next[idx+i]=d;});
      setOtp(next);
      const focusIdx=Math.min(idx+digits.length,5);
      inputRefs[focusIdx]?.current?.focus();
      if(next.every(d=>d)) handleVerify(next.join(''));
      return;
    }
    const digit=val.replace(/\D/g,'');
    const next=[...otp];
    next[idx]=digit;
    setOtp(next);
    if(digit && idx<5) inputRefs[idx+1]?.current?.focus();
    if(next.every(d=>d)) handleVerify(next.join(''));
  };

  const handleOtpKeyDown = (idx:number, e:React.KeyboardEvent) => {
    if(e.key==='Backspace'&&!otp[idx]&&idx>0) inputRefs[idx-1]?.current?.focus();
  };

  const handleVerify = async (code?:string) => {
    const token=code||otp.join('');
    if(token.length!==6){setError('Enter all 6 digits.');return;}
    setVerifying(true); setError('');
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type:'email' });
    setVerifying(false);
    if(error){setError('Invalid or expired code. Try again.');return;}
    if(data.session){
      window.location.href='/reset-password';
    }else{
      const { data:{ subscription } }=supabase.auth.onAuthStateChange((event,session)=>{
        if(event==='SIGNED_IN'&&session){subscription.unsubscribe();window.location.href='/reset-password';}
      });
      setTimeout(()=>{window.location.href='/reset-password';},2000);
    }
  };

  const handleResend = async () => {
    if(resendCooldown>0) return;
    setError(''); setOtp(['','','','','','']); setResendSuccess(false);
    const { error } = await supabase.auth.signInWithOtp({ email, options:{ shouldCreateUser:false } });
    if(error){setError(error.message);return;}
    setResendSuccess(true);
    setTimeout(()=>setResendSuccess(false),3000);
    setResendCooldown(30);
    const iv=setInterval(()=>{setResendCooldown(c=>{if(c<=1){clearInterval(iv);return 0;}return c-1;});},1000);
  };

  return (
    <>
      <div style={{height:32,display:'flex',alignItems:'center',marginBottom:16}}>
        <div onClick={step==='otp'?()=>setStep('email'):onBack} style={{cursor:'pointer',color:'#9E8C7E',fontSize:14,fontFamily:'inherit'}}>← Back</div>
      </div>
      {step==='email'?(
        <>
          <div className="f2" style={{marginBottom:28}}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:700,color:'#F5E6D3',marginBottom:6}}>Forgot your password?</div>
            <div style={{fontSize:14,color:'#9E8C7E',lineHeight:1.6}}>We'll send a 6-digit code to your email.</div>
          </div>
          <form onSubmit={handleSendCode} className="f3">
            <input className="mep-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" required/>
            <Err msg={error}/>
            <button type="submit" className="mep-btn-primary" disabled={loading||!email}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        </>
      ):(
        <div>
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:700,color:'#F5E6D3',marginBottom:6}}>Enter your code</div>
            <div style={{fontSize:14,color:'#9E8C7E',lineHeight:1.6}}>We sent a 6-digit code to {email}</div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:20}}>
            {otp.map((d,i)=>(
              <input key={i} ref={el=>{inputRefs[i].current=el;}} type="text" inputMode="numeric" maxLength={6} value={d}
                onChange={e=>handleOtpChange(i,e.target.value)} onKeyDown={e=>handleOtpKeyDown(i,e)}
                style={{width:48,height:56,borderRadius:12,border:`1.5px solid ${d?'#FF4D1C':'rgba(255,255,255,.15)'}`,background:'rgba(255,255,255,.06)',fontSize:24,fontFamily:"'Playfair Display',Georgia,serif",color:'#F5E6D3',textAlign:'center',outline:'none',caretColor:'#FF4D1C'}}/>
            ))}
          </div>
          <Err msg={error}/>
          <button onClick={()=>handleVerify()} className="mep-btn-primary" disabled={verifying||otp.some(d=>!d)} style={{marginBottom:14}}>
            {verifying ? 'Verifying…' : 'Verify code'}
          </button>
          {resendSuccess&&<div style={{textAlign:'center',fontSize:13,color:'#92B383',marginBottom:8}}>Code sent!</div>}
          <div style={{textAlign:'center'}}>
            {resendCooldown>0?(
              <span style={{fontSize:13,color:'rgba(158,140,126,.5)'}}>Resend in {resendCooldown}s</span>
            ):(
              <button onClick={handleResend} style={{background:'none',border:'none',color:'#9E8C7E',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                Didn't get a code? Resend
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function OnboardScreen() {
  const [avatar, setAvatar] = useState('');
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkUsername = async (val: string) => {
    setUsername(val); setAvailable(null);
    if (val.length < 3) return;
    setChecking(true);
    const { data } = await supabase.from('profiles').select('id').eq('username', val.toLowerCase().trim()).single();
    setAvailable(!data); setChecking(false);
  };

  const handleFinish = async () => {
    if (!avatar || !username || username.length < 3 || !available) return;
    setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Session expired. Please sign in again.'); setLoading(false); return; }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, username: username.toLowerCase().trim(),
      avatar_url: avatar, xp: 0, level: 1, updated_at: new Date().toISOString(),
    });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = '/';
  };

  return (
    <>
      <div className="f2" style={{marginBottom:24}}>
        <div style={{fontSize:11,color:'rgba(245,230,211,.3)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:8}}>Profile setup</div>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:700,color:'#F5E6D3',marginBottom:6}}>Make it yours</div>
        <div style={{fontSize:14,color:'rgba(245,230,211,.4)'}}>Choose an avatar and username to get started.</div>
      </div>

      <div className="f3" style={{marginBottom:24}}>
        <div style={{fontSize:11,color:'rgba(245,230,211,.3)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Avatar</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
          {AVATAR_COLORS.map((color,i)=>(
            <button key={color} onClick={()=>setAvatar(color)}
              style={{background:color,border:`2.5px solid ${avatar===color?'#fff':'transparent'}`,borderRadius:14,aspectRatio:'1',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:avatar===color?`0 0 0 3px ${color}55`:'none',fontWeight:800,fontSize:16,color:'#fff',fontFamily:"'Playfair Display',Georgia,serif",padding:0,width:'100%'}}>
              {AVATAR_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      <div className="f3" style={{marginBottom:24}}>
        <div style={{fontSize:11,color:'rgba(245,230,211,.3)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Username</div>
        <div style={{position:'relative'}}>
          <input
            className="mep-input"
            value={username}
            onChange={e=>checkUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g,''))}
            placeholder="e.g. chef_axel"
            maxLength={20}
            style={{
              paddingRight:44,marginBottom:0,
              borderColor: available===true?'rgba(146,179,131,.5)':available===false?'rgba(224,122,95,.5)':undefined
            }}
          />
          <div style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',fontSize:13,color:available===true?'#92B383':available===false?'#E07A5F':'rgba(245,230,211,.2)'}}>
            {checking?'…':available===true?'✓':available===false?'✗':''}
          </div>
        </div>
        {available===true&&<div style={{fontSize:12,color:'#92B383',marginTop:6}}>Available</div>}
        {available===false&&<div style={{fontSize:12,color:'#E07A5F',marginTop:6}}>Already taken — try another</div>}
        <div style={{fontSize:11,color:'rgba(245,230,211,.2)',marginTop:8}}>Letters, numbers, _ and . only</div>
      </div>

      <Err msg={error}/>
      <button className="mep-btn-primary f4" onClick={handleFinish}
        disabled={!avatar||!username||username.length<3||!available||loading}>
        {loading?'Setting up your profile…':'Start cooking'}
      </button>
    </>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'signup'|'reset'|'onboard'>('login');

  return (
    <div style={page}>
      <style>{CSS}</style>
      <div style={bg}/>
      <div style={inner}>
        <Logo/>
        {mode==='login'   && <LoginScreen  onSignup={()=>setMode('signup')} onReset={()=>setMode('reset')}/>}
        {mode==='signup'  && <SignupScreen  onLogin={()=>setMode('login')}/>}
        {mode==='reset'   && <ResetScreen   onBack={()=>setMode('login')}/>}
        {mode==='onboard' && <OnboardScreen/>}
      </div>
    </div>
  );
}