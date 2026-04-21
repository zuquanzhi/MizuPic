"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { COSObject } from "@/lib/types";
import {
  Trash2,
  Copy,
  MoreVertical,
  FileImage,
  Download,
  Check,
  RefreshCw,
  Code2,
} from "lucide-react";
import { toast } from "sonner";

interface ImageCardProps {
  image: COSObject;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
  onRefresh: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN");
}

export function ImageCard({ image, selected, onSelect, onDelete, onRefresh }: ImageCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayUrl = image.shortUrl || image.url;
  const absoluteDisplayUrl = displayUrl.startsWith("/")
    ? `${window.location.origin}${displayUrl}`
    : displayUrl;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(absoluteDisplayUrl);
      setCopied(true);
      toast.success("链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  }

  async function handleCopyShortLink() {
    if (!image.shortUrl) {
      toast.error("短链接未配置");
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.origin + image.shortUrl);
      setCopied(true);
      toast.success("短链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  }

  async function handleCopyMarkdown() {
    const markdown = `![${image.key}](${absoluteDisplayUrl})`;
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Markdown 已复制");
    } catch {
      toast.error("复制失败");
    }
  }

  async function handleCopyHtml() {
    const html = `<img src="${absoluteDisplayUrl}" alt="${image.key}" />`;
    try {
      await navigator.clipboard.writeText(html);
      toast.success("HTML 已复制");
    } catch {
      toast.error("复制失败");
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.key)}?action=buffer`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = image.key.split("/").pop() || "download";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error("获取下载链接失败");
    }
  }

  const fileName = image.key.split("/").pop() || image.key;
  const imageTime = image.lastModified || image.uploadTime || new Date().toISOString();

  return (
    <>
      <Card className="group overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-square cursor-pointer overflow-hidden bg-muted"
            onClick={() => setPreviewOpen(true)}>
            <img
              src={displayUrl}
              alt={fileName}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            <div className="absolute left-2 top-2">
              <Checkbox
                checked={selected}
                onCheckedChange={onSelect}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" />
                    复制链接
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyMarkdown} className="cursor-pointer">
                    <FileImage className="mr-2 h-4 w-4" />
                    复制 Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyHtml} className="cursor-pointer">
                    <Code2 className="mr-2 h-4 w-4" />
                    复制 HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    下载
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      const format = prompt("请输入目标格式 (jpeg/png/webp/avif):", "webp");
                      if (!format) return;
                      try {
                        const res = await fetch("/api/transform", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ sourceKey: image.key, targetFormat: format }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast.success(`已转换为 ${format}`);
                          onRefresh();
                        } else {
                          toast.error(data.error || "转换失败");
                        }
                      } catch {
                        toast.error("转换失败");
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    转换格式
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-medium" title={fileName}>
              {fileName}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {formatBytes(image.size)}
              </Badge>
              <span>{formatDate(imageTime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="truncate text-base sm:text-lg" title={fileName}>{fileName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted">
              <img
                src={displayUrl}
                alt={fileName}
                className="max-h-[50vh] w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                复制链接
              </Button>
              {image.shortUrl && (
                <Button variant="outline" size="sm" onClick={handleCopyShortLink}>
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  短链接
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCopyMarkdown}>
                <FileImage className="mr-1 h-3.5 w-3.5" />
                Markdown
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyHtml}>
                <Code2 className="mr-1 h-3.5 w-3.5" />
                HTML
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1 h-3.5 w-3.5" />
                下载
              </Button>
              <Button variant="destructive" size="sm" onClick={() => { setDeleteConfirmOpen(true); }}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                删除
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-1.5 rounded-md bg-muted p-3">
              <div className="flex items-start gap-2">
                <span className="font-medium shrink-0">URL:</span>
                <code className="break-all text-xs text-foreground bg-background/50 px-1.5 py-0.5 rounded">{absoluteDisplayUrl}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">大小:</span>
                <span>{formatBytes(image.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">上传时间:</span>
                <span>{formatDate(imageTime)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除图片 <span className="font-medium text-foreground">{fileName}</span> 吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete();
                setDeleteConfirmOpen(false);
                setPreviewOpen(false);
              }}
            >
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
