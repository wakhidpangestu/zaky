import { test } from 'node:test';
import assert from 'node:assert/strict';
import { journeyPose, chapterProgress } from '../../src/lib/office/journey.ts';
test('journey clamps invalid progress and moves from exterior through all five real workstations', () => {
  assert.equal(journeyPose(NaN).chapter, 0);
  assert.equal(journeyPose(-10).chapter, 0);
  assert.equal(journeyPose(2).chapter, 5);
  assert.equal(journeyPose(chapterProgress(1)).character[0], 0);
  assert.equal(journeyPose(chapterProgress(5)).character[0], 56);
  assert.ok(journeyPose(chapterProgress(1)).zoom > journeyPose(0).zoom);
});
test('camera and character remain continuous at every stage boundary', () => {
  for (const p of [0.14, 0.34, 0.54, 0.74, 0.94]) {
    const a = journeyPose(p - 0.00001),
      b = journeyPose(p + 0.00001);
    assert.ok(Math.abs(a.character[0] - b.character[0]) < 0.02);
    assert.ok(Math.abs(a.target[0] - b.target[0]) < 0.02);
  }
});
test('reduced motion snaps to a station without a long camera flight', () => {
  const p = journeyPose(0.52, true),
    at = journeyPose(chapterProgress(p.chapter));
  assert.deepEqual(p.character, at.character);
  assert.deepEqual(p.target, at.target);
});
