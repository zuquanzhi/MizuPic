"use client";

import { useState } from "react";
import { ImageCard } from "./image-card";
import { ImageToolbar } from "./image-toolbar";
import type { COSObject } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageGridProps {
  images: COSObject[];
  loading: boolean;
  onRefresh: () => void;
}

export function ImageGrid({ images, loading, onRefresh }: ImageGridProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  function toggleSelect(key: string, selected: boolean) {
    const next = new Set(selectedKeys);
    if (selected) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setSelectedKeys(next);
  }

  function toggleSelectAll() {
    if (selectedKeys.size === images.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(images.map((img) => img.key)));
    }
  }

  async function handleDelete(key: string) {
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        onRefresh();
      }
    } catch {
      // error handled by parent
    }
  }

  async function handleBatchDelete() {
    const keys = Array.from(selectedKeys);
    for (const key of keys) {
      await handleDelete(key);
    }
    setSelectedKeys(new Set());
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">暂无图片</p>
        <p className="text-sm">点击左侧“上传图片”开始上传</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ImageToolbar
        totalCount={images.length}
        selectedCount={selectedKeys.size}
        onSelectAll={toggleSelectAll}
        onBatchDelete={handleBatchDelete}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {images.map((image) => (
          <ImageCard
            key={image.key}
            image={image}
            selected={selectedKeys.has(image.key)}
            onSelect={(sel) => toggleSelect(image.key, sel)}
            onDelete={() => handleDelete(image.key)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}
