import { useEffect } from "react";

/**
 * Registers a minimal service worker (installability only — no shell cache).
 * Also recovers once from stale hashed chunks after a redeploy.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Vite / dynamic import failures after publish → one hard reload.
    const onPreloadError = (event: Event) => {
      event.preventDefault();
      const key = "pawmise-chunk-reload";
      try {
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
      window.location.reload();
    };
    window.addEventListener("vite:preloadError", onPreloadError);

    const onUnhandled = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message ?? event.reason ?? "");
      if (!/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
        return;
      }
      const key = "pawmise-chunk-reload";
      try {
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
      window.location.reload();
    };
    window.addEventListener("unhandledrejection", onUnhandled);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Pull the latest SW immediately after publish.
          void reg.update();
        })
        .catch(() => {
          /* ignore */
        });
    }

    return () => {
      window.removeEventListener("vite:preloadError", onPreloadError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  return null;
}
