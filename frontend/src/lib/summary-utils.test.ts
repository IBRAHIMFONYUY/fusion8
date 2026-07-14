import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLocalSummary } from './summary-utils';

test('buildLocalSummary returns a useful fallback summary for lesson content', () => {
  const content = [
    'Week 1: Introduction to electronics.',
    'Students learn how to read a circuit diagram and use a breadboard.',
    'They build a simple LED circuit and test it with a battery.',
  ].join('\n');

  const summary = buildLocalSummary(content);

  assert.match(summary, /electronics/i);
  assert.match(summary, /breadboard/i);
  assert.match(summary, /LED/i);
});
