import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

type Ctx = { userId: string };

export const getPushPublicKey = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    try {
      const { getVapidKeys } = await import("../push.server");
      const keys = await getVapidKeys();
      return { publicKey: keys.publicKey };
    } catch {
      return { publicKey: "" };
    }
  });

export const getPushStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    try {
      const { hasSubscription } = await import("../push.server");
      return { enabled: await hasSubscription(userId) };
    } catch {
      return { enabled: false };
    }
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { endpoint: string; p256dh: string; auth: string }) => d)
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const { saveSubscription } = await import("../push.server");
    await saveSubscription({
      userId,
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
    });
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { endpoint?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    const { removeSubscription } = await import("../push.server");
    await removeSubscription(userId, data.endpoint);
    return { ok: true };
  });
