/**
 * Drives the real FC27 Editor web UI with a headless Chrome and saves
 * crisp 2x screenshots that Remotion turns into video scenes.
 *
 *   node scripts/capture.mjs
 *
 * Requires the editor running at http://127.0.0.1:8765 (python web_app.py).
 * Override with FC27_BASE / FC27_CHROME env vars.
 *
 * Each scene reloads the page first: the editor keeps a lot of async view state,
 * and a fresh load makes every capture independent and repeatable.
 */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.FC27_BASE ?? 'http://127.0.0.1:8765';
const CHROME =
  process.env.FC27_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT_DIR = path.resolve('public/shots');

// 1600x900 @2x = 3200x1800 source pixels, downscaled to 1920x1080 in the video.
const VIEWPORT = { width: 1600, height: 900 };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tab = (view) => `.tab[data-view="${view}"]`;

async function shot(page, name) {
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    type: 'png',
    animations: 'disabled',
    caret: 'hide',
  });
  console.log(`  captured ${name}.png`);
}

/** Native click in the page, retried: debounced searches re-render the lists. */
async function jsClick(page, selector, timeout = 20000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const clicked = await page
      .$eval(selector, (el) => {
        el.click();
        return true;
      })
      .catch(() => false);
    if (clicked) return;
    if (Date.now() > deadline) throw new Error(`element never appeared: ${selector}`);
    await wait(250);
  }
}

async function tryStep(label, fn) {
  try {
    await fn();
    console.log(`✓ ${label}`);
  } catch (error) {
    console.warn(`✗ ${label}: ${error.message.split('\n')[0]}`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  /** Fresh load, wait until the roster is in memory. */
  const open = async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Rendered as "21,600 名", so strip everything that is not a digit.
    await page.waitForFunction(
      () => {
        const raw = document.querySelector('#playerCount')?.textContent ?? '';
        return Number(raw.replace(/[^0-9]/g, '')) > 1000;
      },
      null,
      { timeout: 90000 },
    );
    await wait(700);
  };

  // ---------------------------------------------------------------- 1 + 2
  await tryStep('player search + detail', async () => {
    await open();
    await page.fill('#playerSearch', 'Lionel Messi');
    await page.waitForSelector('#playerResults [data-player-id]');
    await wait(500);
    await shot(page, '01-search');

    await jsClick(page, '#playerResults [data-player-id]');
    await page.waitForFunction(
      () => !document.querySelector('#playerDetail')?.classList.contains('empty-state'),
    );
    await wait(900);
    await shot(page, '02-player');
  });

  // -------------------------------------------------------------------- 3
  await tryStep('team roster', async () => {
    await open();
    await jsClick(page, tab('teams'));
    await wait(600);
    await page.fill('#teamSearch', 'Milan');
    await page.waitForSelector('#teamResults [data-team-id]', { timeout: 30000 });
    await wait(700);
    await jsClick(page, '#teamResults [data-team-id]');
    await page.waitForFunction(
      () => !document.querySelector('#teamDetail')?.classList.contains('empty-state'),
      null,
      { timeout: 30000 },
    );
    await wait(1000);
    await shot(page, '03-teams');
  });

  // -------------------------------------------------------------------- 4
  await tryStep('quick transfers', async () => {
    await open();
    await jsClick(page, tab('transfers'));
    await wait(700);
    const pick = async (inputSel, optionsSel, query) => {
      await page.fill(inputSel, query);
      const options = `${optionsSel} [data-transfer-team-id]`;
      await page.waitForSelector(options, { timeout: 30000 });
      await wait(600);
      await jsClick(page, options);
      const picked = await page.waitForFunction(
        (sel) => Boolean(document.querySelector(sel)?.dataset.teamId),
        inputSel,
        { timeout: 20000 },
      );
      await picked.dispose();
    };
    await pick('#transferFromTeam', '#transferFromOptions', 'Milan');
    await page.waitForTimeout(500);
    // Only a few clubs carry a real name in this save; match Inter Miami by team ID.
    await pick('#transferToTeam', '#transferToOptions', '112893');
    await page.waitForFunction(
      () => document.querySelectorAll('#transferFromRoster tbody tr').length > 5,
      null,
      { timeout: 30000 },
    );
    await wait(900);
    await shot(page, '04-transfers');
  });

  // -------------------------------------------------------------------- 5
  await tryStep('national team', async () => {
    await open();
    await jsClick(page, tab('national'));
    await page.waitForFunction(() => {
      const select = document.querySelector('#nationalTeam');
      return select && select.options.length > 1;
    });
    await page.selectOption('#nationalTeam', { index: 1 });
    await wait(1800);
    await shot(page, '05-national');
  });

  // -------------------------------------------------------------------- 6
  await tryStep('quick features', async () => {
    await open();
    await jsClick(page, tab('quick'));
    await wait(1000);
    await shot(page, '06-quick');
  });

  // -------------------------------------------------------------------- 7
  await tryStep('peak roster dialog', async () => {
    await page.click('#peakPreview');
    await page.waitForFunction(() => document.querySelector('#listDialog')?.open === true, null, {
      timeout: 60000,
    });
    await wait(1000);
    await shot(page, '07-dialog');
    await page.click('#listClose');
  });

  await browser.close();
  console.log(`\nDone. Images in ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
