import type { Buffer } from "node:buffer";

import type { StorageAdapter } from "@/server/adapters/storage";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export type MediaUploadParams = {
  buffer: Buffer;
  originalName: string;
  contentType: string;
  size: number;
};

export class MediaService {
  constructor(private readonly storage: StorageAdapter) {}

  async upload(params: MediaUploadParams) {
    this.validate(params);

    const saved = await this.storage.save(
      {
        buffer: params.buffer,
        filename: params.originalName,
        contentType: params.contentType,
      },
      { folder: "uploads" },
    );

    return {
      url: saved.url,
    };
  }

  private validate(params: MediaUploadParams) {
    if (params.size <= 0) {
      throw new Error("FILE_EMPTY");
    }

    if (params.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("FILE_TOO_LARGE");
    }

    if (!ALLOWED_MIME_TYPES.has(params.contentType)) {
      throw new Error("UNSUPPORTED_TYPE");
    }
  }
}
