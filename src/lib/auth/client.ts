import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { GROK_PROVIDERS } from "./providers";

/**
 * Better Auth client for this React SPA (browser-side).
 */
export const authClient = createAuthClient({
  plugins: [genericOAuthClient()],
  fetchOptions: {
    onRequest(ctx) {
      const token = getBearerToken();
      if (token) ctx.headers.set("Authorization", `Bearer ${token}`);
      return ctx;
    },
  },
});

export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

export { GROK_PROVIDERS };

const BEARER_KEY = "grok-auth.bearer-token";

export function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(BEARER_KEY);
  } catch {
    return null;
  }
}

function setBearerToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(BEARER_KEY, token);
    else window.sessionStorage.removeItem(BEARER_KEY);
  } catch {
    /* storage unavailable */
  }
}

function inLivePreview(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".grok-sandbox.com")
  );
}

type PopupMessage = { source: "grok-auth-popup"; token: string | null; error?: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("Sign-in timed out — try again")), ms);
    promise.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

function formatAuthError(error: unknown): string {
  if (!error) return "Sign-in failed";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "Sign-in failed";
  if (typeof error === "object") {
    const o = error as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.statusText === "string" && o.statusText) return o.statusText;
  }
  return "Sign-in failed";
}

/**
 * Start sign-in with Google or X via the Grok auth broker.
 */
export async function signIn(
  providerId: string,
  opts: { callbackURL?: string; errorCallbackURL?: string } = {},
): Promise<void> {
  const callbackURL = opts.callbackURL ?? "/";
  const errorCallbackURL = opts.errorCallbackURL ?? "/login";

  const popup = inLivePreview() ? openSignInPopup(providerId) : null;

  // Best-effort clear. Skip network sign-out on deploy if it is slow — never
  // block the OAuth start path for more than a moment.
  const hadBearer = Boolean(getBearerToken());
  if (hadBearer || !inLivePreview()) {
    try {
      await withTimeout(authClient.signOut().then(() => undefined), 2500);
    } catch {
      /* continue */
    }
  }
  setBearerToken(null);

  if (inLivePreview()) {
    if (!popup) throw new Error("Pop-up blocked — allow pop-ups for sign-in");
    const token = await waitForPopupToken(popup);
    if (!token) throw new Error("Sign-in was cancelled or failed");
    setBearerToken(token);
    try {
      await authClient.getSession();
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      const dest = new URL(callbackURL, window.location.origin);
      const here = window.location;
      if (
        dest.origin !== here.origin ||
        dest.pathname !== here.pathname ||
        dest.search !== here.search
      ) {
        window.location.href = callbackURL;
      }
    }
    return;
  }

  // Deployed: call oauth2 and navigate. Prefer automatic redirect path first
  // (Better Auth redirect plugin), fall back to manual URL.
  let result: {
    data?: { url?: string; redirect?: boolean } | null;
    error?: unknown;
  };

  try {
    result = await withTimeout(
      authClient.signIn.oauth2({
        providerId,
        callbackURL,
        errorCallbackURL,
      }),
      20000,
    );
  } catch (e) {
    throw new Error(formatAuthError(e));
  }

  if (result.error) {
    throw new Error(formatAuthError(result.error));
  }

  const url = result.data?.url;
  if (url) {
    // Redirect plugin may already have navigated; assign again is safe.
    window.location.assign(url);
    return;
  }

  // If the redirect plugin already navigated, data.url may be gone — give it a beat.
  await new Promise((r) => setTimeout(r, 300));
  if (document.visibilityState === "hidden") return;

  throw new Error(
    "Could not start Google/X sign-in (no redirect URL). Open /api/health on this site — if the database is down, republish after the platform finishes provisioning.",
  );
}

function openSignInPopup(providerId: string): Window | null {
  const origin = window.location.origin;
  const url = `${origin}/auth/popup?providerId=${encodeURIComponent(providerId)}`;
  const name = `grok-signin-${Date.now()}`;
  return window.open(url, name, "popup,width=500,height=650");
}

function waitForPopupToken(popup: Window): Promise<string | null> {
  return new Promise((resolve) => {
    const origin = window.location.origin;
    let settled = false;
    let closeTimer: number | undefined;
    const settle = (token: string | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(token);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const data = event.data as PopupMessage | undefined;
      if (!data || data.source !== "grok-auth-popup") return;
      settle(data.token ?? null);
    };
    const pollTimer = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(pollTimer);
      closeTimer = window.setTimeout(() => settle(null), 400);
    }, 300);
    function cleanup() {
      window.clearInterval(pollTimer);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
      window.removeEventListener("message", onMessage);
    }
    window.addEventListener("message", onMessage);
  });
}

export async function signOut(redirectTo = "/"): Promise<void> {
  try {
    await authClient.signOut();
  } finally {
    setBearerToken(null);
  }
  window.location.href = redirectTo;
}
