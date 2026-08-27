/**
 * OmniPDF In-Browser Storage Vault & File Manager
 * Handles local document caching, quota tracking, metadata indexing, and export.
 */

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: 'pdf' | 'image' | 'word' | 'archive' | 'other';
  createdAt: string;
  blobUrl?: string;
  dataBase64?: string;
  pageCount?: number;
  tags?: string[];
  starred?: boolean;
  toolUsed?: string;
}

const DB_NAME = 'omnypdf_vault_db_v2';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function getCategoryFromMime(mime: string, filename: string): StoredFile['category'] {
  if (mime.includes('pdf') || filename.toLowerCase().endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('image/') || /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(filename)) return 'image';
  if (mime.includes('word') || mime.includes('document') || /\.(docx|doc|txt|rtf)$/i.test(filename)) return 'word';
  if (mime.includes('zip') || filename.toLowerCase().endsWith('.zip')) return 'archive';
  return 'other';
}

class StorageVaultService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result as IDBDatabase);
      };

      request.onerror = (event: any) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save a processed or uploaded file into the user's storage vault
   */
  async saveFile(
    fileOrBlob: File | Blob,
    filename: string,
    metadata?: Partial<StoredFile>
  ): Promise<StoredFile> {
    const db = await this.initDB();
    const id = metadata?.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const category = getCategoryFromMime(fileOrBlob.type, filename);

    // Convert blob to base64 for persistent IndexedDB storage
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const dataBase64 = `data:${fileOrBlob.type || 'application/octet-stream'};base64,${btoa(binary)}`;

    const storedFile: StoredFile = {
      id,
      name: filename,
      size: fileOrBlob.size,
      type: fileOrBlob.type || 'application/octet-stream',
      category,
      createdAt: new Date().toISOString(),
      dataBase64,
      pageCount: metadata?.pageCount,
      tags: metadata?.tags || ['converted'],
      starred: metadata?.starred || false,
      toolUsed: metadata?.toolUsed || 'OmniPDF Engine',
      ...metadata,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(storedFile);

      request.onsuccess = () => {
        // Also provide a runtime blob URL
        const blobUrl = URL.createObjectURL(fileOrBlob);
        resolve({ ...storedFile, blobUrl });
      };

      request.onerror = (e: any) => {
        reject(e.target.error);
      };
    });
  }

  /**
   * Get all stored files for the current session/account
   */
  async getAllFiles(): Promise<StoredFile[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const files: StoredFile[] = (request.result || []).map((file: StoredFile) => {
            if (file.dataBase64) {
              try {
                // Generate dynamic blob URL for current browser session
                const byteString = atob(file.dataBase64.split(',')[1]);
                const mimeString = file.dataBase64.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                return { ...file, blobUrl: URL.createObjectURL(blob) };
              } catch {
                return file;
              }
            }
            return file;
          });

          // Sort descending by creation date
          files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(files);
        };

        request.onerror = (e: any) => {
          reject(e.target.error);
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Delete a file from the vault
   */
  async deleteFile(id: string): Promise<boolean> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = (e: any) => reject(e.target.error);
      });
    } catch {
      return false;
    }
  }

  /**
   * Toggle star status for a stored file
   */
  async toggleStar(id: string): Promise<StoredFile | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
          const file = getReq.result as StoredFile;
          if (!file) {
            resolve(null);
            return;
          }
          file.starred = !file.starred;
          const putReq = store.put(file);
          putReq.onsuccess = () => resolve(file);
          putReq.onerror = (e: any) => reject(e.target.error);
        };

        getReq.onerror = (e: any) => reject(e.target.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Clear all files in the vault
   */
  async clearAll(): Promise<boolean> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = (e: any) => reject(e.target.error);
      });
    } catch {
      return false;
    }
  }

  /**
   * Trigger immediate browser file download
   */
  downloadFile(file: StoredFile) {
    let url = file.blobUrl;
    if (!url && file.dataBase64) {
      url = file.dataBase64;
    }
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const storageVault = new StorageVaultService();
