'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as T from 'three';
import { buildWorld } from './models';
import {
  journeyPose,
  journeyFrustum,
  journeyHeading,
  chapterProgress,
  JOURNEY_CHAPTERS,
} from '@/lib/office/journey';
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
  onChapter?: (chapter: number) => void;
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
      walk = 0,
      reportedChapter = -1,
      aspect = 1,
      compact = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const roomMode = latest.current.mode === 'office';
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0xf4efe9, 1);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.setAttribute(
        'aria-label',
        'Ilustrasi gedung dan lima ruang layanan zakat. Gunakan navigasi tahap untuk memilih ruang.',
      );
      renderer.domElement.setAttribute('role', 'img');
      mount.appendChild(renderer.domElement);
      const scene = new T.Scene();
      scene.background = new T.Color(0xf4efe9);
      scene.add(new T.HemisphereLight(0xffffff, 0xc4b7a0, 1.7));
      const sun = new T.DirectionalLight(0xfff4dc, 3.2);
      sun.position.set(-12, 32, 20);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, {
        left: -24,
        right: 24,
        top: 24,
        bottom: -24,
        near: 0.1,
        far: 110,
      });
      sun.shadow.normalBias = 0.03;
      sun.shadow.radius = 3;
      scene.add(sun, sun.target);
      world = buildWorld();
      scene.add(world.root);
      const camera = new T.OrthographicCamera(-16, 16, 12, -12, 0.1, 160),
        look = new T.Vector3(),
        characterTarget = new T.Vector3();
      function invalidate() {
        if (!raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(render);
      }
      function render(time: number) {
        raf = 0;
        if (disposed || !renderer || !world || !visible || document.hidden) return;
        const dt = Math.min(0.05, (time - last) / 1000 || 0.016);
        last = time;
        current = reduced.matches ? target : current + (target - current) * (1 - Math.exp(-dt * 9));
        if (Math.abs(current - target) < 0.00003) current = target;
        const pose = journeyPose(current, reduced.matches);
        world.building.visible = !roomMode && !pose.inside;
        for (const group of world.rooms.children)
          if (group.userData.room) group.visible = Math.abs(group.position.x - pose.target[0]) < 23;
        world.rooms.visible = roomMode || pose.inside;
        world.avatar.visible = roomMode || pose.inside;
        camera.position.set(...pose.position);
        look.set(...pose.target);
        camera.lookAt(look);
        camera.zoom = pose.zoom * (compact ? (roomMode ? 0.88 : 0.72) : 1);
        const framing = journeyFrustum(aspect, camera.zoom, roomMode || compact ? 0 : pose.offset);
        Object.assign(camera, framing);
        camera.updateProjectionMatrix();
        sun.position.set(pose.target[0] - 18, 34, 22);
        sun.target.position.set(pose.target[0], 0, 0);
        sun.target.updateMatrixWorld();
        characterTarget.set(...pose.character);
        const distance = world.avatar.position.distanceTo(characterTarget);
        const facing =
          distance > 0.00005 && current !== target && !reduced.matches
            ? Math.atan2(
                characterTarget.x - world.avatar.position.x,
                characterTarget.z - world.avatar.position.z,
              )
            : pose.facing;
        const heading = journeyHeading(world.avatar.rotation.y, facing, dt, reduced.matches);
        world.avatar.position.copy(characterTarget);
        world.updateRoute(current);
        world.avatar.rotation.y = heading.angle;
        if (reportedChapter !== pose.chapter) {
          reportedChapter = pose.chapter;
          latest.current.onChapter?.(pose.chapter);
        }
        mount.dataset.motion = current === target && !heading.moving ? 'idle' : 'moving';
        mount.dataset.chapter = String(pose.chapter);
        if (distance > 0.00005 && current !== target) {
          walk += distance * 4.5;
          world.legs.forEach((leg, i) => (leg.rotation.x = Math.sin(walk + i * Math.PI) * 0.45));
          world.arms.forEach((arm, i) => (arm.rotation.x = -Math.sin(walk + i * Math.PI) * 0.25));
        } else {
          world.legs.forEach((leg) => (leg.rotation.x = 0));
          world.arms.forEach((arm) => (arm.rotation.x = 0));
        }
        renderer.render(scene, camera);
        mount.dataset.drawCalls = String(renderer.info.render.calls);
        if (current !== target || heading.moving) invalidate();
      }
      function resize() {
        if (!renderer) return;
        const w = mount.clientWidth,
          h = Math.max(240, mount.clientHeight);
        aspect = w / h;
        compact = w < 760;
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
