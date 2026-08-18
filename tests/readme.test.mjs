import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mdTable, renderBlock, findBlock, replaceBlock } from '../scripts/lib/readme.mjs';

test('mdTable pads columns and rejects ragged rows', () => {
  const t = mdTable(['A', 'Long'], [['x', '1'], ['yy', '22']]);
  assert.equal(t, '| A  | Long |\n| -- | ---- |\n| x  | 1    |\n| yy | 22   |');
  assert.throws(() => mdTable(['A'], [['x', 'y']]), /ragged/);
});

test('marker blocks: render, find, replace; blank-line padding is preserved', () => {
  const doc = 'before\n\n<!-- verify:t:start -->\n\nold\n\n<!-- verify:t:end -->\n\nafter\n';
  assert.ok(findBlock(doc, 't'));
  assert.equal(findBlock(doc, 'missing'), null);
  const next = replaceBlock(doc, 't', 'new body\n');
  assert.equal(next, 'before\n\n' + renderBlock('t', 'new body') + '\n\nafter\n');
  assert.equal(renderBlock('t', 'x'), '<!-- verify:t:start -->\n\nx\n\n<!-- verify:t:end -->');
  assert.throws(() => replaceBlock(doc, 'missing', 'x'), /missing marker block "missing"/);
  assert.throws(() => findBlock('<!-- verify:t:start -->\nno end', 't'), /without a matching end marker/);
});
