'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as T from 'three';
import { buildWorld } from './models';
import { journeyPose, chapterProgress, JOURNEY_CHAPTERS } from '@/lib/office/journey';
import type { StationId } from '@/lib/office/model';
export interface JourneyApi {
  seek: (progress: number) => void;
}
interface Props {
  mode?: 'tour' | 'office';
  selected?: StationId;
  tasks?: { id: string; stage: StationId; status: string }[];
  reset?: number;
  onStation?: (id: StationId) => void;
  onTask?: (id: string) => void;
  onError?: () => void;
  onReady?: () => void;
}
const Scene = forwardRef<JourneyApi, Props>(function Scene(props, ref) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    api = useRef<{ seek: (p: number) => void; tasks: () => void } | null>(null);
  useEffect(() => {
    latest.current = props;
    api.current?.tasks();
    if (props.mode === 'office') {
      const index = JOURNEY_CHAPTERS.findIndex((c) => c.station === props.selected);
      api.current?.seek(chapterProgress(Math.max(1, index)));
    }
  }, [props]);
  useImperativeHandle(ref, () => ({ seek: (p: number) => api.current?.seek(p) }), []);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const mount: HTMLDivElement = container;
    let renderer: T.WebGLRenderer | undefined, world: ReturnType<typeof buildWorld> | undefined;
    let raf = 0,
      disposed = false,
      visible = true,
      current = 0,
      target = 0,
      last = 0,
      walk = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const roomMode = latest.current.mode === 'office';
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0xf5f1e9, 1);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.domElement.setAttribute(
        'aria-label',
        'Ilustrasi gedung dan lima ruang layanan zakat. Gunakan navigasi tahap untuk memilih ruang.',
      );
      renderer.domElement.setAttribute('role', 'img');
      mount.appendChild(renderer.domElement);
      const scene = new T.Scene();
      scene.background = new T.Color(0xf5f1e9);
      scene.add(new T.HemisphereLight(0xffffff, 0xc4b7a0, 3));
      const sun = new T.DirectionalLight(0xfff4dc, 3.4);
      sun.position.set(-12, 32, 20);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, {
        left: -20,
        right: 85,
        top: 25,
        bottom: -25,
        near: 0.1,
        far: 110,
      });
      sun.shadow.normalBias = 0.03;
      scene.add(sun);
      world = buildWorld();
      scene.add(world.root);
      const camera = new T.OrthographicCamera(-16, 16, 12, -12, 0.1, 160),
        look = new T.Vector3();
      function invalidate() {
        if (!raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(render);
      }
      function render(time: number) {
        raf = 0;
        if (disposed || !renderer || !world || !visible || document.hidden) return;
        const dt = Math.min(0.05, (time - last) / 1000 || 0.016);
        last = time;
        const previous = current;
        current = reduced.matches ? target : current + (target - current) * (1 - Math.exp(-dt * 9));
        if (Math.abs(current - target) < 0.00003) current = target;
        const pose = journeyPose(current, reduced.matches);
        world.building.visible = !roomMode && current < 0.105;
        world.rooms.visible = roomMode || pose.inside;
        world.avatar.visible = roomMode || pose.inside;
        camera.position.set(...pose.position);
        look.set(...pose.target);
        camera.lookAt(look);
        camera.zoom = roomMode ? 2.1 : pose.zoom;
        camera.updateProjectionMatrix();
        world.avatar.position.set(...pose.character);
        if (current !== previous) {
          walk += Math.abs(current - previous) * 160;
          world.legs.forEach((leg, i) => (leg.rotation.x = Math.sin(walk + i * Math.PI) * 0.5));
        } else world.legs.forEach((leg) => (leg.rotation.x = 0));
        renderer.render(scene, camera);
        if (current !== target) invalidate();
      }
      function resize() {
        if (!renderer) return;
        const w = mount.clientWidth,
          h = Math.max(240, mount.clientHeight),
          aspect = w / h;
        const offset = !roomMode && w >= 760 ? 0.45 : 0;
        camera.left = -12 * aspect * (1 + offset);
        camera.right = 12 * aspect * (1 - offset);
        camera.top = 12;
        camera.bottom = -12;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        invalidate();
      }
      function tasks() {
        if (!world) return;
        for (const [station, papers] of world.papers) {
          const items = (latest.current.tasks ?? []).filter(
            (t) => t.stage === station && t.status === 'open',
          );
          papers.forEach((paper, i) => {
            paper.visible = roomMode ? i < items.length : i < 2;
            paper.userData.itemId = roomMode ? items[i]?.id : undefined;
          });
        }
        invalidate();
      }
      api.current = {
        seek(p) {
          target = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
          invalidate();
        },
        tasks,
      };
      tasks();
      resize();
      if (roomMode) {
        const n = JOURNEY_CHAPTERS.findIndex((c) => c.station === latest.current.selected);
        current = target = chapterProgress(Math.max(1, n));
      }
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? false;
          if (visible) invalidate();
          else {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { rootMargin: '100px' },
      );
      io.observe(mount);
      const visibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else invalidate();
      };
      const motion = () => invalidate();
      document.addEventListener('visibilitychange', visibility);
      reduced.addEventListener('change', motion);
      const ray = new T.Raycaster(),
        pointer = new T.Vector2();
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
        if (obj?.userData.itemId) {
          latest.current.onTask?.(obj.userData.itemId);
          return;
        }
        while (obj && !obj.userData.station) obj = obj.parent;
        if (obj?.userData.station) latest.current.onStation?.(obj.userData.station);
      };
      const lost = (e: Event) => {
        e.preventDefault();
        latest.current.onError?.();
      };
      renderer.domElement.addEventListener('pointerdown', pointerDown);
      renderer.domElement.addEventListener('pointerup', pointerUp);
      renderer.domElement.addEventListener('webglcontextlost', lost);
      latest.current.onReady?.();
      invalidate();
      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        document.removeEventListener('visibilitychange', visibility);
        reduced.removeEventListener('change', motion);
        renderer?.domElement.removeEventListener('pointerdown', pointerDown);
        renderer?.domElement.removeEventListener('pointerup', pointerUp);
        renderer?.domElement.removeEventListener('webglcontextlost', lost);
        sun.shadow.dispose();
        world?.dispose();
        renderer?.dispose();
        renderer?.domElement.remove();
        api.current = null;
      };
    } catch {
      world?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      latest.current.onError?.();
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="zj-canvas" ref={host} />;
});
export default Scene;
