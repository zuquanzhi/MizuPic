import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  getSettingStatus,
  getStoredSettings,
  sanitizeSettings,
  writeStoredSettings,
  type AppSettings,
} from '@/lib/app-config';
import { getErrorMessage } from '@/lib/utils';

const settingMeta: Record<keyof AppSettings, { env: string; secret: boolean; label: string }> = {
  cosSecretId: { env: 'COS_SECRET_ID', secret: true, label: 'COS SecretId' },
  cosSecretKey: { env: 'COS_SECRET_KEY', secret: true, label: 'COS SecretKey' },
  cosBucket: { env: 'COS_BUCKET', secret: false, label: 'COS Bucket' },
  cosRegion: { env: 'COS_REGION', secret: false, label: 'COS Region' },
  publicApiToken: { env: 'PUBLIC_API_TOKEN', secret: true, label: 'Public API Token' },
  publicBaseUrl: { env: 'PUBLIC_BASE_URL', secret: false, label: '公开访问域名' },
  minimaxApiKey: { env: 'MINIMAX_API_KEY', secret: true, label: 'Minimax API Key' },
  minimaxBaseUrl: { env: 'MINIMAX_BASE_URL', secret: false, label: 'Minimax Base URL' },
  adminPasswordHash: { env: 'ADMIN_PASSWORD_HASH', secret: true, label: 'Admin Password' },
};

type SettingKey = keyof AppSettings;

export async function GET() {
  try {
    const settings = await getStoredSettings();
    const fields = Object.entries(settingMeta).map(([key, meta]) => {
      const settingKey = key as SettingKey;
      return {
        key,
        label: meta.label,
        status: getSettingStatus(settings, settingKey, meta.env),
        secret: meta.secret,
        envName: meta.env,
        value: meta.secret ? '' : settings[settingKey] || process.env[meta.env] || '',
      };
    });

    return NextResponse.json({ fields });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to load settings') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = await getStoredSettings();
    const updates = sanitizeSettings((body.settings || {}) as AppSettings);
    const clear = Array.isArray(body.clear) ? body.clear as string[] : [];
    const next: AppSettings = { ...current };

    for (const key of clear) {
      if (key in settingMeta) {
        delete next[key as SettingKey];
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      if (key in settingMeta) {
        next[key as SettingKey] = value;
      }
    }

    const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword.trim() : '';
    if (adminPassword) {
      next.adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
    }

    await writeStoredSettings(next);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to save settings') }, { status: 500 });
  }
}
