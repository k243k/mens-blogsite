import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import type { Buffer } from "node:buffer";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export type StorageFile = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

export type StorageSaveOptions = {
  folder?: string;
};

export interface StorageAdapter {
  save(file: StorageFile, options?: StorageSaveOptions): Promise<{ url: string; path: string }>;
}

const DEFAULT_FOLDER = "uploads";

export class LocalStorageAdapter implements StorageAdapter {
  private readonly publicDir: string;

  constructor(baseDir = path.join(process.cwd(), "public")) {
    this.publicDir = baseDir;
  }

  async save(file: StorageFile, options?: StorageSaveOptions) {
    const folder = options?.folder ?? DEFAULT_FOLDER;
    const targetDir = path.join(this.publicDir, folder);
    await fs.mkdir(targetDir, { recursive: true });

    const filename = this.createFilename(file.filename, file.contentType);
    const targetPath = path.join(targetDir, filename);

    await fs.writeFile(targetPath, file.buffer);

    const url = `/${folder}/${filename}`.replace(/\\+/g, "/");

    return { url, path: targetPath };
  }

  private createFilename(original: string, contentType: string) {
    const random = crypto.randomUUID();
    const ext = this.getExtension(original, contentType);
    return ext ? `${random}.${ext}` : random;
  }

  private getExtension(original: string, contentType: string) {
    const fromName = original.includes(".") ? original.split(".").pop() ?? "" : "";
    if (fromName) {
      return this.sanitizeExtension(fromName);
    }

    const mimeExt = this.extensionFromMime(contentType);
    return mimeExt ?? "";
  }

  private sanitizeExtension(ext: string) {
    return ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private extensionFromMime(contentType: string) {
    switch (contentType) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      case "image/gif":
        return "gif";
      case "image/avif":
        return "avif";
      default:
        return undefined;
    }
  }
}

export type S3AdapterConfig = {
  bucket: string;
  publicUrlBase?: string;
  folder?: string;
};

export class S3StorageAdapter implements StorageAdapter {
  constructor(private readonly client: S3Client, private readonly config: S3AdapterConfig) {}

  async save(file: StorageFile, options?: StorageSaveOptions) {
    const folder = options?.folder ?? this.config.folder ?? DEFAULT_FOLDER;
    const key = this.createKey(folder, file.filename, file.contentType);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.contentType,
        ACL: "public-read",
      }),
    );

    const base = this.config.publicUrlBase?.replace(/\/$/, "") ?? ``;
    const url = base ? `${base}/${key}` : `https://${this.config.bucket}.s3.amazonaws.com/${key}`;

    return { url, path: key };
  }

  private createKey(folder: string, original: string, contentType: string) {
    const filename = this.createFilename(original, contentType);
    return `${folder}/${filename}`.replace(/\\+/g, "/");
  }

  private createFilename(original: string, contentType: string) {
    const random = crypto.randomUUID();
    const ext = this.getExtension(original, contentType);
    return ext ? `${random}.${ext}` : random;
  }

  private getExtension(original: string, contentType: string) {
    const fromName = original.includes(".") ? original.split(".").pop() ?? "" : "";
    if (fromName) {
      return fromName.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    switch (contentType) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      case "image/gif":
        return "gif";
      case "image/avif":
        return "avif";
      default:
        return undefined;
    }
  }
}

export function createS3AdapterFromEnv() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("S3_BUCKET is required when STORAGE_DRIVER=s3");
  }

  const region = process.env.S3_REGION ?? "us-east-1";
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  const client = new S3Client({
    region,
    endpoint,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    forcePathStyle: Boolean(process.env.S3_FORCE_PATH_STYLE === "true"),
  });

  return new S3StorageAdapter(client, {
    bucket,
    publicUrlBase: process.env.S3_PUBLIC_URL,
  });
}
