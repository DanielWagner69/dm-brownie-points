import { createServerFn } from "@tanstack/react-start";
import { isServerlessRuntime } from "@/lib/db";

export type DeployStatus = {
  hasDatabaseUrl: boolean;
  hasBetterAuthUrl: boolean;
  hasGrokClient: boolean;
  serverless: boolean;
  needsDatabase: boolean;
  /** Google/X will fail with invalid_redirect / state_mismatch without broker client. */
  oauthLikelyBroken: boolean;
  message: string | null;
  oauthHint: string | null;
};

/** Client-safe deploy health for the login screen. */
export const getDeployStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<DeployStatus> => {
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
    const hasBetterAuthUrl = Boolean(process.env.BETTER_AUTH_URL?.trim());
    const hasGrokClient = Boolean(process.env.GROK_AUTH_CLIENT_ID?.trim());
    const serverless = isServerlessRuntime();
    const needsDatabase = serverless && !hasDatabaseUrl;
    const oauthLikelyBroken = serverless && !hasGrokClient;

    return {
      hasDatabaseUrl,
      hasBetterAuthUrl,
      hasGrokClient,
      serverless,
      needsDatabase,
      oauthLikelyBroken,
      message: needsDatabase
        ? "Published app is missing a database (DATABASE_URL). Set it on Vercel and redeploy."
        : null,
      oauthHint: oauthLikelyBroken
        ? "Google / X sign-in is not configured for this host (Invalid redirect URI). Use email + password below — that is the permanent path on Vercel + Neon."
        : !hasBetterAuthUrl && serverless
          ? "Set BETTER_AUTH_URL to your exact site URL (https://….vercel.app, no trailing slash) and redeploy."
          : null,
    };
  },
);
