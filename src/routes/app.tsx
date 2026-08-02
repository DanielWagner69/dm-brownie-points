import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useDashboard } from "@/lib/paws/hooks";
import type { ThemeId } from "@/lib/paws/types";
import { FullPageLoading } from "@/components/paws/loading";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, isPending } = useCurrentUserState();
  const dash = useDashboard(Boolean(user));

  useEffect(() => {
    const theme = (dash.data?.profile.theme ?? "warm") as ThemeId;
    document.documentElement.setAttribute("data-theme", theme);
  }, [dash.data?.profile.theme]);

  if (isPending || dash.isLoading) {
    return <FullPageLoading message="Warming up your shared nest…" />;
  }

  if (!user) return <RedirectToSignIn />;

  if (dash.isError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-lg font-semibold">Couldn’t open the nest</h1>
          <p className="text-sm text-muted-foreground">
            {dash.error instanceof Error ? dash.error.message : "Try reloading."}
          </p>
          <button
            type="button"
            className="min-h-[44px] rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </main>
    );
  }

  if (!dash.data?.couple?.is_complete) {
    return <Navigate to="/onboarding" />;
  }

  return <Outlet />;
}
