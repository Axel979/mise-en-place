'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#1A0F08;font-family:'Source Serif 4',Georgia,serif;}
  input,button{font-family:inherit;}
  input:-webkit-autofill{
    -webkit-box-shadow:0 0 0 100px #2A1A0E inset !important;
    -webkit-text-fill-color:#F5E6D3 !important;
  }
`;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true);
        } else {
          window.location.href = '/login';
        }
        setChecking(false);
      });
    }, 500);
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
    setTimeout(() => router.push('/login'), 2000);
  };

  const pageStyle = {
    minHeight:'100dvh',background:'#1A0F08',display:'flex',alignItems:'center',justifyContent:'center',padding:20,position:'relative' as const,overflow:'hidden' as const,
  };
  const bgStyle = {
    position:'absolute' as const,inset:0,
    background:'radial-gradient(ellipse at 30% 20%,rgba(196,129,74,.1) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(92,122,78,.07) 0%,transparent 50%)',
    pointerEvents:'none' as const,
  };
  const inputStyle = {
    width:'100%',padding:'14px 16px',borderRadius:16,border:'1.5px solid rgba(255,255,255,.12)',
    background:'rgba(255,255,255,.04)',fontSize:15,color:'#F5E6D3',outline:'none',
    fontFamily:BF,boxSizing:'border-box' as const,letterSpacing:'.01em',
    WebkitTextFillColor:'#F5E6D3',
  };
  const btnStyle = {
    width:'100%',padding:'16px',borderRadius:16,border:'none',
    background:'linear-gradient(135deg,#C4814A,#A0622E)',color:'#FAF4EE',
    fontWeight:700,fontSize:15,cursor:loading?'not-allowed':'pointer',
    opacity:loading?0.7:1,fontFamily:'inherit',letterSpacing:'.03em',
    boxShadow:'0 4px 20px rgba(196,129,74,.35)',
  };

  if (success) return (
    <>
      <style>{styles}</style>
      <div style={pageStyle}>
        <div style={bgStyle}/>
        <div style={{maxWidth:390,width:'100%',textAlign:'center',position:'relative',zIndex:1}}>
          <div style={{fontFamily:DF,fontWeight:900,fontSize:32,color:'#F5E6D3',letterSpacing:'-.02em',marginBottom:44}}>
            mise<span style={{color:'#C4814A'}}>.</span>en<span style={{color:'#C4814A'}}>.</span>place
          </div>
          <div style={{fontSize:13,color:'#92B383',padding:'10px 14px',background:'rgba(146,179,131,.08)',borderRadius:12,marginBottom:14,border:'1px solid rgba(146,179,131,.15)'}}>Password updated successfully.</div>
          <p style={{color:'#9E8C7E',fontSize:14}}>Taking you back to sign in...</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div style={pageStyle}>
        <div style={bgStyle}/>
        <div style={{maxWidth:390,width:'100%',position:'relative',zIndex:1}}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <div style={{fontFamily:DF,fontWeight:900,fontSize:32,color:'#F5E6D3',letterSpacing:'-.02em',lineHeight:1}}>
              mise<span style={{color:'#C4814A'}}>.</span>en<span style={{color:'#C4814A'}}>.</span>place
            </div>
            <div style={{fontSize:11,color:'rgba(245,230,211,.3)',marginTop:8,letterSpacing:'.15em',textTransform:'uppercase'}}>
              your daily cooking habit
            </div>
          </div>
          {checking ? (
            <p style={{color:'#9E8C7E',fontSize:14,textAlign:'center'}}>Loading...</p>
          ) : ready ? (
            <>
              <div style={{marginBottom:28}}>
                <div style={{fontFamily:DF,fontSize:24,fontWeight:700,color:'#F5E6D3',marginBottom:6}}>Choose a new password</div>
                <div style={{fontSize:14,color:'rgba(245,230,211,.4)',lineHeight:1.6}}>Must be at least 8 characters.</div>
              </div>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                style={{...inputStyle,marginBottom:12}}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e=>setConfirm(e.target.value)}
                style={{...inputStyle,marginBottom:16}}
              />
              {error && <div style={{fontSize:13,color:'#E07A5F',padding:'10px 14px',background:'rgba(224,122,95,.08)',borderRadius:12,marginBottom:14,border:'1px solid rgba(224,122,95,.15)'}}>{error}</div>}
              <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
