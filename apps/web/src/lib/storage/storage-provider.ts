// src/lib/storage/storage-provider.ts

export interface StorageProvider {
  /**
   * Upload a file and return its URL
   */
  upload(file: File, path: string): Promise<string>;

  /**
   * Get a signed URL for accessing a file
   */
  getUrl(path: string): Promise<string>;

  /**
   * Delete a file
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;
}
