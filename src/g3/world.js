// Mundo 3D: céu, pista em blocos reciclados, cenário lateral por tema, buracos. O jogador fica em z = 0 e o
// mundo "corre" em direção a +z; uma posição s na pista vira z = dist - s (negativo = à frente).
import { THREE, P, box, toMesh, mergeParts, toon, hex, mixHex, rng, lowDetail } from './kit.js';
import { SCENERY, buildSea, animateSea, SEA_TILE } from './final.js';
import { SCENERY as SCENERY_LO } from './props.js';

// a partir desta distância o cenário troca para a versão simples (o detalhe fino não aparece de longe)
const LOD_FAR = 28;
const LO_KEY = { treefern: 'cycad', horsetail: 'cycad' };

export const LANE_W = 2.1;
export const ROAD_HALF = 3.5;
const TILE = 3, TILES = 34, TILES_BEHIND = 3;
const CHUNK = 12, CHUNKS = 8;

// Cada tema: cores da pista/laterais, céu, luz e a receita do cenário.
export const THEMES3 = {
  bairro: {
    sky: [0x2f9bff, 0xcdeeff], fog: 0xcdeeff, hemi: [0xe4f4ff, 0xb5a27a, 1.2], sun: [0xfff2d8, 2.1],
    road: [0x4b5568, 0x525d72], line: 0xffffff, edge: 0xffd23f, curb: 0xe9edf5, walk: 0xd9d2c4, side: [0x58d36a, 0x4cc65e], pit: 0x22456e, pitName: 'água',
    layout: (r, side) => [
      { key: 'lamp', x: 5.6, z: r.between(1, 11) },
      { key: r.pick(['bush', 'bush', 'fence', 'flowers']), x: 6.6, z: r.between(1, 11) },
      { key: 'house', x: 11.5, z: 3, face: true }, { key: r.pick(['house', 'tree', 'tree']), x: r.pick([9.4, 10.4]), z: 9, face: true },
      { key: r.pick(['tower', 'tree']), x: r.between(20, 26), z: r.between(2, 10), face: true },
      ...(r.frac() < 0.5 ? [{ key: 'tree', x: r.between(15, 18), z: r.between(1, 11) }] : []),
    ],
    far: ['tower', 'tower', 'hill'],
  },
  praca: {
    sky: [0x3fb0ff, 0xffe9b8], fog: 0xffe9b8, hemi: [0xfff4e0, 0xc2a070, 1.2], sun: [0xffe6b0, 2.2],
    road: [0xe3c08f, 0xd9b482], line: 0xf6e3bd, edge: 0xc4905a, curb: 0xffffff, walk: 0xf2ddb0, side: [0x6ad46a, 0x5ac85c], pit: 0x2f78c8, pitName: 'água',
    layout: (r) => [
      { key: 'lamp', x: 5.6, z: r.between(1, 11) },
      { key: r.pick(['bench', 'flowers', 'bush']), x: 6.4, z: r.between(1, 11) },
      { key: r.pick(['shop', 'shop', 'house']), x: 12, z: 3, face: true }, { key: r.pick(['tree', 'fountain', 'shop']), x: r.pick([9, 10]), z: 9, face: true },
      { key: r.pick(['tree', 'tower']), x: r.between(18, 24), z: r.between(2, 10), face: true },
    ],
    far: ['hill', 'tower', 'hill'],
  },
  floresta: {
    sky: [0x3fb8ff, 0xd6ffb8], fog: 0xcfeebd, hemi: [0xf0ffe0, 0x9a8a5a, 1.15], sun: [0xfff4c8, 2.0],
    road: [0xc79558, 0xbd8a4e], line: 0xd9aa6c, edge: 0x7fcf4a, curb: 0x7fcf4a, walk: 0x6cc24a, side: [0x3fb85a, 0x36ad52], pit: 0x2f78c8, pitName: 'riacho',
    layout: (r) => [
      { key: r.pick(['fern', 'mushroom', 'rock', 'bush']), x: r.between(5.4, 6.8), z: r.between(1, 11) },
      { key: r.pick(['pine', 'tree', 'pine']), x: r.between(8, 10), z: 3 }, { key: r.pick(['pine', 'bigtree', 'tree']), x: r.between(8.5, 11), z: 9 },
      { key: r.pick(['pine', 'bigtree']), x: r.between(13, 18), z: r.between(1, 11) }, { key: 'bigtree', x: r.between(20, 28), z: r.between(1, 11) },
      ...(r.frac() < 0.5 ? [{ key: 'rock', x: r.between(7, 9), z: r.between(1, 11) }] : []),
    ],
    far: ['hill', 'hill', 'bigtree'],
  },
  altura: {
    sky: [0xff7e6b, 0xffd9a0], fog: 0xffd2a0, hemi: [0xffe3c8, 0xb08a7a, 1.15], sun: [0xffc58a, 2.2],
    road: [0x8e98ad, 0x8590a6], line: 0xffffff, edge: 0xffc92b, curb: 0xdfe6f1, walk: 0xb7c0d2, side: [0x9ba5ba, 0x939eb4], pit: 0xffe3c0, pitName: 'vão', rooftop: true,
    layout: (r) => [
      { key: 'rail', x: 5.0, z: 6 },
      { key: r.pick(['tank', 'billboard', 'bush']), x: r.between(6.5, 8.5), z: r.between(2, 10), face: true },
      { key: 'tower', x: r.between(14, 22), z: r.between(1, 11), face: true, drop: 12 }, { key: 'tower', x: r.between(26, 40), z: r.between(1, 11), face: true, drop: 14 },
    ],
    far: ['tower', 'tower', 'cloud'],
  },
  agua: {
    sky: [0x29a8ff, 0xd8f4ff], fog: 0xd8f4ff, hemi: [0xe8f8ff, 0x7fb8c8, 1.2], sun: [0xfff4dc, 2.2],
    road: [0xc99a62, 0xbf8f58], line: 0xe8c48c, edge: 0x8a5a35, curb: 0x8a5a35, walk: 0xb98a52, side: [0x2f9be0, 0x2b94da], pit: 0x1f78c8, pitName: 'mar', sideDrop: 0.45, planks: true,
    layout: (r) => [
      { key: 'post', x: 4.1, z: r.between(1, 11) },
      { key: r.pick(['buoyS', 'buoyS', 'rocksea']), x: r.between(6.5, 9), z: r.between(1, 11) },
      { key: r.pick(['boat', 'boat', 'palmisle']), x: r.between(11.5, 15), z: r.between(2, 10), face: true },
      ...(r.frac() < 0.3 ? [{ key: 'lighthouse', x: r.between(22, 30), z: r.between(1, 11) }] : []),
    ],
    far: ['island', 'cloud', 'island'],
  },
  vulcao: {
    sky: [0xff7a4a, 0xffd0a0], fog: 0xf0b890, hemi: [0xffe0c8, 0x8a4a3a, 1.15], sun: [0xffb070, 2.2],
    road: [0x5a4a48, 0x534341], line: 0xff9a3a, edge: 0xff6a1a, curb: 0x3a2e2e, walk: 0x6a5450, side: [0x4a3a38, 0x463634], pit: 0xff5a1a, pitName: 'lava',
    layout: (r) => [
      { key: r.pick(['lavarockS', 'vent', 'deadtree']), x: r.between(5.4, 7), z: r.between(1, 11) },
      { key: r.pick(['deadtree', 'lavarockS', 'hut']), x: r.between(9.5, 12), z: r.between(2, 10), face: true },
      { key: 'lavapool', x: r.between(14, 20), z: r.between(1, 11) },
    ],
    far: ['volcano', 'darkhill', 'volcano'],
  },
  pre: {
    sky: [0xffb347, 0xfff0c4], fog: 0xffe9b0, hemi: [0xfff1d8, 0x9a7a4a, 1.2], sun: [0xffd98a, 2.2],
    road: [0xd9b46e, 0xcfa862], line: 0xeccd8c, edge: 0x6fcf4a, curb: 0x7fd44a, walk: 0x7fcf4a, side: [0x4fc24a, 0x45b743], pit: 0x2f78c8, pitName: 'pântano',
    layout: (r) => [
      { key: r.pick(['fern', 'mushroom', 'bones', 'rock']), x: r.between(5.6, 7), z: r.between(1, 11) },
      { key: r.pick(['cycad', 'horsetail', 'fern']), x: r.between(8, 11), z: 3 }, { key: r.pick(['cycad', 'treefern', 'bigtree', 'mushroom']), x: r.between(8.5, 12), z: 9 },
      { key: r.pick(['treefern', 'cycad', 'rock', 'bigtree']), x: r.between(14, 20), z: r.between(1, 11) },
      ...(r.frac() < 0.22 ? [{ key: 'dino', x: r.between(24, 32), z: r.between(1, 11), face: true }] : []),
    ],
    far: ['volcano', 'hill', 'hill'],
  },
};

