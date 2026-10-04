// Página de apoio: compara um elemento em 3 níveis de qualidade. ?el=tree&q=atual|alta|muito
import { THREE, rng } from './kit.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SCENERY, buildBin, buildFlame, buildFireTruck, buildObstacle } from './props.js';
import { HQ, TEX } from './hq.js';
import { HQ2 } from './hq2.js';
import { HQ3 } from './hq3.js';
import { HQ4 } from './hq4.js';
import { HQ5 } from './hq5.js';
import { HQ6, SEA } from './hq6.js';
import { HQ7, GROUND7 } from './hq7.js';
import { buildLeaf, buildPad, buildHeli, buildBasket, buildPlatform, buildNest, buildEgg, buildDino, buildRescueBoat, buildRaft, buildLifeRing, buildLavaFlow, buildLavaIsland, buildHut } from './creatures.js';

const q = new URLSearchParams(location.search);
const el = q.get('el') || 'tree', lvl = q.get('q') || 'atual';
const W = +(q.get('w') || 720), H = +(q.get('h') || 540);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const muito = lvl === 'muito';

// céu em degradê igual ao da fase 1
const skyC = document.createElement('canvas'); skyC.width = 4; skyC.height = 256; const sx = skyC.getContext('2d'); const gr = sx.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#2f9bff'); gr.addColorStop(1, '#cdeeff'); sx.fillStyle = gr; sx.fillRect(0, 0, 4, 256);
const skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace; scene.background = skyT; scene.fog = new THREE.Fog(0xcdeeff, 30, 110);

let sun;
if (muito) {
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xdff2ff, 0x9a8a6a, 0.7));
  sun = new THREE.DirectionalLight(0xfff1d6, 2.6); sun.position.set(-7, 12, -9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 13, bottom: -3, near: 1, far: 40 }); scene.add(sun);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TEX.grass([80, 80]), color: 0x9fd8a0, roughness: 1 })); grass.receiveShadow = true; scene.add(grass);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 5).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: TEX.asphalt([80, 1]), roughness: 0.9 })); road.position.set(0, 0.01, -5.5); road.receiveShadow = true; scene.add(road);
} else {
  scene.add(new THREE.HemisphereLight(0xe4f4ff, 0xb5a27a, 1.2));
  sun = new THREE.DirectionalLight(0xfff2d8, 2.1); sun.position.set(-6, 14, -8); scene.add(sun);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x58d36a })); scene.add(grass);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 5).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x4b5568 })); road.position.set(0, 0.01, -5.5); scene.add(road);
}

