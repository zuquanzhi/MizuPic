import sharp from 'sharp';
import type { ImageMeta } from './types';

export async function extractImageMeta(
  buffer: Buffer,
  key: string,
  category: 'upload' | 'ai-generated',
  tags: string[] = [],
  originalName?: string
): Promise<ImageMeta> {
  const metadata = await sharp(buffer).metadata();
  const format = (metadata.format || 'unknown').toLowerCase();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  return {
    key,
    category,
    size: buffer.length,
    width,
    height,
    format,
    tags: tags.map((t) => t.trim()).filter(Boolean),
    uploadTime: new Date().toISOString(),
    originalName,
  };
}

export function generateStorageKey(
  category: 'upload' | 'ai-generated',
  fileName: string
): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `images/${category === 'upload' ? 'uploads' : 'ai-generated'}/${yyyy}/${mm}/${timestamp}-${safeName}`;
}
