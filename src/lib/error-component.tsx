import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|MIME type|text\/html/i.test(
    msg,
  );
}

async function hardRecover() {
  try {
    sessionStorage.removeItem("pawmise-chunk-reload");
  } catch {
    /* ignore */
  }
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* ignore */
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  // Hard navigate home with cache-bust so we don't re-open a dead chunk route
  const url = new URL("/", window.location.origin);
  url.searchParams.set("_fresh", String(Date.now()));
  window.location.replace(url.toString());
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const chunkFail = isChunkLoadError(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-foreground">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">
        {chunkFail ? "A fresh version is ready" : "Something went wrong"}
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground break-words">
        {chunkFail
          ? "The app was updated. Tap Reload to open the latest version — this is normal after a redeploy."
          : error.message || "An unexpected error occurred. Try reloading the page."}
      </p>
      <button
        type="button"
        className="min-h-[44px] rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        onClick={() => {
          void hardRecover();
        }}
      >
        Reload
      </button>
      {chunkFail ? (
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => {
            void hardRecover();
          }}
        >
          Still stuck? Tap here to force a clean start
        </button>
      ) : null}
    </main>
  );
}
