import { getRuntimeConfig } from './app-config';

export async function getPublicImagePath(key: string) {
  const { publicApiToken } = await getRuntimeConfig();
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const query = publicApiToken ? `?token=${encodeURIComponent(publicApiToken)}` : '';
  return `/api/public/${encodedKey}${query}`;
}

export async function getAbsolutePublicImageUrl(request: Request, key: string) {
  const { publicBaseUrl } = await getRuntimeConfig();
  return new URL(await getPublicImagePath(key), publicBaseUrl || request.url).toString();
}
