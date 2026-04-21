import { NextRequest, NextResponse } from 'next/server';
import { putObject } from '@/lib/cos';
import { readIndex, filterImages, addMeta } from '@/lib/meta';
import { extractImageMeta, generateStorageKey } from '@/lib/image-meta';
import { getErrorMessage } from '@/lib/utils';
import { getAbsolutePublicImageUrl, getPublicImagePath } from '@/lib/public-url';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const index = await readIndex();

    const result = filterImages(index.images, {
      tag: searchParams.get('tag') || undefined,
      category: searchParams.get('category') || undefined,
      format: searchParams.get('format') || undefined,
      minWidth: searchParams.get('minWidth') ? parseInt(searchParams.get('minWidth')!, 10) : undefined,
      maxWidth: searchParams.get('maxWidth') ? parseInt(searchParams.get('maxWidth')!, 10) : undefined,
      minHeight: searchParams.get('minHeight') ? parseInt(searchParams.get('minHeight')!, 10) : undefined,
      maxHeight: searchParams.get('maxHeight') ? parseInt(searchParams.get('maxHeight')!, 10) : undefined,
      sort: searchParams.get('sort') || 'newest',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
    });

    const images = result.images.map((meta) => ({
      ...meta,
      lastModified: meta.uploadTime,
    }));
    const imagesWithUrls = await Promise.all(images.map(async (meta) => ({
      ...meta,
      url: await getAbsolutePublicImageUrl(request, meta.key),
      shortUrl: await getPublicImagePath(meta.key),
    })));

    return NextResponse.json({
      images: imagesWithUrls,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: unknown) {
    console.error('[Images List Error]', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to list images') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tagsRaw = formData.get('tags') as string || '';
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const key = generateStorageKey('upload', file.name);

    await putObject(key, buffer, file.type);
    const meta = await extractImageMeta(buffer, key, 'upload', tags, file.name);
    await addMeta(meta);

    return NextResponse.json({
      success: true,
      key,
      url: await getAbsolutePublicImageUrl(request, key),
      shortUrl: await getPublicImagePath(key),
      meta,
    });
  } catch (error: unknown) {
    console.error('[Upload Error]', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to upload image') }, { status: 500 });
  }
}
