// Versões finais dos modelos, conforme as escolhas de qualidade (docs/qualidade-escolhas.md).
// O jogo importa daqui (e não direto de props.js / creatures.js) os construtores de cenário, obstáculos, missões e bichinhos.
// Cada peça "muito alta" é compactada (malhas do mesmo material juntadas) e não carrega luzes próprias, para o celular aguentar.
import { THREE, PART_HOOK, toMesh, hex } from './kit.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as B from './props.js';
import * as C from './creatures.js';
import { HQ, treeMuito, houseAlta, towerAlta, lampAlta, truckAlta, TEX } from './hq.js';
import { HQ2, withLevel, FUR, shopMuito, fountainAlta, plazaMuito, obs2Muito } from './hq2.js';
import { pineMuito, bigtreeMuito, groundMuito, obs3Muito, leafPadAlta } from './hq3.js';
import { heliMuito, roofAlta, obs4Alta, platMuito } from './hq4.js';
import { nestMuito, plantsMuito, volcanoAlta, bonesAlta, dinoAt } from './hq5.js';
import { boatAlta, lightAlta, obs6Alta, raftMuito, pierAlta, foamRing, seaShowcase } from './hq6.js';
import { lavaMuito, islandMuito, hutMuito, deadVentAlta, lavarockMuito } from './hq7.js';

// pelo dos bichinhos: menos camadas e esferas mais leves no jogo
FUR.shells = 6; FUR.seg = [22, 15]; FUR.len = 0.04; FUR.merged = true;

// ------------------------------------------------------------------ utilidades
/** remove luzes (cada luz pontual extra custa caro em todos os materiais) */
export function stripLights(root) { const rm = []; root.traverse((o) => { if (o.isLight) rm.push(o); }); rm.forEach((o) => { if (o.target && o.target.parent) o.target.parent.remove(o.target); o.parent && o.parent.remove(o); }); return root; }

const _box = new THREE.Box3(), _c = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler();
/** centro de uma peça (inclui pontos já embutidos na geometria, como tubos e lajes) */
function partCenter(q) {
  const g = q.geo; if (!g.boundingBox) g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3());
  _e4.set(q.r[0], q.r[1], q.r[2]); _q4.setFromEuler(_e4); _m4.compose(new THREE.Vector3(q.p[0], q.p[1], q.p[2]), _q4, new THREE.Vector3(q.s[0], q.s[1], q.s[2]));
  c.applyMatrix4(_m4); return [c.x, c.y, c.z];
}
/**
 * Recorta uma parte de um modelo composto: `parts` filtra as peças antes de juntar (pela posição),
 * `kids` filtra os filhos diretos já prontos (pelo centro). `at` recentraliza.
 */
function region(build, { parts = null, kids = () => true, at = [0, 0, 0] } = {}) {
  let g;
  if (parts) {
    const hook = (ps, opts) => { const keep = ps.filter((q) => parts(partCenter(q))); PART_HOOK.fn = null; const m = keep.length ? toMesh(keep, opts) : new THREE.Group(); PART_HOOK.fn = hook; m.userData.cut = true; return m; };
    PART_HOOK.fn = hook; try { g = build(); } finally { PART_HOOK.fn = null; }
  } else g = build();
  g.updateMatrixWorld(true);
  const out = new THREE.Group(), inner = new THREE.Group(); inner.position.set(-at[0], -at[1], -at[2]); out.add(inner);
  [...g.children].forEach((ch) => {
    if (ch.userData.cut) { if (ch.children.length) inner.add(ch); return; }
    if (ch.isLight) return;
    _box.makeEmpty(); _box.expandByObject(ch, true); if (_box.isEmpty()) return;
    _box.getCenter(_c); if (kids([_c.x, _c.y, _c.z], ch)) inner.add(ch);
  });
  return out;
}
const range = (a, b) => (p) => p[0] >= a && p[0] < b;

