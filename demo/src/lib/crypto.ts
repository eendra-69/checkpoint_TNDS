/**
 * Envelope encryption for secrets held in the session blob.
 *
 * `session.settings.providerKeys` stores whatever API key the admin typed in
 * /admin, and that blob goes to Redis verbatim. `SETTINGS_SECRET` has been
 * provisioned in `.env.example` and `docs/DEPLOY.md` since the demo was
 * scaffolded as if it protected these — but nothing ever read it, so operators
 * reasonably believed the keys were encrypted at rest when they were not.
 *
 * Format: `enc:v1:<iv-b64>:<ciphertext-b64>` using AES-256-GCM, with the key
 * derived from the secret via SHA-256. Decryption failures return null rather
 * than throwing, so rotating the secret degrades to "fall back to the env
 * var" instead of breaking the demo.
 */

const PREFIX = "enc:v1:";

export class MissingEncryptionSecretError extends Error {
  constructor() {
    super(
      "SETTINGS_SECRET (or AUTH_SECRET) is required to store provider API keys. " +
        "Refusing to write an unencrypted secret to the session store.",
    );
    this.name = "MissingEncryptionSecretError";
  }
}

function encryptionSecret() {
  const secret =
    process.env.SETTINGS_SECRET ||
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === "production"
      ? null
      : "tasco-demo-dev-secret-change-me");
  return secret;
}

export function encryptionAvailable() {
  return Boolean(encryptionSecret());
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const material = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function toB64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function fromB64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/** Encrypt for storage. Throws in production when no secret is configured. */
export async function encryptSecret(plaintext: string): Promise<string> {
  const secret = encryptionSecret();
  if (!secret) throw new MissingEncryptionSecretError();
  if (!plaintext) return "";

  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return `${PREFIX}${toB64(iv)}:${toB64(new Uint8Array(ct))}`;
}

/** Decrypt if encrypted; pass through anything already stored in plaintext. */
export async function decryptSecret(value: unknown): Promise<string | null> {
  if (typeof value !== "string" || !value) return null;
  // Values written before encryption existed are still plaintext; pass them through.
  if (!isEncrypted(value)) return value;

  const secret = encryptionSecret();
  if (!secret) return null;

  const [, , ivB64, ctB64] = value.split(":");
  if (!ivB64 || !ctB64) return null;

  try {
    const key = await deriveKey(secret);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(ivB64) },
      key,
      fromB64(ctB64),
    );
    return new TextDecoder().decode(plain);
  } catch {
    // Wrong secret (rotated) or corrupted payload. Callers fall back to the
    // environment key rather than crashing the request.
    return null;
  }
}

/** Never render a stored secret's suffix — for ciphertext it's meaningless. */
export function secretPreview(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  if (isEncrypted(value)) return "saved (encrypted)";
  return `saved: ••••${value.slice(-4)}`;
}
