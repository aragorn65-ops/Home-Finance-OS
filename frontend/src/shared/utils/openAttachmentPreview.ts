import type {
  StoredAttachment,
} from "../models/StoredAttachment";

export default function openAttachmentPreview(
  attachment: Pick<
    StoredAttachment,
    "dataUrl" | "fileName" | "mimeType"
  >
): void {
  if (!hasAttachmentPreviewData(attachment)) {
    return;
  }

  const previewWindow =
    window.open("", "_blank");

  if (!previewWindow) {
    return;
  }

  previewWindow.document.title =
    attachment.fileName;

  const theme = window.getComputedStyle(document.documentElement);
  const previewRoot = previewWindow.document.documentElement;
  for (const [name, fallback] of Object.entries({
    "--color-canvas": "#f8fafc",
    "--color-surface": "#ffffff",
    "--color-text": "#0f172a",
    "--color-border": "#cbd5e1",
  })) {
    previewRoot.style.setProperty(name, theme.getPropertyValue(name).trim() || fallback);
  }
  previewRoot.style.colorScheme = theme.colorScheme || "light";

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
      background: var(--color-canvas);
      color: var(--color-text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
    }

    header {
      padding: 12px 16px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      overflow-wrap: anywhere;
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

export function hasAttachmentPreviewData(
  attachment: Pick<
    StoredAttachment,
    "dataUrl"
  >
): boolean {
  return attachment.dataUrl.trim().length > 0;
}
