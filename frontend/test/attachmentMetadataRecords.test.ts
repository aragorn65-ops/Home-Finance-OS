import assert from "node:assert/strict";
import test from "node:test";

import createAttachmentMetadataRecords from "../src/shared/utils/createAttachmentMetadataRecords.ts";

test(
  "attachment metadata records remove stored file bodies",
  () => {
    const records =
      createAttachmentMetadataRecords([
        {
          id: "attachment-1",
          category: "bill",
          fileName:
            "provider-bill.jpg",
          mimeType:
            "image/jpeg",
          sizeBytes: 512000,
          dataUrl:
            "data:image/jpeg;base64,large-provider-bill-body",
          createdAt:
            new Date(
              "2026-07-30T09:00:00Z"
            ),
        },
      ]);

    assert.equal(
      records[0]?.fileName,
      "provider-bill.jpg"
    );
    assert.equal(
      records[0]?.dataUrl,
      ""
    );
    assert.notEqual(
      records[0]?.createdAt,
      "2026-07-30T09:00:00.000Z"
    );
    assert.equal(
      records[0]?.createdAt.toISOString(),
      "2026-07-30T09:00:00.000Z"
    );
  }
);
