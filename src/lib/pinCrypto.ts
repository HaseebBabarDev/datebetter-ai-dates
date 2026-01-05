export const PIN_SESSION_STORAGE_KEY = "datebetter_pin_session";

export type PinSessionPayload = {
  accessToken: string;
  refreshToken: string;
};

type EncryptedBlobV1 = {
  v: 1;
  s: string; // salt (base64)
  iv: string; // iv (base64)
  ct: string; // ciphertext (base64)
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const fromBase64 = (b64: string): Uint8Array => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
};

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 150_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptSessionWithPin(pin: string, payload: PinSessionPayload): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const plaintext = encoder.encode(JSON.stringify(payload));
  const ctBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const blob: EncryptedBlobV1 = {
    v: 1,
    s: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ctBuffer)),
  };

  return JSON.stringify(blob);
}

export async function decryptSessionWithPin(pin: string, encrypted: string): Promise<PinSessionPayload> {
  const blob = JSON.parse(encrypted) as EncryptedBlobV1;
  if (!blob || blob.v !== 1) throw new Error("Unsupported encrypted payload");

  const salt = fromBase64(blob.s);
  const iv = fromBase64(blob.iv);
  const ct = fromBase64(blob.ct);

  const key = await deriveKey(pin, salt);
  const ptBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(ct));
  const text = decoder.decode(ptBuffer);

  const payload = JSON.parse(text) as PinSessionPayload;
  if (!payload?.accessToken || !payload?.refreshToken) throw new Error("Invalid payload");
  return payload;
}
