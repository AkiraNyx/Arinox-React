const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/AkiraNyx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const base = process.argv[2]; assert.ok(base);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 960 } });
  const errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const pass = name => checks.push(name);
  try {
    await page.goto(new URL('checks.html', base).href); await page.evaluate(() => document.fonts.ready);
    const host = await page.locator('#host-button').evaluate(element => ({ radius: getComputedStyle(element).borderRadius, font: getComputedStyle(element).fontFamily }));
    assert.equal(host.radius, '0px'); assert.ok(!host.font.includes('Inter')); pass('host styles untouched');
    assert.equal(await page.getByRole('button', { name: '不可用', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: '加载状态', exact: true }).getAttribute('aria-busy'), 'true');
    assert.equal(await page.getByRole('button', { name: '加载状态', exact: true }).isDisabled(), true); pass('button variants disabled loading');
    await page.locator('#focus-ref').click(); assert.equal(await page.locator('#controlled').evaluate(element => element === document.activeElement), true);
    await page.locator('#controlled').fill('新的受控名称'); assert.match(await page.locator('#controlled-result').textContent(), /新的受控名称/);
    await page.locator('#uncontrolled').fill('新的非受控名称'); await page.locator('#theme').click(); assert.equal(await page.locator('#uncontrolled').inputValue(), '新的非受控名称'); pass('native ref and controlled uncontrolled values');
    assert.equal(await page.locator('#readonly').isEditable(), false); assert.equal(await page.locator('#disabled').isDisabled(), true);
    assert.equal(await page.locator('#invalid').getAttribute('aria-invalid'), 'true'); assert.equal(await page.locator('#invalid-help').getAttribute('role'), 'alert'); pass('readonly disabled associated error');
    await page.locator('#check-ref').click(); assert.equal(await page.locator('#controlled-check').evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Space'); assert.match(await page.locator('#controlled-result').textContent(), /true/);
    assert.equal(await page.locator('#partial').evaluate(element => element.indeterminate), true); await page.locator('#switch').uncheck(); assert.equal(await page.locator('#switch').isChecked(), false); pass('checkbox ref half checked and native switch');
    await page.locator('#select').click(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); assert.equal(await page.locator('#select').inputValue(), '工具界面'); pass('native select keyboard');
    for (const width of [1200, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      for (const theme of ['day', 'night']) {
        if (await page.locator('.ax-theme').getAttribute('data-theme') !== theme) await page.locator('#theme').click();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.equal(await page.locator('#controlled').evaluate(element => getComputedStyle(element).borderRadius), '11px');
        assert.equal(await page.locator('.ax-theme').evaluate(element => getComputedStyle(element).getPropertyValue('--fx-radius-popover').trim()), '16px');
        assert.equal(await page.locator('.ax-theme').evaluate(element => getComputedStyle(element).getPropertyValue('--ax-color-bg-default').trim()), theme === 'day' ? '#fdfaf4' : '#070a12');
        pass(theme + '/' + width + ' scoped geometry');
      }
    }
    assert.deepEqual(errors, []); pass('strict mode no runtime or console errors');
    fs.writeFileSync(new URL('./foundation-results.json', 'file:///' + __filename.replaceAll('\\', '/')), JSON.stringify({ checks: checks.length, results: checks, errors }, null, 2));
    console.log('PASS foundation ' + checks.length);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
