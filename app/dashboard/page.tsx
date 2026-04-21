"use client";

import { useEffect, useState, useCallback } from "react";
import { ImageGrid } from "@/components/images/image-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { COSObject } from "@/lib/types";
import { Search, RefreshCw, FilterX } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [images, setImages] = useState<COSObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [format, setFormat] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchImages = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const nextPage = reset ? 1 : page + 1;
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "50",
        sort,
      });
      if (format !== "all") params.set("format", format);
      if (category !== "all") params.set("category", category);

      const res = await fetch(`/api/images?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setImages((prev) => (reset ? data.images : [...prev, ...data.images]));
        setPage(data.pagination.page);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } else {
        toast.error(data.error || "获取图片列表失败");
      }
    } catch {
      toast.error("获取图片列表失败");
    } finally {
      setLoading(false);
    }
  }, [category, format, page, sort]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchImages(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchImages]);

  const filteredImages = images.filter((img) =>
    img.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索图片..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchImages(true)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
            setImages([]);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">全部来源</option>
          <option value="upload">手动上传</option>
          <option value="ai-generated">AI 生图</option>
        </select>
        <select
          value={format}
          onChange={(e) => {
            setFormat(e.target.value);
            setPage(1);
            setImages([]);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm uppercase"
        >
          <option value="all">全部格式</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="avif">AVIF</option>
          <option value="gif">GIF</option>
          <option value="svg">SVG</option>
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
            setImages([]);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
          <option value="largest">体积最大</option>
          <option value="smallest">体积最小</option>
        </select>
        {(category !== "all" || format !== "all" || sort !== "newest" || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategory("all");
              setFormat("all");
              setSort("newest");
              setSearchQuery("");
              setPage(1);
              setImages([]);
            }}
          >
            <FilterX className="mr-2 h-4 w-4" />
            重置筛选
          </Button>
        )}
      </div>

      <ImageGrid
        images={filteredImages}
        loading={loading && filteredImages.length === 0}
        onRefresh={() => fetchImages(true)}
      />

      {hasMore && !searchQuery && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => fetchImages()} disabled={loading}>
            {loading ? "加载中..." : "加载更多"}
          </Button>
        </div>
      )}
    </div>
  );
}