const sideGeoCache = {}, trackGeoCache = {};
function trackGeo(th, parity) {
  const k = th + parity; if (trackGeoCache[k]) return trackGeoCache[k];
  const T = THEMES3[th];
  const road = T.road[parity];
  const p = [P(box(ROAD_HALF * 2, 0.5, TILE + 0.02, 0.0), road, [0, -0.25, 0])];
  [-1, 1].forEach((s) => { p.push(P(box(0.18, 0.5, TILE + 0.02, 0.0), T.edge, [s * (ROAD_HALF - 0.12), -0.25, 0])); });
  [-1, 1].forEach((s) => p.push(P(box(0.08, 0.02, 1.4, 0.0), T.line, [s * LANE_W / 2, 0.005, -0.8 + (parity ? 0.8 : 0)]), P(box(0.08, 0.02, 1.4, 0.0), T.line, [s * LANE_W / 2, 0.005, 0.7 + (parity ? 0.8 : 0)])));
  if (T.planks) for (let i = 0; i < 5; i++) p.push(P(box(ROAD_HALF * 2 - 0.4, 0.02, 0.05, 0.0), hex(road, 0.78), [0, 0.006, -1.2 + i * 0.6]));
  if (th === 'praca') for (let i = -3; i <= 3; i++) p.push(P(box(0.9, 0.02, 0.9, 0.0), hex(road, 0.93), [i * 1.0, 0.008, (parity ? 0.7 : -0.7)]));
  if (th === 'floresta' || th === 'pre') for (let i = 0; i < 3; i++) p.push(P(new THREE.SphereGeometry(0.1, 5, 4), 0xa9763c, [(i - 1) * 2.2 + (parity ? 0.4 : -0.3), 0.02, (i % 2 ? 0.7 : -0.8)], [0, 0, 0], [1.4, 0.5, 1]));
  const g = mergeParts(p); trackGeoCache[k] = g; return g;
}
function sideGeo(th, parity) {
  const k = th + parity; if (sideGeoCache[k]) return sideGeoCache[k];
  const T = THEMES3[th];
  const p = [];
  const W = th === 'altura' ? 8.5 : 70;
  [-1, 1].forEach((s) => {
    p.push(P(box(1.7, 3.2, TILE + 0.02, 0.0), T.walk, [s * (ROAD_HALF + 0.85), -1.6, 0]));
    p.push(P(box(0.3, 0.2, TILE + 0.02, 0.0), T.curb, [s * (ROAD_HALF + 0.15), -0.08, 0]));
    p.push(P(box(W, 3.2, TILE + 0.02, 0.0), T.side[parity], [s * (ROAD_HALF + 1.7 + W / 2), -1.6 - (T.sideDrop || 0), 0]));
    if (th !== 'altura') p.push(P(box(W, 0.02, 1.2, 0.0), hex(T.side[parity], 1.08), [s * (ROAD_HALF + 1.7 + W / 2), 0.01 - (T.sideDrop || 0), parity ? 0.7 : -0.7]));
  });
  const g = mergeParts(p); sideGeoCache[k] = g; return g;
}

