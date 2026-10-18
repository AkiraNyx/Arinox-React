const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/AkiraNyx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const url = process.argv[2];
  assert.ok(url, 'Pass the local preview URL');
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const results = [];
  const errors = [];
  const requests = new Set();
  function track(page) {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => requests.add(new URL(request.url()).origin));
    page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  }
  async function settled(page) {
    await page.locator('#projects').waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('[data-motion-state]')].every(element => element.dataset.motionState === 'open'));
    await page.waitForFunction(() => [...document.querySelectorAll('[data-ax-layout-item]')].every(element => { const matrix=new DOMMatrixReadOnly(getComputedStyle(element).transform); return Math.abs(matrix.e)+Math.abs(matrix.f)<.1; }));
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await document.activeViewTransition?.finished;
      await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
    });
  }
  async function projectCount(page, count) {
    await page.waitForFunction(expected => document.querySelectorAll('[data-project]').length === expected, count);
    assert.equal(await page.locator('[data-project]').count(), count);
  }
  async function dialogClosed(page) { await page.waitForFunction(() => !document.getElementById('project-dialog')?.open); }
  async function checkBounds(page, label) {
    await settled(page);
    const result = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const bad = [...document.querySelectorAll('button,input,select,textarea,h1,h2,h3')].filter(element => {
        if (element.closest('[hidden]') || element.closest('dialog:not([open])')) return false;
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.left < -1 || box.right > width + 1);
      }).map(element => element.outerHTML.slice(0, 120));
      return { width, scrollWidth: document.documentElement.scrollWidth, bad };
    });
    assert.ok(result.scrollWidth <= result.width + 1, label + ': page overflow');
    assert.deepEqual(result.bad, [], label + ': clipped controls');
    results.push({ check: label, passed: true });
  }
  try {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ colorScheme: theme, viewport: { width: 1440, height: 1100 } });
      const page = await context.newPage();
      track(page);
      await page.goto(url, { waitUntil: 'load' });
      await settled(page);
      assert.equal(await page.locator('[data-project]').count(), 3);
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme === 'light' ? 'day' : 'night');
      const fonts = await page.evaluate(() => ({
        inter: document.fonts.check('400 14px "Inter Variable"', 'Arinox'),
        newsreader: document.fonts.check('500 24px "Newsreader Variable"', 'Arinox'),
        noto: document.fonts.check('500 24px "Noto Serif SC Variable"', '夜明'),
        glass: getComputedStyle(document.querySelector('.topbar')).backdropFilter,
        radius: getComputedStyle(document.getElementById('new-project')).borderRadius
      }));
      assert.deepEqual([fonts.inter, fonts.newsreader, fonts.noto], [true, true, true]);
      assert.ok(fonts.glass.includes('22px'));
      assert.equal(fonts.radius, '11px');
      const contrast = await page.evaluate(() => {
        const context = document.createElement('canvas').getContext('2d');
        const luminance = color => {
          context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
          const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(channel => {
            const value = channel / 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
          });
          return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
        };
        const ratio = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
        const primary = getComputedStyle(document.getElementById('new-project'));
        const card = getComputedStyle(document.querySelector('.project-card'));
        return {
          primary: ratio(primary.color, primary.backgroundColor),
          title: ratio(getComputedStyle(document.querySelector('.project-open')).color, card.backgroundColor),
          secondary: ratio(getComputedStyle(document.querySelector('.project-description')).color, card.backgroundColor),
          success: ratio(getComputedStyle(document.querySelector('[data-status="done"] .project-status')).color, card.backgroundColor)
        };
      });
      for (const [name, value] of Object.entries(contrast)) assert.ok(value >= 4.5, theme + '/' + name + ' contrast: ' + value);
      results.push({ check: theme + '/text-contrast', passed: true, ratios: contrast });
      for (const width of [1440, 1024, 768, 390, 320]) {
        await page.setViewportSize({ width, height: width < 600 ? 920 : 1100 });
        await checkBounds(page, theme + '/' + width + '/cards');
        if (width === 1440 || width === 390) await page.screenshot({ path: path.join(__dirname, theme + '-' + width + '.png'), fullPage: true });
        await page.getByRole('button', { name: '列表布局', exact: true }).click();
        await checkBounds(page, theme + '/' + width + '/list');
        await page.getByRole('button', { name: '卡片布局', exact: true }).click();
        await page.locator('[data-menu="arinox"]').click();
        await page.locator('.project-actions:not([hidden])').waitFor();
        assert.equal(await page.locator('.project-actions').isVisible(), true);
        await checkBounds(page, theme + '/' + width + '/menu');
        if (width === 1440) await page.screenshot({ path: path.join(__dirname, theme + '-menu.png') });
        assert.equal(await page.locator('.project-actions').evaluate(element => !element.hidden && !element.inert), true, theme + '/' + width + '/menu remains open');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('[data-menu="arinox"]').evaluate(element => element === document.activeElement), true, theme + '/' + width + '/menu focus return');
        await page.locator('[data-open="arinox"]').click();
        await page.locator('#project-dialog[open]').waitFor();
        assert.equal(await page.locator('#project-dialog').evaluate(element => element.open), true);
        await page.locator('#project-dialog').evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))));
        await checkBounds(page, theme + '/' + width + '/dialog');
        if (width === 1440 || width === 390) await page.screenshot({ path: path.join(__dirname, theme + '-dialog-' + width + '.png') });
        await page.keyboard.press('Escape');
        await dialogClosed(page);
        assert.equal(await page.locator('[data-open="arinox"]').evaluate(element => element === document.activeElement), true);
      }
      await page.setViewportSize({ width: 1440, height: 1100 });
      await page.keyboard.press('Control+k');
      assert.equal(await page.locator('#search').evaluate(element => element === document.activeElement), true);
      await page.locator('#search').fill('不存在的关键词');
      assert.equal(await page.locator('[data-project]').count(), 0);
      assert.equal(await page.locator('#empty-state').isVisible(), true);
      await page.getByRole('button', { name: '查看全部项目', exact: true }).click();
      await projectCount(page, 3);
      await page.locator('[data-nav="favorites"]').click();
      await projectCount(page, 1);
      await page.locator('[data-menu="arinox"]').click();
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('[data-menu-action="favorite"]').evaluate(element => element === document.activeElement), true);
      await page.keyboard.press('Enter');
      await projectCount(page, 0);
      assert.equal(await page.locator('#new-project').evaluate(element => element === document.activeElement), true);
      await page.locator('[data-nav="all"]').click();
      await page.locator('[data-filter="done"]').click();
      await projectCount(page, 1);
      await page.getByRole('button', { name: '新建项目', exact: true }).click();
      const title = page.locator('input[name="title"]');
      await title.fill('   ');
      await page.getByRole('button', { name: '保存项目', exact: true }).click();
      assert.equal(await title.evaluate(input => input.checkValidity()), false);
      await title.fill('新想法 <img src=x onerror=alert(1)>');
      await page.locator('textarea[name="description"]').fill('一份保存在本机的测试项目。');
      await page.locator('select[name="category"]').selectOption({ label: '灵感收集' });
      await page.getByRole('button', { name: '保存项目', exact: true }).click();
      await dialogClosed(page);
      assert.equal(await page.locator('#project-dialog').count(), 0);
      assert.equal(await page.locator('[data-project]').count(), 4);
      assert.equal(await page.locator('#projects img').count(), 0);
      const newProject = page.getByRole('button', { name: '新想法 <img src=x onerror=alert(1)>', exact: true });
      await newProject.click();
      await page.locator('select[name="status"]').selectOption('done');
      await page.getByRole('button', { name: '保存项目', exact: true }).click();
      await dialogClosed(page);
      await page.locator('[data-filter="done"]').click();
      await projectCount(page, 2);
      await page.locator('#desk-note').fill('自动保存的手边笔记');
      await page.waitForFunction(() => document.getElementById('note-status').textContent.includes('已保存在'));
      await page.locator('[data-todo="1"]').check();
      await page.locator('#theme-toggle').click();
      const expectedTheme = theme === 'light' ? 'night' : 'day';
      await page.reload({ waitUntil: 'load' });
      assert.equal(await page.locator('#desk-note').inputValue(), '自动保存的手边笔记');
      assert.equal(await page.locator('[data-todo="1"]').isChecked(), true);
      assert.equal(await page.locator('html').getAttribute('data-theme'), expectedTheme);
      assert.equal(await page.locator('[data-project]').count(), 4);
      const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
      assert.equal(new Set(ids).size, ids.length);
      results.push({ check: theme + '/create-edit-filter-favorite-focus-persistence-safe-text', passed: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('[data-open="arinox"]').click();
      assert.ok(await page.locator('#project-dialog').evaluate(element => parseFloat(getComputedStyle(element).animationDuration) <= .001));
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('#project-dialog').evaluate(element => element.contains(document.activeElement)), true);
      await page.keyboard.press('Escape');
      results.push({ check: theme + '/reduced-motion-and-dialog-focus', passed: true });
      await context.close();
    }
    const touchContext = await browser.newContext({ viewport: { width: 320, height: 920 }, isMobile: true, hasTouch: true });
    const touchPage = await touchContext.newPage();
    track(touchPage);
    await touchPage.goto(url, { waitUntil: 'load' });
    await checkBounds(touchPage, '320/touch-cards');
    await touchPage.getByRole('button', { name: '新建项目', exact: true }).click();
    await touchPage.locator('#project-dialog').evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))));
    await checkBounds(touchPage, '320/touch-dialog');
    const touchChecks = await touchPage.locator('#project-dialog button').evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 44));
    assert.equal(touchChecks, true);
    await touchContext.close();
    const corruptContext = await browser.newContext();
    const corruptPage = await corruptContext.newPage();
    track(corruptPage);
    await corruptPage.goto(url, { waitUntil: 'load' });
    await corruptPage.evaluate(() => {
      document.getElementById('theme-toggle').click();
      const saved = JSON.parse(localStorage.getItem('arinox-fusion-v1'));
      saved.projects[0].id = 123;
      localStorage.setItem('arinox-fusion-v1', JSON.stringify(saved));
    });
    const unreadableRaw=await corruptPage.evaluate(() => localStorage.getItem('arinox-fusion-v1')); await corruptPage.reload({ waitUntil: 'load' });
    assert.equal(await corruptPage.locator('[data-project="arinox"]').count(), 1);
    assert.ok((await corruptPage.locator('#toast').textContent()).includes('未能读取'));
    await corruptPage.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('quota', 'QuotaExceededError'); }; });
    await corruptPage.locator('#new-project').click();
    await corruptPage.locator('input[name="title"]').fill('保存失败时保留在页面');
    await corruptPage.getByRole('button', { name: '保存项目', exact: true }).click();
    assert.equal(await corruptPage.locator('[data-project]').count(), 4);
    assert.ok((await corruptPage.locator('#toast').textContent()).includes('原记录未覆盖')); assert.equal(await corruptPage.evaluate(() => localStorage.getItem('arinox-fusion-v1')), unreadableRaw);
    assert.equal(await corruptPage.locator('#storage-status').textContent(), '暂时仅保留在当前页面');
    results.push({ check: 'corrupt-storage-and-storage-failure', passed: true });
    await corruptContext.close();
    const quotaContext = await browser.newContext(); const quotaPage=await quotaContext.newPage(); track(quotaPage);
    await quotaPage.goto(url); await quotaPage.locator('#projects').waitFor();
    await quotaPage.evaluate(() => { Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError');}; });
    await quotaPage.locator('#new-project').click(); await quotaPage.locator('input[name="title"]').fill('quota failure'); await quotaPage.getByRole('button',{name:'保存项目',exact:true}).click(); await dialogClosed(quotaPage);
    assert.equal(await quotaPage.locator('[data-project]').count(),4); assert.ok((await quotaPage.locator('#toast').textContent()).includes('暂时无法保存')); assert.equal(await quotaPage.locator('#storage-status').textContent(),'暂时仅保留在当前页面');
    results.push({check:'valid-workspace-quota-failure-keeps-in-memory',passed:true}); await quotaContext.close();
    const limitContext = await browser.newContext();
    const limitPage = await limitContext.newPage();
    track(limitPage);
    await limitPage.goto(url, { waitUntil: 'load' });
    await limitPage.evaluate(() => {
      document.getElementById('theme-toggle').click();
      const saved = JSON.parse(localStorage.getItem('arinox-fusion-v1'));
      saved.projects = Array.from({ length: 50 }, (_, index) => ({ ...saved.projects[0], id: 'project-' + index, title: '示例项目 ' + index }));
      localStorage.setItem('arinox-fusion-v1', JSON.stringify(saved));
    });
    await limitPage.reload({ waitUntil: 'load' });
    await limitPage.locator('#new-project').click();
    await limitPage.locator('input[name="title"]').fill('第 51 个项目');
    await limitPage.getByRole('button', { name: '保存项目', exact: true }).click();
    assert.equal(await limitPage.locator('#project-dialog').evaluate(element => element.open), true);
    assert.ok((await limitPage.locator('#dialog-description').textContent()).includes('50'));
    assert.equal(await limitPage.locator('#dialog-description').getAttribute('aria-live'), 'polite');
    assert.equal(await limitPage.locator('[data-project]').count(), 50);
    results.push({ check: 'project-limit-accessible-feedback', passed: true });
    await limitContext.close();
    assert.deepEqual(errors, []);
    assert.deepEqual([...requests], [new URL(url).origin]);
    const report = { passed: true, browser: 'Microsoft Edge ' + browser.version(), checks: results.length, results, externalRequests: 0, errors };
    fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: true, checks: results.length, externalRequests: 0, errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
