import { supabase } from '@/lib/supabase';
import type { PhotoTarget, PhotoMetadata } from './photo';
import {
  convertHeicIfNeeded,
  compressImage,
  extractDominantColor,
  getImageDimensions,
  generatePhotoId,
  buildPhotoPath,
  bucketForTarget,
  isAcceptedImageType,
} from './photo';

// ── Types ─────────────────────────────────────────────────────
export type UploadResult = {
  data: PhotoMetadata | null;
  error: Error | null;
};

export type UploadStage =
  | 'converting'
  | 'compressing'
  | 'analyzing'
  | 'uploading'
  | 'done';

export type UploadProgressCallback = (stage: UploadStage) => void;

// ── Friendly error messages ──────────────────────────────────
function friendlyError(err: unknown): Error {
  const msg =
    err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  if (msg.includes('payload too large') || msg.includes('413'))
    return new Error("That photo's too big to upload. Try a smaller one.");
  if (msg.includes('timeout') || msg.includes('abort') || msg.includes('network'))
    return new Error('Upload timed out. Check your connection and try again.');
  if (msg.includes('heic') || msg.includes('heif'))
    return new Error("Couldn't read that photo. Try saving it as JPEG first.");

  return new Error('That slipped off the plate. Try again?');
}

// ── Upload pipeline ──────────────────────────────────────────
// validate → HEIC convert → compress → extract color/dimensions → upload.
// Returns final public URL + metadata. Does NOT write to any DB table.
// Never throws — errors returned in result.error.
export async function uploadPhoto(
  file: File,
  target: PhotoTarget,
  uid: string,
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
  try {
    // 0. Verify auth session is available
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: new Error('Not signed in — please refresh and try again') };
    }

    // 1. Convert HEIC if needed
    onProgress?.('converting');
    let processed = await convertHeicIfNeeded(file);

    // 2. Compress
    onProgress?.('compressing');
    processed = await compressImage(processed);

    // 3. Extract metadata in parallel
    onProgress?.('analyzing');
    const [dimensions, dominantColor] = await Promise.all([
      getImageDimensions(processed),
      extractDominantColor(processed),
    ]);

    // 4. Upload to Storage
    onProgress?.('uploading');
    const bucket = bucketForTarget(target);
    const photoId = generatePhotoId();
    const path = buildPhotoPath(target, uid, photoId, 'jpg');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, processed, {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
          upsert: target === 'avatar',
        });

      clearTimeout(timeoutId);
      if (uploadError) throw uploadError;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }

    // 5. Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    let publicUrl = urlData.publicUrl;
    if (target === 'avatar') {
      publicUrl += '?v=' + Date.now(); // cache-bust for avatars
    }

    onProgress?.('done');

    return {
      data: {
        url: publicUrl,
        width: dimensions.width,
        height: dimensions.height,
        dominantColor,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: friendlyError(err) };
  }
}

// ── Delete a photo from Storage ──────────────────────────────
// Idempotent: returns success even if file doesn't exist.
export async function deletePhoto(
  url: string,
  target: PhotoTarget,
): Promise<{ error: Error | null }> {
  try {
    const bucket = bucketForTarget(target);

    // Parse path from public URL
    // Pattern: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return { error: null }; // can't parse — treat as no-op

    let path = url.slice(idx + marker.length);
    // Strip query params (cache-bust, etc.)
    const qIdx = path.indexOf('?');
    if (qIdx !== -1) path = path.slice(0, qIdx);

    const { error } = await supabase.storage.from(bucket).remove([path]);

    // Treat 404 / not-found as success (already deleted)
    if (error && !error.message.toLowerCase().includes('not found')) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

// Re-export for convenience
export { isAcceptedImageType } from './photo';
export type { PhotoTarget, PhotoMetadata } from './photo';
