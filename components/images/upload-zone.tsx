"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  url?: string;
}

export function UploadZone({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2),
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".bmp"],
    },
    multiple: true,
  });

  async function uploadAll() {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) {
      toast.info("没有待上传的文件");
      return;
    }

    for (const item of pending) {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" } : f))
      );

      try {
        const formData = new FormData();
        const key = `uploads/${Date.now()}-${item.file.name}`;
        formData.append("file", item.file);
        formData.append("key", key);

        const res = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: "done", progress: 100, url: data.url } : f
            )
          );
        } else {
          throw new Error(data.error || "上传失败");
        }
      } catch (error: unknown) {
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "error" } : f))
        );
        toast.error(`${item.file.name} 上传失败: ${getErrorMessage(error, "未知错误")}`);
      }
    }

    toast.success("上传完成");
    onUploadComplete?.();
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-medium">
          {isDragActive ? "释放文件以上传" : "拖拽图片到此处，或点击选择"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          支持 PNG, JPG, WebP, GIF, AVIF 等格式
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">待上传文件 ({files.length})</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
                disabled={uploadingCount > 0}
              >
                清空列表
              </Button>
              <Button
                size="sm"
                onClick={uploadAll}
                disabled={pendingCount === 0 || uploadingCount > 0}
              >
                {uploadingCount > 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    开始上传
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-auto">
            {files.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <FileImage className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {item.status === "uploading" && (
                    <Progress value={item.progress} className="h-1 mt-1" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.status === "done" && (
                    <span className="text-xs text-green-600">完成</span>
                  )}
                  {item.status === "error" && (
                    <span className="text-xs text-destructive">失败</span>
                  )}
                  {item.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
