// node scripts/check-all.mjs — loads every scene solo (day and night) in one browser and reports console errors.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:5199/';
const ids = [...readFileSync(new URL('../src/data.js', import.meta.url), 'utf8').matchAll(/^\s*\['([a-z]+)', '/gm)].map((m) => m[1]);
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await b.newPage({ viewport: { width: 960, height: 600 } });
let errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
let bad = 0;
for (const id of ids) for (const night of [0, 1]) {
  errs = [];
  await page.goto(`${BASE}?solo=${id}&view=front&t=7&night=${night}`);
  try { await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 }); } catch { errs.push('timeout'); }
  await page.waitForTimeout(150);
  if (errs.length) { bad++; console.log(`${id} night=${night}:`, errs.slice(0, 3).join(' | ')); }
}
console.log(`${ids.length} scenes × day/night checked, ${bad} with errors`);
await b.close();
