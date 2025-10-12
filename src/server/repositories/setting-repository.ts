import type { Setting } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

export interface SettingRepository {
  findByKey<T = unknown>(key: string): Promise<T | null>;
  findAll(): Promise<Setting[]>;
  upsert(key: string, value: unknown): Promise<Setting>;
}

export class PrismaSettingRepository implements SettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByKey<T = unknown>(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    return setting ? (setting.value as T) : null;
  }

  findAll() {
    return this.prisma.setting.findMany();
  }

  upsert(key: string, value: unknown) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
