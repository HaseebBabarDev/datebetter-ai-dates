import { supabase } from "@/integrations/supabase/client";

export type PushTokenPlatform = "ios" | "android" | "web";

export async function upsertPushToken(
  userId: string,
  fcmToken: string,
  platform: PushTokenPlatform = "ios",
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      fcm_token: fcmToken,
      platform,
    },
    { onConflict: "fcm_token" },
  );
  return { error: error ? new Error(error.message) : null };
}

export async function deletePushTokensForUser(userId: string): Promise<void> {
  await supabase.from("push_tokens").delete().eq("user_id", userId);
}
