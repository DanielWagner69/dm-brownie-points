import { createServerFn } from "@tanstack/react-start";
import { isServerlessRuntime } from "@/lib/db";

export type DeployStatus = {
  hasDatabaseUrl: boolean;
  serverless: boolean;
  /** True when publish is missing durable Postgres (login will not stick). */
  needsDatabase: boolean;
  message: string | null;
};

/** Client-safe deploy health for the login screen. */
export const getDeployStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<DeployStatus> => {
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
    const serverless = isServerlessRuntime();
    const needsDatabase = serverless && !hasDatabaseUrl;
    return {
      hasDatabaseUrl,
      serverless,
      needsDatabase,
      message: needsDatabase
        ? "Published app is missing a database (DATABASE_URL). Google can sign you in at the broker, but this app cannot save your session or couple data — so you land back on login. Fix: attach Neon / set DATABASE_URL on publish, then republish. You do not need a separate server."
        : null,
    };
  },
);
