import type {
  StoredAttachment,
} from "../models/StoredAttachment";

export default function openAttachmentPreview(
  attachment: Pick<
    StoredAttachment,
    "dataUrl" | "fileName" | "mimeType"
  >
): void {
  const previewWindow =
    window.open("", "_blank");

  if (!previewWindow) {
    return;
  }

  previewWindow.document.title =
    attachment.fileName;

  const style =
    previewWindow.document.createElement(
      "style"
    );

  style.textContent = `
    html,
    body {
      width: 100%;
      min-height: 100%;
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
    }

    header {
      padding: 12px 16px;
      background: #ffffff;
      border-bottom: 1px solid #dbeafe;
      font-size: 14px;
      font-weight: 600;
    }

    main {
      display: grid;
      min-height: calc(100vh - 49px);
      place-items: center;
      padding: 16px;
    }

    img,
    iframe {
      width: 100%;
      height: calc(100vh - 82px);
      border: 0;
      object-fit: contain;
      background: #ffffff;
    }
  `;

  previewWindow.document.head.appendChild(
    style
  );

  const header =
    previewWindow.document.createElement(
      "header"
    );

  header.textContent =
    attachment.fileName;

  const main =
    previewWindow.document.createElement(
      "main"
    );

  if (
    attachment.mimeType.startsWith(
      "image/"
    )
  ) {
    const image =
      previewWindow.document.createElement(
        "img"
      );

    image.src = attachment.dataUrl;
    image.alt = attachment.fileName;

    main.appendChild(image);
  } else {
    const frame =
      previewWindow.document.createElement(
        "iframe"
      );

    frame.src = attachment.dataUrl;
    frame.title = attachment.fileName;

    main.appendChild(frame);
  }

  previewWindow.document.body.append(
    header,
    main
  );
}
