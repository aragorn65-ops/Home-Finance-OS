export type StoredAttachmentCategory =
  | "receipt"
  | "bill"
  | "other";

export interface StoredAttachment {
  id: string;

  category:
    StoredAttachmentCategory;

  fileName: string;
  mimeType: string;
  sizeBytes: number;

  /**
   * Base64 data URL persisted in localStorage.
   *
   * Example:
   * data:image/jpeg;base64,...
   */
  dataUrl: string;

  createdAt: Date;
}