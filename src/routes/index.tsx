import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/paws/server";
import { FullPageLoading } from "@/components/paws/loading";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { user, isPending } = useCurrentUserState();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: Boolean(user),
    retry: 1,
  });

  // Session hung → stop looking blank; send to login.
  if (isPending && timedOut) return <RedirectToSignIn />;
  if (isPending) return <FullPageLoading message="Checking your soft session…" />;

  if (!user) return <RedirectToSignIn />;

  if (me.isError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-lg font-semibold text-foreground">Couldn’t load your nest</h1>
          <p className="text-sm text-muted-foreground">
            {me.error instanceof Error ? me.error.message : "Please try again."}
          </p>
          <a
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Back to sign-in
          </a>
        </div>
      </main>
    );
  }

  if (me.isLoading || !me.data) {
    return <FullPageLoading message="Loading your shared little notebook…" />;
  }

  const step = me.data.profile.onboarding_step;
  const paired = Boolean(me.data.couple?.user_b);

  if (step !== "done" || !paired) {
    return <Navigate to="/onboarding" />;
  }

  return <Navigate to="/app" />;
}
