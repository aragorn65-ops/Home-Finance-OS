import type {
  StoredAttachment,
} from "../models/StoredAttachment";

export default function createAttachmentMetadataRecords(
  attachments: StoredAttachment[]
): StoredAttachment[] {
  return attachments.map(
    (attachment) => ({
      ...attachment,
      dataUrl: "",
      createdAt:
        new Date(
          attachment.createdAt
        ),
    })
  );
}
