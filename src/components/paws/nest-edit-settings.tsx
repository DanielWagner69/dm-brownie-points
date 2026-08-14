import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/lib/paws/server";
import type { Dashboard } from "@/lib/paws/types";

type VersionInfo = {
  version: string;
  builtAt?: string;
  notes?: string;
};

type Props = {
  d: Dashboard;
  invalidate: () => void;
};

export function NestEditSettings({ d, invalidate }: Props) {
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [appVersion, setAppVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<VersionInfo>)
      .then((v) => {
        if (!cancelled) setAppVersion(v);
      })
      .catch(() => {
        /* ignore – version is best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit mode</CardTitle>
          <CardDescription>
            Both of you must switch this on. Then either of you can propose changes to past
            Brownie Points (points, notes). Your partner still has to agree before it sticks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-border px-3">
            <span className="text-sm font-medium">Enable Edit mode</span>
            <input
              type="checkbox"
              checked={Boolean(d.profile.edit_mode)}
              onChange={async (e) => {
                try {
                  await updateProfile({ data: { edit_mode: e.target.checked } });
                  toast.success(
                    e.target.checked
                      ? "Edit mode on for you — partner must enable too"
                      : "Edit mode off for you",
                  );
                  invalidate();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update");
                }
              }}
              className="h-5 w-5 accent-[var(--primary)]"
            />
          </label>
          <p className="text-xs leading-snug text-muted-foreground">
            You:{" "}
            <span className="font-medium text-foreground">
              {d.profile.edit_mode ? "on" : "off"}
            </span>
            {" · "}
            {d.couple?.partner_name || d.profile.partner_nickname || "Partner"}:{" "}
            <span className="font-medium text-foreground">
              {d.partner?.edit_mode ? "on" : "off"}
            </span>
            {d.editModeActive ? (
              <span className="mt-1 block text-positive">
                Edit mode is active — open History to propose edits on settled actions.
              </span>
            ) : (
              <span className="mt-1 block">
                Waiting for both of you to switch Edit mode on.
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">App update</CardTitle>
          <CardDescription>
            Installed PWAs sometimes stick on an old build. This checks version.json, updates
            the service worker, clears caches, and reloads.
            {appVersion ? (
              <span className="mt-1.5 block space-y-0.5">
                <span className="block font-mono text-[11px] text-foreground">
                  Running: {appVersion.version}
                </span>
                {appVersion.notes ? (
                  <span className="block text-[11px] text-muted-foreground">
                    {appVersion.notes}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                Checking version…
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            variant="secondary"
            disabled={refreshBusy}
            onClick={async () => {
              setRefreshBusy(true);
              try {
                const remote = await fetch(`/version.json?t=${Date.now()}`, {
                  cache: "no-store",
                }).then((r) => r.json() as Promise<VersionInfo>);
                const local = localStorage.getItem("pawmise-app-version");
                setAppVersion(remote);

                if ("serviceWorker" in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map((reg) => reg.update()));
                }
                if ("caches" in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map((k) => caches.delete(k)));
                }

                if (local && local === remote.version) {
                  toast.message(`You're on the latest version (${remote.version})`);
                  const ok = window.confirm(
                    `You're on ${remote.version}. Reload the app anyway to clear any stuck screens?`,
                  );
                  if (ok) {
                    localStorage.setItem("pawmise-app-version", remote.version);
                    window.location.href = `/?_fresh=${Date.now()}`;
                    return;
                  }
                } else {
                  toast.success(
                    local
                      ? `Update found (${remote.version}) — installing…`
                      : `Loading ${remote.version}…`,
                  );
                  localStorage.setItem("pawmise-app-version", remote.version);
                  window.location.href = `/?_fresh=${Date.now()}`;
                  return;
                }
              } catch {
                toast.message("Refreshing app…");
                window.location.href = `/?_fresh=${Date.now()}`;
                return;
              } finally {
                setRefreshBusy(false);
              }
            }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshBusy ? "animate-spin" : ""}`} />
            {refreshBusy ? "Checking…" : "Check for updates / Refresh"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
