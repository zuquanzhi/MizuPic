import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/ai';
import { putObject } from '@/lib/cos';
import { addMeta } from '@/lib/meta';
import { extractImageMeta, generateStorageKey } from '@/lib/image-meta';
import type { ImageMeta } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';
import { getAbsolutePublicImageUrl, getPublicImagePath } from '@/lib/public-url';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      aspectRatio,
      width,
      height,
      n,
      seed,
      promptOptimizer,
      provider = 'minimax',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const aiProvider = getProvider(provider);
    const buffers = await aiProvider.generate({
      prompt,
      aspectRatio,
      width,
      height,
      n: n || 1,
      seed,
      promptOptimizer,
      responseFormat: 'base64',
    });

    const results: { key: string; url: string; shortUrl: string; meta: ImageMeta }[] = [];

    for (let i = 0; i < buffers.length; i++) {
      const key = generateStorageKey('ai-generated', `generated-${i + 1}.png`);
      await putObject(key, buffers[i], 'image/png');
      const meta = await extractImageMeta(buffers[i], key, 'ai-generated', ['ai-generated']);
      await addMeta(meta);
      results.push({
        key,
        url: await getAbsolutePublicImageUrl(request, key),
        shortUrl: await getPublicImagePath(key),
        meta,
      });
    }

    return NextResponse.json({ success: true, images: results });
  } catch (error: unknown) {
    console.error('[AI Generate Error]', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to generate image') }, { status: 500 });
  }
}
