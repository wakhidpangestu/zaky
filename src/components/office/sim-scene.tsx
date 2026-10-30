'use client';
import { useEffect, useRef, type RefObject } from 'react';
import * as T from 'three';
import { buildWorld } from '@/components/journey/models';
import { createStage } from '@/components/journey/stage';
import type { StationId } from '@/lib/office/model';
import {
  DESK_FRONT,
  FACES_BACK,
  STATION_ORDER,
  STATION_SPOTS,
  nearStation,
  queueSlot,
  stationQueue,
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

const DEPT_INFO: Record<StationId, { num: string; title: string; sub: string; color: number }> = {
  penerimaan: { num: '01', title: 'MEJA PENERIMAAN', sub: 'Pencatatan Zakat & Infak', color: 0x16a249 },
  penyaluran: { num: '02', title: 'MEJA PENYALURAN', sub: 'Verifikasi Draf & Asnaf', color: 0xd97706 },
  saksi: { num: '03', title: 'MEJA SAKSI', sub: 'Konfirmasi 2 Saksi Independen', color: 0x2563eb },
  persetujuan: { num: '04', title: 'MEJA PERSETUJUAN', sub: 'Otorisasi & Pengesahan', color: 0x059669 },
  catatan: { num: '05', title: 'BUKU CATATAN', sub: 'Rantai Hash & Audit Publik', color: 0x4f46e5 },
};

function makeSignTexture(station: StationId): T.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  const info = DEPT_INFO[station];

  // Dark glass gradient background
  const bg = ctx.createLinearGradient(0, 0, 0, 160);
  bg.addColorStop(0, '#0a1a12');
  bg.addColorStop(1, '#05100b');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(4, 4, 504, 152, 16);
  ctx.fill();

  // Subtle border
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1d3b2b';
  ctx.stroke();

  // Left accent pill
  ctx.fillStyle = '#16a249';
  ctx.beginPath();
  ctx.roundRect(18, 22, 60, 42, 10);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(info.num, 48, 43);

  // Department title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 32px sans-serif';
  ctx.fillText(info.title, 94, 44);

  // Subtitle
  ctx.fillStyle = '#94a89e';
  ctx.font = '500 20px sans-serif';
  ctx.fillText(info.sub, 22, 106);

  // Bottom glowing rule
  ctx.fillStyle = '#16a249';
  ctx.fillRect(18, 138, 476, 4);

  const texture = new T.CanvasTexture(canvas);
  texture.minFilter = T.LinearFilter;
  return texture;
}

