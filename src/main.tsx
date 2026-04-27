import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister any service worker + clear caches when running inside the
// Lovable editor preview (iframe) or preview hosts. The PWA should only be
// active on the published site — otherwise old layouts get served from cache.
(() => {
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") && host.includes("--");

  if (isInIframe || isPreviewHost) {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
    }
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => caches.delete(k));
      }).catch(() => {});
    }
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
