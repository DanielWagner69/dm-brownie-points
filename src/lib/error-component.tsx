import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(
    msg,
  );
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
          ? "The published app was updated. Reload once to load the new files — this is normal after a redeploy."
          : error.message || "An unexpected error occurred. Try reloading the page."}
      </p>
      <button
        type="button"
        className="min-h-[44px] rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        onClick={() => {
          try {
            sessionStorage.removeItem("pawmise-chunk-reload");
          } catch {
            /* ignore */
          }
          window.location.reload();
        }}
      >
        Reload
      </button>
    </main>
  );
}
