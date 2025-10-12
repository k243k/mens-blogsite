import type { SettingRepository } from "@/server/repositories/setting-repository";

export class SettingService {
  constructor(private readonly repository: SettingRepository) {}

  async getAll() {
    const settings = await this.repository.findAll();
    return settings.map((setting) => ({ key: setting.key, value: setting.value }));
  }

  update(key: string, value: unknown) {
    return this.repository.upsert(key, value);
  }
}
