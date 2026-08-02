import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, PawPrint, TriangleAlert } from "lucide-react";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FullPageLoading } from "@/components/paws/loading";
import { getDeployStatus } from "@/lib/paws/deploy-status";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const [busy, setBusy] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const deploy = useQuery({
    queryKey: ["deploy-status"],
    queryFn: () => getDeployStatus(),
    staleTime: 30_000,
  });

  if (isPending) {
    return <FullPageLoading message="Checking if you’re already signed in…" />;
  }

  if (user) return <Navigate to="/" />;

  async function handleSignIn(providerId: string, label: string) {
    if (deploy.data?.needsDatabase) {
      const msg = deploy.data.message ?? "Database is not configured on this publish.";
      setLastError(msg);
      toast.error("Can’t sign in until a database is attached");
      return;
    }
    setBusy(providerId);
    setLastError(null);
    try {
      await signIn(providerId, { callbackURL: "/", errorCallbackURL: "/login" });
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : `Could not start ${label} sign-in. Please try again.`;
      setLastError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="paw-bg grid min-h-dvh place-items-center p-5">
      <Card className="w-full max-w-sm border-border/80 shadow-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 grid h-14 w-14 place-items-center rounded-3xl bg-primary/15 text-primary">
            <PawPrint className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl tracking-tight">Welcome to Pawmise</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            A private little world of brownie points for two. Soft accountability, zero therapy vibes
            — just noticing each other’s effort.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {deploy.data?.needsDatabase ? (
            <div
              role="alert"
              className="rounded-2xl border border-danger/35 bg-danger/10 px-3 py-3 text-left text-xs leading-relaxed text-danger"
            >
              <div className="mb-1 flex items-center gap-1.5 font-semibold">
                <TriangleAlert className="h-3.5 w-3.5" />
                Database missing on this publish
              </div>
              <p className="text-danger/90">{deploy.data.message}</p>
              <p className="mt-2 text-[11px] text-danger/80">
                Check{" "}
                <a className="underline underline-offset-2" href="/api/health">
                  /api/health
                </a>
                . You want <code className="rounded bg-danger/10 px-1">hasDatabaseUrl: true</code>.
              </p>
            </div>
          ) : null}

          {authEnabled ? (
            GROK_PROVIDERS.map((p, i) => (
              <Button
                key={p.providerId}
                type="button"
                variant={i === 0 ? "default" : "outline"}
                className="w-full"
                disabled={busy !== null || deploy.data?.needsDatabase === true}
                onClick={() => void handleSignIn(p.providerId, p.label)}
              >
                {busy === p.providerId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>Continue with {p.label}</>
                )}
              </Button>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground">Sign-in is disabled.</p>
          )}
          {lastError && !deploy.data?.needsDatabase ? (
            <p
              role="alert"
              className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-left text-xs leading-relaxed text-danger"
            >
              {lastError}
            </p>
          ) : null}
          <p className="pt-1 text-center text-xs leading-relaxed text-muted-foreground">
            Only you and your person will ever see your shared notebook. One couple. Private paws.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
