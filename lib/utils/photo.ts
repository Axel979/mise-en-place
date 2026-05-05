import imageCompression from 'browser-image-compression';

// ── Types ─────────────────────────────────────────────────────
export type PhotoMetadata = {
  url: string;
  width: number;
  height: number;
  dominantColor: string; // 7-char hex like '#A8B5C2'
};

export type PhotoTarget = 'cooks' | 'recipes' | 'posts' | 'avatar';

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const HEIC_EXTENSIONS = /\.(heic|heif)$/i;

// ── HEIC conversion ──────────────────────────────────────────
// Lazy-loads heic2any (~1.3MB) only when needed.
export async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    HEIC_EXTENSIONS.test(file.name);

  if (!isHeic) return file;

  const heic2any = (await import('heic2any')).default;
  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.85,
  });

  const result = Array.isArray(blob) ? blob[0] : blob;
  const newName = file.name.replace(HEIC_EXTENSIONS, '.jpg');
  return new File([result], newName, { type: 'image/jpeg' });
}

// ── Compression ──────────────────────────────────────────────
// 1600px max edge, JPEG 0.85, strips EXIF by default.
export async function compressImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
  });
  return new File([compressed], compressed.name, { type: 'image/jpeg' });
}

// ── Dominant color extraction ────────────────────────────────
// Draws to a tiny canvas, averages RGB of non-transparent pixels.
// Returns '#888888' fallback on any failure (nice-to-have, not critical).
export async function extractDominantColor(file: File): Promise<string> {
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const canvas = new OffscreenCanvas(50, 50);
      const ctx = canvas.getContext('2d');
      if (!ctx) return '#888888';

      ctx.drawImage(img, 0, 0, 50, 50);
      const { data } = ctx.getImageData(0, 0, 50, 50);

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // skip fully transparent
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }

      if (count === 0) return '#888888';
      const hex = (c: number) => Math.round(c / count).toString(16).padStart(2, '0');
      return `#${hex(r)}${hex(g)}${hex(b)}`;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return '#888888';
  }
}

// ── Image dimensions ─────────────────────────────────────────
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── Helpers ──────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function generatePhotoId(): string {
  return crypto.randomUUID();
}

export function buildPhotoPath(
  target: PhotoTarget,
  uid: string,
  photoId: string,
  ext: string,
): string {
  if (target === 'avatar') return `${uid}/avatar.${ext}`;
  return `${target}/${uid}/${photoId}.${ext}`;
}

export function bucketForTarget(target: PhotoTarget): 'avatars' | 'photos' {
  return target === 'avatar' ? 'avatars' : 'photos';
}

export function isAcceptedImageType(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  // Fallback: some browsers report empty MIME for HEIC
  if (HEIC_EXTENSIONS.test(file.name)) return true;
  if (/\.(jpe?g|png|webp)$/i.test(file.name)) return true;
  return false;
}
