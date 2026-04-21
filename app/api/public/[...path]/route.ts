import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getObjectBuffer } from '@/lib/cos';
import { getErrorMessage } from '@/lib/utils';
import { getRuntimeConfig } from '@/lib/app-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const { searchParams } = new URL(request.url);

    const token = searchParams.get('token');
    const config = await getRuntimeConfig();
    if (config.publicApiToken && token !== config.publicApiToken) {
      return NextResponse.json({ error: 'Invalid or missing token' }, { status: 403 });
    }

    const key = path.join('/');
    const width = searchParams.get('w') ? parseInt(searchParams.get('w')!, 10) : undefined;
    const height = searchParams.get('h') ? parseInt(searchParams.get('h')!, 10) : undefined;
    const format = searchParams.get('format') as 'jpeg' | 'png' | 'webp' | 'avif' | undefined;
    const quality = searchParams.get('quality') ? parseInt(searchParams.get('quality')!, 10) : 80;

    const buffer = await getObjectBuffer(key);
    const originalContentType = getContentType(key);

    if (!width && !height && !format) {
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': originalContentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    let pipeline = sharp(buffer);

    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
    }

    let contentType = originalContentType;
    if (format) {
      contentType = `image/${format}`;
      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality });
          break;
        case 'png':
          pipeline = pipeline.png({ quality });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality });
          break;
      }
    }

    const transformedBuffer = await pipeline.toBuffer();

    return new NextResponse(new Uint8Array(transformedBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to get image') }, { status: 500 });
  }
}

function getContentType(key: string) {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
