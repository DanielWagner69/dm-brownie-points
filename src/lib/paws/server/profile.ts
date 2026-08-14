import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { Profile, ThemeId } from "../types";
import { getProfile, ensureProfile, getActiveCouple } from "./helpers";

type Ctx = { userId: string };

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context as Ctx;
    const sql = await getSql();
    const users = await sql<{ name: string; image: string | null }>`
      select name, image from "user" where id = ${userId}`;
    const profile = await ensureProfile(userId, users[0]?.name ?? "Little one");
    if (!profile.avatar_url && users[0]?.image) {
      await sql`update profiles set avatar_url = ${users[0].image} where user_id = ${userId}`;
      profile.avatar_url = users[0].image;
    }
    const coupleRow = await getActiveCouple(userId);
    return { profile, couple: coupleRow, authName: users[0]?.name ?? null };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      display_name?: string;
      bio?: string;
      avatar_url?: string | null;
      theme?: ThemeId;
      partner_nickname?: string;
      notification_prefs?: Profile["notification_prefs"];
      onboarding_step?: string;
      edit_mode?: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { userId } = context as Ctx;
    await ensureProfile(userId, data.display_name ?? "Little one");
    const sql = await getSql();
    const cur = await getProfile(userId);
    if (!cur) throw new Error("Profile missing");
    const display_name = data.display_name?.trim() || cur.display_name;
    const bio = data.bio ?? cur.bio;
    const avatar_url = data.avatar_url !== undefined ? data.avatar_url : cur.avatar_url;
    const theme = data.theme ?? cur.theme;
    const partner_nickname = data.partner_nickname ?? cur.partner_nickname;
    const prefs = data.notification_prefs ?? cur.notification_prefs;
    const step = data.onboarding_step ?? cur.onboarding_step;
    const edit_mode = data.edit_mode !== undefined ? Boolean(data.edit_mode) : cur.edit_mode;
    await sql`
      update profiles set
        display_name = ${display_name},
        bio = ${bio},
        avatar_url = ${avatar_url},
        theme = ${theme},
        partner_nickname = ${partner_nickname},
        notification_prefs = ${JSON.stringify(prefs)}::jsonb,
        onboarding_step = ${step},
        edit_mode = ${edit_mode},
        updated_at = now()
      where user_id = ${userId}`;
    return getProfile(userId);
  });
