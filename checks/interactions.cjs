const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/AkiraNyx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const base = process.argv[2]; assert.ok(base);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 960 } });
  const errors = [], results = [];
  page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const pass = check => results.push(check);
  const opened = id => page.waitForFunction(id => document.getElementById(id)?.dataset.motionState === 'open', id);
  const closed = id => page.waitForFunction(id => !document.getElementById(id), id);
  const drive = id => page.locator('#' + id).evaluate(element => element.click());
  try {
    for (const width of [1200, 390]) {
      await page.setViewportSize({ width, height: 960 }); await page.goto(new URL('checks.html?motion', base).href); await page.evaluate(() => document.fonts.ready);
      const tabs = page.locator('[role="tab"]');
      await page.getByLabel('面板输入').fill('保持这个值');
      await tabs.first().focus(); await page.keyboard.press('ArrowRight'); assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
      await page.keyboard.press('End'); assert.equal(await tabs.nth(3).evaluate(element => element === document.activeElement), true);
      await page.keyboard.press('ArrowRight'); assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
      assert.equal(await page.getByLabel('面板输入').inputValue(), '保持这个值'); assert.equal(await page.locator('[role="tab"][tabindex="0"]').count(), 1);
      await page.keyboard.press('Tab'); assert.equal(await page.locator('[role="tabpanel"]:not([hidden])').evaluate(element => element === document.activeElement), true); pass(width + '/tabs-keyboard-panel-state');

      await page.locator('#menu-trigger').focus(); await page.keyboard.press('ArrowUp'); await opened('lab-menu');
      assert.equal(await page.locator('#menu-last').evaluate(element => element === document.activeElement), true);
      await page.keyboard.press('Home'); assert.equal(await page.locator('#menu-first').evaluate(element => element === document.activeElement), true);
      await page.keyboard.press('ArrowDown'); assert.equal(await page.locator('#menu-last').evaluate(element => element === document.activeElement), true);
      await page.keyboard.press('Escape'); await closed('lab-menu'); assert.equal(await page.locator('#menu-trigger').evaluate(element => element === document.activeElement), true); pass(width + '/menu-keyboard-disabled-skip-return');
      await page.locator('#menu-trigger').click(); await opened('lab-menu');
      await page.locator('#lab-menu [aria-disabled="true"]').evaluate(element => element.click());
      assert.match(await page.locator('#callbacks').textContent(), /菜单 0/);
      const menuBounds = await page.locator('#lab-menu').evaluate(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, radius: getComputedStyle(element).borderRadius }));
      assert.ok(menuBounds.left >= 0 && menuBounds.right <= width); assert.equal(menuBounds.radius, '16px');
      await page.locator('#menu-first').click(); await closed('lab-menu'); assert.match(await page.locator('#callbacks').textContent(), /菜单 1/); pass(width + '/menu-selection-and-position');
      await page.locator('#menu-trigger').click(); await opened('lab-menu');
      await page.mouse.click(3, 3); await closed('lab-menu');
      await page.locator('#menu-trigger').click(); await opened('lab-menu');
      await page.getByLabel('面板输入').focus(); await closed('lab-menu');
      await page.getByLabel('面板输入').press('Home'); assert.equal(await page.getByLabel('面板输入').evaluate(element => element.selectionStart), 0); pass(width + '/outside-focus-close-and-text-navigation');

      await page.locator('#toggle-dialog').click(); await opened('lab-dialog');
      const finalStyle = await page.locator('#lab-dialog').evaluate(element => ({ opacity: Number(getComputedStyle(element).opacity), scale: new DOMMatrixReadOnly(getComputedStyle(element).transform).a, animation: getComputedStyle(element).animationName }));
      assert.equal(finalStyle.opacity, 1); assert.equal(finalStyle.scale, 1); assert.equal(finalStyle.animation, 'none');
      assert.ok(await page.locator('#lab-dialog').evaluate(element => getComputedStyle(element).backdropFilter.includes('22px')));
      assert.equal(await page.locator('#lab-dialog').evaluate(element => element.matches(':modal')), true);
      assert.equal(await page.locator('#lab-name').evaluate(element => element === document.activeElement), true);
      await page.getByRole('button', { name: '提交', exact: true }).click(); assert.equal(await page.locator('#lab-name').evaluate(element => element.validity.valid), false);
      const field = await page.locator('#lab-name').evaluate(element => ({ radius: getComputedStyle(element).borderRadius, outline: getComputedStyle(element).outlineStyle }));
      assert.equal(field.radius, '11px'); assert.equal(field.outline, 'none');
      await page.locator('#lab-select').click(); await page.waitForFunction(() => document.getElementById('lab-select').matches(':open'));
      assert.equal(await page.locator('#lab-select').evaluate(element => getComputedStyle(element, '::picker(select)').borderRadius), '16px');
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); assert.equal(await page.locator('#lab-select').inputValue(), '灵感收集');
      await page.locator('#lab-select').click(); await page.keyboard.press('Escape'); assert.equal(await page.locator('#lab-dialog').evaluate(element => element.open && !element.inert), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#lab-dialog').evaluate(element => element.open && element.inert && element.matches(':modal')), true);
      await closed('lab-dialog'); assert.equal(await page.locator('#toggle-dialog').evaluate(element => element === document.activeElement), true); pass(width + '/dialog-validation-picker-hierarchy-exit-modality');
      await page.locator('#uncontrolled-trigger').click(); await opened('uncontrolled-dialog'); await page.getByRole('button', { name: '完成', exact: true }).click(); await closed('uncontrolled-dialog');
      assert.equal(await page.locator('#uncontrolled-trigger').evaluate(element => element === document.activeElement), true); pass(width + '/uncontrolled-dialog');
    }

    await page.setViewportSize({ width: 1200, height: 960 }); await page.reload();
    await page.locator('#toggle-dialog').click();
    await page.waitForFunction(() => { const node = document.getElementById('lab-dialog'); return node && Number(getComputedStyle(node).opacity) > .05 && Number(getComputedStyle(node).opacity) < .98; });
    await page.keyboard.press('Escape');
    const during = await page.locator('#lab-dialog').evaluate(element => Number(getComputedStyle(element).opacity));
    await drive('toggle-dialog');
    const resumed = await page.locator('#lab-dialog').evaluate(element => Number(getComputedStyle(element).opacity));
    assert.ok(Math.abs(during - resumed) < .35, `${during} -> ${resumed}`);
    await opened('lab-dialog'); assert.match(await page.locator('#callbacks').textContent(), /退出 0/);
    await page.keyboard.press('Escape'); await closed('lab-dialog'); assert.match(await page.locator('#callbacks').textContent(), /退出 1/); pass('interrupted-exit-reopens-from-current-frame-no-stale-close');

    await page.evaluate(() => { for (let i = 0; i < 12; i++) document.getElementById('menu-trigger').click(); });
    await closed('lab-menu'); assert.equal(await page.locator('.ax-portals [role="menu"]').count(), 0);
    await page.locator('#menu-trigger').click(); await opened('lab-menu');
    await page.evaluate(() => { document.body.style.minHeight = '2200px'; scrollTo(0, 40); });
    assert.equal(await page.locator('#lab-menu').evaluate(element => !element.inert), true);
    await page.mouse.move(3, 3); await page.mouse.wheel(0, 30); await closed('lab-menu'); pass('rapid-menu-and-programmatic-versus-user-scroll');
    await page.locator('#toggle-dialog').click(); await page.evaluate(() => { window.detachedDialog = document.getElementById('lab-dialog'); document.getElementById('unmount').click(); });
    await closed('lab-dialog'); const callbacks = await page.locator('#callbacks').textContent();
    const detachedStyle = await page.evaluate(() => [window.detachedDialog.open, window.detachedDialog.style.opacity, window.detachedDialog.style.transform]);
    assert.equal(detachedStyle[0], false); assert.equal(detachedStyle[1], ''); assert.equal(detachedStyle[2], '');
    await page.waitForTimeout(400);
    assert.equal(await page.locator('#callbacks').textContent(), callbacks);
    assert.deepEqual(await page.evaluate(() => [window.detachedDialog.open, window.detachedDialog.style.opacity, window.detachedDialog.style.transform]), detachedStyle);
    await drive('toggle-dialog'); await page.locator('#remount').click(); pass('unmount-cancels-scopes-restores-style-no-late-callback');
    await page.locator('#menu-trigger').click(); await opened('lab-menu');
    await page.evaluate(() => { window.detachedMenu = document.getElementById('lab-menu'); document.getElementById('unmount').click(); });
    await closed('lab-menu');
    assert.equal(await page.evaluate(() => window.detachedMenu.matches(':popover-open')), false);
    assert.deepEqual(await page.evaluate(() => [window.detachedMenu.style.opacity, window.detachedMenu.style.transform]), ['', '']);
    await page.locator('#remount').click(); pass('unmount-clears-native-popover-and-anime-styles');

    await page.locator('#layout-toggle').click();
    await page.waitForFunction(() => [...document.querySelectorAll('[data-ax-layout-item]')].some(element => { const m = new DOMMatrixReadOnly(getComputedStyle(element).transform); return Math.abs(m.e) + Math.abs(m.f) > 1; }));
    await page.evaluate(() => { for (let i = 0; i < 7; i++) document.getElementById('layout-toggle').click(); });
    await page.waitForFunction(() => [...document.querySelectorAll('[data-ax-layout-item]')].every(element => { const m = new DOMMatrixReadOnly(getComputedStyle(element).transform); return Math.abs(m.e) + Math.abs(m.f) < .1; }));
    assert.equal(await page.locator('.lab-layout').getAttribute('data-mode'), 'grid'); pass('anime-layout-rapid-final-state');

    await page.locator('#toggle-dialog').click(); await opened('lab-dialog'); await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: 'reduce' }); await closed('lab-dialog');
    assert.equal(await page.locator('#toggle-dialog').evaluate(element => element === document.activeElement), true); pass('live-reduced-motion-finishes-exit');
    await page.locator('#toggle-dialog').click(); await opened('lab-dialog'); await page.keyboard.press('Escape'); await closed('lab-dialog');
    await page.locator('#menu-trigger').click(); await opened('lab-menu'); await page.keyboard.press('Escape'); await closed('lab-menu'); pass('reduced-motion-keyboard-and-layer-lifecycle');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.deepEqual(errors, []); pass('strict-mode-console-runtime-clean');
    await page.screenshot({ path: path.join(__dirname, 'motion-lab.png') });
    fs.writeFileSync(path.join(__dirname, 'interaction-results.json'), JSON.stringify({ checks: results.length, results, errors }, null, 2));
    console.log('PASS interactions ' + results.length);
  } catch (error) { await page.screenshot({ path: path.join(__dirname, 'interaction-failure.png') }).catch(() => {}); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
