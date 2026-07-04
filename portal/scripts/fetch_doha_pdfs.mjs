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

// branded Chrome + headed: DOHA's bot protection fingerprints headless chromium
const headed = process.argv.includes('--headed');
const browser = await chromium.launch({
  channel: 'chrome', headless: !headed,
}).catch(() => chromium.launch({ headless: !headed }));
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();
// establish the Akamai session the way the repo's scraper does
await page.goto('https://doha.ogc.osd.mil/Industrial-Security-Program/',
  { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch((e) => {
  console.log(`session page: ${e.message}`);
});
await page.waitForTimeout(1500);

async function fetchPdf(url) {
  // request API first (fast); full navigation as fallback (runs JS challenge)
  const res = await context.request.get(url, { timeout: 45_000 });
  let body = await res.body();
  if (res.ok() && body.subarray(0, 5).toString('latin1').startsWith('%PDF')) return body;
  const nav = await page.goto(url, { waitUntil: 'commit', timeout: 45_000 });
  await page.waitForTimeout(2000);
  body = await nav.body();
  if (body.subarray(0, 5).toString('latin1').startsWith('%PDF')) return body;
  throw new Error(`nav HTTP ${nav.status()}, ${body.length} bytes, `
    + `starts ${JSON.stringify(body.subarray(0, 12).toString('latin1'))}`);
}

let ok = 0; let failed = 0;
for (const r of records) {
  const slug = r.file.replace(/\.json$/, '');
  const out = path.join(pdfDir, `${slug}.pdf`);
  if (fs.existsSync(out) && fs.statSync(out).size > 10_000) { ok += 1; continue; }
  if (!r.sourceUrl) { failed += 1; console.log(`no sourceUrl: ${slug}`); continue; }
  try {
    const body = await fetchPdf(r.sourceUrl);
    fs.writeFileSync(out, body);
    console.log(`saved ${slug}.pdf (${Math.round(body.length / 1024)} KB)`);
    ok += 1;
  } catch (err) {
    failed += 1;
    console.log(`FAILED ${slug}: ${err.message}`);
  }
  await page.waitForTimeout(800); // be polite to the DOHA servers
}
await browser.close();
console.log(`done: ${ok} ok, ${failed} failed of ${records.length}`);
process.exit(failed > 0 && ok === 0 ? 1 : 0);