function atual() {
  const r = rng('vitrine-' + el);
  switch (el) {
    case 'tree': return SCENERY.tree(rng('t3'));
    case 'house': return SCENERY.house(rng('h1'));
    case 'tower': return SCENERY.tower(rng('w2'));
    case 'lamp': return SCENERY.lamp(r);
    case 'binfire': { const g = new THREE.Group(); const b = buildBin(); b.scale.setScalar(1.7); g.add(b); const f = buildFlame(); f.position.set(0, 2.3, 0); f.scale.setScalar(1.9); g.add(f); return g; }
    case 'truck': return buildFireTruck();
    case 'shop': return SCENERY.shop(rng('s4'));
    case 'fountain': return SCENERY.fountain(r);
    case 'plaza': { const g = new THREE.Group(); const b = SCENERY.bench(r); g.add(b); const f = SCENERY.flowers(rng('f2')); f.position.x = 2.6; g.add(f); const f2 = SCENERY.flowers(rng('f3')); f2.position.x = -2.4; f2.scale.setScalar(0.5); g.add(f2); return g; }
    case 'obs2': { const g = new THREE.Group(); ['bench', 'bush'].forEach((k, i) => { const o = buildObstacle(k); o.position.x = [-1.2, 1.2][i]; g.add(o); }); return g; }
    case 'pine': return SCENERY.pine(rng('p1'));
    case 'bigtree': return SCENERY.bigtree(rng('b1'));
    case 'ground': { const g = new THREE.Group(); const f = SCENERY.fern(r); g.add(f); const m = SCENERY.mushroom(rng('m2')); m.position.x = 1.7; g.add(m); const k = SCENERY.rock(rng('k1')); k.position.x = -1.9; k.scale.setScalar(0.6); g.add(k); return g; }
    case 'obs3': { const g = new THREE.Group(); ['log', 'rock', 'mushroom'].forEach((k, i) => { const o = buildObstacle(k); o.position.x = [-2.4, 0, 2.2][i]; g.add(o); }); return g; }
    case 'leafpad': { const g = new THREE.Group(); const l = buildLeaf(); l.position.set(-1.6, 3, 0); g.add(l); const p = buildPad(); p.position.x = 2.2; g.add(p); return g; }
    case 'heli': return buildHeli();
    case 'roof': { const g = new THREE.Group(); const t = SCENERY.tank(r); g.add(t); const b = SCENERY.billboard(rng('bb')); b.position.x = 3.6; g.add(b); return g; }
    case 'obs4': { const g = new THREE.Group(); ['ac', 'pipe'].forEach((k, i) => { const o = buildObstacle(k); o.position.x = [-1.3, 1.3][i]; g.add(o); }); return g; }
    case 'plat': { const g = new THREE.Group(); const p = buildPlatform(2.4, 3.0); p.position.set(-1.4, 4, 0); g.add(p); const b = buildBasket(); b.position.set(1.9, 4.2, 0); g.add(b); return g; }
    case 'nest': { const g = new THREE.Group(); g.add(buildNest()); [[-0.25, 0.1], [0.25, -0.05], [0.05, 0.25]].forEach(([x, z]) => { const e = buildEgg(); e.position.set(x, 0.22, z); g.add(e); }); const b = buildDino('baby'); b.scale.setScalar(1.6); b.position.set(1.9, 0, -0.2); b.rotation.y = -0.5; g.add(b); return g; }
    case 'preplants': { const g = new THREE.Group(); g.add(SCENERY.cycad(r)); const f = SCENERY.fern(r); f.position.x = 2.3; g.add(f); const c2 = SCENERY.cycad(rng('c2')); c2.position.x = -2.4; c2.scale.setScalar(1.3); g.add(c2); return g; }
    case 'volcano': return SCENERY.volcano(r);
    case 'bones': { const g = new THREE.Group(); const o = buildObstacle('bone'); o.position.x = -2.2; g.add(o); const b = SCENERY.bones(r); b.position.x = 1.2; b.scale.setScalar(0.7); g.add(b); return g; }
    case 'sea': { const k = SCENERY.rocksea(rng('rs')); k.position.y = 0.15; k.scale.setScalar(1.3); return k; }
    case 'rboat': return buildRescueBoat();
    case 'lighthouse': { const g = new THREE.Group(); const l = SCENERY.lighthouse(r); l.position.x = 2; g.add(l); const p = SCENERY.palmisle(rng('pi')); p.position.x = -2.2; g.add(p); return g; }
    case 'obs6': { const g = new THREE.Group(); ['buoy', 'barrel', 'rope'].forEach((k, i) => { const o = buildObstacle(k); o.position.x = [-2.2, 0, 2.2][i]; g.add(o); }); return g; }
    case 'raft': { const g = new THREE.Group(); const f = buildRaft(); f.position.x = -1.4; g.add(f); const l = buildLifeRing(1.4); l.position.set(1.8, -0.15, 0); g.add(l); return g; }
    case 'pier': { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const p = SCENERY.post(r); p.position.set(-2.6, 0, i * 1.2 - 1.8); g.add(p); } const b = SCENERY.boat(rng('bt')); b.position.x = 1.2; b.scale.setScalar(0.6); g.add(b); return g; }
    case 'lava': { const g = new THREE.Group(); const p = SCENERY.lavapool(rng('lp')); g.add(p); const f = buildLavaFlow(); f.position.set(2.9, 0, -2.3); g.add(f); return g; }
    case 'lavaisle': { const g = buildLavaIsland(); g.userData.stones.forEach((s, i) => { s.position.y = 0.05; }); return g; }
    case 'hut': return buildHut();
    case 'deadvent': { const g = new THREE.Group(); g.add(SCENERY.deadtree(rng('dt'))); const v = SCENERY.vent(r); v.position.x = 2.6; g.add(v); return g; }
    case 'lavarock': return buildObstacle('lavarock');
    case 'obstacles': { const g = new THREE.Group(); ['cone', 'hydrant', 'barrier', 'crate'].forEach((k, i) => { const o = buildObstacle(k); o.position.x = [-2.4, -0.8, 0.9, 2.5][i]; g.add(o); }); return g; }
  }
}
if (el === 'volcano') scene.fog = null;
if (['lava', 'lavaisle', 'hut', 'deadvent', 'lavarock'].includes(el)) { scene.children.filter((o) => o.isMesh && o.geometry.type === 'PlaneGeometry').forEach((o) => scene.remove(o)); scene.add(GROUND7[lvl]()); const c2 = document.createElement('canvas'); c2.width = 4; c2.height = 256; const x2 = c2.getContext('2d'); const g2 = x2.createLinearGradient(0, 0, 0, 256); g2.addColorStop(0, '#ff7a4a'); g2.addColorStop(1, '#ffd0a0'); x2.fillStyle = g2; x2.fillRect(0, 0, 4, 256); const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; scene.background = t2; scene.fog = new THREE.Fog(0xf0b890, 30, 110); }
if (['sea', 'rboat', 'lighthouse', 'obs6', 'raft', 'pier'].includes(el)) { scene.children.filter((o) => o.isMesh && o.geometry.type === 'PlaneGeometry').forEach((o) => scene.remove(o)); scene.add(SEA[lvl]()); }
const ALL = { ...HQ, ...HQ2, ...HQ3, ...HQ4, ...HQ5, ...HQ6, ...HQ7 };
let obj = lvl === 'atual' && !(ALL[el] && ALL[el].atual) ? atual() : ALL[el][lvl]();
if (el === 'binfire' && lvl !== 'atual') obj.scale.setScalar(1.7);
scene.add(obj);
if (muito) obj.traverse((o) => { if (o.isMesh && !o.material.transparent && !(o.material instanceof THREE.MeshBasicMaterial)) { o.castShadow = true; o.receiveShadow = true; } });

