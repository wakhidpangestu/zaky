'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as T from 'three';
import { buildWorld } from './models';
import { createStage } from './stage';
import { journeyPose } from '@/lib/office/journey';
import type { StationId } from '@/lib/office/model';
export interface JourneyApi {
  seek: (progress: number) => void;
}
interface Props {
  onStation?: (id: StationId) => void;
  onError?: () => void;
  onReady?: () => void;
}
const Scene = forwardRef<JourneyApi, Props>(function Scene(props, ref) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    api = useRef<{ seek: (p: number) => void } | null>(null);
  useEffect(() => {
    latest.current = props;
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
    try {
      const stage = createStage(
        'Ilustrasi gedung dan lima ruang layanan zakat. Gunakan navigasi tahap untuk memilih ruang.',
      );
      const { scene, sun } = stage;
      renderer = stage.renderer;
      mount.appendChild(renderer.domElement);
      world = buildWorld();
      scene.add(world.root);
      world.papers.forEach((papers) => papers.forEach((paper, i) => (paper.visible = i < 2)));
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
        world.building.visible = current < 0.105;
        world.rooms.visible = pose.inside;
        world.avatar.visible = pose.inside;
        camera.position.set(...pose.position);
        look.set(...pose.target);
        camera.lookAt(look);
        camera.zoom = pose.zoom;
        camera.updateProjectionMatrix();
        world.avatar.position.set(...pose.character);
        world.avatar.rotation.y = pose.facing;
        // The path lights up behind the character, brightest while walking.
        const trail = world.route.progress(pose.character[0], pose.character[2]).at;
        world.route.light(0, trail, pose.inside ? (pose.walking ? 1 : 0.6) : 0);
        if (current !== previous && pose.walking) {
          walk += Math.abs(current - previous) * 420;
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
        const offset = w >= 760 ? 0.45 : 0;
        camera.left = -12 * aspect * (1 + offset);
        camera.right = 12 * aspect * (1 - offset);
        camera.top = 12;
        camera.bottom = -12;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        invalidate();
      }
      api.current = {
        seek(p) {
          target = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
          invalidate();
        },
      };
      resize();
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
