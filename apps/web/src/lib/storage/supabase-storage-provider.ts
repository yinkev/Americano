// src/lib/storage/supabase-storage-provider.ts

import { createClient } from '@supabase/supabase-js'
import path from 'path'
import type { StorageProvider } from './storage-provider'

export class SupabaseStorageProvider implements StorageProvider {
  private supabase
  private bucket = 'lectures'

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  }

  async upload(file: File, filePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(this.bucket).upload(filePath, file)

    if (error) throw error

    return data.path
  }

  async getUrl(filePath: string): Promise<string> {
    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(filePath)

    return data.publicUrl
  }

  async delete(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucket).remove([filePath])

    if (error) throw error
  }

  async exists(filePath: string): Promise<boolean> {
    const { data } = await this.supabase.storage.from(this.bucket).list(path.dirname(filePath), {
      search: path.basename(filePath),
    })

    return !!data && data.length > 0
  }
}