function makeCueTexture(text: string, sub: string): T.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#061a10';
  ctx.beginPath();
  ctx.roundRect(2, 2, 316, 92, 18);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#22c55e';
  ctx.stroke();

  // Kbd key icon
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.roundRect(14, 18, 44, 40, 8);
  ctx.fill();

  ctx.fillStyle = '#061a10';
  ctx.font = '900 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', 36, 38);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(text, 68, 38);

  ctx.fillStyle = '#86efac';
  ctx.font = '500 15px sans-serif';
  ctx.fillText(sub, 68, 64);

  const tex = new T.CanvasTexture(canvas);
  tex.minFilter = T.LinearFilter;
  return tex;
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

    const extraGeometries: T.BufferGeometry[] = [];
    const extraMaterials: T.Material[] = [];
    const extraTextures: T.Texture[] = [];

    try {
      const stage = createStage(
        'Zaky Simulator: Kantor Terbuka Luas dengan 5 Meja Kerja. Gunakan keyboard [W][A][S][D] untuk bergerak, [Shift] lari, [1]-[5] ke meja, [E] kerjakan.',
      );
      const { scene, sun } = stage;
      renderer = stage.renderer;
      mount.appendChild(renderer.domElement);
      world = buildWorld({ crowd: QUEUE_SLOTS * 2, layout: 'office' });
      world.building.visible = false;
      world.rooms.visible = true;
      scene.add(world.root);

      // --- GRAND CORPORATE OFFICE ARCHITECTURE ---
      const officeGroup = new T.Group();
      scene.add(officeGroup);

      // 1. Central aisle runner: every desk front opens onto it (z = 0).
      const laneGeo = new T.PlaneGeometry(38, 2.4);
      extraGeometries.push(laneGeo);
      const laneMat = new T.MeshStandardMaterial({ color: 0xd9e3dc, roughness: 0.8 });
      extraMaterials.push(laneMat);
      const corridor = new T.Mesh(laneGeo, laneMat);
      corridor.rotation.x = -Math.PI / 2;
      corridor.position.set(0, -0.035, 0);
      corridor.receiveShadow = true;
      officeGroup.add(corridor);

      // Distinctive Executive Zone Carpets under each station
      const CARPET_COLORS: Record<StationId, number> = {
        penerimaan: 0xd6ede0, // Soft sage emerald
        penyaluran: 0xfef3c7, // Warm golden amber
        saksi: 0xdbeafe,      // Soft executive azure
        persetujuan: 0xd1fae5, // Crisp mint green
        catatan: 0xe2e8f0,    // Sleek platinum slate
      };

      STATION_ORDER.forEach((id) => {
        const cGeo = new T.PlaneGeometry(10, 6.2);
        extraGeometries.push(cGeo);
        const cMat = new T.MeshStandardMaterial({
          color: CARPET_COLORS[id],
          roughness: 0.92,
        });
        extraMaterials.push(cMat);
        const rug = new T.Mesh(cGeo, cMat);
        rug.rotation.x = -Math.PI / 2;
        // Zone carpet under the desk and its furniture, on the side away from the aisle.
        const spot = STATION_SPOTS[id],
          away = FACES_BACK.has(id) ? 1 : -1;
        rug.position.set(spot.x - away * 1.4, -0.04, spot.z + away * 1.2);
        rug.receiveShadow = true;
        officeGroup.add(rug);
      });

      // 2. Floating 3D Department Overhead Banners
      const banners: { group: T.Group; cue: T.Mesh; cueTex: T.CanvasTexture; station: StationId }[] = [];

      STATION_ORDER.forEach((id) => {
        const { x, z: spotZ } = STATION_SPOTS[id];
        const bannerGroup = new T.Group();
        bannerGroup.position.set(x, 3.65, spotZ);
        officeGroup.add(bannerGroup);

        // Signboard frame
        const frameGeo = new T.BoxGeometry(4.2, 1.35, 0.12);
        extraGeometries.push(frameGeo);
        const frameMat = new T.MeshStandardMaterial({ color: 0x0f2219, roughness: 0.5 });
        extraMaterials.push(frameMat);
        const frame = new T.Mesh(frameGeo, frameMat);
        bannerGroup.add(frame);

        // Sign face with dynamic canvas texture
        const signTex = makeSignTexture(id);
        extraTextures.push(signTex);
        const signFaceGeo = new T.PlaneGeometry(4.1, 1.25);
        extraGeometries.push(signFaceGeo);
        const signFaceMat = new T.MeshBasicMaterial({ map: signTex, transparent: true });
        extraMaterials.push(signFaceMat);
        const signFace = new T.Mesh(signFaceGeo, signFaceMat);
        signFace.position.set(0, 0, 0.065);
        bannerGroup.add(signFace);

        // Suspension steel cables from ceiling
        const cableGeo = new T.CylinderGeometry(0.012, 0.012, 2.2, 8);
        extraGeometries.push(cableGeo);
        const cableMat = new T.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
        extraMaterials.push(cableMat);
        for (const cx of [-1.8, 1.8]) {
          const cable = new T.Mesh(cableGeo, cableMat);
          cable.position.set(cx, 1.7, 0);
          bannerGroup.add(cable);
        }

        // Suspended linear LED downlight beneath the banner
        const ledGeo = new T.BoxGeometry(3.6, 0.08, 0.15);
        extraGeometries.push(ledGeo);
        const ledMat = new T.MeshBasicMaterial({ color: 0xfef9c3 });
        extraMaterials.push(ledMat);
        const led = new T.Mesh(ledGeo, ledMat);
        led.position.set(0, -0.75, 0);
        bannerGroup.add(led);

        // Interactive 3D cue chip above desk front
        const cueTex = makeCueTexture('KERJAKAN', 'Tekan [E] / [Space]');
        extraTextures.push(cueTex);
        const cueGeo = new T.PlaneGeometry(2.4, 0.72);
        extraGeometries.push(cueGeo);
        const cueMat = new T.MeshBasicMaterial({ map: cueTex, transparent: true, opacity: 0.95 });
        extraMaterials.push(cueMat);
        const cueMesh = new T.Mesh(cueGeo, cueMat);
        cueMesh.position.set(DESK_FRONT[id].x, 2.1, DESK_FRONT[id].z + 0.6);
        cueMesh.visible = false;
        officeGroup.add(cueMesh);

        banners.push({ group: bannerGroup, cue: cueMesh, cueTex, station: id });
      });

      // 3. Station Floor Beacons (Glow circles under each desk)
      const stationBeacons: { ring: T.Mesh; station: StationId }[] = [];
      STATION_ORDER.forEach((id) => {
        const ringGeo = new T.RingGeometry(0.9, 1.25, 40);
        extraGeometries.push(ringGeo);
        const ringMat = new T.MeshBasicMaterial({
          color: 0x16a249,
          transparent: true,
          opacity: 0.45,
          side: T.DoubleSide,
        });
        extraMaterials.push(ringMat);
        const ringMesh = new T.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        const front = DESK_FRONT[id];
        ringMesh.position.set(front.x, 0.03, front.z);
        officeGroup.add(ringMesh);
        stationBeacons.push({ ring: ringMesh, station: id });
      });

      // Rings for player interaction & target walking
      const ring = (color: number, inner: number, outer: number) => {
        const m = new T.Mesh(
          new T.RingGeometry(inner, outer, 40),
          new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
        );
        m.rotation.x = -Math.PI / 2;
        m.visible = false;
        scene.add(m);
        return m;
      };
      const deskRing = ring(0xfacc14, 1.0, 1.35),
        targetRing = ring(0x16a249, 0.25, 0.42);

      // Camera setup with dynamic keyboard / wheel zoom
      const camera = new T.OrthographicCamera(-16, 16, 12, -12, 0.1, 180),
        look = new T.Vector3(),
        goal = new T.Vector3(),
        floor = new T.Plane(new T.Vector3(0, 1, 0), 0);
      let zoom = 1.75;
      let targetZoom = 1.75;
      // [O] shows the whole office floor; any other zoom key returns to following the officer.
      // The shift opens on the whole floor; the first step brings the camera to the officer.
      let overview = true,
        intro = true,
        followZoom = 1.75,
        overviewZoom = 0.8;

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
        stride = p.moving ? stride + dt * (g.player.moving ? 13 : 0) : 0;

        // Path glow
        const onPath = world.route.progress(p.x, p.z);
        glow += ((p.moving && onPath.distance < 1.2 ? 1 : 0) - glow) * (1 - Math.exp(-dt * 6));
        if (p.moving && onPath.distance < 1.2) litAt = onPath.at;
        world.route.light(litAt - 0.035, litAt + 0.035, glow);
        world.legs.forEach((leg, i) => (leg.rotation.x = Math.sin(stride + i * Math.PI) * 0.55));

        // Queue visitors in front of desks
        const queues: [StationId, number][] = [
          ['penerimaan', v?.deposits.length ?? 0],
          ['penyaluran', v?.requests.length ?? 0],
        ];
        queues.forEach(([station, count], q) => {
          for (let n = 0; n < QUEUE_SLOTS; n++) {
            const crowdMember = world!.crowd[q * QUEUE_SLOTS + n];
            crowdMember.group.visible = n < count;
            if (n >= count) continue;
            const s = queueSlot(station, n);
            crowdMember.group.position.set(s.x, 0, s.z);
            crowdMember.group.rotation.y = Math.PI * 0.85;
          }
        });

        // Paper stacks on desks
        for (const [station, papers] of world.papers) {
          const count = paperwork(v, station);
          papers.forEach((paper, i) => (paper.visible = i < count));
        }

        const near = nearStation(g);

        // Update ground beacons with gentle sinusoidal pulsing
        const pulse = 0.35 + 0.25 * Math.sin(time * 0.004);
        stationBeacons.forEach(({ ring: bRing, station: sId }) => {
          const qCount = v ? stationQueue(v, sId) : 0;
          if (sId === near) {
            bRing.visible = true;
            (bRing.material as T.MeshBasicMaterial).color.setHex(0xfacc14);
            (bRing.material as T.MeshBasicMaterial).opacity = 0.85;
          } else if (qCount > 0) {
            bRing.visible = true;
            (bRing.material as T.MeshBasicMaterial).color.setHex(0x16a249);
            (bRing.material as T.MeshBasicMaterial).opacity = pulse;
          } else {
            bRing.visible = true;
            (bRing.material as T.MeshBasicMaterial).color.setHex(0x94a89e);
            (bRing.material as T.MeshBasicMaterial).opacity = 0.2;
          }
        });

        // Update 3D cue chips
        banners.forEach(({ cue, station: sId }) => {
          const isNear = near === sId;
          cue.visible = isNear;
          if (isNear) {
            cue.rotation.y = Math.PI * 0.08;
          }
        });

        // Desk ring highlight
        deskRing.visible = !!near;
        if (near) deskRing.position.set(DESK_FRONT[near].x, 0.06, DESK_FRONT[near].z);
        targetRing.visible = !!g.target;
        if (g.target) targetRing.position.set(g.target.x, 0.06, g.target.z);

        // Smooth camera follow & zoom
        zoom += (targetZoom - zoom) * (1 - Math.exp(-dt * 8));
        if (intro && p.moving) {
          intro = overview = false;
          targetZoom = followZoom;
        }
        if (overview) goal.set(0, 0.8, 0);
        else goal.set(p.x, 0.8, p.z - 0.5);
        look.lerp(goal, 1 - Math.exp(-dt * 6));
        camera.position.copy(look).add(CAMERA_OFFSET);
        camera.lookAt(look);
        camera.zoom = zoom;
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
      }

      function resize() {
        if (!renderer || !mount) return;
        const w = mount.clientWidth,
          h = Math.max(260, mount.clientHeight),
          aspect = w / h;
        followZoom = w < 640 ? 1.25 : 1.75;
        // Fit the 41 x 24 floor: width rules on wide screens, height on narrow ones.
        overviewZoom = Math.min(0.9, Math.max(0.42, aspect / 2.05));
        targetZoom = overview ? overviewZoom : followZoom;
        Object.assign(camera, { left: -12 * aspect, right: 12 * aspect, top: 12, bottom: -12 });
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }

      look.set(0, 0.8, 0);
      resize();

      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      // Wheel zoom support
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        overview = false;
        targetZoom = Math.min(2.4, Math.max(0.45, targetZoom + delta));
      };
      mount.addEventListener('wheel', onWheel, { passive: false });

      // Keyboard zoom listeners (+ / - / PageUp / PageDown)
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === '=' || e.key === '+' || e.key === 'PageUp') {
          e.preventDefault();
          overview = false;
          targetZoom = Math.min(2.4, targetZoom + 0.2);
        } else if (e.key === '-' || e.key === '_' || e.key === 'PageDown') {
          e.preventDefault();
          overview = false;
          targetZoom = Math.max(0.45, targetZoom - 0.2);
        } else if (e.key.toLowerCase() === 'o') {
          e.preventDefault();
          intro = false;
          overview = !overview;
          targetZoom = overview ? overviewZoom : followZoom;
        }
      };
      window.addEventListener('keydown', onKeyDown);

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
        mount.removeEventListener('wheel', onWheel);
        window.removeEventListener('keydown', onKeyDown);
        renderer?.domElement.removeEventListener('pointerdown', pointerDown);
        renderer?.domElement.removeEventListener('pointerup', pointerUp);
        renderer?.domElement.removeEventListener('webglcontextlost', lost);

        for (const m of [deskRing, targetRing]) {
          m.geometry.dispose();
          (m.material as T.Material).dispose();
        }
        extraGeometries.forEach((g) => g.dispose());
        extraMaterials.forEach((m) => m.dispose());
        extraTextures.forEach((t) => t.dispose());
        sun.shadow.dispose();
        world?.dispose();
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch {
      extraGeometries.forEach((g) => g.dispose());
      extraMaterials.forEach((m) => m.dispose());
      extraTextures.forEach((t) => t.dispose());
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
