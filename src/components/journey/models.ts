import * as T from 'three';
import { journeyPose } from '@/lib/office/journey';
import type { StationId } from '@/lib/office/model';
export interface World {
  root: T.Group;
  building: T.Group;
  rooms: T.Group;
  avatar: T.Group;
  legs: T.Group[];
  arms: T.Mesh[];
  desks: Map<StationId, T.Group>;
  papers: Map<StationId, T.Mesh[]>;
  clickable: T.Object3D[];
  updateRoute: (progress: number) => void;
  dispose: () => void;
}
/** Reconstructed from the source video's exterior and four connected cutaway areas. */
export function buildWorld(): World {
  const root = new T.Group(),
    building = new T.Group(),
    rooms = new T.Group();
  root.add(building, rooms);
  const geometries = new Map<string, T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Set<T.Texture>();
  const geometry = (key: string, make: () => T.BufferGeometry) => {
    let g = geometries.get(key);
    if (!g) {
      g = make();
      geometries.set(key, g);
    }
    return g;
  };
  const mat = (color: number) => {
    const m = new T.MeshStandardMaterial({ color, roughness: 0.88 });
    materials.add(m);
    return m;
  };
  const white = mat(0xfff0df),
    cream = mat(0xf0e4d4),
    orange = mat(0xff7410),
    wood = mat(0xf2b777),
    ink = mat(0x30302b),
    road = mat(0x34302a),
    green = mat(0x547847),
    leaf = mat(0x78904e),
    skin = mat(0xd4a27a),
    blue = mat(0x173f58),
    teal = mat(0x4f9992),
    paper = mat(0xfff3da),
    gray = mat(0xb1b5af),
    brown = mat(0x543a2c),
    purple = mat(0xb0a0bc);
  orange.emissive.setHex(0xff6d00);
  orange.emissiveIntensity = 0.35;
  const mesh = (g: T.Object3D, geo: T.BufferGeometry, m: T.Material, x = 0, y = 0, z = 0) => {
    const o = new T.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    g.add(o);
    return o;
  };
  const box = (
    g: T.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) => {
    const o = mesh(
      g,
      geometry('box', () => new T.BoxGeometry(1, 1, 1)),
      m,
      x,
      y,
      z,
    );
    o.scale.set(w, h, d);
    return o;
  };
  const cylinder = (
    g: T.Object3D,
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) => {
    const o = mesh(
      g,
      geometry('cylinder', () => new T.CylinderGeometry(1, 1, 1, 16)),
      m,
      x,
      y,
      z,
    );
    o.scale.set(r, h, r);
    return o;
  };
  const ball = (g: T.Object3D, r: number, x: number, y: number, z: number, m: T.Material) => {
    const o = mesh(
      g,
      geometry('sphere', () => new T.SphereGeometry(1, 12, 10)),
      m,
      x,
      y,
      z,
    );
    o.scale.setScalar(r);
    return o;
  };
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
    const geo = geometry(`rounded:${w}:${h}:${d}:${r}`, () => {
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
      const shape = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 10 });
      shape.rotateX(-Math.PI / 2);
      return shape;
    });
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
    bg: string | null = '#fffaf1',
    fg = '#39382f',
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 768, 192);
    }
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 128px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(text, 384, 96, 730);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
    textures.add(texture);
    const material = new T.MeshBasicMaterial({ map: texture, transparent: !bg, depthWrite: !!bg });
    materials.add(material);
    const o = mesh(
      g,
      geometry('plane', () => new T.PlaneGeometry(1, 1)),
      material,
      x,
      y,
      z,
    );
    o.scale.set(w, h, 1);
    o.castShadow = false;
    return o;
  }
  function plant(g: T.Object3D, x: number, z: number, scale = 1, tree = false) {
    const p = new T.Group();
    p.position.set(x, 0, z);
    p.scale.setScalar(scale);
    g.add(p);
    if (!tree) cylinder(p, 0.25, 0.4, 0, 0.2, 0, white);
    cylinder(p, tree ? 0.085 : 0.032, tree ? 1.8 : 1.1, 0, tree ? 0.9 : 0.75, 0, brown);
    for (let i = 0; i < (tree ? 11 : 7); i++) {
      const theta = i * 2.399,
        rr = tree ? 0.55 : 0.3;
      const o = mesh(
        p,
        geometry('leaf', () => new T.IcosahedronGeometry(1, 1)),
        i % 3 ? green : leaf,
        Math.sin(theta) * rr,
        tree ? 1.9 + (i % 3) * 0.25 : 1.25 + (i % 3) * 0.09,
        Math.cos(theta) * rr,
      );
      o.scale.setScalar(tree ? 0.58 : 0.35);
      o.scale.y *= 0.8;
    }
    return p;
  }
  function person(
    g: T.Object3D,
    x: number,
    z: number,
    shirt: T.Material,
    scale = 1,
    seated = false,
  ) {
    const p = new T.Group();
    p.position.set(x, 0, z);
    p.scale.setScalar(scale);
    g.add(p);
    const legs: T.Group[] = [],
      arms: T.Mesh[] = [];
    for (const xx of [-0.13, 0.13]) {
      const l = new T.Group();
      l.position.set(xx, 0.65, 0);
      p.add(l);
      if (seated) {
        l.position.y = 0.57;
        box(l, 0.17, 0.16, 0.49, 0, -0.04, 0.18, blue);
        box(l, 0.16, 0.45, 0.17, 0, -0.29, 0.39, blue);
        box(l, 0.19, 0.1, 0.29, 0, -0.52, 0.45, ink);
      } else {
        box(l, 0.16, 0.57, 0.19, 0, -0.29, 0, blue);
        box(l, 0.18, 0.1, 0.29, 0, -0.56, 0.045, ink);
      }
      legs.push(l);
    }
    const body = mesh(
      p,
      geometry('body', () => new T.CapsuleGeometry(0.23, 0.34, 4, 8)),
      shirt,
      0,
      seated ? 0.87 : 1.02,
      0,
    );
    body.scale.z = 0.78;
    ball(p, 0.22, 0, seated ? 1.36 : 1.52, 0, skin);
    const hair = mesh(
      p,
      geometry('hair', () => new T.SphereGeometry(0.225, 12, 8, 0, Math.PI * 2, 0, 1.45)),
      brown,
      0,
      seated ? 1.4 : 1.56,
      0,
    );
    hair.scale.z = 0.99;
    for (const xx of [-0.075, 0.075]) ball(p, 0.018, xx, seated ? 1.37 : 1.53, 0.2, ink);
    for (const xx of [-0.3, 0.3]) {
      const arm = mesh(
        p,
        geometry('arm', () => new T.CapsuleGeometry(0.073, 0.37, 3, 8)),
        shirt,
        xx,
        seated ? 0.9 : 1.02,
        0.02,
      );
      arm.rotation.z = xx * 0.25;
      arms.push(arm);
      ball(p, 0.075, xx, seated ? 0.66 : 0.69, 0.035, skin);
    }
    return { group: p, legs, arms };
  }
  const monitor = (g: T.Object3D, x: number, z: number) => {
    box(g, 0.72, 0.48, 0.055, x, 1.46, z, ink);
    box(g, 0.59, 0.35, 0.02, x, 1.46, z + 0.035, gray);
    box(g, 0.06, 0.19, 0.06, x, 1.15, z, ink);
    box(g, 0.42, 0.025, 0.24, x, 1.07, z, ink);
    box(g, 0.48, 0.025, 0.17, x, 1.08, z + 0.4, ink);
  };
  function bench(g: T.Object3D, x: number, z: number, count = 3, occupants: T.Material[] = []) {
    const seats = new T.Group();
    seats.position.set(x, 0, z);
    g.add(seats);
    box(seats, count * 1.0, 0.055, 0.08, 0, 0.37, 0, gray);
    for (let i = 0; i < count; i++) {
      const xx = (i - (count - 1) / 2) * 1.0;
      rounded(seats, 0.9, 0.09, 0.58, 0.07, xx, 0.48, 0, wood);
      rounded(seats, 0.9, 0.52, 0.08, 0.05, xx, 0.57, -0.28, wood);
      for (const dx of [-0.25, 0.25]) box(seats, 0.035, 0.5, 0.035, xx + dx, 0.25, 0.02, gray);
      if (occupants[i]) person(seats, xx, -0.04, occupants[i], 0.9, true);
    }
    return seats;
  }
  function shelves(g: T.Object3D, x: number, z: number, width = 6.4) {
    box(g, width, 2.65, 0.52, x, 1.38, z, white);
    for (let row = 0; row < 5; row++) {
      box(g, width, 0.07, 0.65, x, 0.3 + row * 0.5, z + 0.03, white);
      for (let col = 0; col < 16; col++) {
        const m = [blue, teal, orange, green, purple, wood][(col * 3 + row * 2) % 6];
        const folder = box(
          g,
          0.2,
          0.32,
          0.2,
          x - width / 2 + 0.3 + (col * (width - 0.6)) / 15,
          0.52 + row * 0.5,
          z + 0.23,
          m,
        );
        if (col % 5 === 0) folder.rotation.z = 0.18;
      }
    }
  }
  // Warm tiled site and continuous shadows, shared by exterior/interior.
  const ground = box(root, 230, 0.1, 130, 24, -0.32, 0, cream);
  ground.castShadow = false;
  const grid = new T.GridHelper(220, 73, 0xd8ccbb, 0xd8ccbb);
  grid.position.set(24, -0.26, 0);
  const gridMaterial = grid.material as T.Material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.24;
  materials.add(gridMaterial);
  geometries.set('ground-grid', grid.geometry);
  root.add(grid);
  // White curved facade above the service podium, narrow ribbed orange tower and low wing.
  rounded(building, 11, 0.16, 8.3, 0.7, 0, -0.2, 0.8, white);
  rounded(building, 9.6, 2.7, 7.2, 0.4, 0, 0, 0.8, white);
  for (let i = 0; i < 7; i++) {
    const y = 3.1 + i * 0.87;
    rounded(building, 6.6, 0.62, 4.8, 0.65, -0.75, y, -0.35, ink);
    rounded(building, 6.76, 0.25, 4.96, 0.72, -0.75, y + 0.62, -0.35, white);
    for (let x = -3.7; x < 2.5; x += 0.7)
      box(building, 0.065, 0.63, 0.07, x, y + 0.31, 2.07, white);
    for (let z = -2.35; z < 1.95; z += 0.6)
      box(building, 0.07, 0.63, 0.065, 2.57, y + 0.31, z, white);
  }
  rounded(building, 6.82, 0.4, 5.02, 0.75, -0.75, 9.15, -0.35, white);
  box(building, 1.95, 11.2, 4.9, 3.8, 5.6, -3.0, orange);
  for (let i = 0; i < 20; i++) box(building, 0.025, 11.18, 0.07, 2.85 + i * 0.1, 5.6, -0.51, wood);
  label(building, 'zaky.', 4.1, 1.2, -1.85, 9.85, 2.18, null, '#231c17');
  label(building, 'AMANAH.', 1.5, 0.3, 3.8, 10.2, -0.45, null, '#fff8e9');
  label(building, 'TERJAGA.', 1.5, 0.3, 3.8, 9.84, -0.45, null, '#fff8e9');
  const ring = mesh(
    building,
    geometry('roof-ring', () => new T.TorusGeometry(0.72, 0.027, 8, 64)),
    orange,
    -2.0,
    9.6,
    -0.3,
  );
  ring.rotation.x = -Math.PI / 2;
  // Ground-floor glazed entry and portal; no healthcare branding.
  for (let x = -4.1; x < 3.6; x += 0.68) {
    box(building, 0.59, 1.65, 0.04, x, 1.0, 4.43, ink);
    box(building, 0.04, 1.72, 0.06, x + 0.32, 1.0, 4.45, white);
  }
  rounded(building, 8.6, 0.18, 1.2, 0.15, -0.3, 2.4, 4.5, white);
  label(building, 'PUSAT LAYANAN ZAKAT', 4.1, 0.4, -0.8, 2.16, 4.51, '#fffaf2');
  const arch = new T.Shape();
  arch.moveTo(-1.0, 0);
  arch.lineTo(1, 0);
  arch.lineTo(1, 1.7);
  arch.quadraticCurveTo(1, 2.1, 0.6, 2.1);
  arch.lineTo(-0.6, 2.1);
  arch.quadraticCurveTo(-1, 2.1, -1, 1.7);
  arch.closePath();
  const doorway = mesh(
    building,
    geometry('entrance-arch', () => new T.ShapeGeometry(arch)),
    road,
    1.2,
    0,
    4.49,
  );
  doorway.receiveShadow = false;
  box(building, 0.1, 1.8, 0.03, 0.14, 0.9, 4.53, orange);
  box(building, 0.1, 1.8, 0.03, 2.26, 0.9, 4.53, orange);
  box(building, 2.17, 0.15, 0.04, 1.2, 1.99, 4.53, orange);
  // Low service wing on the right, with narrow dark horizontal glazing.
  rounded(building, 15.8, 2.0, 4.2, 0.15, 13.5, 0, 3.4, white);
  rounded(building, 16.1, 0.17, 4.45, 0.18, 13.5, 2.0, 3.4, white);
  for (let x = 6.4; x < 21; x += 0.6) {
    box(building, 0.53, 0.8, 0.04, x, 1.12, 5.52, ink);
    box(building, 0.045, 1.7, 0.06, x + 0.29, 0.9, 5.54, white);
  }
  for (const x of [9, 12.6, 16.3]) box(building, 2.5, 0.1, 0.7, x, 2.23, 3.6, gray);
  const roadCurve = new T.CatmullRomCurve3([
    new T.Vector3(1.2, 0.01, 4.55),
    new T.Vector3(1.1, 0.01, 7.8),
    new T.Vector3(3, 0.01, 9.8),
    new T.Vector3(9, 0.01, 10.0),
    new T.Vector3(24, 0.01, 10.0),
  ]);
  const surface = (half: number, name: string, m: T.Material, y: number) => {
    const pts = roadCurve.getPoints(100),
      s = new T.Shape(),
      left: T.Vector3[] = [],
      right: T.Vector3[] = [];
    pts.forEach((p, i) => {
      const t = roadCurve.getTangent(i / 100),
        normal = new T.Vector3(-t.z, 0, t.x);
      left.push(p.clone().addScaledVector(normal, half));
      right.push(p.clone().addScaledVector(normal, -half));
    });
    [...left, ...right.reverse()].forEach((p, i) =>
      i ? s.lineTo(p.x, -p.z) : s.moveTo(p.x, -p.z),
    );
    s.closePath();
    const geo = geometry(name, () => {
      const g = new T.ShapeGeometry(s);
      g.rotateX(-Math.PI / 2);
      return g;
    });
    const path = mesh(building, geo, m, 0, y, 0);
    path.castShadow = false;
  };
  surface(1.02, 'road-border', wood, 0.012);
  surface(0.91, 'road-surface', road, 0.022);
  for (let i = 0; i < 30; i++) {
    const p = roadCurve.getPointAt(i / 29),
      t = roadCurve.getTangentAt(i / 29),
      stripe = box(building, 0.025, 0.015, 0.35, p.x, 0.04, p.z, white);
    stripe.rotation.y = Math.atan2(t.x, t.z);
  }
  for (const [x, z, s] of [
    [-1.8, 4.5, 1.15],
    [3.5, 3.8, 1],
    [6.7, 1.2, 1.2],
    [20.8, 1.5, 1],
  ])
    plant(building, x, z, s, true);
  for (const x of [-3, -2.1, -1.2, 2.5]) plant(building, x, 2.2, 0.35);
  const van = new T.Group();
  van.position.set(6, 0.07, 9.9);
  van.rotation.y = Math.PI / 2;
  building.add(van);
  rounded(van, 1.0, 0.62, 1.9, 0.12, 0, 0.25, 0, white);
  box(van, 0.9, 0.3, 0.04, 0, 0.78, 0.65, blue);
  box(van, 1.01, 0.12, 0.04, 0, 0.42, 0.97, orange);
  for (const x of [-0.5, 0.5])
    for (const z of [-0.6, 0.6]) {
      const wheel = cylinder(van, 0.19, 0.11, x, 0.22, z, ink);
      wheel.rotation.z = Math.PI / 2;
    }
  person(building, -2.9, 5.4, blue, 0.4);
  person(building, 8.3, 7.5, orange, 0.4);
  // Room helpers preserve real station/task markers while each room has its own arrangement.
  const desks = new Map<StationId, T.Group>(),
    papers = new Map<StationId, T.Mesh[]>(),
    clickable: T.Object3D[] = [];
  const room = (x: number, width = 14) => {
    const g = new T.Group();
    g.position.x = x;
    g.userData.room = true;
    rooms.add(g);
    rounded(g, width, 0.14, 11.5, 0.25, 0, -0.15, 0.25, white);
    box(g, width, 3.3, 0.16, 0, 1.63, -5.4, cream);
    box(g, width, 0.15, 0.23, 0, 3.3, -5.4, orange);
    box(g, width, 0.08, 0.2, 0, 0.015, 5.8, orange);
    return g;
  };
  const divider = (g: T.Object3D, x: number) => {
    box(g, 0.15, 3.3, 7.4, x, 1.63, -1.7, cream);
    box(g, 0.23, 0.15, 7.4, x, 3.3, -1.7, orange);
  };
  function desk(
    g: T.Object3D,
    station: StationId,
    x: number,
    z: number,
    width: number,
    staff: T.Material = blue,
    count = 1,
  ) {
    const d = new T.Group();
    d.position.set(x, 0, z);
    d.userData.station = station;
    g.add(d);
    desks.set(station, d);
    clickable.push(d);
    rounded(d, width, 0.12, 1.5, 0.08, 0, 1.03, 0, wood);
    box(d, width - 0.12, 0.95, 1.25, 0, 0.51, 0, white);
    box(d, width - 0.08, 0.055, 0.03, 0, 0.94, 0.64, orange);
    box(d, width - 0.08, 0.055, 0.04, 0, 0.05, 0.65, ink);
    label(
      d,
      station.toUpperCase(),
      Math.min(2, width / 2),
      0.24,
      0,
      0.7,
      0.66,
      '#fffaf2',
      '#d3864b',
    );
    for (let i = 0; i < count; i++) {
      const xx = count === 2 ? (i - 0.5) * 3.3 : 0;
      monitor(d, xx, -0.28);
      person(d, xx, -1.05, staff, 1);
    }
    const stack: T.Mesh[] = [];
    for (let n = 0; n < 4; n++) {
      const folder = box(
        d,
        0.36,
        0.035,
        0.3,
        width * 0.31,
        1.19 + n * 0.045,
        0.15,
        n % 2 ? orange : paper,
      );
      folder.visible = false;
      folder.userData.station = station;
      stack.push(folder);
    }
    papers.set(station, stack);
    return d;
  }
  const reception = room(0);
  divider(reception, -6.9);
  desk(reception, 'penerimaan', 0, -1.7, 7, blue, 2);
  label(reception, '+ PENERIMAAN ZAKAT', 4, 0.42, -1.4, 2.7, -5.3, '#ff851c', '#fff8ec');
  label(reception, 'CATATAN LEMBAGA', 2.15, 0.7, 4.4, 2.35, -5.28, '#25211d', '#fff8ec');
  person(reception, -2.2, -0.1, green, 1).group.rotation.y = Math.PI;
  bench(reception, 2.5, 3.4, 3, [brown, gray]);
  bench(reception, 2.5, 6.0, 3, [wood, teal]);
  plant(reception, -4.9, -0.6, 0.9);
  plant(reception, 5.9, -3.7, 1);
  const prep = room(14);
  divider(prep, -6.9);
  desk(prep, 'penyaluran', 2, -2.0, 3.0, white);
  label(prep, '+ PERSIAPAN PENYALURAN', 4.6, 0.42, -1.0, 2.7, -5.3, '#ff851c', '#fff8ec');
  box(prep, 1.0, 2.1, 0.65, -4.4, 1.05, -3.6, white);
  box(prep, 0.65, 0.8, 0.04, -4.4, 1.6, -3.25, teal);
  const kiosk = new T.Group();
  kiosk.position.set(-1.1, 0, 1.6);
  prep.add(kiosk);
  box(kiosk, 0.55, 0.07, 0.8, 0, 0.06, 0, ink);
  cylinder(kiosk, 0.035, 1.65, 0, 0.85, -0.3, gray);
  box(kiosk, 0.43, 0.31, 0.07, 0, 1.57, -0.3, ink);
  box(kiosk, 0.36, 0.24, 0.02, 0, 1.57, -0.26, teal);
  person(prep, -1.4, 1.3, teal, 0.95).group.rotation.y = Math.PI;
  for (let i = 0; i < 3; i++) {
    const screen = box(prep, 0.035, 1.55, 1.0, 4.2 + i * 0.65, 0.85, 1.4, teal);
    screen.rotation.y = 0.12;
    for (const z of [0.94, 1.94]) cylinder(prep, 0.022, 1.75, 4.2 + i * 0.65, 0.88, z, white);
  }
  box(prep, 1.25, 0.12, 2.2, 4.35, 0.82, -2.3, wood);
  box(prep, 0.75, 0.26, 0.5, 4.35, 1.0, -2.8, paper);
  plant(prep, 5.9, -4.3, 0.8);
  const witness = room(28);
  divider(witness, -6.9);
  divider(witness, 0.25);
  label(witness, '+ SAKSI / UNIT A', 4.4, 0.4, -3.1, 2.72, -5.3, '#ff851c', '#fff8ec');
  label(witness, '+ SAKSI / UNIT B', 4.6, 0.4, 3.5, 2.72, -5.3, '#ff851c', '#fff8ec');
  const witnessDesk = desk(witness, 'saksi', -3.1, -3.3, 4.9, white);
  label(witnessDesk, 'UNIT INDEPENDEN', 1.6, 0.2, 0, 0.7, 0.66, '#fffaf2', '#d3864b');
  const secondary = new T.Group();
  secondary.position.set(3.8, 0, 2.3);
  secondary.userData.station = 'saksi';
  witness.add(secondary);
  clickable.push(secondary);
  box(secondary, 2.5, 1.05, 1.2, 0, 0.52, 0, white);
  box(secondary, 2.6, 0.12, 1.3, 0, 1.1, 0, ink);
  monitor(secondary, 0, -0.12);
  person(secondary, 0, -0.95, blue, 1);
  box(witness, 1.35, 0.7, 1.8, -3.6, 0.36, 1.4, white);
  box(witness, 1.35, 0.12, 1.8, -3.6, 0.77, 1.4, teal);
  person(witness, -1.4, 1.3, white, 0.95);
  person(witness, -3.6, 2.5, purple, 0.95, true).group.rotation.y = Math.PI;
  box(witness, 1.6, 1.9, 0.12, 3.8, 1.9, -5.28, white);
  box(witness, 1.35, 1.4, 0.04, 3.8, 1.95, -5.2, ink);
  box(witness, 0.9, 1.0, 0.03, 3.8, 1.95, -5.15, paper);
  // Approval/archive and final records are adjacent counters in one shared room.
  const archive = room(45, 20);
  divider(archive, -9.9);
  shelves(archive, -3.2, -4.9, 6.5);
  desk(archive, 'persetujuan', -3.2, -1.2, 6.4, gray);
  desk(archive, 'catatan', 3.4, -1.2, 3.8, blue);
  label(archive, '+ PEMERIKSAAN & CATATAN', 6.0, 0.4, -1, 2.72, -5.3, '#ff851c', '#fff8ec');
  bench(archive, 0.7, 5.5, 3, [green]);
  plant(archive, 7, -3.4, 1);
  // Route geometry uses exactly the same curved path as the animated character.
  const routePoints: T.Vector3[] = [],
    distances: number[] = [];
  let distance = 0,
    lastPoint: T.Vector3 | undefined;
  for (let i = 0; i <= 500; i++) {
    const p = journeyPose(i / 500).character,
      v = new T.Vector3(p[0], 0.035, p[2]);
    if (lastPoint) distance += v.distanceTo(lastPoint);
    distances.push(distance);
    lastPoint = v;
    if (!routePoints.length || v.distanceTo(routePoints[routePoints.length - 1]) > 0.025)
      routePoints.push(v);
  }
  const route = new T.CatmullRomCurve3(routePoints),
    segments = 360,
    sides = 6;
  const pale = mat(0xe9bc90);
  const fullGeometry = geometry(
    'journey-route-base',
    () => new T.TubeGeometry(route, segments, 0.035, sides, false),
  );
  const activeGeometry = geometry('journey-route-active', () => fullGeometry.clone());
  const basePath = mesh(rooms, fullGeometry, pale);
  basePath.castShadow = false;
  const activePath = mesh(rooms, activeGeometry, orange, 0, 0.008, 0);
  activePath.castShadow = false;
  const updateRoute = (progress: number) => {
    const n = Math.round(Math.max(0, Math.min(1, progress)) * 500);
    activeGeometry.setDrawRange(0, Math.floor((distances[n] / distance) * segments) * sides * 6);
  };
  const avatar = person(root, -0.6, 6.5, orange, 1);
  box(avatar.group, 0.29, 0.34, 0.13, 0, 1.01, -0.24, blue);
  box(avatar.group, 0.035, 0.45, 0.025, -0.17, 1.03, -0.18, blue);
  box(avatar.group, 0.035, 0.45, 0.025, 0.17, 1.03, -0.18, blue);
  rooms.visible = false;
  return {
    root,
    building,
    rooms,
    avatar: avatar.group,
    legs: avatar.legs,
    arms: avatar.arms,
    desks,
    papers,
    clickable,
    updateRoute,
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
