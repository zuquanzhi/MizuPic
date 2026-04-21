import { getObjectBuffer, putObject } from './cos';
import type { ImageIndex, ImageMeta } from './types';

const INDEX_KEY = 'meta/index.json';

export async function readIndex(): Promise<ImageIndex> {
  try {
    const buffer = await getObjectBuffer(INDEX_KEY);
    return JSON.parse(buffer.toString('utf-8'));
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), images: [] };
  }
}

export async function writeIndex(index: ImageIndex) {
  index.updatedAt = new Date().toISOString();
  const buffer = Buffer.from(JSON.stringify(index, null, 2));
  await putObject(INDEX_KEY, buffer, 'application/json');
}

export async function addMeta(meta: ImageMeta) {
  const index = await readIndex();
  const existingIdx = index.images.findIndex((img) => img.key === meta.key);
  if (existingIdx >= 0) {
    index.images[existingIdx] = meta;
  } else {
    index.images.unshift(meta);
  }
  await writeIndex(index);
}

export async function removeMeta(key: string) {
  const index = await readIndex();
  index.images = index.images.filter((img) => img.key !== key);
  await writeIndex(index);
}

export async function updateMeta(key: string, updates: Partial<ImageMeta>) {
  const index = await readIndex();
  const img = index.images.find((i) => i.key === key);
  if (!img) return false;
  Object.assign(img, updates);
  await writeIndex(index);
  return true;
}

export function filterImages(
  images: ImageMeta[],
  query: {
    tag?: string;
    category?: string;
    format?: string;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }
) {
  let result = [...images];

  if (query.tag) {
    const tag = query.tag.toLowerCase();
    result = result.filter((img) => img.tags.some((t) => t.toLowerCase().includes(tag)));
  }

  if (query.category) {
    result = result.filter((img) => img.category === query.category);
  }

  if (query.format) {
    const fmt = query.format.toLowerCase();
    result = result.filter((img) => img.format.toLowerCase() === fmt);
  }

  if (query.minWidth !== undefined) {
    result = result.filter((img) => img.width >= query.minWidth!);
  }
  if (query.maxWidth !== undefined) {
    result = result.filter((img) => img.width <= query.maxWidth!);
  }
  if (query.minHeight !== undefined) {
    result = result.filter((img) => img.height >= query.minHeight!);
  }
  if (query.maxHeight !== undefined) {
    result = result.filter((img) => img.height <= query.maxHeight!);
  }

  // sort
  switch (query.sort) {
    case 'oldest':
      result.sort((a, b) => new Date(a.uploadTime).getTime() - new Date(b.uploadTime).getTime());
      break;
    case 'largest':
      result.sort((a, b) => b.size - a.size);
      break;
    case 'smallest':
      result.sort((a, b) => a.size - b.size);
      break;
    case 'newest':
    default:
      result.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
      break;
  }

  // pagination
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const total = result.length;
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + limit);

  return { images: paginated, total, page, limit, totalPages: Math.ceil(total / limit) };
}
