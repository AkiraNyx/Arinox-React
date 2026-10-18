const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const http=require('node:http');
const {chromium}=require('C:/Users/AkiraNyx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const root=path.resolve(__dirname,'consumer/dist');const errors=[];
  const server=http.createServer((request,response)=>{try{const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';response.setHeader('Content-Type',mime);fs.createReadStream(file).on('error',()=>{response.statusCode=404;response.end();}).pipe(response);}catch{response.writeHead(400);response.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
  try{
    await page.goto(url);await page.locator('#consumer-open').waitFor();assert.equal(await page.locator('#host').evaluate(element=>getComputedStyle(element).borderRadius),'0px');assert.equal(await page.locator('.ax-theme').evaluate(element=>getComputedStyle(element).getPropertyValue('--ax-color-bg-default').trim()),'#070a12');
    await page.locator('#consumer-open').click();await page.waitForFunction(()=>document.getElementById('consumer-dialog')?.dataset.motionState==='open');assert.equal(await page.locator('#consumer-name').evaluate(element=>element===document.activeElement),true);
    assert.equal(await page.locator('#consumer-dialog').evaluate(element=>Number(getComputedStyle(element).opacity)),1);
    assert.ok(await page.locator('#consumer-dialog').evaluate(element=>getComputedStyle(element).backdropFilter.includes('22px')));
    await page.locator('#consumer-menu-trigger').click();await page.waitForFunction(()=>document.getElementById('consumer-menu')?.dataset.motionState==='open');assert.equal(await page.locator('#consumer-action').evaluate(element=>element===document.activeElement),true);
    assert.ok(await page.locator('#consumer-menu').evaluate(element=>{const trigger=document.getElementById('consumer-menu-trigger').getBoundingClientRect(),bounds=element.getBoundingClientRect();return bounds.right<=innerWidth&&bounds.left>=0&&Math.abs(bounds.top-trigger.bottom-8)<2;}));
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('consumer-menu'));assert.equal(await page.locator('#consumer-dialog').evaluate(element=>element.open&&!element.inert),true);
    await page.locator('#consumer-menu-trigger').click();await page.waitForFunction(()=>document.getElementById('consumer-menu')?.dataset.motionState==='open');
    await page.keyboard.press('Tab');await page.waitForFunction(()=>!document.getElementById('consumer-menu'));assert.equal(await page.locator('#consumer-close').evaluate(element=>element===document.activeElement),true);
    await page.locator('#consumer-menu-trigger').click();await page.waitForFunction(()=>document.getElementById('consumer-menu')?.dataset.motionState==='open');
    await page.locator('#consumer-action').click();await page.waitForFunction(()=>!document.getElementById('consumer-menu'));assert.equal(await page.locator('#selected').textContent(),'操作 1');assert.equal(await page.locator('#consumer-menu-trigger').evaluate(element=>element===document.activeElement),true);
    await page.locator('#consumer-close').click();await page.waitForFunction(()=>!document.getElementById('consumer-dialog'));assert.equal(await page.locator('#consumer-open').evaluate(element=>element===document.activeElement),true);assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(__dirname,'consumer-results.json'),JSON.stringify({passed:true,tarballInstalled:true,independentTypesAndBuild:true,nestedMenuDialogFocus:true,errors},null,2));console.log('PASS external consumer types/build/scoped styles/nested overlays');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
