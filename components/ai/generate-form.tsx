"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Copy, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

const aspectRatios = [
  { value: "1:1", label: "1:1 (1024x1024)" },
  { value: "16:9", label: "16:9 (1280x720)" },
  { value: "4:3", label: "4:3 (1152x864)" },
  { value: "3:2", label: "3:2 (1248x832)" },
  { value: "2:3", label: "2:3 (832x1248)" },
  { value: "3:4", label: "3:4 (864x1152)" },
  { value: "9:16", label: "9:16 (720x1280)" },
  { value: "21:9", label: "21:9 (1344x576)" },
];

export function GenerateForm() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [n, setN] = useState(1);
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ key: string; url: string }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error("请输入提示词");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          n,
          seed: seed ? parseInt(seed, 10) : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResults(data.images);
        toast.success(`成功生成 ${data.images.length} 张图片`);
      } else {
        toast.error(data.error || "生成失败");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "生成请求失败，请检查网络或配置"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(url: string, index: number) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      toast.success("链接已复制");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("复制失败");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">提示词 (Prompt)</Label>
          <Textarea
            id="prompt"
            placeholder="描述你想要生成的图片内容..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            {prompt.length} / 1500 字符
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="aspect-ratio">宽高比</Label>
            <select
              id="aspect-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="n">生成数量 (1-9)</Label>
            <Input
              id="n"
              type="number"
              min={1}
              max={9}
              value={n}
              onChange={(e) => setN(Math.min(9, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seed">随机种子 (可选)</Label>
            <Input
              id="seed"
              type="number"
              placeholder="留空则随机"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              开始生成
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">生成结果</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((img, index) => (
              <Card key={img.key} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={img.url}
                      alt={`生成结果 ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopy(img.url, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      复制链接
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const markdown = `![AI生成](${img.url})`;
                        navigator.clipboard.writeText(markdown).then(() => {
                          toast.success("Markdown 已复制");
                        });
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      MD
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
