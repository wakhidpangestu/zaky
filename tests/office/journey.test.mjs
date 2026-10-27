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
test('camera pauses at reference work areas instead of drifting throughout each chapter', () => {
  for (const [a, b] of [
    [0, 0.06],
    [0.17, 0.26],
    [0.37, 0.46],
    [0.57, 0.66],
    [0.77, 0.86],
    [0.97, 1],
  ]) {
    assert.deepEqual(journeyPose(a).target, journeyPose(b).target);
    assert.deepEqual(journeyPose(a).character, journeyPose(b).character);
  }
});
test('the final records counter shares the approval room and needs only a short camera pan', () => {
  const approval = journeyPose(chapterProgress(4)),
    records = journeyPose(chapterProgress(5));
  assert.ok(records.target[0] - approval.target[0] > 0);
  assert.ok(records.target[0] - approval.target[0] < 8);
  assert.ok(Math.abs(records.character[0] - approval.character[0]) < 8);
});
test('camera changes azimuth entering the frontal interior and character follows a curved floor route', () => {
  const outside = journeyPose(0),
    inside = journeyPose(chapterProgress(1));
  const azimuth = (p) => Math.atan2(p.position[0] - p.target[0], p.position[2] - p.target[2]);
  assert.ok(azimuth(outside) > azimuth(inside) * 2);
  const stops = Array.from(
    { length: 5 },
    (_, i) => journeyPose(chapterProgress(i + 1)).character[2],
  );
  assert.ok(
    new Set(stops).size > 2,
    'character should visit counters, not stay on a straight corridor',
  );
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
test('zoom does not multiply the intended horizontal framing offset and push desks offscreen', () => {
  assert.equal(typeof journey.journeyFrustum, 'function');
  for (const aspect of [390 / 500, 1024 / 576, 1440 / 900])
    for (let i = 0; i < 6; i++) {
      const pose = journeyPose(chapterProgress(i));
      const f = journey.journeyFrustum(aspect, pose.zoom, 0.27);
      const camera = new T.OrthographicCamera(f.left, f.right, f.top, f.bottom, 0.1, 160);
      camera.position.set(...pose.position);
      camera.lookAt(new T.Vector3(...pose.target));
      camera.zoom = pose.zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const point = new T.Vector3(...pose.target).project(camera);
      assert.ok(Math.abs(point.x - 0.27) < 1e-8, 'camera target remains at 63.5% viewport width');
      assert.ok(Math.abs(point.y) < 1e-8);
    }
});
test('reduced motion snaps to a documented stop without a long camera flight', () => {
  const p = journeyPose(0.52, true),
    at = journeyPose(chapterProgress(p.chapter));
  assert.deepEqual(p.character, at.character);
  assert.deepEqual(p.target, at.target);
});
test('reduced motion also snaps avatar heading without scheduling extra turning frames', () => {
  assert.equal(typeof journey.journeyHeading, 'function');
  assert.deepEqual(journey.journeyHeading(0, Math.PI, 0.016, true), {
    angle: Math.PI,
    moving: false,
  });
  const normal = journey.journeyHeading(0, Math.PI, 0.016, false);
  assert.ok(normal.angle > 0 && normal.angle < Math.PI);
  assert.equal(normal.moving, true);
  const wrapped = journey.journeyHeading(Math.PI - 0.1, -Math.PI + 0.1, 0.016, false);
  assert.ok(wrapped.angle > Math.PI - 0.1, 'turn through the shortest angle');
  assert.deepEqual(journey.journeyHeading(1, 1.0001, 0.016, false), {
    angle: 1.0001,
    moving: false,
  });
});
