// Enforces the CLAUDE.md writing rule: no em/en dashes (or their double-encoded
// mojibake forms) anywhere in source - use plain hyphens.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXTS = new Set(['.js', '.jsx', '.css']);
// em dash, en dash, mojibake prefix - as escapes so this file passes its own scan
const BANNED = ['\u2014', '\u2013', '\u00e2\u20ac'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (EXTS.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

describe('copy style', () => {
  it('contains no em dashes, en dashes, or mojibake in src', () => {
    const offenders = [];
    for (const f of walk(SRC)) {
      const text = fs.readFileSync(f, 'utf8');
      if (BANNED.some((ch) => text.includes(ch))) {
        offenders.push(path.relative(SRC, f));
      }
    }
    expect(offenders).toEqual([]);
  });
});
