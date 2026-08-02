import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { CreatedWithGrokBanner } from "@/components/created-with-grok-banner";
import { PwaRegister } from "@/components/paws/pwa-register";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "Pawmise — soft little paw-points for two",
      },
      {
        name: "description",
        content:
          "A private, playful notebook for couples to notice each other’s effort — brownie points with bulochka energy.",
      },
      { name: "theme-color", content: "#b56b4a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icons/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: true },
        },
      }),
  );

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CreatedWithGrokBanner />
          <PwaRegister />
          <Outlet />
          <Toaster
            position="top-center"
            toastOptions={{
              className: "rounded-2xl border border-border bg-card text-foreground",
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg text-foreground antialiased">
        {/* Visible before/while React hydrates — never a pure blank page */}
        <div id="pawmise-boot" className="sr-only">
          Pawmise is loading…
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
