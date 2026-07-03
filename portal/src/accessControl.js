// Access gate for the shared demo. Only the SHA-256 of the password lives in
// the repo and the built bundle; the password itself is distributed out of band
// and kept locally in portal/.env (gitignored), which can override this hash
// at build time via VITE_ACCESS_PASSWORD_HASH.
export const PASSWORD_SHA256 =
  import.meta.env.VITE_ACCESS_PASSWORD_HASH
  || 'a3ee88204ad224bef6430bb55d023bd4ccd778eb1ead61819cf539126643c07d';

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}
