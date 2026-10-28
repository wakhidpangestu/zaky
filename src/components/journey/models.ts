import * as T from 'three';
import { JOURNEY_CHAPTERS, ROOM_SPACING, journeyRoute } from '@/lib/office/journey';
import type { StationId } from '@/lib/office/model';
export interface World {
  root: T.Group;
  building: T.Group;
  rooms: T.Group;
  avatar: T.Group;
  legs: T.Group[];
  desks: Map<StationId, T.Group>;
  papers: Map<StationId, T.Mesh[]>;
  clickable: T.Object3D[];
  /** Hidden visitor figures that a game can position; empty unless requested. */
  crowd: { group: T.Group; legs: T.Group[] }[];
  /** The floor path: `progress` maps a point onto it, `light` makes a stretch of it glow. */
  route: {
    progress: (x: number, z: number) => { at: number; distance: number };
    light: (from: number, to: number, strength: number) => void;
  };
  dispose: () => void;
}
export type Attire = 'plain' | 'peci' | 'hijab' | 'hijab-green' | 'hijab-sage';
export function buildWorld({ crowd = 0 } = {}): World {
  const root = new T.Group(),
    building = new T.Group(),
    rooms = new T.Group();
  root.add(building, rooms);
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Set<T.Texture>();
  const mat = (color: number) => {
    const m = new T.MeshStandardMaterial({ color, roughness: 0.88 });
    materials.add(m);
    return m;
  };
  const cream = mat(0xf3f1ed),
    white = mat(0xffffff),
    emerald = mat(0x16a249),
    sun = mat(0xfacc14),
    wood = mat(0xe0ebe6),
    ink = mat(0x15281f),
    road = mat(0x5c7066),
    green = mat(0x12873d),
    skin = mat(0xd9b28c),
    blue = mat(0x19a1e6),
    teal = mat(0x94a89e),
    paper = mat(0xdcf9e7),
    peci = mat(0x1b1b1b);
  const hijabs: Record<Exclude<Attire, 'plain' | 'peci'>, T.Material> = {
    hijab: mat(0xcfb391),
    'hijab-green': mat(0x203c2e),
    'hijab-sage': mat(0x94a89e),
  };
  function mesh(g: T.Object3D, geometry: T.BufferGeometry, m: T.Material, x = 0, y = 0, z = 0) {
    geometries.add(geometry);
    const o = new T.Mesh(geometry, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    g.add(o);
    return o;
  }
  const box = (
    g: T.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) => mesh(g, new T.BoxGeometry(w, h, d), m, x, y, z);
  const cylinder = (
    g: T.Object3D,
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) => mesh(g, new T.CylinderGeometry(r, r, h, 16), m, x, y, z);
  function rounded(
    g: T.Object3D,
    w: number,
    h: number,
    d: number,
    r: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) {
    const s = new T.Shape(),
      l = -w / 2,
      b = -d / 2;
    s.moveTo(l + r, b);
    s.lineTo(l + w - r, b);
    s.quadraticCurveTo(l + w, b, l + w, b + r);
    s.lineTo(l + w, b + d - r);
    s.quadraticCurveTo(l + w, b + d, l + w - r, b + d);
    s.lineTo(l + r, b + d);
    s.quadraticCurveTo(l, b + d, l, b + d - r);
    s.lineTo(l, b + r);
    s.quadraticCurveTo(l, b, l + r, b);
    const geo = new T.ExtrudeGeometry(s, {
      depth: h,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 8,
    });
    geo.rotateX(-Math.PI / 2);
    return mesh(g, geo, m, x, y, z);
  }
  function label(
    g: T.Object3D,
    text: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    bg = '#ffffff',
    fg = '#05140d',
  ) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(text, 256, 64, 480);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    textures.add(texture);
    const material = new T.MeshBasicMaterial({ map: texture });
    materials.add(material);
    return mesh(g, new T.PlaneGeometry(w, h), material, x, y, z);
  }
  function plant(g: T.Object3D, x: number, z: number, scale = 1) {
    const p = new T.Group();
    p.position.set(x, 0, z);
    p.scale.setScalar(scale);
    g.add(p);
    cylinder(p, 0.24, 0.4, 0, 0.2, 0, cream);
    cylinder(p, 0.035, 1, 0, 0.75, 0, wood);
    for (let i = 0; i < 5; i++) {
      const o = mesh(
        p,
        new T.IcosahedronGeometry(0.42, 0),
        green,
        Math.sin(i * 2) * 0.2,
        1.05 + i * 0.06,
        Math.cos(i * 2) * 0.2,
      );
      o.scale.y = 0.65;
    }
    return p;
  }
  // Headwear: a black peci for men, a hijab (open at the face, draped over the shoulders) for women.
  function person(
    g: T.Object3D,
    x: number,
    z: number,
    shirt: T.Material,
    scale = 1,
    head: Attire = 'plain',
  ) {
    const p = new T.Group();
    p.position.set(x, 0, z);
    p.scale.setScalar(scale);
    g.add(p);
    const legs: T.Group[] = [];
    for (const xx of [-0.14, 0.14]) {
      const l = new T.Group();
      l.position.set(xx, 0.58, 0);
      p.add(l);
      box(l, 0.16, 0.55, 0.2, 0, -0.26, 0, ink);
      box(l, 0.18, 0.09, 0.28, 0, -0.52, 0.04, ink);
      legs.push(l);
    }
    mesh(p, new T.CapsuleGeometry(0.23, 0.38, 4, 8), shirt, 0, 0.95, 0);
    mesh(p, new T.SphereGeometry(0.21, 16, 12), skin, 0, 1.46, 0);
    if (head === 'plain' || head === 'peci')
      mesh(p, new T.SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, 1.25), ink, 0, 1.48, 0);
    if (head === 'peci') mesh(p, new T.CylinderGeometry(0.205, 0.22, 0.2, 18), peci, 0, 1.66, 0);
    else if (head !== 'plain') {
      const veil = hijabs[head];
      const face = 0.7;
      mesh(p, new T.SphereGeometry(0.255, 18, 12, Math.PI / 2 + face, Math.PI * 2 - 2 * face), veil, 0, 1.48, -0.01);
      mesh(p, new T.ConeGeometry(0.4, 0.6, 18, 1, true), veil, 0, 1.12, 0);
    }
    for (const xx of [-0.33, 0.33]) {
      const arm = mesh(p, new T.CapsuleGeometry(0.07, 0.42, 3, 6), shirt, xx, 0.91, 0.02);
      arm.rotation.z = xx * 0.35;
      mesh(p, new T.SphereGeometry(0.075, 8, 6), skin, xx, 0.6, 0.02);
    }
    return { group: p, legs };
  }
  // A row of yellow waiting chairs facing the front; `seated` marks which chairs are occupied.
  function waiting(g: T.Object3D, x: number, z: number, seated: [T.Material, Attire][]) {
    for (let k = 0; k < 3; k++) {
      const cx = x + k * 0.8;
      box(g, 0.66, 0.08, 0.6, cx, 0.42, z, sun);
      box(g, 0.66, 0.55, 0.08, cx, 0.72, z - 0.28, sun);
      for (const lx of [-0.26, 0.26]) box(g, 0.05, 0.4, 0.05, cx + lx, 0.2, z, ink);
      if (!seated[k]) continue;
      const s = person(g, cx, z - 0.05, seated[k][0], 0.8, seated[k][1]);
      s.legs.forEach((leg) => (leg.rotation.x = -Math.PI / 2));
    }
  }
  // Exterior: rounded white facade and continuous dark window bands, as in the reference.
  rounded(building, 30, 0.12, 26, 2, 4, -0.18, 1, cream);
  rounded(building, 12, 0.55, 8, 1, 0, 0, 0, white);
  for (let i = 0; i < 9; i++) {
    rounded(building, 8, 0.82, 6, 1, 0, 0.55 + i * 1.03, 0, ink);
    rounded(building, 8.2, 0.22, 6.2, 1.05, 0, 1.37 + i * 1.03, 0, white);
    for (let x = -3.3; x <= 3.4; x += 1.1)
      box(building, 0.12, 0.85, 0.18, x, 0.98 + i * 1.03, 3.01, white);
    for (let z = -2.3; z <= 2.4; z += 1.1)
      box(building, 0.18, 0.85, 0.12, 4.01, 0.98 + i * 1.03, z, white);
  }
  rounded(building, 8.3, 0.35, 6.3, 1.1, 0, 9.82, 0, white);
  box(building, 2.15, 12.3, 5, 4.25, 6.15, -0.9, emerald);
  label(building, 'zaky.', 3.2, 0.8, -1.3, 10.55, 3.12, '#ffffff', '#05140d');
  label(building, 'AMANAH.', 1.6, 0.4, 4.25, 11.3, 1.62, '#16a249', '#fbfbf8');
  label(building, 'TERJAGA.', 1.6, 0.4, 4.25, 10.75, 1.62, '#16a249', '#fbfbf8');
  rounded(building, 9, 0.25, 7, 0.4, 0, 0.6, 1.6, cream);
  box(building, 3.6, 1.7, 0.16, -0.5, 1.55, 4.98, ink);
  box(building, 0.08, 1.7, 0.18, -0.5, 1.55, 5.0, wood);
  box(building, 4.6, 0.16, 1.2, -0.5, 2.5, 5, white);
  label(building, 'PUSAT LAYANAN ZAKY', 4, 0.4, -0.5, 2.9, 4.4);
  for (let i = 0; i < 3; i++) box(building, 4.1, 0.09, 0.7, -0.5, 0.09 * i, 5.2 + i * 0.5, white);
  const curve = new T.CatmullRomCurve3([
    new T.Vector3(-0.5, 0.05, 6),
    new T.Vector3(1, 0.05, 8),
    new T.Vector3(6, 0.05, 8),
    new T.Vector3(10, 0.05, 5),
    new T.Vector3(20, 0.05, 5),
  ]);
  const pts = curve.getPoints(80),
    shape = new T.Shape();
  const left: T.Vector3[] = [],
    right: T.Vector3[] = [];
  pts.forEach((p, i) => {
    const t = curve.getTangent(i / 80),
      n = new T.Vector3(-t.z, 0, t.x);
    left.push(p.clone().addScaledVector(n, 1));
    right.push(p.clone().addScaledVector(n, -1));
  });
  [...left, ...right.reverse()].forEach((p, i) =>
    i === 0 ? shape.moveTo(p.x, -p.z) : shape.lineTo(p.x, -p.z),
  );
  shape.closePath();
  const rg = new T.ShapeGeometry(shape);
  rg.rotateX(-Math.PI / 2);
  mesh(building, rg, road, 0, 0.02, 0);
  for (let i = 0; i < 25; i++) {
    const p = curve.getPointAt(i / 24),
      t = curve.getTangentAt(i / 24),
      stripe = box(building, 0.035, 0.02, 0.33, p.x, 0.045, p.z, white);
    stripe.rotation.y = Math.atan2(t.x, t.z);
  }
  for (const [x, z] of [
    [-5, 5],
    [5.8, 4.7],
    [9.4, 2.8],
    [14, 2.7],
    [18, 3],
  ])
    plant(building, x, z, 0.75);
  const van = new T.Group();
  van.position.set(6, 0.07, 8);
  van.rotation.y = Math.PI / 2;
  building.add(van);
  rounded(van, 1.1, 0.65, 1.9, 0.15, 0, 0.27, 0, white);
  box(van, 1, 0.35, 0.05, 0, 0.83, 0.6, ink);
  box(van, 1.12, 0.18, 0.05, 0, 0.48, 0.98, emerald);
  for (const x of [-0.55, 0.55])
    for (const z of [-0.6, 0.6]) {
      const wheel = cylinder(van, 0.21, 0.1, x, 0.24, z, ink);
      wheel.rotation.z = Math.PI / 2;
    }
  // Five cutaway rooms, connected by a single emerald route.
  const desks = new Map<StationId, T.Group>(),
    papers = new Map<StationId, T.Mesh[]>(),
    clickable: T.Object3D[] = [];
  for (let i = 0; i < 5; i++) {
    const chapter = JOURNEY_CHAPTERS[i + 1],
      station = chapter.station!;
    const g = new T.Group();
    g.position.x = i * ROOM_SPACING;
    g.userData.station = station;
    rooms.add(g);
    rounded(g, 13.8, 0.14, 10, 0.2, 0, -0.12, 0, white);
    box(g, 13.8, 3.1, 0.16, 0, 1.5, -4.9, cream);
    box(g, 13.8, 0.13, 0.18, 0, 3.08, -4.9, emerald);
    box(g, 0.16, 3.1, 7, -6.8, 1.5, -1.4, cream);
    box(g, 0.18, 0.13, 7, -6.8, 3.08, -1.4, emerald);
    const door = new T.Group();
    door.position.set(6.9, 0, 3);
    g.add(door);
    for (const z of [1.9, 4.1]) box(door, 0.16, 2.6, 0.13, 0, 1.3, z - 3, white);
    box(door, 0.2, 0.13, 2.35, 0, 2.67, 0, emerald);
    label(g, chapter.label.toUpperCase(), 4, 0.55, -2.5, 2.48, -4.78, '#16a249', '#fbfbf8');
    const desk = new T.Group();
    desk.position.set(0, 0, -1);
    desk.userData.station = station;
    g.add(desk);
    desks.set(station, desk);
    clickable.push(desk);
    rounded(desk, i === 0 ? 5 : 3.8, 0.16, 1.3, 0.1, 0, 1.05, 0, wood);
    box(desk, i === 0 ? 4.8 : 3.5, 0.9, 0.18, 0, 0.55, 0.5, cream);
    for (const x of [-1.5, 1.5]) box(desk, 0.15, 1, 0.9, x, 0.5, 0, white);
    const count = i === 0 ? 2 : 1;
    for (let m = 0; m < count; m++) {
      const x = count === 2 ? (m - 0.5) * 2 : 0;
      box(desk, 0.75, 0.5, 0.05, x, 1.53, -0.33, ink);
      box(desk, 0.63, 0.38, 0.025, x, 1.53, -0.295, white);
      box(desk, 0.08, 0.2, 0.08, x, 1.18, -0.33, ink);
      box(desk, 0.65, 0.03, 0.2, x, 1.17, 0.12, ink);
      // Amil at the desks: white baju koko with peci, or a green hijab.
      const ustazah = (i + m) % 2 === 1;
      person(g, x, -2, ustazah ? teal : white, 0.85, ustazah ? 'hijab-green' : 'peci');
    }
    const stack: T.Mesh[] = [];
    for (let n = 0; n < 4; n++) {
      const folder = box(
        desk,
        0.48,
        0.05,
        0.4,
        1.15,
        1.19 + n * 0.06,
        0.04,
        n % 2 ? emerald : paper,
      );
      folder.visible = false;
      stack.push(folder);
    }
    papers.set(station, stack);
    if (i === 0) {
      waiting(g, -5.5, -3.2, [[teal, 'hijab'], [white, 'peci'], [green, 'hijab-sage']]);
      waiting(g, -5.5, -1.8, [[emerald, 'peci'], [paper, 'hijab-green']]);
    } else if (i === 1 || i === 4)
      waiting(g, 3.4, -2.4, i === 1 ? [[green, 'hijab'], [white, 'peci']] : [[blue, 'peci']]);
    else waiting(g, -5.5, -3.2, i === 2 ? [[teal, 'hijab-sage']] : [[green, 'peci'], [paper, 'hijab']]);
    if (i === 1 || i === 4) {
      for (let shelf = 0; shelf < 3; shelf++) {
        const x = -4.8 + shelf * 1.3;
        box(g, 1.15, 2.2, 0.6, x, 1.1, -4.35, white);
        for (let r = 0; r < 4; r++) {
          box(g, 1.17, 0.04, 0.66, x, 0.3 + r * 0.5, -4.3, wood);
          for (let f = 0; f < 4; f++)
            box(
              g,
              0.16,
              0.34,
              0.4,
              x - 0.4 + f * 0.25,
              0.5 + r * 0.5,
              -4.15,
              (f + r) % 3 === 0 ? emerald : (f + r) % 3 === 1 ? green : paper,
            );
        }
      }
    }
    if (i === 2) {
      const other = new T.Group();
      other.position.set(3.7, 0, 1);
      g.add(other);
      box(other, 2, 0.12, 1, 0, 1, 0, wood);
      person(other, 0, -0.75, white, 0.8, 'peci');
      label(g, 'UNIT BERBEDA', 2.1, 0.35, 3.7, 2.2, -4.78);
    }
    if (i === 3 || i === 4) {
      box(g, 3.8, 1.5, 0.12, 2.7, 1.9, -4.72, ink);
      for (let b = 0; b < 4; b++)
        box(
          g,
          0.4,
          0.2 + b * 0.15,
          0.02,
          1.6 + b * 0.65,
          1.5 + b * 0.08,
          -4.64,
          b % 2 ? emerald : green,
        );
    }
    plant(g, 6, -4.1, 0.8);
    plant(g, -5, 3.5, 0.7);
  }
  // One flat path that winds from desk to desk, the same curve the character walks.
  // It rests unlit; a glowing copy is drawn only where the character walks.
  const route = new T.CatmullRomCurve3(journeyRoute().map(([x, z]) => new T.Vector3(x, 0, z)));
  const SEGMENTS = 400,
    RADIAL = 6;
  const unlit = mesh(rooms, new T.TubeGeometry(route, SEGMENTS, 0.14, RADIAL, false), mat(0xd3dcd6), 0, 0.04, 0);
  unlit.scale.y = 0.12;
  unlit.castShadow = false;
  // Unlit material so tone mapping cannot wash the glow out.
  const glow = new T.MeshBasicMaterial({ color: 0x22e36a, transparent: true, opacity: 0 });
  materials.add(glow);
  const lit = mesh(rooms, new T.TubeGeometry(route, SEGMENTS, 0.2, RADIAL, false), glow, 0, 0.05, 0);
  lit.scale.y = 0.14;
  lit.castShadow = lit.receiveShadow = false;
  lit.visible = false;
  // Arc-length position of every sample, to map a floor point onto the tube.
  const samples = route.getSpacedPoints(SEGMENTS);
  function routeProgress(x: number, z: number) {
    let best = 0,
      dist = Infinity;
    samples.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < dist) [best, dist] = [i, d];
    });
    return { at: best / SEGMENTS, distance: Math.sqrt(dist) };
  }
  function lightRoute(from: number, to: number, strength: number) {
    const a = Math.max(0, Math.min(1, from)),
      b = Math.max(a, Math.min(1, to)),
      perSegment = RADIAL * 6;
    lit.visible = strength > 0.01 && b > a;
    lit.geometry.setDrawRange(Math.floor(a * SEGMENTS) * perSegment, Math.ceil((b - a) * SEGMENTS) * perSegment);
    glow.opacity = Math.min(1, strength);
  }
  const avatar = person(root, -7, 4.6, sun, 1, 'peci');
  const shirts = [blue, teal, green, white, paper];
  const heads: Attire[] = ['peci', 'hijab', 'hijab-sage', 'peci', 'hijab-green'];
  const visitors = Array.from({ length: crowd }, (_, i) => {
    const v = person(rooms, 0, 0, shirts[i % shirts.length], 0.9, heads[(i * 3) % heads.length]);
    v.group.visible = false;
    return v;
  });
  rooms.visible = false;
  return {
    root,
    building,
    rooms,
    avatar: avatar.group,
    legs: avatar.legs,
    desks,
    papers,
    clickable,
    crowd: visitors,
    route: { progress: routeProgress, light: lightRoute },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
