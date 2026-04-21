# Image Host - 图床管理面板

基于 Next.js 14 + 腾讯云 COS 的全栈图床管理面板，支持图片上传、管理、格式转换、AI 生成等功能。

## 功能特性

- [x] 单用户认证（密码登录）
- [x] 图片上传（拖拽/选择，支持多文件）
- [x] 图片列表（网格展示、搜索、分页）
- [x] 图片预览（大图弹窗）
- [x] 图片删除（单张/批量）
- [x] 格式转换（JPEG/PNG/WebP/AVIF）
- [x] 复制链接（直链/Markdown/HTML）
- [x] 公开 API 访问（带 Token 验证，支持实时缩放和格式转换）
- [x] AI 生图（Minimax，预留多服务商扩展）

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + TypeScript |
| 样式 | Tailwind CSS + shadcn/ui |
| 认证 | iron-session + bcryptjs |
| 存储 | 腾讯云 COS |
| 图像处理 | sharp |
| AI 生图 | Minimax API |
| 部署 | Vercel |

## 快速开始

### 1. 克隆项目并安装依赖

```bash
cd image-host
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
# 管理员密码（bcrypt 哈希）
# 生成方式: node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
ADMIN_PASSWORD_HASH=

# Session 加密密钥（随机字符串，至少 32 位）
SESSION_SECRET=

# 腾讯云 COS 配置
COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=
COS_REGION=ap-guangzhou
COS_DOMAIN=https://your-bucket.cos.ap-guangzhou.myqcloud.com

# 公开 API Token（用于外部访问图片）
PUBLIC_API_TOKEN=

# Minimax API Key
MINIMAX_API_KEY=
```

### 3. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 部署到 Vercel

```bash
npm i -g vercel
vercel
```

在 Vercel Dashboard 中设置环境变量。

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `ADMIN_PASSWORD_HASH` | 是 | bcrypt 哈希后的管理员密码 |
| `SESSION_SECRET` | 是 | iron-session 加密密钥 |
| `COS_SECRET_ID` | 是 | 腾讯云 COS SecretId |
| `COS_SECRET_KEY` | 是 | 腾讯云 COS SecretKey |
| `COS_BUCKET` | 是 | COS 存储桶名称 |
| `COS_REGION` | 是 | COS 地域（如 ap-guangzhou）|
| `COS_DOMAIN` | 是 | COS 访问域名 |
| `PUBLIC_API_TOKEN` | 是 | 公开 API 访问令牌 |
| `MINIMAX_API_KEY` | 否 | Minimax API Key（AI 生图需要）|

## API 文档

### 认证

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录 `{ password: string }` |
| `/api/auth/logout` | POST | 登出 |
| `/api/auth/session` | GET | 获取当前会话 |

### 图片管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/images?marker=&maxKeys=50` | GET | 获取图片列表 |
| `/api/images` | POST | 上传图片（multipart/form-data） |
| `/api/images/:key` | DELETE | 删除图片 |
| `/api/images/:key?action=download` | GET | 获取下载链接 |

### 图片处理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/transform` | POST | 格式转换 `{ sourceKey, targetFormat, quality?, width?, height? }` |

### AI 生图

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ai/generate` | POST | AI 生图 `{ prompt, aspectRatio?, n?, seed? }` |

### 公开访问

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/public/:path?token=&w=&h=&format=` | GET | 公开访问图片（支持实时转换） |

示例：
```
/api/public/uploads/photo.jpg?token=pub_xxx&w=800&format=webp
```

## 公开 API 使用

无需登录，只需携带 `PUBLIC_API_TOKEN`：

- **直链访问**：`/api/public/图片路径?token=你的Token`
- **指定宽度**：`?w=800`
- **指定格式**：`?format=webp`
- **组合使用**：`?token=xxx&w=800&format=webp&quality=85`

## AI 生图扩展

项目采用适配器模式，如需接入其他 AI 服务商：

1. 在 `lib/ai/providers/` 下新建 provider 文件
2. 实现 `AIImageProvider` 接口
3. 在 `lib/ai/index.ts` 中注册

```typescript
// lib/ai/providers/openai.ts
export class OpenAIProvider implements AIImageProvider {
  name = 'openai';
  async generate(params: GenerateImageParams): Promise<Buffer[]> {
    // 实现...
  }
}

// lib/ai/index.ts
import { OpenAIProvider } from './providers/openai';
const providers: Record<string, AIImageProvider> = {
  minimax: new MinimaxProvider(),
  openai: new OpenAIProvider(),
};
```

## 许可证

MIT
