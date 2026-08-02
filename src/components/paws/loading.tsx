import { PawPrint } from "lucide-react";

/** High-contrast full-screen loading — never a blank cream page. */
export function FullPageLoading({ message = "Opening your little world…" }: { message?: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-foreground">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-3xl bg-primary/15 text-primary">
          <PawPrint className="h-7 w-7 animate-pulse" />
        </div>
        <p className="text-base font-medium text-foreground">{message}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          If this hangs more than a few seconds, reload the page.
        </p>
      </div>
    </main>
  );
}
