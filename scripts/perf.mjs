// node scripts/perf.mjs [hash]  — loads the app, enters, reports FPS overview & focused
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://127.0.0.1:5199/');
await p.waitForFunction(() => !document.getElementById('enter')?.disabled, null, { timeout: 180000 });
await p.click('#enter');
await p.waitForTimeout(6000);
console.log('overview fps', (await p.evaluate(() => window.__fps)).toFixed(1));
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(5000);
console.log('focused fps', (await p.evaluate(() => window.__fps)).toFixed(1));
await b.close();
