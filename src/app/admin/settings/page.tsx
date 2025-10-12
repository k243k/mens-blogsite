import { SettingForm } from "@/components/admin/SettingForm";
import { getServerContainer } from "@/server/get-container";

export default async function AdminSettingsPage() {
  const container = getServerContainer();
  const settings = await container.services.settings.getAll();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">サイト設定</h1>
        <p className="text-sm text-foreground/60">広告・アフィリエイト・SEOの既定値などを更新できます。</p>
      </div>
      <SettingForm initialSettings={settings} />
    </div>
  );
}
