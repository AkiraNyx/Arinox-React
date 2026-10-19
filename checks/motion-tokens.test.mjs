import assert from 'node:assert/strict';
import { test } from 'node:test';
import { motionTokens } from '../lib/motion.js';

test('motion tokens accept equivalent milliseconds and production-minified seconds', () => {
  const previous = globalThis.getComputedStyle;
  try {
    for (const [unit, values] of [
      ['ms', ['120ms', '200ms', '320ms']],
      ['s', ['.12s', '.2s', '.32s']],
    ]) {
      globalThis.getComputedStyle = () => ({ getPropertyValue: name => {
        const index = ['fast', 'base', 'slow'].findIndex(key => name.endsWith('-' + key));
        return index < 0 ? '' : values[index];
      } });
      const { fast, base, slow } = motionTokens({});
      assert.deepEqual([fast, base, slow], [120, 200, 320], unit);
    }
    for (const [raw, expected] of [['0ms', 0], ['0s', 0], [' 0.2S ', 200], ['', 200], ['bad', 200], ['-1s', 200], ['200', 200], ['Infinitys', 200]]) {
      globalThis.getComputedStyle = () => ({ getPropertyValue: () => raw });
      assert.equal(motionTokens({}).base, expected, raw);
    }
  } finally {
    if (previous === undefined) delete globalThis.getComputedStyle;
    else globalThis.getComputedStyle = previous;
  }
});
