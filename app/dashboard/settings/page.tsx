import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">运行时设置</h2>
        <p className="text-muted-foreground">环境变量作为默认值，这里的保存项会在运行时覆盖它们。</p>
      </div>
      <SettingsForm />
    </div>
  );
}
