// Local structural/interaction checks; visual browser review is still separate.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const folder = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(folder, 'index.html'), 'utf8');
const css = readFileSync(resolve(folder, 'studio.css'), 'utf8');
const js = readFileSync(resolve(folder, 'studio.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'IDs must be unique');
for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  if (value.startsWith('#')) assert.ok(ids.includes(value.slice(1)), `Missing anchor: ${value}`);
  else if (!/^(https?:|mailto:)/.test(value)) assert.ok(existsSync(resolve(folder, value.split('?')[0])), `Missing file: ${value}`);
}
for (const [, value] of html.matchAll(/\baria-labelledby="([^"]+)"/g)) {
  for (const id of value.split(' ')) assert.ok(ids.includes(id), `Missing accessible label: ${id}`);
}
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.ok(css.includes('prefers-reduced-motion:reduce'));
assert.ok(css.includes('@media print'));
assert.ok(css.includes(':focus-visible'));

const elements = Object.fromEntries(ids.map(id => [id, {
  textContent: '',
  addEventListener(event, callback) { this[event] = callback; }
}]));
const buttons = ['quick', 'driver'].map(flow => ({
  dataset: { flow }, attributes: {},
  setAttribute(key, value) { this.attributes[key] = value; },
  addEventListener(event, callback) { this[event] = callback; }
}));
let printCalls = 0;
runInNewContext(js, {
  document: {
    querySelectorAll(selector) { assert.equal(selector, '[data-flow]'); return buttons; },
    getElementById(id) { assert.ok(elements[id], `JS target missing: ${id}`); return elements[id]; }
  },
  window: { print() { printCalls++; } }
});
buttons[1].click();
assert.equal(buttons[1].attributes['aria-pressed'], 'true');
assert.equal(buttons[0].attributes['aria-pressed'], 'false');
assert.equal(elements['flow-action'].textContent, '수락 → 운행 → 결제');
assert.equal(elements['flow-complete'].textContent, '콜 대기 화면 복귀 확인');
assert.match(elements['flow-announcement'].textContent, /대리 운행/);
buttons[0].click();
assert.equal(buttons[0].attributes['aria-pressed'], 'true');
assert.equal(buttons[1].attributes['aria-pressed'], 'false');
assert.equal(elements['flow-action'].textContent, '수락 → 픽업 → 배송');
assert.equal(elements['flow-complete'].textContent, '직접 수령 서명 완료 확인');
elements['print-button'].click();
assert.equal(printCalls, 1);
console.log('PASS: local files, anchors, IDs, accessible labels, both flow transitions, print action.');
console.log('NOTE: These are structural/unit checks, not browser rendering or accessibility certification.');
