"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ImageIcon,
  Upload,
  Sparkles,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const navItems = [
  {
    title: "图片管理",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "上传图片",
    href: "/dashboard/upload",
    icon: Upload,
  },
  {
    title: "AI 生图",
    href: "/dashboard/ai",
    icon: Sparkles,
  },
  {
    title: "运行设置",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <ImageIcon className="h-5 w-5" />
          <span>图床面板</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: pathname === item.href ? "secondary" : "ghost" }),
                "justify-start gap-2 no-underline",
                pathname === item.href && "bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          Image Host v1.0
        </p>
      </div>
    </div>
  );
}
