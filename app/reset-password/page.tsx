'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DF = "'Playfair Display',Georgia,serif";
const BF = "'Source Serif 4',Georgia,serif";

export default function ResetPasswordPage() {
  if(typeof window!=='undefined') console.log('[RESET] page loaded, URL:', window.location.href, 'search:', window.location.search, 'hash:', window.location.hash);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[RESET] auth event:', event, 'session user:', session?.user?.email);
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
      // CRITICAL: Do NOT redirect on SIGNED_IN here — this page must stay put
      // even when a session is established via recovery link
    });

    // Also check current session in case token was already exchanged
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[RESET] getSession result:', session?.user?.email, 'error:', error);
      if (session) setReady(true);
    });

    // Prevent any navigation away from this page
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[RESET] handleSubmit called, ready:', ready, 'password length:', password.length);
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setTimeout(() => { window.location.href = '/login'; }, 2000);
  };

  return (
    <div style={{ background: 'var(--bg-page, #1A0F08)', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BF }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        :root{--bg-page:#1A0F08;--bg-card:#2A1A0E;--text-primary:#F5E6D3;--text-muted:#9E8C7E;--accent:#FF4D1C}
        body{background:var(--bg-page);}
      `}</style>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: DF, fontWeight: 900, fontSize: 28, color: '#F5E6D3', letterSpacing: '-0.03em' }}>
            mise<span style={{ color: '#FF4D1C' }}>.</span>en<span style={{ color: '#FF4D1C' }}>.</span>place
          </div>
        </div>

        {!ready && !success && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 14, color: '#9E8C7E', lineHeight: 1.6 }}>Loading reset session...</div>
          </div>
        )}

        {ready && !success && (
          <div style={{ background: '#FFF8F0', borderRadius: 24, padding: '32px 24px' }}>
            <div style={{ fontFamily: DF, fontSize: 22, fontWeight: 700, color: '#3B2A1A', marginBottom: 6 }}>Choose a new password</div>
            <div style={{ fontSize: 14, color: '#9E8C7E', marginBottom: 24, lineHeight: 1.5 }}>Must be at least 8 characters.</div>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password"
                required
                style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid #E8DDD4', background: '#FAF4EE', fontSize: 14, color: '#3B2A1A', outline: 'none', marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm password"
                required
                style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid #E8DDD4', background: '#FAF4EE', fontSize: 14, color: '#3B2A1A', outline: 'none', marginBottom: 16, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              {error && <div style={{ color: '#FF4D1C', fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>{error}</div>}
              <button
                type="submit"
                disabled={loading || !password || !confirm}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#D8D0C8' : '#FF4D1C', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        )}

        {success && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
            <div style={{ fontFamily: DF, fontSize: 20, fontWeight: 700, color: '#F5E6D3', marginBottom: 8 }}>Password updated</div>
            <div style={{ fontSize: 14, color: '#9E8C7E' }}>Redirecting to login...</div>
          </div>
        )}
      </div>
    </div>
  );
}
