import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const baseline = JSON.parse((await readFile(new URL('./readonly-baseline.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''));
for (const [group, rows] of Object.entries(baseline)) {
  for (const { Path: file, Hash: hash } of rows) assert.equal(createHash('sha256').update(await readFile(file)).digest('hex').toUpperCase(), hash, file);
  if (group === 'Fusion') {
    async function walk(root) { const entries = await readdir(root, { withFileTypes: true }); return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(root + '/' + entry.name) : root + '/' + entry.name))).flat(); }
    assert.equal((await walk(fileURLToPath(new URL('../../arinox-fusion', import.meta.url)))).length, rows.length);
  }
  console.log(group + ': ' + rows.length + ' files unchanged');
}
