// Access gate for the shared demo. Only SHA-256 hashes of the access codes live
// in the repo and the built bundle; the codes themselves are distributed out of
// band and kept locally in portal/.env (gitignored), which can override this
// list at build time via VITE_ACCESS_PASSWORD_HASHES (comma-separated).
const FALLBACK_HASHES = [
  'a3ee88204ad224bef6430bb55d023bd4ccd778eb1ead61819cf539126643c07d',
  '5b4e3929f7ebbe3d062b63738e758294b0738d2e5be512b466022c2194ea6fd0',
];

const envHashes = (import.meta.env.VITE_ACCESS_PASSWORD_HASHES || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

export const PASSWORD_SHA256S = envHashes.length ? envHashes : FALLBACK_HASHES;

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}
