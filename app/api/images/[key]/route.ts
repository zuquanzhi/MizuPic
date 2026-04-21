import { NextRequest, NextResponse } from 'next/server';
import { deleteObject, getObjectBuffer } from '@/lib/cos';
import { removeMeta } from '@/lib/meta';
import { getErrorMessage } from '@/lib/utils';
import { getAbsolutePublicImageUrl } from '@/lib/public-url';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    await deleteObject(decodedKey);
    await removeMeta(decodedKey);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Delete Error]', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to delete image') }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'download') {
      return NextResponse.json({ url: await getAbsolutePublicImageUrl(request, decodedKey) });
    }

    if (action === 'buffer') {
      const buffer = await getObjectBuffer(decodedKey);
      const ext = decodedKey.split('.').pop()?.toLowerCase() || '';
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
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${decodedKey.split('/').pop() || 'download'}"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('[Image Get Error]', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to get image') }, { status: 500 });
  }
}
