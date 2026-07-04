// Access gate for the shared demo. Only SHA-256 hashes of the access codes live
// in the repo and the built bundle; the codes themselves are distributed out of
// band and kept locally in portal/.env (gitignored), which can override this
// list at build time via VITE_ACCESS_PASSWORD_HASHES (comma-separated).
const FALLBACK_HASHES = [
  'a3ee88204ad224bef6430bb55d023bd4ccd778eb1ead61819cf539126643c07d',
  '5b4e3929f7ebbe3d062b63738e758294b0738d2e5be512b466022c2194ea6fd0',
  'c49eadaf4fffac24acd05b60625796c093f125ca7ed7950425125e4d84811acc', // consulting
  '4ab4bb90499d3f8e35205db4d1f21b8e64c974ac2bc939070c126140a5eacaae', // director
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
