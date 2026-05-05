'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  uploadPhoto,
  deletePhoto,
  isAcceptedImageType,
} from '@/lib/utils/photo-upload';
import type {
  PhotoTarget,
  PhotoMetadata,
  UploadStage,
} from '@/lib/utils/photo-upload';

// ── Types ─────────────────────────────────────────────────────
type ToastFn = (toast: { emoji: string; title: string; subtitle: string }) => void;

type PhotoUploadProps = {
  target: PhotoTarget;
  uid: string;
  currentUrl?: string | null;
  currentDimensions?: { width: number; height: number } | null;
  currentDominantColor?: string | null;
  onUploaded: (metadata: PhotoMetadata) => void;
  onRemoved?: () => void;
  allowRemove?: boolean;
  allowCamera?: boolean;
  variant: 'avatar' | 'card' | 'inline';
  onToast?: ToastFn;
  fallback?: React.ReactNode;
};

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const MAX_RAW_SIZE = 10 * 1024 * 1024; // 10MB

const STAGE_LABELS: Record<UploadStage, string> = {
  converting: 'Converting...',
  compressing: 'Compressing...',
  analyzing: 'Almost ready...',
  uploading: 'Plating up...',
  done: '',
};

// ── Component ─────────────────────────────────────────────────
export default function PhotoUpload({
  target,
  uid,
  currentUrl,
  currentDimensions,
  currentDominantColor,
  onUploaded,
  onRemoved,
  allowRemove = false,
  allowCamera = true,
  variant,
  onToast,
  fallback,
}: PhotoUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<UploadStage | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const displayUrl = previewUrl || currentUrl || null;
  const isUploading = stage !== null && stage !== 'done';
  const isReady = !!uid;

  const handleFile = useCallback(async (file: File) => {
    // Auth gate
    if (!uid) {
      onToast?.({ emoji: '', title: 'Not signed in', subtitle: 'Please refresh and try again' });
      return;
    }

    // Validate type
    if (!isAcceptedImageType(file)) {
      onToast?.({ emoji: '', title: 'Wrong file type', subtitle: 'Photos only — JPEG, PNG, WebP, or HEIC' });
      return;
    }
    // Validate size
    if (file.size > MAX_RAW_SIZE) {
      onToast?.({ emoji: '', title: "That photo's huge", subtitle: 'Try a smaller one (max 10MB)' });
      return;
    }

    // Optimistic preview
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setPreviewUrl(blobUrl);

    onToast?.({ emoji: '', title: 'Plating up...', subtitle: '' });

    // Upload (setStage wrapped in try/finally to guarantee cleanup)
    try {
      const result = await uploadPhoto(file, target, uid, setStage);

      if (result.data) {
        // Swap blob preview to remote URL
        setPreviewUrl(null);
        onUploaded(result.data);
        onToast?.({ emoji: '', title: 'Photo uploaded', subtitle: '' });
      } else {
        // Revert preview
        setPreviewUrl(null);
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
        onToast?.({ emoji: '', title: 'Upload failed', subtitle: result.error?.message || 'Try again?' });
      }
    } finally {
      setStage(null);
    }
  }, [target, uid, onUploaded, onToast]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [handleFile]);

  const handleRemove = useCallback(async () => {
    if (!currentUrl) return;
    const result = await deletePhoto(currentUrl, target);
    if (result.error) {
      onToast?.({ emoji: '', title: 'Remove failed', subtitle: result.error.message });
    } else {
      onRemoved?.();
      onToast?.({ emoji: '', title: 'Photo removed', subtitle: '' });
    }
    setConfirmRemove(false);
  }, [currentUrl, target, onRemoved, onToast]);

  // ── Shared inputs (hidden) ────────────────────────────────
  const fileInputs = (
    <>
      {allowCamera && (
        <input
          ref={cameraRef}
          type="file"
          accept={ACCEPT}
          capture="environment"
          onChange={onFileChange}
          style={{ display: 'none' }}
        />
      )}
      <input
        ref={libraryRef}
        type="file"
        accept={ACCEPT}
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
    </>
  );

  // ── Status overlay ────────────────────────────────────────
  const statusOverlay = isUploading && stage ? (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', borderRadius: 'inherit',
    }}>
      <div style={{
        background: '#fff', borderRadius: 999,
        padding: '6px 14px', fontSize: 12, fontWeight: 600,
        color: 'var(--bark)', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="14" height="14" viewBox="0 0 20 20" style={{ animation: 'spin 0.8s linear infinite' }}>
          <circle cx="10" cy="10" r="8" fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round" />
        </svg>
        {STAGE_LABELS[stage]}
      </div>
    </div>
  ) : null;

  // ── Action buttons ────────────────────────────────────────
  const actionBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, color: 'var(--muted)',
    padding: '4px 0', fontFamily: 'inherit',
  };

  // ── Remove confirmation ───────────────────────────────────
  const removeConfirmation = confirmRemove ? (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Remove photo?</span>
      <button onClick={handleRemove} style={{ ...actionBtnStyle, color: 'var(--rose)' }}>
        Yes, remove
      </button>
      <button onClick={() => setConfirmRemove(false)} style={actionBtnStyle}>
        Cancel
      </button>
    </div>
  ) : null;

  // ── Render variants ───────────────────────────────────────
  if (variant === 'avatar') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {fileInputs}
        <div style={{
          width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
          background: currentDominantColor || 'var(--pill)',
          position: 'relative',
        }}>
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : fallback || null}
          {statusOverlay}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          {allowCamera && (
            <button onClick={() => cameraRef.current?.click()} disabled={isUploading || !isReady} style={actionBtnStyle}>
              Take photo
            </button>
          )}
          <button onClick={() => libraryRef.current?.click()} disabled={isUploading || !isReady} style={actionBtnStyle}>
            {displayUrl ? 'Change photo' : 'Add photo'}
          </button>
          {allowRemove && displayUrl && !confirmRemove && (
            <button onClick={() => setConfirmRemove(true)} disabled={isUploading || !isReady} style={actionBtnStyle}>
              Remove
            </button>
          )}
        </div>
        {removeConfirmation}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div>
        {fileInputs}
        <div style={{
          width: '100%', borderRadius: 14, overflow: 'hidden',
          background: currentDominantColor || 'var(--pill)',
          position: 'relative',
          minHeight: displayUrl ? undefined : 120,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Photo"
              style={{
                width: '100%', height: 'auto', display: 'block',
                aspectRatio: currentDimensions
                  ? `${currentDimensions.width} / ${currentDimensions.height}`
                  : undefined,
              }}
            />
          ) : fallback ? (
            <div style={{ padding: 24 }}>{fallback}</div>
          ) : (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
          {statusOverlay}
          {/* Floating action pill */}
          {!isUploading && (
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              display: 'flex', gap: 6,
            }}>
              {allowCamera && (
                <button
                  onClick={() => cameraRef.current?.click()}
                  style={{
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 999,
                    padding: '5px 10px', fontSize: 11, fontWeight: 600,
                    color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  Camera
                </button>
              )}
              <button
                onClick={() => libraryRef.current?.click()}
                style={{
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 999,
                  padding: '5px 10px', fontSize: 11, fontWeight: 600,
                  color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                {displayUrl ? 'Change' : 'Add photo'}
              </button>
            </div>
          )}
        </div>
        {allowRemove && displayUrl && !isUploading && (
          <div style={{ marginTop: 8 }}>
            {confirmRemove ? removeConfirmation : (
              <button onClick={() => setConfirmRemove(true)} style={actionBtnStyle}>
                Remove photo
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // variant === 'inline'
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {fileInputs}
      <div style={{
        width: 64, height: 64, borderRadius: 8, overflow: 'hidden',
        background: currentDominantColor || 'var(--pill)',
        position: 'relative', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Photo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : fallback ? fallback : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
        {statusOverlay}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {allowCamera && (
          <button onClick={() => cameraRef.current?.click()} disabled={isUploading || !isReady} style={actionBtnStyle}>
            Take photo
          </button>
        )}
        <button onClick={() => libraryRef.current?.click()} disabled={isUploading || !isReady} style={actionBtnStyle}>
          {displayUrl ? 'Change photo' : 'Choose photo'}
        </button>
        {allowRemove && displayUrl && !confirmRemove && (
          <button onClick={() => setConfirmRemove(true)} disabled={isUploading || !isReady} style={actionBtnStyle}>
            Remove
          </button>
        )}
        {removeConfirmation}
      </div>
    </div>
  );
}