const hasMaps = (m) => !!(m.map || m.bumpMap || m.normalMap || m.emissiveMap || m.alphaMap || m.roughnessMap || m.metalnessMap);
/** materiais sem textura e com cor única podem ser juntados levando a cor para os vértices */
const bakeable = (m) => !m.isShaderMaterial && !Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile') && !hasMaps(m) && !m.vertexColors && (m.isMeshStandardMaterial || m.isMeshToonMaterial || m.isMeshBasicMaterial || m.isMeshLambertMaterial);
function matSig(m, bake) {
  if (m.isShaderMaterial || Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile')) return m.uuid;
  const t = (x) => (x ? x.uuid : '-'), c = (x) => (x ? x.getHex() : '-');
  const q = (v, k) => (bake && v !== undefined ? Math.round(v * k) / k : v);
  return [bake && m.isMeshStandardMaterial ? 'std' + (m.clearcoat > 0 ? 'cc' : '') + (m.transmission > 0 ? 'tr' : '') : m.type, bake ? 'vc' : c(m.color), q(m.roughness, 3), q(m.metalness, 2), c(m.emissive), m.emissiveIntensity, t(m.map), t(m.bumpMap), m.bumpScale, t(m.normalMap), t(m.emissiveMap), t(m.alphaMap), t(m.gradientMap),
    m.alphaTest, m.transparent, m.opacity, m.side, m.vertexColors, bake ? m.clearcoat > 0 : m.clearcoat, bake ? '' : m.clearcoatRoughness, bake ? m.sheen > 0 : m.sheen, m.transmission, m.depthWrite, m.blending, m.toneMapped, bake ? '' : m.envMapIntensity].join('|');
}
/** junta as malhas de mesmo material numa só (menos chamadas de desenho) */
export function compact(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), M = new THREE.Matrix4();
  const buckets = new Map(), done = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.renderOrder !== 0 || o.userData.keep) return;
    const m = o.material, bake = bakeable(m), needUv = hasMaps(m), vc = !!m.vertexColors || bake;
    const key = matSig(m, bake) + '#' + needUv + vc + o.castShadow + o.receiveShadow;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    Object.keys(g.attributes).forEach((k) => { if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k); });
    if (!g.attributes.normal) g.computeVertexNormals();
    if (needUv && !g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!needUv && g.attributes.uv) g.deleteAttribute('uv');
    const n = g.attributes.position.count;
    if (bake) { const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = m.color.r; a[i * 3 + 1] = m.color.g; a[i * 3 + 2] = m.color.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
    else if (vc && !g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    if (!vc && g.attributes.color) g.deleteAttribute('color');
    g.morphAttributes = {};
    M.multiplyMatrices(inv, o.matrixWorld); g.applyMatrix4(M);
    if (!buckets.has(key)) { let mm = m; if (bake) { mm = m.clone(); mm.color.setRGB(1, 1, 1); mm.vertexColors = true; } buckets.set(key, { m: mm, list: [], cast: o.castShadow, recv: o.receiveShadow }); }
    buckets.get(key).list.push(g); done.push(o);
  });
  done.forEach((o) => o.parent && o.parent.remove(o));
  buckets.forEach(({ m, list, cast, recv }) => { const geo = mergeGeometries(list, false); list.forEach((x) => x.dispose()); if (!geo) return; const mesh = new THREE.Mesh(geo, m); mesh.castShadow = cast; mesh.receiveShadow = recv; root.add(mesh); });
  // remove grupos que ficaram vazios
  const empty = []; root.traverse((o) => { if (o !== root && o.isGroup && !o.children.length) empty.push(o); }); empty.forEach((o) => o.parent && o.parent.remove(o));
  return root;
}
const solid = (g) => compact(stripLights(g));
const scaled = (g, s) => { const w = new THREE.Group(); g.scale.setScalar(s); w.add(g); return w; };

