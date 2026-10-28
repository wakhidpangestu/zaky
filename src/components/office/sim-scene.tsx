'use client';
import { useEffect, useRef, type RefObject } from 'react';
import * as T from 'three';
import { buildWorld } from '@/components/journey/models';
import { createStage } from '@/components/journey/stage';
import type { StationId } from '@/lib/office/model';
import {
  DESK_FRONT,
  nearStation,
  queueSlot,
  type SimView,
  type Walker,
} from '@/lib/office/simulator';

const QUEUE_SLOTS = 5;
const CAMERA_OFFSET = new T.Vector3(18, 19, 24.5);

/** Papers stacked on a desk: drafts waiting for witnesses or approval, and published records. */
function paperwork(view: SimView | null, station: StationId) {
  if (!view) return 0;
  if (station === 'saksi') return view.cases.filter((c) => c.stage === 'saksi').length;
  if (station === 'persetujuan') return view.cases.filter((c) => c.stage === 'persetujuan').length;
  if (station === 'catatan') return view.cases.filter((c) => c.stage === 'terbit').length;
  return 0;
}

interface Props {
  walker: RefObject<Walker>;
  view: RefObject<SimView | null>;
  onFrame: (seconds: number) => void;
  onFloor: (x: number, z: number) => void;
  onDesk: (station: StationId) => void;
  onError: () => void;
}

export default function SimScene(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  }, [props]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: T.WebGLRenderer | undefined, world: ReturnType<typeof buildWorld> | undefined;
    let raf = 0,
      disposed = false,
      last = 0,
      stride = 0,
      glow = 0,
      litAt = 0;
    try {
      const stage = createStage(
        'Zaky Simulator: kantor dengan lima meja layanan. Gunakan tombol arah atau daftar meja untuk bergerak.',
      );
      const { scene, sun } = stage;
      renderer = stage.renderer;
      mount.appendChild(renderer.domElement);
      world = buildWorld({ crowd: QUEUE_SLOTS * 2 });
      world.building.visible = false;
      world.rooms.visible = true;
      scene.add(world.root);
      const ring = (color: number, inner: number, outer: number) => {
        const m = new T.Mesh(
          new T.RingGeometry(inner, outer, 40),
          new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
        );
        m.rotation.x = -Math.PI / 2;
        m.visible = false;
        scene.add(m);
        return m;
      };
      const deskRing = ring(0xfacc14, 0.95, 1.2),
        targetRing = ring(0x16a249, 0.25, 0.38);
      const camera = new T.OrthographicCamera(-16, 16, 12, -12, 0.1, 160),
        look = new T.Vector3(),
        goal = new T.Vector3(),
        floor = new T.Plane(new T.Vector3(0, 1, 0), 0);
      let zoom = 1.8;

      function frame(time: number) {
        raf = requestAnimationFrame(frame);
        if (disposed || !renderer || !world || document.hidden) return;
        const dt = Math.min(0.1, (time - last) / 1000 || 0.016);
        last = time;
        latest.current.onFrame(dt);
        const g = latest.current.walker.current,
          v = latest.current.view.current;
        if (!g) return;
        const p = g.player;
        world.avatar.position.set(p.x, 0, p.z);
        world.avatar.rotation.y = p.facing;
        stride = p.moving ? stride + dt * 11 : 0;
        // The floor path stays unlit until the player walks along it, then fades out again.
        const onPath = world.route.progress(p.x, p.z);
        glow += ((p.moving && onPath.distance < 1.2 ? 1 : 0) - glow) * (1 - Math.exp(-dt * 6));
        if (p.moving && onPath.distance < 1.2) litAt = onPath.at;
        world.route.light(litAt - 0.035, litAt + 0.035, glow);
        world.legs.forEach((leg, i) => (leg.rotation.x = Math.sin(stride + i * Math.PI) * 0.55));
        // Visitors queue in front of the two public desks; paperwork stacks on the others.
        const queues: [StationId, number][] = [
          ['penerimaan', v?.deposits.length ?? 0],
          ['penyaluran', v?.requests.length ?? 0],
        ];
        queues.forEach(([station, count], q) => {
          for (let n = 0; n < QUEUE_SLOTS; n++) {
            const v = world!.crowd[q * QUEUE_SLOTS + n];
            v.group.visible = n < count;
            if (n >= count) continue;
            const s = queueSlot(station, n);
            v.group.position.set(s.x, 0, s.z);
            v.group.rotation.y = Math.PI * 0.85;
          }
        });
        for (const [station, papers] of world.papers) {
          const count = paperwork(v, station);
          papers.forEach((paper, i) => (paper.visible = i < count));
        }
        const near = nearStation(g);
        deskRing.visible = !!near;
        if (near) deskRing.position.set(DESK_FRONT[near].x, 0.06, DESK_FRONT[near].z);
        targetRing.visible = !!g.target;
        if (g.target) targetRing.position.set(g.target.x, 0.06, g.target.z);
        look.lerp(goal.set(p.x, 0.8, p.z - 0.5), 1 - Math.exp(-dt * 6));
        camera.position.copy(look).add(CAMERA_OFFSET);
        camera.lookAt(look);
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      }
      function resize() {
        if (!renderer) return;
        const w = mount!.clientWidth,
          h = Math.max(260, mount!.clientHeight),
          aspect = w / h;
        zoom = w < 640 ? 1.25 : 1.8;
        Object.assign(camera, { left: -12 * aspect, right: 12 * aspect, top: 12, bottom: -12 });
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
      const start = latest.current.walker.current?.player;
      if (start) look.set(start.x, 0.8, start.z - 0.5);
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      const ray = new T.Raycaster(),
        pointer = new T.Vector2(),
        hit = new T.Vector3();
      let down: { x: number; y: number } | null = null;
      const pointerDown = (e: PointerEvent) => {
        down = { x: e.clientX, y: e.clientY };
      };
      const pointerUp = (e: PointerEvent) => {
        if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) {
          down = null;
          return;
        }
        down = null;
        if (!renderer || !world) return;
        const r = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          (-(e.clientY - r.top) / r.height) * 2 + 1,
        );
        ray.setFromCamera(pointer, camera);
        let obj: T.Object3D | null = ray.intersectObjects(world.clickable, true)[0]?.object ?? null;
        while (obj && !obj.userData.station) obj = obj.parent;
        if (obj?.userData.station) latest.current.onDesk(obj.userData.station);
        else if (ray.ray.intersectPlane(floor, hit)) latest.current.onFloor(hit.x, hit.z);
      };
      const lost = (e: Event) => {
        e.preventDefault();
        latest.current.onError();
      };
      renderer.domElement.addEventListener('pointerdown', pointerDown);
      renderer.domElement.addEventListener('pointerup', pointerUp);
      renderer.domElement.addEventListener('webglcontextlost', lost);
      raf = requestAnimationFrame(frame);
      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer?.domElement.removeEventListener('pointerdown', pointerDown);
        renderer?.domElement.removeEventListener('pointerup', pointerUp);
        renderer?.domElement.removeEventListener('webglcontextlost', lost);
        for (const m of [deskRing, targetRing]) {
          m.geometry.dispose();
          (m.material as T.Material).dispose();
        }
        sun.shadow.dispose();
        world?.dispose();
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch {
      world?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      latest.current.onError();
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="zo-canvas" ref={host} />;
}
