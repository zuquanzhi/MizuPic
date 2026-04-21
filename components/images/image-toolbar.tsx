"use client";

import { Button } from "@/components/ui/button";
import { Trash2, CheckSquare, Square } from "lucide-react";

interface ImageToolbarProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onBatchDelete: () => void;
}

export function ImageToolbar({
  totalCount,
  selectedCount,
  onSelectAll,
  onBatchDelete,
}: ImageToolbarProps) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        共 {totalCount} 张图片
        {selectedCount > 0 && (
          <span className="ml-2 text-foreground">已选择 {selectedCount} 张</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          {allSelected ? (
            <Square className="mr-2 h-4 w-4" />
          ) : (
            <CheckSquare className="mr-2 h-4 w-4" />
          )}
          {allSelected ? "取消全选" : "全选"}
        </Button>
        {selectedCount > 0 && (
          <Button variant="destructive" size="sm" onClick={onBatchDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            批量删除
          </Button>
        )}
      </div>
    </div>
  );
}