// enquadramento automático: frente do objeto virada para a câmera (como no jogo)
obj.updateMatrixWorld(true); const bb = new THREE.Box3(); obj.traverse((o) => { if (o.isMesh && !o.isSprite && !(o.material && o.material.isShaderMaterial)) bb.expandByObject(o, true); }); if (el === 'binfire') bb.max.y += 1.6; const c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
const rad = Math.max(sz.x * (['obstacles', 'dogs', 'plaza', 'obs3', 'ground', 'dinos', 'bones', 'nest', 'obs6', 'raft', 'pier'].includes(el) ? 0.42 : 0.62), sz.y * 0.64, sz.z * 0.5) + 0.3, dist = rad / Math.tan(THREE.MathUtils.degToRad(15)) * 0.98;
const yaw = +(q.get('yaw') || 0.55);
cam.position.set(c.x + Math.sin(yaw) * dist, c.y + dist * (['leafpad', 'lava', 'lavaisle'].includes(el) ? 0.55 : 0.14), c.z - Math.cos(yaw) * dist); cam.lookAt(c.x, c.y, c.z);
if (sun.castShadow) { sun.target.position.copy(c); scene.add(sun.target); }
renderer.render(scene, cam);
const info = renderer.info.render; window.__stats = { tris: info.triangles, calls: info.calls };
window.__ready = true;
