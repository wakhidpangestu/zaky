import test from 'node:test';
import assert from 'node:assert/strict';
import { connectSnapshotStream } from '../../src/lib/office/stream-connection.ts';
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
function setup(refresh = async () => true) {
  const streams = [],
    timers = new Map(),
    states = [],
    snapshots = [];
  let active = true,
    id = 0;
  const connection = connectSnapshotStream({
    refresh,
    active: () => active,
    state: (s) => states.push(s),
    snapshot: (s) => snapshots.push(s),
    open: () => {
      const listeners = {};
      const s = {
        readyState: 1,
        closed: false,
        onerror: null,
        close() {
          this.closed = true;
        },
        addEventListener(n, f) {
          listeners[n] = f;
        },
        emit(n, data) {
          listeners[n]?.({ data });
        },
      };
      streams.push(s);
      return s;
    },
    schedule: (fn, delay) => {
      timers.set(++id, { fn, delay });
      return id;
    },
    cancel: (id) => timers.delete(id),
  });
  return {
    connection,
    streams,
    timers,
    states,
    snapshots,
    setActive: (v) => (active = v),
    fire() {
      const [key, timer] = timers.entries().next().value;
      timers.delete(key);
      timer.fn();
    },
  };
}
test('explicit unavailable closes the stream and reconnects after refreshing authority', async () => {
  const h = setup();
  await settle();
  assert.equal(h.streams.length, 1);
  h.streams[0].emit('unavailable');
  assert.equal(h.streams[0].closed, true);
  assert.equal(h.timers.size, 1);
  h.fire();
  await settle();
  assert.equal(h.streams.length, 2);
  h.streams[1].emit('snapshot', '{"version":2}');
  assert.deepEqual(h.snapshots, [{ version: 2 }]);
  assert.equal(h.states.at(-1), 'live');
  h.connection.dispose();
});
test('network and authorization refresh failures back off without claiming live', async () => {
  const h = setup(async () => false);
  await settle();
  assert.equal(h.timers.values().next().value.delay, 1000);
  h.fire();
  await settle();
  assert.equal(h.timers.values().next().value.delay, 2000);
  assert.equal(h.streams.length, 0);
  assert.equal(h.states.at(-1), 'reconnecting');
  h.connection.dispose();
  assert.equal(h.timers.size, 0);
});
test('pause and cleanup cancel reconnect and ignore late refresh and snapshots', async () => {
  let resolve;
  const h = setup(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  h.setActive(false);
  h.connection.resume();
  resolve(true);
  await settle();
  assert.equal(h.streams.length, 0);
  h.connection.dispose();
  assert.equal(h.timers.size, 0);
  const running = setup();
  await settle();
  running.streams[0].emit('unavailable');
  running.connection.dispose();
  running.streams[0].emit('snapshot', '{}');
  assert.equal(running.timers.size, 0);
  assert.equal(running.snapshots.length, 0);
});
test('native reconnect remains native while CONNECTING, CLOSED recreates connection', async () => {
  const h = setup();
  await settle();
  h.streams[0].readyState = 0;
  h.streams[0].onerror();
  assert.equal(h.timers.size, 0);
  h.streams[0].readyState = 2;
  h.streams[0].onerror();
  assert.equal(h.timers.size, 1);
  h.connection.dispose();
});
