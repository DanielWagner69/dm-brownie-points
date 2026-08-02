import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, PawPrint, TriangleAlert } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FullPageLoading } from "@/components/paws/loading";
import { getDeployStatus } from "@/lib/paws/deploy-status";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const deploy = useQuery({
    queryKey: ["deploy-status"],
    queryFn: () => getDeployStatus(),
    staleTime: 30_000,
  });

  if (isPending) {
    return <FullPageLoading message="Checking if you’re already signed in…" />;
  }

  if (user) return <Navigate to="/" />;

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (deploy.data?.needsDatabase) {
      const msg = deploy.data.message ?? "Database is not configured.";
      setLastError(msg);
      toast.error("Can’t sign in until a database is attached");
      return;
    }
    setBusy(true);
    setLastError(null);
    try {
      if (mode === "signup") {
        const { error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0] || "Partner",
          callbackURL: "/",
        });
        if (error) throw new Error(error.message ?? "Sign-up failed");
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (error) throw new Error(error.message ?? "Sign-in failed");
      }
      window.location.href = "/";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Email sign-in failed";
      setLastError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const blocked = deploy.data?.needsDatabase === true;

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
            </div>
          ) : null}

          <form onSubmit={(ev) => void handleEmail(ev)} className="flex flex-col gap-2">
            {mode === "signup" ? (
              <Input
                name="name"
                placeholder="Your name (e.g. Little Prince)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={blocked || busy}
              />
            ) : null}
            <Input
              name="email"
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={blocked || busy}
            />
            <Input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              disabled={blocked || busy}
            />
            <Button type="submit" className="w-full" disabled={blocked || busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "signup" ? "Creating nest…" : "Signing in…"}
                </>
              ) : mode === "signup" ? (
                "Create account"
              ) : (
                "Sign in with email"
              )}
            </Button>
            <button
              type="button"
              className="text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </form>

          {lastError ? (
            <p
              role="alert"
              className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-left text-xs leading-relaxed text-danger"
            >
              {lastError}
            </p>
          ) : null}
          <p className="pt-1 text-center text-xs leading-relaxed text-muted-foreground">
            Only you and your person will ever see your shared notebook. One couple. Private paws.
            Each of you creates your own account, then pairs with a paw-code.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
