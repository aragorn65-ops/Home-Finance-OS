export function subscribeToCoreSnapshotRefreshFallback(
  refresh: () => void,
  isBusy: () => boolean,
  browser: Pick<Window, "addEventListener" | "removeEventListener" | "setInterval" | "clearInterval"> = window,
  page: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener"> = document
): () => void {
  const check = () => {
    if (page.visibilityState === "visible" && !isBusy()) refresh();
  };
  const timer = browser.setInterval(check, 30000);
  browser.addEventListener("focus", check);
  browser.addEventListener("online", check);
  page.addEventListener("visibilitychange", check);
  return () => {
    browser.clearInterval(timer);
    browser.removeEventListener("focus", check);
    browser.removeEventListener("online", check);
    page.removeEventListener("visibilitychange", check);
  };
}
