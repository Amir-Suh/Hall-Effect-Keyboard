// Captures the three tabs in both themes for Dummy-UI-demo.md.
// Usage: start the dev server (npm run dev), then: node scripts/screenshot.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'screenshots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const shot = async (name) => {
  await page.screenshot({ path: path.join(OUT, name) });
  console.log('saved', name);
};
const go = async (route) => {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
};
const selectAll = () =>
  page.getByRole('button', { name: 'Select all keys' }).click().catch(() => {});
// Set the theme deterministically (CSS variables react to data-theme immediately).
const setTheme = (t) =>
  page.evaluate((tt) => {
    document.documentElement.dataset.theme = tt;
    localStorage.setItem('hek-theme', JSON.stringify({ state: { theme: tt }, version: 0 }));
  }, t);

// ---- dark theme (default) ----
await go('/config/actuation-point');
await setTheme('dark');
await selectAll();
await page.waitForTimeout(200);
await shot('actuation-dark.png');

await go('/config/rapid-trigger');
await selectAll();
await page.getByLabel('Enable Rapid Trigger').click().catch(() => {});
await page.waitForTimeout(200);
await shot('rapid-trigger-dark.png');

await go('/config/remap');
await page.waitForTimeout(300);
await shot('remap-dark.png');

// connect the mock device, then show live Visual Feedback
await go('/config/actuation-point');
await page.locator('aside button').filter({ hasText: 'Wooting' }).first().click().catch(() => {});
await page.getByText('Connect demo device').click().catch(() => {});
await page.waitForTimeout(1300);
await selectAll();
await page.waitForTimeout(700);
await shot('actuation-connected-dark.png');

// ---- light theme (matches the Rapid Trigger reference) ----
await setTheme('light');
await page.waitForTimeout(300);

await go('/config/rapid-trigger');
await selectAll();
await page.getByLabel('Enable Rapid Trigger').click().catch(() => {});
await page.waitForTimeout(200);
await shot('rapid-trigger-light.png');

await go('/config/remap');
await page.waitForTimeout(300);
await shot('remap-light.png');

await browser.close();
console.log('done');
