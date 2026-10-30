import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as journey from '../../src/lib/office/journey.ts';
const { journeyPose, chapterProgress } = journey;
test('journey clamps invalid input and reaches all five existing workstation IDs', () => {
  assert.equal(journeyPose(NaN).chapter, 0);
  assert.equal(journeyPose(-10).chapter, 0);
  assert.equal(journeyPose(2).chapter, 5);
  for (let i = 0; i < 6; i++) assert.equal(journeyPose(chapterProgress(i)).chapter, i);
  assert.ok(journeyPose(chapterProgress(1)).zoom > journeyPose(0).zoom);
});
test('camera holds still around each desk while its copy is read', () => {
  // Inside, every chapter stop is a hold window: no camera or avatar drift around the key.
  for (let i = 1; i < 6; i++) {
    const key = chapterProgress(i);
    // The first desk is reached by the exterior dive, so it only holds after its key.
    for (const t of [i > 1 ? key - 0.03 : key, key + 0.03].map((v) => Math.min(1, v))) {
      assert.deepEqual(journeyPose(t).target, journeyPose(key).target);
      assert.deepEqual(journeyPose(t).character, journeyPose(key).character);
      assert.equal(journeyPose(t).walking, false);
    }
  }
});
test('each workstation is one room further along a constant room spacing', () => {
  for (let i = 1; i < 5; i++) {
    const a = journeyPose(chapterProgress(i)),
      b = journeyPose(chapterProgress(i + 1));
    assert.equal(b.target[0] - a.target[0], journey.ROOM_SPACING);
    assert.equal(b.character[0] - a.character[0], journey.ROOM_SPACING);
  }
});
test('camera keeps one isometric azimuth and the character follows a curved floor route', () => {
  const azimuth = (p) => Math.atan2(p.position[0] - p.target[0], p.position[2] - p.target[2]);
  for (let i = 0; i < 6; i++)
    assert.ok(Math.abs(azimuth(journeyPose(chapterProgress(i))) - azimuth(journeyPose(0))) < 1e-9);
  // Between two desks the avatar leaves the desk line towards the door and comes back.
  const depths = Array.from({ length: 21 }, (_, i) => journeyPose(0.14 + (0.2 * i) / 20).character[2]);
  assert.ok(Math.max(...depths) > Math.min(...depths) + 2, 'character should curve through the side door');
});
test('camera and avatar stay continuous, reversible and finite through every transition', () => {
  for (let i = 1; i <= 1000; i++) {
    const a = journeyPose((i - 1) / 1000),
      b = journeyPose(i / 1000);
    for (const key of ['position', 'target', 'character']) {
      assert.ok(b[key].every(Number.isFinite));
      assert.ok(Math.hypot(...b[key].map((n, j) => n - a[key][j])) < 0.8);
    }
    assert.deepEqual(b, journeyPose(i / 1000));
  }
});
test('the dive zooms about the front door, then hands framing back before the rooms', () => {
  const before = journeyPose(journey.JOURNEY_CUT - 0.001),
    after = journeyPose(chapterProgress(1));
  assert.equal(before.pivot, 1);
  assert.equal(before.inside, false);
  assert.ok(before.zoom > after.zoom, 'the facade fills the view at the cut');
  assert.equal(after.pivot, 0);
  assert.equal(after.inside, true);
});
test('reduced motion snaps to a documented stop without a long camera flight', () => {
  const p = journeyPose(0.52, true),
    at = journeyPose(chapterProgress(p.chapter));
  assert.deepEqual(p.character, at.character);
  assert.deepEqual(p.target, at.target);
});
test('reduced motion never reports a walking avatar or a turning heading', () => {
  for (let i = 0; i <= 100; i++) {
    const p = journeyPose(i / 100, true);
    assert.equal(p.walking, false);
    assert.equal(p.facing, Math.PI);
  }
});
