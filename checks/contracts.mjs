import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import postcss from 'postcss';
function walk(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(root,entry.name)):[path.join(root,entry.name)]);}
for(const file of walk('src').filter(file=>/\.tsx?$/.test(file))) assert.ok(!/localStorage|sessionStorage|setTimeout|innerHTML/.test(fs.readFileSync(file,'utf8')), 'Library must not own business storage/timers: '+file);
for(const file of walk('examples').filter(file=>/\.tsx?$/.test(file))){const source=fs.readFileSync(file,'utf8');assert.ok(!/from\s+['"][^'"]*(?:\/src\/components|\/lib\/components)/.test(source),'Private component import: '+file);}
for(const file of walk('src/styles').filter(file=>file.endsWith('.css'))){postcss.parse(fs.readFileSync(file,'utf8')).walkRules(rule=>{let parent=rule.parent;while(parent){if(parent.type==='atrule'&&parent.name.endsWith('keyframes'))return;parent=parent.parent;}for(const selector of rule.selectors)assert.ok(selector.includes('.ax-theme'),'Unscoped element rule: '+selector);if(rule.selector.includes('.ax-dialog')&&!rule.selector.includes('::backdrop'))rule.walkDecls(decl=>assert.ok(!decl.prop.startsWith('animation'),'CSS competes with Anime dialog: '+file));});}
const baseline=JSON.parse(fs.readFileSync('checks/readonly-baseline.json','utf8').replace(/^\uFEFF/,''));const assets=baseline.Fusion.filter(row=>row.Path.includes('\\dist\\assets\\'));
for(const asset of assets){const relative=asset.Path.split('\\dist\\assets\\')[1];for(const target of ['src/assets','lib/assets']){const file=path.join(target,relative);assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase(),asset.Hash,file);}}
const pack=JSON.parse(fs.readFileSync('checks/pack-manifest.json','utf8').replace(/^\uFEFF/,''))[0],lock=JSON.parse(fs.readFileSync('checks/consumer/package-lock.json','utf8'));
assert.equal(lock.packages['node_modules/@arinox/react'].integrity,pack.integrity);
const installed='checks/consumer/node_modules/@arinox/react';
for(const file of walk('lib'))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),createHash('sha256').update(fs.readFileSync(path.join(installed,file))).digest('hex'),'Packed library stale: '+file);
fs.writeFileSync('checks/contract-results.json',JSON.stringify({libraryStorageOrFixedCompletionTimers:false,scopedElementStyles:true,publicEntryConsumption:true,assetsPreserved:assets.length,packageFiles:pack.files.length,consumerIntegrityMatches:true,installedLibraryMatchesBuild:true},null,2));
console.log('PASS public/style/motion/storage/assets/package contracts');
