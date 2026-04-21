"use client";

import { Suspense } from "react";
import { GenerateForm } from "@/components/ai/generate-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIGeneratePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI 生图</h2>
        <p className="text-muted-foreground">使用 Minimax AI 生成图片并保存到图床</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <GenerateForm />
      </Suspense>
    </div>
  );
}
