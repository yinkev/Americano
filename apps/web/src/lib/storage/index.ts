// src/lib/storage/index.ts

import { LocalStorageProvider } from './local-storage-provider';
import { SupabaseStorageProvider } from './supabase-storage-provider';
import type { StorageProvider } from './storage-provider';

export function getStorageProvider(): StorageProvider {
  const mode = process.env.STORAGE_MODE || 'local';

  switch (mode) {
    case 'local':
      return new LocalStorageProvider();
    case 'cloud':
      return new SupabaseStorageProvider();
    default:
      throw new Error(`Unknown storage mode: ${mode}`);
  }
}

export type { StorageProvider } from './storage-provider';
