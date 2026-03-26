'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) { setError(error.message); } else { setSent(true); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'#FAF4EE',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',padding:'24px'}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:56,marginBottom:12}}>🍳</div>
          <div style={{fontSize:28,fontWeight:900,color:'#3B2A1A'}}>mise<span style={{color:'#FF4D1C'}}>.</span>en<span style={{color:'#FF4D1C'}}>.</span>place</div>
          <div style={{fontSize:14,color:'#9E8C7E',marginTop:4}}>your daily cooking habit</div>
        </div>
        {sent ? (
          <div style={{textAlign:'center',background:'#FFF8F0',borderRadius:20,padding:'32px 24px',border:'2px solid #EEE5DC'}}>
            <div style={{fontSize:48,marginBottom:12}}>📬</div>
            <div style={{fontWeight:900,fontSize:20,color:'#3B2A1A',marginBottom:8}}>Check your email</div>
            <div style={{fontSize:14,color:'#9E8C7E',lineHeight:1.6}}>We sent a magic link to <strong>{email}</strong>. Click it to sign in.</div>
          </div>
        ) : (
          <div style={{background:'#FFF8F0',borderRadius:20,padding:'32px 24px',border:'2px solid #EEE5DC'}}>
            <form onSubmit={signInWithEmail}>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:700,color:'#9E8C7E',display:'block',marginBottom:6}}>EMAIL ADDRESS</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required
                  style={{width:'100%',padding:'12px 14px',borderRadius:14,border:'2px solid #EEE5DC',background:'#FAF4EE',fontSize:14,color:'#3B2A1A',outline:'none',boxSizing:'border-box'}}/>
              </div>
              {error&&<div style={{fontSize:13,color:'#FF4D1C',marginBottom:12}}>{error}</div>}
              <button type="submit" disabled={loading||!email}
                style={{width:'100%',padding:'13px',borderRadius:14,border:'none',background:loading||!email?'#D8D0C8':'#FF4D1C',color:'#fff',fontWeight:800,fontSize:15,cursor:loading||!email?'not-allowed':'pointer'}}>
                {loading?'Sending…':'Send Magic Link ✉️'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
