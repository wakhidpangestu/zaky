import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
test('standard entry lazy-loads 3D', () => {
  const s = source('src/components/office/gateway.tsx');
  assert.match(s, /dynamic\(\(\) => import\('\.\/simulator-view'\)/);
  assert.doesNotMatch(s, /from ['"]three/);
  assert.match(s, /mode === '3d'/);
});
test('scenes release resources and react to resize', () => {
  for (const file of ['src/components/journey/scene.tsx', 'src/components/office/sim-scene.tsx']) {
    const s = source(file);
    for (const term of [
      'ResizeObserver',
      'cancelAnimationFrame',
      'renderer?.dispose()',
      'world?.dispose()',
      'webglcontextlost',
    ])
      assert.ok(s.includes(term), file + ': ' + term);
  }
});
test('dashboard cards are draggable, saved per account and fed by the live office', () => {
  const s = source('src/components/office/dashboard-board.tsx');
  for (const term of ['DndContext', 'KeyboardSensor', "type: 'layout'", 'useSim'])
    assert.ok(s.includes(term), term);
  const stream = source('src/app/api/simulator/stream/route.ts');
  assert.match(stream, /text\/event-stream/);
  assert.match(stream, /getSession/);
  assert.match(stream, /abort/);
  assert.match(source('src/components/dashboard-shell.tsx'), /NotificationBell/);
});
test('simulator only talks to its own demo store, never institution finances', () => {
  for (const file of [
    'src/components/office/simulator-view.tsx',
    'src/components/office/sim-panels.tsx',
    'src/components/office/sim-scene.tsx',
    'src/lib/office/simulator.ts',
    'src/lib/office/sim-world.ts',
    'src/lib/office/sim-store.ts',
    'src/app/api/simulator/route.ts',
    'src/app/api/simulator/stream/route.ts',
    'src/components/office/sim-provider.tsx',
    'src/components/office/dashboard-board.tsx',
  ]) {
    const s = source(file);
    assert.ok(s.length > 0, file);
    assert.doesNotMatch(s, /savePenyaluran|savePosDana|\/api\/office|@\/lib\/db|from ['"]pg['"]/, file);
  }
  const route = source('src/app/api/simulator/route.ts');
  assert.match(route, /getSession/);
  assert.match(route, /sameOrigin/);
});
test('chat guards tenant, origin, identity and idempotency', () => {
  const s = source('src/app/api/office/chat/route.ts');
  for (const term of [
    'OFFICE_CHAT_ENABLED',
    'getSession',
    'APP_URL',
    'lembaga_id',
    'aktif',
    'pg_advisory_xact_lock',
    'ON CONFLICT',
    'parseChatInput',
  ])
    assert.ok(s.includes(term), term);
});
test('old quiz leads to real dashboard', () =>
  assert.match(source('src/app/gamifikasi/page.tsx'), /redirect\('\/dasbor'\)/));
test('standard mode shows the dashboard without loading 3D', () => {
  const s = source('src/components/office/standard-view.tsx');
  assert.match(s, /DashboardBoard/);
  assert.doesNotMatch(s, /from ['"].*(scene|three)['"]/);
});
test('embedding cannot recurse into another 3D office', () => {
  const s = source('src/components/office/gateway.tsx');
  assert.match(s, /setEmbedded\(true\)/);
  assert.match(s, /mode && !embedded/);
});
