/**
 * SCHEMELY AI — OFFLINE DRAFT & LOCAL RECOVERY STORE (IndexedDB)
 *
 * Persists diagram drafts safely without hitting localStorage 5MB quotas.
 * Automatically recovers work after browser crashes, offline edits, or 409 conflicts.
 */

const DB_NAME = 'schemely_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'diagram_drafts';

export interface OfflineDraft {
  diagramId: string;
  updatedAt: string;
  version?: number;
  syntax: string;
  nodes: any[];
  edges: any[];
  title?: string;
  metadata?: Record<string, any>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'diagramId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineDraft(draft: OfflineDraft): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({
        ...draft,
        updatedAt: new Date().toISOString(),
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Fallback save to localStorage:', err);
    try {
      localStorage.setItem(`schemely_draft_${draft.diagramId}`, JSON.stringify(draft));
    } catch (e) {
      console.error('[OfflineStorage] LocalStorage quota exceeded:', e);
    }
  }
}

export async function getOfflineDraft(diagramId: string): Promise<OfflineDraft | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(diagramId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem(`schemely_draft_${diagramId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export async function clearOfflineDraft(diagramId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(diagramId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.removeItem(`schemely_draft_${diagramId}`);
  }
}

export async function getAllOfflineDrafts(): Promise<OfflineDraft[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
