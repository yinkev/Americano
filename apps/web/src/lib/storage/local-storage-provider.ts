// src/lib/storage/local-storage-provider.ts

import fs from 'fs/promises';
import path from 'path';
import type { StorageProvider } from './storage-provider';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || '~/americano-data/pdfs';
    // Expand ~ to home directory
    if (this.basePath.startsWith('~')) {
      this.basePath = this.basePath.replace('~', process.env.HOME || process.env.USERPROFILE || '');
    }
  }

  async upload(file: File, filePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return `file://${fullPath}`;
  }

  async getUrl(filePath: string): Promise<string> {
    return `file://${path.join(this.basePath, filePath)}`;
  }

  async delete(filePath: string): Promise<void> {
    await fs.unlink(path.join(this.basePath, filePath));
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, filePath));
      return true;
    } catch {
      return false;
    }
  }
}
