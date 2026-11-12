// Screenshot helper (Windows / headless Chrome on the real GPU via ANGLE-D3D11).
//   node scripts/shot.mjs <sceneId> [view=front] [out.png] [t=2]
//   node scripts/shot.mjs app [out.png] [hash] [waitMs]      (full app; clicks 展卷)
// views: front | side | back | top | close | low | far
// env: VW/VH viewport, EXTRA="&ao=0", KEYS="ArrowRight|wait:3000|Escape"
import { chromium } from 'playwright-core';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:5199/';
const [, , what = 'app', a2, a3, a4] = process.argv;
const browser = await chromium.launch({
  executablePath: CHROME, headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: +(process.env.VW || 1280), height: +(process.env.VH || 800) } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
try {
  if (what === 'app') {
    const out = a2 || 'shot-app.png';
    await page.goto(BASE + (a3 ? '#' + a3 : ''));
    await page.waitForFunction(() => !document.getElementById('enter')?.disabled, null, { timeout: 180000 });
    await page.click('#enter');
    await page.waitForTimeout(+(a4 || 5000));
    for (const k of (process.env.KEYS || '').split('|').filter(Boolean)) {
      if (k.startsWith('wait:')) await page.waitForTimeout(+k.slice(5));
      else if (k.startsWith('eval:')) await page.evaluate(k.slice(5));
      else await page.keyboard.press(k);
    }
    await page.screenshot({ path: out });
    console.log('saved', out);
  } else {
    const view = a2 || 'front';
    const out = a3 || `shot-${what}-${view}.png`;
    const t = a4 || '2';
    await page.goto(`${BASE}?solo=${what}&view=${view}&t=${t}${process.env.EXTRA || ''}`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: out });
    console.log('saved', out);
  }
} catch (e) { errors.push('shot: ' + e.message); }
if (errors.length) console.log(errors.slice(0, 15).join('\n'));
await browser.close();