// ------------------------------------------------------------------ chama (sombreador animado, fase 1 escolha 3)
export const FLAME_T = { value: 0 };
let flameMatC = null;
function flameMat() {
  if (flameMatC) return flameMatC;
  flameMatC = new THREE.ShaderMaterial({
    uniforms: { t: FLAME_T }, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: 'varying vec2 vUv; varying float vSeed; void main(){ vUv = uv; vSeed = modelMatrix[3].x * 1.7 + modelMatrix[3].z * 0.9; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; varying float vSeed; uniform float t;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){ vec2 uv = vUv; float y = uv.y; float x = (uv.x - 0.5) * 2.0; float tt = t + vSeed;
        float noise = n(vec2(uv.x*5.0 + vSeed, uv.y*4.0 - tt*3.0)) * 0.6 + n(vec2(uv.x*11.0, uv.y*9.0 - tt*5.0)) * 0.4;
        float shape = (1.0 - y) * 1.25 - abs(x) * (0.55 + y * 1.1) + noise * 0.5 - 0.12;
        float a = smoothstep(0.0, 0.18, shape) * smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x) * smoothstep(1.0, 0.9, uv.y);
        vec3 c = mix(vec3(1.0,0.25,0.03), vec3(1.0,0.62,0.1), smoothstep(0.1,0.45,shape)); c = mix(c, vec3(1.0,0.95,0.55), smoothstep(0.45,0.85,shape));
        if (a < 0.01) discard; gl_FragColor = vec4(c, a); }`,
  });
  return flameMatC;
}
let glowT = null;
function glowTex() { if (!glowT) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowT = new THREE.CanvasTexture(c); } return glowT; }
const PLANE_BIG = new THREE.PlaneGeometry(0.9, 1.25).translate(0, 0.6, 0), PLANE_CORE = new THREE.PlaneGeometry(0.55, 0.75).translate(0, 0.34, 0);
export function buildFlame() {
  const g = new THREE.Group(), parts = [];
  [0.55, 0.55 + Math.PI / 2].forEach((a) => { const m = new THREE.Mesh(PLANE_BIG, flameMat()); m.rotation.y = a; m.renderOrder = 8; g.add(m); parts.push(m); });
  const core = new THREE.Mesh(PLANE_CORE, flameMat()); core.rotation.y = 0.55 + Math.PI / 4; core.renderOrder = 9; g.add(core); parts.push(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff9a40, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 })); halo.scale.set(1.5, 1.6, 1); halo.position.y = 0.42; g.add(halo);
  g.userData.parts = parts;
  return g;
}

// ------------------------------------------------------------------ cenário (fase a fase)
const TREE_C = [0x3aa852, 0x34b25a, 0x48b84a, 0x2f9e55];
const WALLS = [0xffd66b, 0xff9fb2, 0x86dcff, 0xb4f08a, 0xffb36b, 0xcdb2ff], ROOFS = [0xe8352f, 0x2f78e0, 0xff8a1f, 0x8a4fd9, 0x1fa8a0];
const TOWER_C = [0xb9c6dd, 0xffcf9a, 0xa7e0ff, 0xf2b7d0, 0xc8e6a5];
const lampRot = () => { const g = new THREE.Group(), l = lampAlta(); l.rotation.y = Math.PI; g.add(l); return compact(g); };

export const SCENERY = {
  ...B.SCENERY,
  // fase 1
  tree: (r) => scaled(solid(treeMuito(r.pick(TREE_C), r.int(1, 9))), r.between(0.95, 1.3)),
  house: (r) => solid(houseAlta(r.pick(WALLS), r.pick(ROOFS))),
  tower: (r) => solid(towerAlta(r.int(4, 7), r.pick(TOWER_C))),
  lamp: () => lampRot(),
  // fase 2
  shop: () => solid(shopMuito()),
  fountain: () => solid(fountainAlta()),
  bench: () => solid(region(plazaMuito, { kids: range(-1.3, 1.3) })),
  flowers: () => solid(region(plazaMuito, { kids: range(1.5, 4), at: [2.6, 0, 0] })),
  bush: () => solid(region(obs2Muito, { kids: range(0, 3), at: [1.2, 0, 0] })),
  // fase 3
  pine: (r) => scaled(solid(pineMuito()), r.between(0.9, 1.25)),
  bigtree: (r) => scaled(solid(bigtreeMuito()), r.between(0.85, 1.15)),
  fern: (r) => scaled(solid(region(groundMuito, { kids: range(-0.9, 0.9) })), r.between(0.9, 1.3)),
  mushroom: (r) => scaled(solid(region(groundMuito, { kids: range(0.9, 3), at: [1.7, 0, 0] })), r.between(1.0, 1.6)),
  rock: (r) => scaled(solid(region(groundMuito, { kids: range(-3, -0.9), at: [-1.6, 0, 0] })), r.between(1.0, 1.9)),
  // fase 4
  tank: () => solid(region(roofAlta, { parts: (p) => p[0] > -1.3 && p[0] < 1.3 && p[2] > -1.5, kids: () => false })),
  billboard: () => solid(region(roofAlta, { parts: (p) => p[0] > 1.6 && p[0] < 6, kids: range(1.6, 6), at: [3.6, 0, 0] })),
  // fase 5
  cycad: () => solid(region(plantsMuito, { kids: range(-1.2, 1.3) })),
  treefern: () => solid(region(plantsMuito, { kids: range(-6, -1.2), at: [-2.4, 0, 0] })),
  horsetail: () => solid(region(plantsMuito, { kids: range(1.3, 6), at: [2.3, 0, 0] })),
  volcano: () => solid(volcanoAlta()),
  bones: () => solid(region(bonesAlta, { kids: range(0, 6), at: [1.6, 0, 0] })),
  // fase 6
  post: () => solid(region(pierAlta, { parts: (p) => p[0] < -2.3 && Math.abs(p[2] + 1.8) < 0.4, kids: () => false, at: [-2.6, 0, -1.8] })),
  boat: (r) => (r.frac() < 0.5 ? solid(region(pierAlta, { parts: (p) => p[0] > 0.2, kids: range(0.2, 5), at: [1.2, 0, 0] })) : solid(boatAlta())),
  buoyS: () => solid(region(obs6Alta, { kids: range(-4, -1.1), at: [-2.2, 0.3, 0] })),
  rocksea: (r) => scaled(solid(seaShowcase('muito')), r.between(0.8, 1.4)),
  lighthouse: () => solid(lightAlta()),
  palmisle: () => solid(region(lightAlta, { parts: (p) => !(p[0] > 0.9 && p[0] < 3.1 && p[1] > 0.2), kids: (c, o) => !(o.isMesh && o.geometry.type === 'ConeGeometry') })),
  // fase 7
  lavapool: (r) => scaled(solid(lavaMuito(false)), r.between(0.6, 0.9)),
  lavarockS: (r) => scaled(solid(lavarockMuito()), r.between(1.0, 1.6)),
  hut: () => solid(hutMuito()),
  deadtree: (r) => scaled(solid(region(deadVentAlta, { parts: (p) => p[0] < 1.5, kids: range(-3, 1.5) })), r.between(0.9, 1.4)),
  vent: () => solid(region(deadVentAlta, { parts: (p) => p[0] >= 1.5, kids: range(1.5, 6), at: [2.6, 0, 0] })),
};

// ------------------------------------------------------------------ obstáculos
const OBS = {
  cone: () => region(() => HQ.obstacles.muito(), { kids: range(-3.4, -1.6), at: [-2.4, 0, 0] }),
  hydrant: () => region(() => HQ.obstacles.muito(), { kids: range(-1.6, 0), at: [-0.8, 0, 0] }),
  barrier: () => region(() => HQ.obstacles.muito(), { kids: range(0, 1.7), at: [0.9, 0, 0] }),
  crate: () => region(() => HQ.obstacles.muito(), { kids: range(1.7, 3.5), at: [2.5, 0, 0] }),
  bench: () => region(obs2Muito, { kids: range(-3, 0), at: [-1.2, 0, 0] }),
  bush: () => region(obs2Muito, { kids: range(0, 3), at: [1.2, 0, 0] }),
  log: () => region(obs3Muito, { kids: range(-4, -1.2), at: [-2.4, 0, 0] }),
  rock: () => region(obs3Muito, { kids: range(-1.2, 1.1) }),
  mushroom: () => region(obs3Muito, { kids: range(1.1, 4), at: [2.2, 0, 0] }),
  ac: () => region(obs4Alta, { kids: range(-3, 0), at: [-1.3, 0, 0] }),
  pipe: () => region(obs4Alta, { kids: range(0, 3), at: [1.3, 0, 0] }),
  bone: () => region(bonesAlta, { kids: range(-4, 0), at: [-2.2, 0, 0] }),
  buoy: () => region(obs6Alta, { kids: range(-4, -1.1), at: [-2.2, 0, 0] }),
  barrel: () => region(obs6Alta, { kids: range(-1.1, 1.1) }),
  rope: () => region(obs6Alta, { kids: range(1.1, 4), at: [2.2, 0, 0] }),
  lavarock: () => lavarockMuito(),
};
export const OBSTACLES = B.OBSTACLES;
export function buildObstacle(kind) { return OBS[kind] ? solid(OBS[kind]()) : B.buildObstacle(kind); }

// ------------------------------------------------------------------ missões e veículos
export function buildBin() { const g = HQ.binfire.muito(); g.remove(g.children[g.children.length - 1]); return solid(g); }
export const buildHouse = (wall = 0xffd66b, roof = 0xe8352f) => solid(houseAlta(wall, roof));
export const buildTower = (floors = 4, wall = 0xb9c6dd) => solid(towerAlta(floors, wall));
export function buildFireTruck() { return truckAlta(); }
export function buildHeli() { return stripLights(heliMuito()); }
export function buildBasket() { return region(() => platMuito(2.4, 3.0, -1.4, 4, true), { kids: range(1.3, 3), at: [1.9, 4.2, 0] }); }
export function buildPlatform(w = 2.4, len = 3.4) { return solid(platMuito(w, len, 0, 0, false)); }
export function buildRaft(w = 2.0, len = 3.4) { return solid(region(() => raftMuito(w, len, 0, false), { kids: (c, o) => c[0] < w / 2 + 0.3 })); }
export function buildLifeRing(scale = 1) {
  const g = new THREE.Group(), paint = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.1 });
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.14, 16, 12, Math.PI / 4 + 0.01), paint(i % 2 ? 0xf6f6f6 : 0xd8241c)); t.rotation.set(Math.PI / 2, 0, i * Math.PI / 4); t.castShadow = true; g.add(t); }
  const rl = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.015, 6, 48), new THREE.MeshStandardMaterial({ color: 0xdfe6f1, roughness: 0.9 })); rl.rotation.x = Math.PI / 2; g.add(rl);
  compact(g); g.scale.setScalar(scale); return g;
}
export function buildRescueBoat() { return solid(boatAlta()); }
export function buildNest() { return solid(nestMuito(false, false)); }
let EGG = null;
export function buildEgg(scale = 1) {
  if (!EGG) {
    const e = new THREE.Group(), shell = new THREE.MeshPhysicalMaterial({ color: 0xf8ecc8, roughness: 0.35, clearcoat: 0.5, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) }), dot = new THREE.MeshStandardMaterial({ color: 0x5fbf5a, roughness: 0.4 });
    e.add(new THREE.Mesh(new THREE.LatheGeometry([[0.0001, 0], [0.2, 0.04], [0.27, 0.22], [0.24, 0.48], [0.13, 0.66], [0.0001, 0.7]].map(([a, b]) => new THREE.Vector2(a, b)), 40), shell));
    for (let k = 0; k < 9; k++) { const a = k * 2.1, y = 0.12 + (k % 5) * 0.11, rr = 0.27 - Math.abs(y - 0.3) * 0.3; const s = new THREE.Mesh(new THREE.SphereGeometry(0.04 + (k % 2) * 0.02, 12, 8), dot); s.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); s.scale.set(0.35, 1, 1); s.rotation.y = -a; e.add(s); }
    e.traverse((o) => { if (o.isMesh) o.castShadow = true; }); EGG = compact(e);
  }
  const g = new THREE.Group(); g.add(EGG.clone()); g.scale.setScalar(scale); return g;
}
export function buildHut() { return solid(hutMuito()); }
export function buildLavaFlow() {
  const inner = lavaMuito(false); stripLights(inner); inner.scale.setScalar(0.72);
  const g = new THREE.Group(); g.add(inner);
  let lava = null, glow = null; inner.traverse((o) => { if (o.isMesh && o.geometry.type === 'CircleGeometry' && !lava) lava = o; if (o.isSprite) glow = o; });
  g.userData = { lava, glow: glow || new THREE.Object3D() };
  return g;
}
export function buildLavaIsland() {
  const g = stripLights(islandMuito()), stones = [];
  g.children.forEach((o) => { if (o.isMesh && o.position.z < -1.45 && o.position.y < 0.2 && o.geometry.type !== 'CircleGeometry') stones.push(o); });
  stones.sort((a, b) => b.position.z - a.position.z); stones.forEach((s) => { s.position.y = -0.6; s.userData.keep = true; });
  g.userData.stones = stones; return g;
}
export function buildWaterPatch(r = 2.6) {
  const g = new THREE.Group();
  const pm = seaMaterial().clone(); pm.normalMap = seaNormal().clone(); pm.normalMap.repeat.set(r / 7, r / 7); pm.normalMap.needsUpdate = true;
  const w = new THREE.Mesh(new THREE.CircleGeometry(r, 48), pm); w.rotation.x = -Math.PI / 2; w.position.y = -0.38; w.receiveShadow = true; g.add(w);
  const foam = foamRing('muito', r * 0.95); foam.position.y = -0.34; g.add(foam);
  return g;
}

// ------------------------------------------------------------------ mar (fase 6 escolha 3)
let seaNormalT = null, seaMat = null;
function seaNormal() {
  if (seaNormalT) return seaNormalT;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
  const hgt = (i, j) => { const u = i / N * 6.2832, v = j / N * 6.2832; return Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u * 2) * 0.3 + Math.sin(u * 9 - v * 7) * 0.12; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = hgt(i + 1, j) - hgt(i - 1, j), dy = hgt(i, j + 1) - hgt(i, j - 1), k = (j * N + i) * 4; im.data[k] = 128 - dx * 90; im.data[k + 1] = 128 - dy * 90; im.data[k + 2] = 255; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); seaNormalT = new THREE.CanvasTexture(c); seaNormalT.wrapS = seaNormalT.wrapT = THREE.RepeatWrapping; seaNormalT.repeat.set(14, 22); return seaNormalT;
}
export function seaMaterial() {
  if (!seaMat) seaMat = new THREE.MeshPhysicalMaterial({ color: 0x1f84c6, roughness: 0.08, normalMap: seaNormal(), normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.5, sheen: 0.4, sheenColor: new THREE.Color(0x8fe0ff) });
  return seaMat;
}
export const SEA_TILE = 14;   // o padrão da água se repete a cada 14 m: o mar anda junto da câmera sem "pular"
export function buildSea() { const m = new THREE.Mesh(new THREE.PlaneGeometry(SEA_TILE * 14, SEA_TILE * 22), seaMaterial()); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; m.userData.tex = seaNormal(); return m; }
export function animateSea(t) { if (seaNormalT) seaNormalT.offset.set(t * 0.01, t * 0.015); }

// ------------------------------------------------------------------ bichinhos
const furOf = (d) => new Set([d.coat, d.patch, d.belly]);
export function buildDog(key = 'bolota') { const d = C.DOGS3[key] || C.DOGS3.bolota; return withLevel('muito', furOf(d), () => C.buildDog(key)); }
export function buildCat() { return withLevel('muito', new Set([0xffa043, 0xd9711f, 0xfff0d6]), () => C.buildCat()); }
export function buildBunny() { return withLevel('muito', new Set([0xf4f0ee, 0xffffff]), () => C.buildBunny()); }
export function buildDino(kind = 'stego') { return dinoAt(['stego', 'tricera', 'trex'].includes(kind) ? 'alta' : 'muito', kind); }
export function buildLeaf(w, len, col) { return C.buildLeaf(w, len, col); }
