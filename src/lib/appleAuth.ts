import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { trackLoginAfterSignIn } from "@/lib/trackLogin";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/** iOS bundle id → must match Xcode and Supabase Apple “Client IDs”. */
const IOS_BUNDLE_ID =
  (import.meta.env.VITE_IOS_BUNDLE_ID as string) || "com.datebetter.ai";

export function shouldUseNativeAppleSignIn(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

function randomNonce(): string {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256HexUtf8(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

/**
 * Native iOS: Apple ID token → Supabase session.
 * Pass SHA-256(hex) nonce to Apple; pass the same raw nonce to Supabase (GoTrue re-hashes to verify the JWT).
 */
export async function signInWithAppleNative(): Promise<{ error: Error | null }> {
  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
  const rawNonce = randomNonce();
  const hashedNonce = await sha256HexUtf8(rawNonce);

  const res = await SignInWithApple.authorize({
    clientId: IOS_BUNDLE_ID,
    redirectURI: `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/callback`,
    scopes: "email name",
    nonce: hashedNonce,
  });

  const identityToken = res.response?.identityToken;
  if (!identityToken) {
    return { error: new Error("Apple did not return an identity token") };
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
    nonce: rawNonce,
  });
  console.log("data", data);
  console.log("error", error);

  if (error) {
    return { error: new Error(error.message) };
  }
  if (!data.session) {
    return { error: new Error("No Supabase session after Apple sign-in") };
  }

  await trackLoginAfterSignIn();
  return { error: null };
}
