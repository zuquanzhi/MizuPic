import COS from 'cos-nodejs-sdk-v5';

const SETTINGS_KEY = 'meta/app-settings.json';

export interface AppSettings {
  cosSecretId?: string;
  cosSecretKey?: string;
  cosBucket?: string;
  cosRegion?: string;
  publicApiToken?: string;
  publicBaseUrl?: string;
  minimaxApiKey?: string;
  minimaxBaseUrl?: string;
  adminPasswordHash?: string;
}

export interface RuntimeConfig {
  cosSecretId?: string;
  cosSecretKey?: string;
  cosBucket?: string;
  cosRegion?: string;
  publicApiToken?: string;
  publicBaseUrl?: string;
  minimaxApiKey?: string;
  minimaxBaseUrl: string;
  adminPasswordHash?: string;
  sessionSecret?: string;
}

let cachedSettings: AppSettings | null | undefined;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

function getBootstrapCOSClient() {
  if (!process.env.COS_SECRET_ID || !process.env.COS_SECRET_KEY) {
    return null;
  }

  return new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  });
}

function getBootstrapBucket() {
  return process.env.COS_BUCKET;
}

function getBootstrapRegion() {
  return process.env.COS_REGION;
}

async function readStoredSettings(): Promise<AppSettings> {
  const now = Date.now();
  if (cachedSettings !== undefined && now - cachedAt < CACHE_TTL_MS) {
    return cachedSettings || {};
  }

  const cos = getBootstrapCOSClient();
  const bucket = getBootstrapBucket();
  const region = getBootstrapRegion();
  if (!cos || !bucket || !region) {
    cachedSettings = {};
    cachedAt = now;
    return {};
  }

  try {
    const settings = await new Promise<AppSettings>((resolve, reject) => {
      cos.getObject(
        {
          Bucket: bucket,
          Region: region,
          Key: SETTINGS_KEY,
        },
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(JSON.parse((data.Body as Buffer).toString('utf-8')));
        }
      );
    });
    cachedSettings = sanitizeSettings(settings);
  } catch {
    cachedSettings = {};
  }

  cachedAt = now;
  return cachedSettings || {};
}

export async function writeStoredSettings(settings: AppSettings) {
  const cos = getBootstrapCOSClient();
  const bucket = getBootstrapBucket();
  const region = getBootstrapRegion();
  if (!cos || !bucket || !region) {
    throw new Error('需要先在 Vercel 环境变量中配置 COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET 和 COS_REGION，才能保存前端覆盖配置');
  }

  const sanitized = sanitizeSettings(settings);
  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: SETTINGS_KEY,
        Body: Buffer.from(JSON.stringify(sanitized, null, 2)),
        ContentType: 'application/json',
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });

  cachedSettings = sanitized;
  cachedAt = Date.now();
}

export async function getStoredSettings() {
  return readStoredSettings();
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  const settings = await readStoredSettings();

  return {
    cosSecretId: settings.cosSecretId || process.env.COS_SECRET_ID,
    cosSecretKey: settings.cosSecretKey || process.env.COS_SECRET_KEY,
    cosBucket: settings.cosBucket || process.env.COS_BUCKET,
    cosRegion: settings.cosRegion || process.env.COS_REGION,
    publicApiToken: settings.publicApiToken || process.env.PUBLIC_API_TOKEN,
    publicBaseUrl: settings.publicBaseUrl || process.env.PUBLIC_BASE_URL,
    minimaxApiKey: settings.minimaxApiKey || process.env.MINIMAX_API_KEY,
    minimaxBaseUrl: settings.minimaxBaseUrl || process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com',
    adminPasswordHash: settings.adminPasswordHash || process.env.ADMIN_PASSWORD_HASH,
    sessionSecret: process.env.SESSION_SECRET,
  };
}

export function sanitizeSettings(input: AppSettings): AppSettings {
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => typeof value === 'string' && value.length > 0)
  ) as AppSettings;
}

export function getSettingStatus(settings: AppSettings, key: keyof AppSettings, envName: string) {
  if (settings[key]) return 'override';
  if (process.env[envName]) return 'env';
  return 'missing';
}
