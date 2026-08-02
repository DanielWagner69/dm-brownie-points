import { Link, useRouterState } from "@tanstack/react-router";
import { Gift, History, Home, PawPrint, PlusCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useDashboard } from "@/lib/paws/hooks";
import { tone } from "@/lib/paws/tone";

const tabs: {
  to: "/app" | "/app/log" | "/app/history" | "/app/rewards" | "/app/settings";
  label: string;
  icon: typeof Home;
  exact?: boolean;
}[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/log", label: "Log BP", icon: PlusCircle },
  { to: "/app/history", label: "Story", icon: History },
  { to: "/app/rewards", label: "Treats", icon: Gift },
  { to: "/app/settings", label: "Nest", icon: Settings },
];

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const dash = useDashboard(true);
  const theme = dash.data?.profile.theme;
  const t = (s: string) => tone(s, theme);

  return (
    <div className="paw-bg mx-auto flex h-dvh max-h-dvh w-full max-w-lg flex-col overflow-hidden">
      <header className="z-20 shrink-0 border-b border-border/60 bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <PawPrint className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("Pawmise")}
            </p>
            {title ? (
              <h1 className="text-lg font-semibold leading-snug tracking-tight [overflow-wrap:normal] [word-break:normal]">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground [overflow-wrap:normal] [word-break:normal]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-4">
        {children}
      </main>

      <nav className="safe-pb z-30 shrink-0 border-t border-border/60 bg-bg/98 px-1.5 pt-2 backdrop-blur-md">
        <ul className="grid grid-cols-5 gap-0.5">
          {tabs.map((tab) => {
            const active = tab.exact
              ? pathname === tab.to
              : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
            const Icon = tab.icon;
            return (
              <li key={tab.to} className="min-w-0">
                <Link
                  to={tab.to}
                  className={cn(
                    "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 text-center text-[11px] font-medium leading-none transition-colors",
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="max-w-full whitespace-nowrap px-0.5">{t(tab.label)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
