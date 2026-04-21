"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, RotateCcw, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SettingField {
  key: string;
  label: string;
  status: "override" | "env" | "missing";
  secret: boolean;
  envName: string;
  value: string;
}

const placeholders: Record<string, string> = {
  cosSecretId: "留空保持当前 SecretId",
  cosSecretKey: "留空保持当前 SecretKey",
  cosBucket: "examplebucket-1250000000",
  cosRegion: "ap-guangzhou",
  publicApiToken: "留空保持当前公开访问 Token",
  publicBaseUrl: "https://img.example.com",
  minimaxApiKey: "留空保持当前 Minimax Key",
  minimaxBaseUrl: "https://api.minimaxi.com",
  adminPasswordHash: "使用下方密码框修改",
};

function statusText(status: SettingField["status"]) {
  if (status === "override") return "前端覆盖";
  if (status === "env") return "环境变量";
  return "未配置";
}

function statusVariant(status: SettingField["status"]) {
  if (status === "override") return "default";
  if (status === "env") return "secondary";
  return "destructive";
}

export function SettingsForm() {
  const [fields, setFields] = useState<SettingField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [clear, setClear] = useState<Set<string>>(new Set());
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载设置失败");
      setFields(data.fields);
      setValues(Object.fromEntries(data.fields.map((field: SettingField) => [field.key, field.secret ? "" : field.value])));
      setClear(new Set());
      setAdminPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载设置失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const groups = useMemo(() => ({
    storage: fields.filter((field) => field.key.startsWith("cos")),
    access: fields.filter((field) => field.key === "publicApiToken" || field.key === "publicBaseUrl" || field.key === "adminPasswordHash"),
    ai: fields.filter((field) => field.key.startsWith("minimax")),
  }), [fields]);

  function toggleClear(key: string) {
    setClear((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const settings = Object.fromEntries(
        Object.entries(values).filter(([key, value]) => value.trim() && !clear.has(key))
      );
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings,
          clear: Array.from(clear),
          adminPassword: adminPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      toast.success("设置已保存");
      await loadSettings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: SettingField) {
    const disabled = clear.has(field.key) || field.key === "adminPasswordHash";
    return (
      <div key={field.key} className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-center">
        <div className="space-y-1">
          <Label htmlFor={field.key}>{field.label}</Label>
          <p className="text-xs text-muted-foreground">{field.envName}</p>
        </div>
        <Input
          id={field.key}
          type={field.secret ? "password" : "text"}
          value={values[field.key] || ""}
          placeholder={placeholders[field.key] || "留空保持当前值"}
          disabled={disabled}
          onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
        />
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(field.status)}>{statusText(field.status)}</Badge>
          <Button
            type="button"
            variant={clear.has(field.key) ? "secondary" : "ghost"}
            size="icon"
            onClick={() => toggleClear(field.key)}
            title="恢复环境变量"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        加载设置中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            存储配置
          </CardTitle>
          <CardDescription>覆盖后，图片读写会使用这里的 COS 配置；设置文件本身仍保存在启动环境变量指向的 COS。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.storage.map(renderField)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">访问与登录</CardTitle>
          <CardDescription>公开 Token 会出现在图片代理链接中；管理员密码会在服务端加密保存。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.access.map(renderField)}
          <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-center">
            <div className="space-y-1">
              <Label htmlFor="adminPassword">新管理员密码</Label>
              <p className="text-xs text-muted-foreground">留空则不修改</p>
            </div>
            <Input
              id="adminPassword"
              type="password"
              value={adminPassword}
              placeholder="输入新密码"
              onChange={(event) => setAdminPassword(event.target.value)}
            />
            <div />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI 生图</CardTitle>
          <CardDescription>Minimax 配置会在下一次生成请求时生效。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.ai.map(renderField)}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          保存设置
        </Button>
      </div>
    </div>
  );
}
