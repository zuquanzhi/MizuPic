import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getObjectBuffer, putObject } from '@/lib/cos';
import { addMeta } from '@/lib/meta';
import { extractImageMeta } from '@/lib/image-meta';
import { getErrorMessage } from '@/lib/utils';
import { getAbsolutePublicImageUrl, getPublicImagePath } from '@/lib/public-url';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceKey, targetFormat, quality, width, height } = body;

    if (!sourceKey || !targetFormat) {
      return NextResponse.json({ error: 'sourceKey and targetFormat are required' }, { status: 400 });
    }

    const buffer = await getObjectBuffer(sourceKey);

    let pipeline = sharp(buffer);

    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
    }

    switch (targetFormat) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: quality || 80 });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: quality || 80 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: quality || 80 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: quality || 80 });
        break;
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    const transformedBuffer = await pipeline.toBuffer();

    const lastDotIndex = sourceKey.lastIndexOf('.');
    const baseName = lastDotIndex > 0 ? sourceKey.slice(0, lastDotIndex) : sourceKey;
    const newKey = `${baseName}.${targetFormat}`;

    await putObject(newKey, transformedBuffer, `image/${targetFormat}`);

    // Add to index
    const meta = await extractImageMeta(transformedBuffer, newKey, 'upload');
    meta.originalName = sourceKey.split('/').pop();
    await addMeta(meta);

    return NextResponse.json({
      success: true,
      key: newKey,
      url: await getAbsolutePublicImageUrl(request, newKey),
      shortUrl: await getPublicImagePath(newKey),
      meta,
    });
  } catch (error: unknown) {
    console.error('[Transform Error]', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to transform image') }, { status: 500 });
  }
}
