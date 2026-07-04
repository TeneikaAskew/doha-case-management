/* Download the 15 per-case DOHA decision PDFs via Playwright (the DOHA site
   blocks plain HTTP; a real browser context gets through). Idempotent: skips
   PDFs already on disk. Run: node scripts/fetch_doha_pdfs.mjs */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dohaDir = path.join(root, 'public', 'data', 'documents', 'doha');
const pdfDir = path.join(dohaDir, 'pdf');
fs.mkdirSync(pdfDir, { recursive: true });

const records = fs.readdirSync(dohaDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(dohaDir, f), 'utf8')) }));

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
// prime the Akamai cookies with a real page visit
await page.goto('https://doha.ogc.osd.mil/', { waitUntil: 'domcontentloaded' })
  .catch(() => {});

let ok = 0; let failed = 0;
for (const r of records) {
  const slug = r.file.replace(/\.json$/, '');
  const out = path.join(pdfDir, `${slug}.pdf`);
  if (fs.existsSync(out) && fs.statSync(out).size > 10_000) { ok += 1; continue; }
  if (!r.sourceUrl) { failed += 1; console.log(`no sourceUrl: ${slug}`); continue; }
  try {
    const res = await context.request.get(r.sourceUrl, { timeout: 45_000 });
    const body = await res.body();
    const isPdf = body.subarray(0, 5).toString('latin1').startsWith('%PDF');
    if (!res.ok() || !isPdf) {
      throw new Error(`HTTP ${res.status()}, pdf=${isPdf}, bytes=${body.length}`);
    }
    fs.writeFileSync(out, body);
    console.log(`saved ${slug}.pdf (${Math.round(body.length / 1024)} KB)`);
    ok += 1;
  } catch (err) {
    failed += 1;
    console.log(`FAILED ${slug}: ${err.message}`);
  }
}
await browser.close();
console.log(`done: ${ok} ok, ${failed} failed of ${records.length}`);
process.exit(failed > 0 && ok === 0 ? 1 : 0);
