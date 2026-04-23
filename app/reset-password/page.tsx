'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  @media (prefers-color-scheme: dark) {
    :root { --bg: #1A0F08; --card: #2A1A0E; --text: #FFF8F0; --muted: #9E8C7E; }
  }
  @media (prefers-color-scheme: light) {
    :root { --bg: #FAF4EE; --card: #FFF8F0; --text: #3B2A1A; --muted: #9E8C7E; }
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

  if (success) return (
    <>
      <style>{styles}</style>
      <div style={{minHeight:'100dvh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{background:'var(--card)',borderRadius:24,padding:40,maxWidth:400,width:'100%',textAlign:'center'}}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{margin:'0 auto 16px',display:'block'}}>
            <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" stroke="#FF4D1C" strokeWidth="1.8"/>
            <path d="M8 12l3 3 5-5" stroke="#FF4D1C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 style={{fontFamily:DF,fontSize:24,color:'var(--text)',marginBottom:8}}>Password updated.</h1>
          <p style={{color:'var(--muted)',fontSize:14}}>Taking you back to sign in...</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div style={{minHeight:'100dvh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{background:'var(--card)',borderRadius:24,padding:40,maxWidth:400,width:'100%'}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{fontFamily:DF,fontSize:22,color:'var(--text)',letterSpacing:'0.05em'}}>
              mise<span style={{color:'#FF4D1C'}}>.</span>en<span style={{color:'#FF4D1C'}}>.</span>place
            </div>
          </div>
          {checking ? (
            <p style={{color:'var(--muted)',fontSize:14,textAlign:'center'}}>Loading...</p>
          ) : ready ? (
            <>
              <h1 style={{fontFamily:DF,fontSize:24,color:'var(--text)',marginBottom:8,textAlign:'center'}}>Choose a new password</h1>
              <p style={{color:'var(--muted)',fontSize:14,textAlign:'center',marginBottom:24}}>Must be at least 8 characters.</p>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                style={{width:'100%',padding:'14px 16px',borderRadius:12,border:'1.5px solid #E8DDD4',background:'var(--bg)',fontSize:15,color:'var(--text)',marginBottom:12,outline:'none',fontFamily:BF,boxSizing:'border-box'}}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e=>setConfirm(e.target.value)}
                style={{width:'100%',padding:'14px 16px',borderRadius:12,border:'1.5px solid #E8DDD4',background:'var(--bg)',fontSize:15,color:'var(--text)',marginBottom:16,outline:'none',fontFamily:BF,boxSizing:'border-box'}}
              />
              {error && <p style={{color:'#FF4D1C',fontSize:13,textAlign:'center',marginBottom:12}}>{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{width:'100%',padding:'16px',borderRadius:50,background:'#FF4D1C',color:'#FFF8F0',border:'none',fontFamily:DF,fontSize:16,fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
