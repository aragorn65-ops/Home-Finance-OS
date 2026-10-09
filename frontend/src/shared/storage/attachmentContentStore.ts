const referencePrefix = "hfos-attachment:v1:";

export interface AttachmentContentBackend {
  readAll(): Promise<Array<{ key: string; dataUrl: string }>>;
  write(key: string, dataUrl: string): Promise<void>;
  read(key: string): Promise<string | undefined>;
}

/** Only verified, committed content may replace inline bytes in local records. */
export class AttachmentContentStore {
  private content = new Map<string, string>();
  private references = new Map<string, string>();

  private backend: AttachmentContentBackend;

  constructor(backend: AttachmentContentBackend) { this.backend = backend; }

  async refresh(): Promise<void> {
    for (const { key, dataUrl } of await this.backend.readAll()) {
      this.content.set(key, dataUrl);
      this.references.set(dataUrl, referencePrefix + key);
    }
  }

  async stage(dataUrl: string): Promise<string> {
    if (!dataUrl.startsWith("data:") || this.references.has(dataUrl)) return dataUrl;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dataUrl));
    const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    await this.backend.write(key, dataUrl);
    if (await this.backend.read(key) !== dataUrl) {
      throw new Error("Receipt storage verification failed. The original records were not replaced.");
    }
    this.content.set(key, dataUrl);
    this.references.set(dataUrl, referencePrefix + key);
    return dataUrl;
  }

  async stageRecords(value: unknown): Promise<void> {
    const files = new Set<string>();
    transform(value, dataUrl => { files.add(dataUrl); return dataUrl; });
    for (const dataUrl of files) await this.stage(dataUrl);
  }

  encode<T>(value: T): T {
    return transform(value, dataUrl => {
      if (dataUrl.startsWith(referencePrefix) && !this.content.has(dataUrl.slice(referencePrefix.length))) {
        throw new Error("Receipt content is not loaded. Reload this tab; do not clear browser data.");
      }
      return this.references.get(dataUrl) ?? dataUrl;
    });
  }

  decode<T>(value: T): T {
    return transform(value, dataUrl => {
      if (!dataUrl.startsWith(referencePrefix)) return dataUrl;
      const content = this.content.get(dataUrl.slice(referencePrefix.length));
      if (content === undefined) {
        throw new Error("Receipt content is not loaded. Reload this tab; do not clear browser data.");
      }
      return content;
    });
  }

  async migrate(storage: Storage, keys: readonly string[]): Promise<void> {
    await this.refresh();
    for (const key of keys) {
      const original = storage.getItem(key);
      if (original === null) continue;
      let envelope: { schemaVersion?: number; data?: unknown };
      try { envelope = JSON.parse(original); } catch { continue; }
      if (!envelope || envelope.schemaVersion !== 1 || !("data" in envelope)) continue;
      const decoded = this.decode(envelope);
      await this.stageRecords(decoded);
      const encoded = this.encode(decoded);
      // Another tab may have changed the record while IndexedDB was committing.
      if (storage.getItem(key) !== original) continue;
      if (JSON.stringify(encoded) !== JSON.stringify(envelope)) {
        storage.setItem(key, JSON.stringify(encoded));
      }
    }
  }
}

function transform<T>(value: T, convert: (dataUrl: string) => string): T {
  if (Array.isArray(value)) return value.map(item => transform(item, convert)) as T;
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  const record = value as Record<string, unknown>;
  const attachment = typeof record.fileName === "string" && typeof record.mimeType === "string";
  return Object.fromEntries(Object.entries(record).map(([key, child]) => [key,
    attachment && key === "dataUrl" && typeof child === "string"
      ? convert(child) : transform(child, convert),
  ])) as T;
}

function createIndexedDbBackend(): AttachmentContentBackend {
  let connection: Promise<IDBDatabase> | undefined;
  function open(): Promise<IDBDatabase> {
    if (!connection) {
      connection = new Promise((resolve, reject) => {
        const request = indexedDB.open("hfos-attachment-content", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("content");
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); connection = undefined; };
          resolve(db);
        };
        request.onerror = () => { connection = undefined; reject(request.error); };
        request.onblocked = () => { connection = undefined; reject(new Error("Close other HFOS tabs and retry receipt storage.")); };
      });
    }
    return connection;
  }
  return {
    async readAll() {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("content", "readonly");
        const result: Array<{ key: string; dataUrl: string }> = [];
        const cursor = tx.objectStore("content").openCursor();
        cursor.onsuccess = () => {
          if (cursor.result) {
            result.push({ key: String(cursor.result.key), dataUrl: cursor.result.value as string });
            cursor.result.continue();
          }
        };
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(tx.error ?? new Error("Receipt storage could not be read."));
      });
    },
    async write(key, dataUrl) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("content", "readwrite", { durability: "strict" });
        tx.objectStore("content").put(dataUrl, key);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error ?? new Error("Receipt storage failed. No record was saved."));
      });
    },
    async read(key) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("content", "readonly");
        const request = tx.objectStore("content").get(key);
        tx.oncomplete = () => resolve(request.result as string | undefined);
        tx.onabort = () => reject(tx.error ?? new Error("Receipt verification failed."));
      });
    },
  };
}

export const attachmentContentStore = new AttachmentContentStore(createIndexedDbBackend());

export async function stageAttachmentDataUrl(dataUrl: string): Promise<string> {
  return attachmentContentStore.stage(dataUrl);
}

export async function stageAttachmentRecords(value: unknown): Promise<void> {
  // Non-browser consumers retain the portable inline format.
  if (typeof indexedDB !== "undefined") await attachmentContentStore.stageRecords(value);
}
