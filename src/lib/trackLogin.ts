import { supabase } from "@/integrations/supabase/client";

/**
 * Mirrors password `signIn`: records login server-side. Fire-and-forget; failures are logged only.
 */
export async function trackLoginAfterSignIn(): Promise<void> {
  try {
    await supabase.functions.invoke("track-login");
  } catch (e) {
    console.error("Failed to track login:", e);
  }
}
