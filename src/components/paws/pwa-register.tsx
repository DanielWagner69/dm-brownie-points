import { useEffect } from "react";

/**
 * Registers a minimal service worker (installability only — no shell cache).
 * Also recovers once from stale hashed chunks after a redeploy.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Drop cache-bust query after a hard recover so URLs stay clean.
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.has("_fresh")) {
        u.searchParams.delete("_fresh");
        window.history.replaceState({}, "", u.pathname + u.search + u.hash);
        try {
          sessionStorage.removeItem("pawmise-chunk-reload");
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }

    const hardReloadHome = () => {
      const key = "pawmise-chunk-reload";
      try {
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
      const url = new URL("/", window.location.origin);
      url.searchParams.set("_fresh", String(Date.now()));
      window.location.replace(url.toString());
    };

    // Vite / dynamic import failures after publish → one hard reload to home.
    const onPreloadError = (event: Event) => {
      event.preventDefault();
      hardReloadHome();
    };
    window.addEventListener("vite:preloadError", onPreloadError);

    const onUnhandled = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message ?? event.reason ?? "");
      if (
        !/Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(
          msg,
        )
      ) {
        return;
      }
      hardReloadHome();
    };
    window.addEventListener("unhandledrejection", onUnhandled);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
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