export class World {
  constructor(scene, themeName, seed) {
    this.scene = scene; this.theme = themeName; this.seed = seed;
    this.root = new THREE.Group(); scene.add(this.root);
    this.holes = [];                                   // {s, len, group}
    // ---- blocos da pista ----
    this.tiles = [];
    for (let i = 0; i < TILES; i++) {
      const track = new THREE.Mesh(trackGeo(themeName, 0), toon), side = new THREE.Mesh(sideGeo(themeName, 0), toon);
      track.userData.k = null; track.userData.th = themeName; track.receiveShadow = side.receiveShadow = true;
      this.root.add(track, side); this.tiles.push({ track, side, k: null, th: null });
    }
    // ---- mar da fase da água (superfície que reflete o céu; anda junto com a câmera) ----
    this.sea = buildSea(); this.sea.position.y = -0.4; this.sea.visible = themeName === 'agua'; this.root.add(this.sea); this.seaT = 0;
    // ---- cenário em blocos ----
    this.lib = {};
    this.chunks = [];
    for (let i = 0; i < CHUNKS; i++) { const g = new THREE.Group(); this.root.add(g); this.chunks.push({ g, c: null, th: null }); }
    // ---- céu, sol, nuvens e colinas distantes (acompanham a câmera) ----
    this.sky = new THREE.Group(); scene.add(this.sky);
    const geo = new THREE.SphereGeometry(300, 20, 12);
    const n = geo.attributes.position.count; geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.skyMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); this.skyMesh.renderOrder = -10;
    this.sky.add(this.skyMesh);
    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6c8, fog: false })); this.sunMesh.position.set(-70, 70, -230); this.sky.add(this.sunMesh);
    this.sunHalo = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1b0, fog: false, transparent: true, opacity: 0.35 })); this.sunHalo.position.copy(this.sunMesh.position); this.sky.add(this.sunHalo);
    this.far = [];
    const r0 = rng(seed + 'far');
    for (let i = 0; i < 14; i++) { const g = new THREE.Group(); this.sky.add(g); this.far.push({ g, x: (r0.frac() < 0.5 ? -1 : 1) * r0.between(60, 150), z: -r0.between(60, 260), key: null, lane: i % 3 }); }
    this.clouds = [];
    for (let i = 0; i < 9; i++) { const g = SCENERY.cloud(r0).clone(); g.position.set(r0.between(-140, 140), r0.between(34, 70), -r0.between(80, 280)); g.scale.setScalar(r0.between(1.4, 2.4)); this.sky.add(g); this.clouds.push({ g, sp: r0.between(0.6, 1.6) }); }
    this.skyCur = THEMES3[themeName].sky.slice(); this.skyTarget = THEMES3[themeName].sky.slice();
    this.fogColor = new THREE.Color(THEMES3[themeName].fog);
    this.paintSky(this.skyCur);
    this.assignFar(themeName);
    this.nextTheme = themeName;
    this.cloudSea = null;
    this.lastDist = -1;
  }

  paintSky(c) {
    const geo = this.skyMesh.geometry, pos = geo.attributes.position, col = geo.attributes.color;
    const top = new THREE.Color(c[0]), hor = new THREE.Color(c[1]), t = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const k = Math.min(1, Math.max(0, pos.getY(i) / 220)); t.copy(hor).lerp(top, Math.pow(k, 0.7)); col.setXYZ(i, t.r, t.g, t.b); }
    col.needsUpdate = true;
  }

  libGet(key, theme, i) {
    const id = key + i;
    if (!this.lib[id]) {
      const hq = lowDetail(() => SCENERY[key](rng(this.seed + id))), lk = LO_KEY[key] || key;
      if (SCENERY_LO[lk] && SCENERY_LO[lk] !== SCENERY[key]) { const lod = new THREE.LOD(); lod.addLevel(hq, 0); lod.addLevel(lowDetail(() => SCENERY_LO[lk](rng(this.seed + id))), LOD_FAR); this.lib[id] = lod; }
      else this.lib[id] = hq;
    }
    return this.lib[id].clone();
  }

  assignFar(theme) {
    const T = THEMES3[theme], r = rng(this.seed + theme + 'f');
    this.far.forEach((f, i) => {
      while (f.g.children.length) f.g.remove(f.g.children[0]);
      const key = T.far[i % T.far.length];
      const o = this.libGet(key, theme, r.int(0, 3));
      const big = key === 'tower' ? 3.2 : key === 'bigtree' ? 3 : key === 'cloud' ? 5 : key === 'volcano' ? 2.2 : 1.6;
      o.scale.setScalar(big); f.g.add(o); f.key = key; f.y = key === 'tower' ? -10 : key === 'cloud' ? r.between(8, 30) : 0;
    });
  }

  setTheme(name) {
    if (name === this.nextTheme) return;
    this.nextTheme = name; this.skyTarget = THEMES3[name].sky.slice();
    this.assignFar(name);
  }

  // ---------------- buracos (vão na pista) ----------------
  addHole(s, len) {
    const T = THEMES3[this.nextTheme];
    const g = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF * 2, 0.3, len), new THREE.MeshBasicMaterial({ color: T.pit })); floor.position.set(0, T.rooftop ? -9 : -1.9, 0); g.add(floor);
    if (!T.rooftop) { const sh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF * 2, 0.04, len), new THREE.MeshBasicMaterial({ color: mixHex(T.pit, 0xffffff, 0.35), transparent: true, opacity: 0.55 })); sh.position.set(0, -1.75, 0); g.add(sh); g.userData.shimmer = sh; }
    // faixas de aviso nas duas bordas
    const warn = (z) => { const w = toMesh(Array.from({ length: 7 }, (_, i) => P(box(0.9, 0.12, 0.34, 0.02), i % 2 ? 0xffffff : 0xe8352f, [-3 + i, 0.09, z])), { thin: true }); return w; };
    g.add(warn(-len / 2 - 0.2), warn(len / 2 + 0.2));
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, len), new THREE.MeshToonMaterial({ color: hex(T.road[0], 0.6) })); wallL.position.set(-ROAD_HALF, -1.1, 0); g.add(wallL);
    const wallR = wallL.clone(); wallR.position.x = ROAD_HALF; g.add(wallR);
    this.root.add(g);
    const h = { s, len, g }; this.holes.push(h); return h;
  }
  removeHole(h) { this.root.remove(h.g); this.holes = this.holes.filter((x) => x !== h); }
  inHole(s0, s1) { return this.holes.some((h) => s1 > h.s && s0 < h.s + h.len); }

  update(dist, dt, speed) {
    const T = THEMES3[this.nextTheme];
    // ---- pista ----
    const k0 = Math.floor((dist - TILES_BEHIND * TILE) / TILE);
    for (let i = 0; i < TILES; i++) {
      const k = k0 + i, t = this.tiles[((k % TILES) + TILES) % TILES];
      if (t.k !== k) {
        t.k = k; const par = ((k % 2) + 2) % 2;
        // a pista nova nasce com o tema novo à frente; o que ficou para trás mantém o antigo (transição gradual)
        const th = this.nextTheme;
        t.track.geometry = trackGeo(th, par); t.side.geometry = sideGeo(th, par); t.th = th;
      }
      const z = dist - (k * TILE + TILE / 2);
      t.track.position.z = z; t.side.position.z = z;
      t.track.visible = !this.inHole(k * TILE + 0.01, k * TILE + TILE - 0.01);
    }
    // ---- cenário ----
    const c0 = Math.floor((dist - CHUNK) / CHUNK);
    for (let i = 0; i < CHUNKS; i++) {
      const c = c0 + i, ch = this.chunks[((c % CHUNKS) + CHUNKS) % CHUNKS];
      if (ch.c !== c) { ch.c = c; this.fillChunk(ch, c, this.nextTheme); }
      ch.g.position.z = dist - c * CHUNK;
    }
    // ---- mar ----
    this.sea.visible = this.nextTheme === 'agua' || this.tiles.some((t) => t.th === 'agua');
    if (this.sea.visible) { this.sea.position.z = (((dist % SEA_TILE) + SEA_TILE) % SEA_TILE) - SEA_TILE * 9; this.seaT += dt; animateSea(this.seaT); }
    // ---- buracos ----
    for (let i = this.holes.length - 1; i >= 0; i--) {
      const h = this.holes[i]; h.g.position.z = dist - (h.s + h.len / 2);
      if (h.g.userData.shimmer) h.g.userData.shimmer.position.y = -1.75 + Math.sin(performance.now() / 300 + h.s) * 0.04;
      if (h.s + h.len < dist - 12) this.removeHole(h);
    }
    // ---- céu ----
    const sp = this.skyCur;
    for (let j = 0; j < 2; j++) { if (sp[j] !== this.skyTarget[j]) sp[j] = mixHex(sp[j], this.skyTarget[j], Math.min(1, dt * 1.2)); }
    if (this.skyChanged !== (sp[0] + ',' + sp[1])) { this.skyChanged = sp[0] + ',' + sp[1]; this.paintSky(sp); }
    this.fogColor.set(sp[1]);
    const par = dist * 0.18;
    this.far.forEach((f) => { const span = 320; const z = -300 + (((f.z + 300 + par * (0.6 + f.lane * 0.25)) % span) + span) % span; f.g.position.set(f.x, f.y, z); });
    this.clouds.forEach((c) => { c.g.position.z += dt * (1.5 + c.sp * 2 + speed * 0.04); if (c.g.position.z > 40) c.g.position.z = -300; });
  }

  fillChunk(ch, c, theme) {
    while (ch.g.children.length) ch.g.remove(ch.g.children[0]);
    const T = THEMES3[theme], r = rng(this.seed + theme + c);
    [-1, 1].forEach((side) => {
      const items = T.layout(r, side);
      items.forEach((it, idx) => {
        const o = this.libGet(it.key, theme, r.int(0, 3));
        const x = it.x * side + (it.key === 'tower' && T.rooftop ? side * 0 : 0);
        o.position.set(x, it.drop ? -it.drop : 0, -(it.z + (idx * 0.9 % 1.5)));
        if (it.face) o.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
        else o.rotation.y = r.between(0, 6.28);
        if (it.key === 'lamp') o.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        ch.g.add(o);
      });
    });
  }

  follow(camZ) { this.sky.position.z = camZ; }
}
