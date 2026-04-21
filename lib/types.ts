export interface SessionData {
  isLoggedIn: boolean;
  user?: {
    name: string;
  };
}

export interface COSObject {
  key: string;
  size: number;
  lastModified?: string;
  uploadTime?: string;
  url: string;
  shortUrl: string;
  contentType?: string;
  category?: 'upload' | 'ai-generated';
  width?: number;
  height?: number;
  format?: string;
  tags?: string[];
  originalName?: string;
}

export interface ImageMeta {
  key: string;
  category: 'upload' | 'ai-generated';
  size: number;
  width: number;
  height: number;
  format: string;
  tags: string[];
  uploadTime: string;
  originalName?: string;
}

export interface ImageIndex {
  version: number;
  updatedAt: string;
  images: ImageMeta[];
}

export interface PublicListQuery {
  token: string;
  tag?: string;
  category?: 'upload' | 'ai-generated';
  format?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'largest' | 'smallest';
}

export interface GenerateImageParams {
  prompt: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  n?: number;
  responseFormat?: 'url' | 'base64';
  seed?: number;
  promptOptimizer?: boolean;
}

export interface AIImageProvider {
  name: string;
  generate(params: GenerateImageParams): Promise<Buffer[]>;
}

export interface TransformImageParams {
  sourceKey: string;
  targetFormat: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  width?: number;
  height?: number;
}
