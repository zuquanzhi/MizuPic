import type { AIImageProvider, GenerateImageParams } from '@/lib/types';
import { getRuntimeConfig } from '@/lib/app-config';

interface MinimaxImageResponse {
  id?: string;
  data?: {
    image_base64?: string[];
    base64_list?: string[];
    image_urls?: string[];
    image_url?: string[];
  };
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
}

export class MinimaxProvider implements AIImageProvider {
  name = 'minimax';

  async generate(params: GenerateImageParams): Promise<Buffer[]> {
    const config = await getRuntimeConfig();
    const apiKey = config.minimaxApiKey;
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY is not configured');
    }

    const imageSize = getImageSize(params);
    const body: Record<string, string | number | boolean> = {
      model: 'image-01',
      prompt: params.prompt,
      image_size: imageSize,
      num_images: params.n || 1,
    };

    if (params.seed !== undefined) {
      body.seed = params.seed;
    }

    if (params.promptOptimizer !== undefined) {
      body.prompt_optimizer = params.promptOptimizer;
    }

    const baseUrl = config.minimaxBaseUrl;
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/image_generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as MinimaxImageResponse;

    const statusCode = data.base_resp?.status_code;
    if (statusCode !== undefined && statusCode !== 0) {
      const msg = data.base_resp?.status_msg || 'Unknown error';
      const code = statusCode;
      if (code === 2049) {
        throw new Error('Minimax API Key 无效，请检查配置');
      }
      throw new Error(formatMinimaxError(code, msg, data.id));
    }

    if (!res.ok) {
      throw new Error(`Minimax HTTP error: ${res.status}`);
    }

    const base64List = data.data?.image_base64 || data.data?.base64_list || [];
    if (base64List.length > 0) {
      return base64List.map((b64) => Buffer.from(b64, 'base64'));
    }

    const imageUrls = data.data?.image_urls || data.data?.image_url || [];
    if (imageUrls.length > 0) {
      return Promise.all(imageUrls.map(downloadImage));
    }

    if ((data.base_resp?.status_msg || '').includes('link')) {
      throw new Error('Minimax 链接生成失败，请稍后重试或改用 base64 返回');
    }

    throw new Error('Minimax 未返回图片数据');
  }
}

function formatMinimaxError(code: number, message: string, requestId?: string) {
  const suffix = requestId ? `，request_id: ${requestId}` : '';
  if (code === 1008) {
    return `Minimax API 返回 1008：${message}${suffix}。如果账户余额充足，请确认当前 MINIMAX_API_KEY 属于已充值的账号/套餐空间，且 Base URL 与该 Key 对应。`;
  }
  return `Minimax API error [${code}]: ${message}${suffix}`;
}

function getImageSize(params: GenerateImageParams) {
  if (params.width && params.height) {
    return `${params.width}x${params.height}`;
  }

  const aspectRatioToSize: Record<string, string> = {
    '1:1': '1024x1024',
    '16:9': '1280x720',
    '4:3': '1152x864',
    '3:2': '1248x832',
    '2:3': '832x1248',
    '3:4': '864x1152',
    '9:16': '720x1280',
    '21:9': '1344x576',
  };

  return aspectRatioToSize[params.aspectRatio || '1:1'] || '1024x1024';
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`下载 Minimax 图片失败: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error('Minimax 未返回图片数据');
  }
  return buffer;
}
