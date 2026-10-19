const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'C:/Users/AkiraNyx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const base = process.argv[2]; assert.ok(base, 'Pass the existing example preview URL');
  const browser = await chromium.launch({ executablePath: process.env.EDGE_EXECUTABLE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(new URL('checks.html?motion', base).href);
    await page.locator('#toggle-dialog').click();
    await page.waitForFunction(() => document.getElementById('lab-dialog')?.dataset.motionState === 'open');
    assert.equal(await page.locator('#lab-dialog').evaluate(node => node.matches(':modal')), true);
    await page.evaluate(() => {
      const button = document.createElement('button');
      document.getElementById('lab-dialog').append(button);
      button.focus(); button.remove();
    });
    await page.waitForFunction(() => !!document.activeElement?.closest('#lab-dialog'));
    await page.evaluate(() => {
      for (const node of document.querySelectorAll('#lab-dialog button,#lab-dialog input,#lab-dialog select,#lab-dialog textarea')) node.disabled = true;
    });
    await page.waitForFunction(() => document.activeElement === document.getElementById('lab-dialog'));
    await page.keyboard.press('Escape');
    await page.locator('#lab-dialog').waitFor({ state: 'detached' });
    assert.equal(await page.locator('#toggle-dialog').evaluate(node => node === document.activeElement), true);
    assert.deepEqual(errors, []);
    console.log('PASS native-dialog-default, removed/disabled focus fallback, exit return, StrictMode cleanup');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
