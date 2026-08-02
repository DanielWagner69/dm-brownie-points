import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

/**
 * Better Auth catch-all. Wrapped so production 500s return a JSON body
 * (empty 500s made Google sign-in look like a dead button / blank failure).
 */
async function handle({ request }: { request: Request }): Promise<Response> {
  try {
    const response = await auth.handler(request);
    if (response.status < 500) return response;

    // Re-body empty 500s so the client can show a real message.
    const clone = response.clone();
    let text = "";
    try {
      text = await clone.text();
    } catch {
      text = "";
    }
    if (text && text.trim()) return response;

    return new Response(
      JSON.stringify({
        message:
          "Sign-in service hit a server error. Check database provisioning, then republish. (empty auth 500)",
        code: "AUTH_EMPTY_500",
        path: new URL(request.url).pathname,
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/auth] handler threw:", err);
    return new Response(
      JSON.stringify({
        message: message || "Auth handler crashed",
        code: "AUTH_HANDLER_THROW",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});
