import { Link, useRouterState } from "@tanstack/react-router";
import { Gift, History, Home, PawPrint, PlusCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tabs: {
  to: "/app" | "/app/log" | "/app/history" | "/app/rewards" | "/app/settings";
  label: string;
  icon: typeof Home;
  exact?: boolean;
}[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/log", label: "Log", icon: PlusCircle },
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

  return (
    <div className="paw-bg mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-primary">
            <PawPrint className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Pawmise
            </p>
            {title ? (
              <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            ) : null}
            {subtitle ? (
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden px-4 py-4">{children}</main>

      <nav className="safe-pb sticky bottom-0 z-20 border-t border-border/60 bg-bg/95 px-2 pt-2 backdrop-blur-md">
        <ul className="grid grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const active = tab.exact
              ? pathname === tab.to
              : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
            const Icon = tab.icon;
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={cn(
                    "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
