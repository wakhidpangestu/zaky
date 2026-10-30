/**
 * Demo persistence for Zaky Simulator: one JSON file shared by every account on this server.
 * Operations run one at a time; if the disk is read-only the office still works in memory.
 * Every change bumps a version and notifies live subscribers (the SSE stream).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createWorld, tick, type SimWorld } from './sim-world.ts';

const FILE = path.join(process.cwd(), '.data', 'zaky-simulator.json');
const TICK_MS = 5000;
type Listener = (version: number) => void;
// Survive module reloads in development so every route shares one office.
const shared = globalThis as typeof globalThis & {
  __zakySim?: {
    world: SimWorld | null;
    queue: Promise<unknown>;
    diskWarned: boolean;
    version: number;
    listeners: Set<Listener>;
    timer: ReturnType<typeof setInterval> | null;
  };
};
// Fill fields one by one: an object left by an older module version may lack newer ones.
const state = (shared.__zakySim ??= {} as NonNullable<typeof shared.__zakySim>);
state.world ??= null;
state.queue ??= Promise.resolve();
state.diskWarned ??= false;
state.version ??= 0;
state.listeners ??= new Set();
state.timer ??= null;

async function load(): Promise<SimWorld> {
  if (state.world) return state.world;
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, 'utf8')) as SimWorld;
    if (parsed?.version === 1) return (state.world = parsed);
  } catch {
    /* no saved office yet */
  }
  state.world = createWorld();
  await save(state.world);
  return state.world;
}

async function save(world: SimWorld) {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(world));
    await fs.rename(tmp, FILE);
  } catch (error) {
    if (!state.diskWarned) console.warn('Zaky Simulator: saved in memory only', error);
    state.diskWarned = true;
  }
}

function broadcast() {
  state.version++;
  for (const listener of state.listeners) listener(state.version);
}

/** Runs `fn` against the shared office after earlier operations finish; saves when it changes. */
export function withWorld<T>(fn: (world: SimWorld, now: number) => { value: T; changed: boolean }) {
  const run = state.queue.then(async () => {
    const world = await load(),
      now = Date.now();
    const spawned = tick(world, now);
    const { value, changed } = fn(world, now);
    if (changed || spawned) {
      await save(world);
      broadcast();
    }
    return value;
  });
  state.queue = run.catch(() => undefined);
  return run;
}

export function currentVersion() {
  return state.version;
}

/** Live updates; while anyone listens, visitors keep arriving without a request. */
export function subscribe(listener: Listener) {
  state.listeners.add(listener);
  state.timer ??= setInterval(() => {
    withWorld(() => ({ value: null, changed: false })).catch(() => undefined);
  }, TICK_MS);
  return () => {
    state.listeners.delete(listener);
    if (!state.listeners.size && state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  };
}

export async function resetWorld() {
  return withWorld((world) => {
    Object.assign(world, createWorld());
    return { value: true, changed: true };
  });
}
