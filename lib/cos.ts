import COS from 'cos-nodejs-sdk-v5';
import { getRuntimeConfig } from './app-config';

let cosClient: COS | null = null;
let cosClientKey = '';

async function getCOSClient(): Promise<COS> {
  const config = await getRuntimeConfig();
  if (!config.cosSecretId || !config.cosSecretKey) {
    throw new Error('COS_SECRET_ID or COS_SECRET_KEY is not configured');
  }

  const nextKey = `${config.cosSecretId}:${config.cosSecretKey}`;
  if (!cosClient || cosClientKey !== nextKey) {
    cosClient = new COS({
      SecretId: config.cosSecretId,
      SecretKey: config.cosSecretKey,
    });
    cosClientKey = nextKey;
  }
  return cosClient;
}

export async function getBucketName(): Promise<string> {
  const config = await getRuntimeConfig();
  if (!config.cosBucket) {
    throw new Error('COS_BUCKET is not configured');
  }
  return config.cosBucket;
}

export async function getRegion(): Promise<string> {
  const config = await getRuntimeConfig();
  if (!config.cosRegion) {
    throw new Error('COS_REGION is not configured');
  }
  return config.cosRegion;
}

export async function listObjects(prefix?: string, marker?: string, maxKeys = 50) {
  const cos = await getCOSClient();
  const bucket = await getBucketName();
  const region = await getRegion();
  return new Promise<{ contents: COS.CosObject[]; nextMarker?: string; isTruncated: boolean }>((resolve, reject) => {
    cos.getBucket(
      {
        Bucket: bucket,
        Region: region,
        Prefix: prefix || '',
        Marker: marker || '',
        MaxKeys: maxKeys,
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          contents: data.Contents || [],
          nextMarker: data.NextMarker,
          isTruncated: data.IsTruncated === 'true',
        });
      }
    );
  });
}

export async function putObject(key: string, buffer: Buffer, contentType?: string) {
  const cos = await getCOSClient();
  const bucket = await getBucketName();
  const region = await getRegion();
  return new Promise<{ key: string }>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
        ContentLength: buffer.length,
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ key });
      }
    );
  });
}

export async function deleteObject(key: string) {
  const cos = await getCOSClient();
  const bucket = await getBucketName();
  const region = await getRegion();
  return new Promise<void>((resolve, reject) => {
    cos.deleteObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
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
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const cos = await getCOSClient();
  const bucket = await getBucketName();
  const region = await getRegion();
  return new Promise<Buffer>((resolve, reject) => {
    cos.getObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data.Body as Buffer);
      }
    );
  });
}

export async function getObject(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const cos = await getCOSClient();
  const bucket = await getBucketName();
  const region = await getRegion();
  return new Promise<{ buffer: Buffer; contentType: string }>((resolve, reject) => {
    cos.getObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          buffer: data.Body as Buffer,
          contentType: data.headers?.['content-type'] || 'application/octet-stream',
        });
      }
    );
  });
}

export async function headObject(key: string): Promise<{ size: number; lastModified: string; contentType?: string }> {
  const cos = await getCOSClient();
  const bucket = await getBucketName();
  const region = await getRegion();
  return new Promise((resolve, reject) => {
    cos.headObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          size: Number(data.headers?.['content-length'] || 0),
          lastModified: String(data.headers?.['last-modified'] || new Date().toISOString()),
          contentType: data.headers?.['content-type'],
        });
      }
    );
  });
}

export async function getObjectUrl(key: string, expires = 3600): Promise<string> {
  const cos = await getCOSClient();
  const bucket = await getBucketName();
  const region = await getRegion();
  return new Promise<string>((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Expires: expires,
        Sign: true,
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data.Url);
      }
    );
  });
}
