'use client';
import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import PhotoUpload from '@/components/PhotoUpload';
import type { PhotoMetadata } from '@/lib/utils/photo-upload';

type ToastEntry = { time: string; emoji: string; title: string; subtitle: string };

type VariantState = {
  url: string | null;
  width: number | null;
  height: number | null;
  dominantColor: string | null;
};

const empty: VariantState = { url: null, width: null, height: null, dominantColor: null };

export default function PhotoTestPage() {
  const { user, loading } = useAuth();
  const [card, setCard] = useState<VariantState>(empty);
  const [avatar, setAvatar] = useState<VariantState>(empty);
  const [inline, setInline] = useState<VariantState>(empty);
  const [toastLog, setToastLog] = useState<ToastEntry[]>([]);

  const logToast = (toast: { emoji: string; title: string; subtitle: string }) => {
    setToastLog(prev => [
      { time: new Date().toLocaleTimeString(), ...toast },
      ...prev,
    ]);
  };

  const handleUploaded = (setter: typeof setCard) => (meta: PhotoMetadata) => {
    setter({ url: meta.url, width: meta.width, height: meta.height, dominantColor: meta.dominantColor });
  };

  const handleRemoved = (setter: typeof setCard) => () => {
    setter(empty);
  };

  if (loading) return <div style={page}>Loading auth...</div>;
  if (!user) return (
    <div style={page}>
      <div style={banner}>Sign in to test photo upload. Go to <a href="/login">/login</a> first.</div>
    </div>
  );

  return (
    <div style={page}>
      <div style={{ ...banner, background: '#FFF3CD', border: '1px solid #FFECB5', color: '#664D03' }}>
        Smoke test page — delete before deploy
      </div>

      <h1 style={{ fontSize: 18, fontWeight: 800, margin: '16px 0 4px' }}>Photo Upload Smoke Test</h1>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px' }}>
        Logged in as: {user.email || user.id}<br />
        Testing target: <code>cooks</code> (safe — not touching avatars bucket)
      </p>

      {/* Card variant */}
      <Section title="Variant: card">
        <PhotoUpload
          target="cooks"
          uid={user.id}
          currentUrl={card.url}
          currentDimensions={card.width && card.height ? { width: card.width, height: card.height } : null}
          currentDominantColor={card.dominantColor}
          onUploaded={handleUploaded(setCard)}
          onRemoved={handleRemoved(setCard)}
          allowRemove={true}
          allowCamera={true}
          variant="card"
          onToast={logToast}
        />
        <MetadataBlock state={card} />
      </Section>

      {/* Avatar variant */}
      <Section title="Variant: avatar">
        <PhotoUpload
          target="cooks"
          uid={user.id}
          currentUrl={avatar.url}
          currentDimensions={avatar.width && avatar.height ? { width: avatar.width, height: avatar.height } : null}
          currentDominantColor={avatar.dominantColor}
          onUploaded={handleUploaded(setAvatar)}
          onRemoved={handleRemoved(setAvatar)}
          allowRemove={true}
          allowCamera={true}
          variant="avatar"
          onToast={logToast}
          fallback={<div style={{ width: 96, height: 96, borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>}
        />
        <MetadataBlock state={avatar} />
      </Section>

      {/* Inline variant */}
      <Section title="Variant: inline (no camera)">
        <PhotoUpload
          target="cooks"
          uid={user.id}
          currentUrl={inline.url}
          currentDimensions={inline.width && inline.height ? { width: inline.width, height: inline.height } : null}
          currentDominantColor={inline.dominantColor}
          onUploaded={handleUploaded(setInline)}
          onRemoved={handleRemoved(setInline)}
          allowRemove={true}
          allowCamera={false}
          variant="inline"
          onToast={logToast}
        />
        <MetadataBlock state={inline} />
      </Section>

      {/* Toast log */}
      <Section title={`Toast log (${toastLog.length} events)`}>
        {toastLog.length === 0 ? (
          <p style={{ fontSize: 12, color: '#999' }}>No toasts fired yet. Upload or reject a file to see events.</p>
        ) : (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {toastLog.map((t, i) => (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #eee', fontFamily: 'monospace' }}>
                <span style={{ color: '#999' }}>{t.time}</span>{' '}
                <strong>{t.title}</strong>{t.subtitle ? ` — ${t.subtitle}` : ''}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function MetadataBlock({ state }: { state: VariantState }) {
  return (
    <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'monospace', color: '#444' }}>
      <div>URL: {state.url ? <a href={state.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all' }}>{state.url.slice(0, 80)}...</a> : '—'}</div>
      <div>Dimensions: {state.width && state.height ? `${state.width} × ${state.height}` : '—'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Dominant color: {state.dominantColor || '—'}
        {state.dominantColor && <div style={{ width: 24, height: 24, borderRadius: 4, background: state.dominantColor, border: '1px solid #ccc' }} />}
      </div>
      {state.url && (
        <a href={state.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: '#0066cc' }}>
          Open URL in new tab →
        </a>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────
const page: React.CSSProperties = {
  maxWidth: 440,
  margin: '0 auto',
  padding: '16px 20px 60px',
  fontFamily: 'system-ui, sans-serif',
};

const banner: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'center',
};
