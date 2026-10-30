import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { SignJWT } from 'jose';
import { spawn } from 'node:child_process';
import { readFile, mkdir, open, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../../', import.meta.url));
const port = String(32000 + Math.floor(Math.random() * 10000));
export const base = 'http://127.0.0.1:' + port;
export const ids = {
  budi: '11111111-1111-1111-1111-111111111111',
  dewi: '33333333-3333-3333-3333-333333333333',
  rian: '44444444-4444-4444-4444-444444444444',
  hari: '22222222-2222-2222-2222-222222222222',
};
const secret = 'isolated-test-only-' + crypto.randomUUID();
export async function testServer() {
  const db = new PGlite({ extensions: { pgcrypto } });
  let server, app, log;
  async function close() {
    if (app && app.exitCode === null) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 2000);
        app.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
        try {
          process.kill(-app.pid, 'SIGTERM');
        } catch {
          clearTimeout(timer);
          resolve();
        }
      });
    }
    await server?.stop();
    await db.close();
    await log?.close();
  }
  try {
    for (const f of [
      '001_initial_schema.sql',
      '002_seed_demo.sql',
      '003_stored_procedures.sql',
      '004_office_chat.sql',
      '005_office_workflow.sql',
      '006_office_operations.sql',
    ])
      await db.exec(await readFile(root + 'db/migrations/' + f, 'utf8'));
    server = new PGLiteSocketServer({
      db,
      port: 55433,
      host: '127.0.0.1',
      maxConnections: 20,
      inspect: process.env.ZAKY_SQL_TRACE === 'true',
    });
    await server.start();
    await mkdir(root + '.next/experience-results', { recursive: true });
    log = await open(root + '.next/experience-results/api-server.log', 'w');
    if (process.env.ZAKY_FRESH_TEST_CACHE === 'true')
      await rename(root + '.next/dev', '/tmp/zaky-experience-cache-' + Date.now()).catch(() => {});
    app = spawn(
      process.execPath,
      ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', port],
      {
        cwd: root,
        detached: true,
        stdio: ['ignore', log.fd, log.fd],
        env: {
          ...process.env,
          DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:55433/postgres',
          JWT_SECRET: secret,
          OFFICE_WORKFLOW_ENABLED: 'true',
          OFFICE_WORKFLOW_DEMO_ACK: 'true',
          APP_URL: base,
        },
      },
    );
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        const r = await fetch(base + '/login');
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 400));
    }
    if (!ready)
      throw new Error(
        'Isolated Next server did not start; inspect .next/experience-results/api-server.log',
      );
    async function cookie(who) {
      const value = await new SignJWT({
        userId: ids[who],
        lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        unitId: 'untrusted-jwt-unit',
        peran: 'untrusted-jwt-role',
        nama: who,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(new TextEncoder().encode(secret));
      return 'zaky-session=' + value;
    }
    return { db, close, cookie };
  } catch (e) {
    await close();
    throw e;
  }
}
