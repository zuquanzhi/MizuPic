"use client";

import { UploadZone } from "@/components/images/upload-zone";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">上传图片</h2>
        <p className="text-muted-foreground">拖拽或选择图片文件上传到图床</p>
      </div>
      <UploadZone onUploadComplete={() => router.refresh()} />
    </div>
  );
}
