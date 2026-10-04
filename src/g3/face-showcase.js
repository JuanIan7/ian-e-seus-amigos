// Página de apoio: compara 5 estilos possíveis para o rosto do personagem.
// Uso: faces.html?style=infantil|normal|anime|realista|ultra
import { THREE, P, sph, box, cyl, cone, cap, tor, dome, toMesh, toon, hex, outlineMaterial } from './kit.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SKINS, HAIR_COLORS, EYE_COLORS } from '../character.js';

const q = new URLSearchParams(location.search);
const style = q.get('style') || 'normal';
const W = +(q.get('w') || 640), H = +(q.get('h') || 640);

const LABELS = { infantil: 'Desenho infantil', normal: 'Desenho normal (atual)', anime: 'Estilo anime', realista: '3D realista', ultra: '3D ultra realista' };

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();

const skyC = document.createElement('canvas'); skyC.width = 4; skyC.height = 256; const sx = skyC.getContext('2d');
const gr = sx.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#bfe4ff'); gr.addColorStop(1, '#eef9ff'); sx.fillStyle = gr; sx.fillRect(0, 0, 4, 256);
const skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace; scene.background = skyT;

const flat3d = style === 'realista' || style === 'ultra';
const realMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.015 });
const ultraMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.02, clearcoat: 0.3, clearcoatRoughness: 0.35, sheen: 0.55, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xffd6ad) });
const mat = style === 'ultra' ? ultraMat : style === 'realista' ? realMat : toon;

if (flat3d) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.05).texture; scene.environmentIntensity = 0.6;
  scene.add(new THREE.HemisphereLight(0xeaf5ff, 0xc9a97a, 0.55));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2); sun.position.set(-1.6, 1.6, -2.4); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfefff, 0.6); fill.position.set(1.8, 0.6, -1.2); scene.add(fill);
} else {
  scene.add(new THREE.HemisphereLight(0xe4f4ff, 0xb5a27a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff2d8, 2.0); sun.position.set(-1.4, 1.8, -2.2); scene.add(sun);
}

const skin = SKINS[3], hc = HAIR_COLORS[1], ec = EYE_COLORS[0], ecLight = hex(ec, 1.6);
const R = 0.27;

function headShape(f) {
  const seg = style === 'ultra' ? 30 : style === 'realista' ? 24 : style === 'infantil' ? 13 : 18;
  f.push(P(sph(R, seg, Math.round(seg * 0.75)), skin, [0, 0, 0], [0, 0, 0], [1, 0.97, 0.98]));
  const ex = 0.265;
  f.push(P(sph(0.06, 8, 6), hex(skin, 0.93), [-ex, -0.01, 0.01], [0, 0, 0], [0.6, 1, 0.9]), P(sph(0.06, 8, 6), hex(skin, 0.93), [ex, -0.01, 0.01], [0, 0, 0], [0.6, 1, 0.9]));
  f.push(P(cyl(0.07, 0.08, 0.1, 10), hex(skin, 0.9), [0, -0.27, 0.01]));
}

function eyesNormal(f, fz) {
  const eye = (sx) => {
    f.push(P(sph(0.078, 12, 9), 0xffffff, [sx * 0.105, 0.035, fz + 0.035], [0, 0, 0], [1, 1.2, 0.55]));
    f.push(P(sph(0.052, 10, 8), ec, [sx * 0.105, 0.03, fz + 0.012], [0, 0, 0], [1, 1.15, 0.5]));
    f.push(P(sph(0.029, 8, 6), 0x0d0b0a, [sx * 0.105, 0.03, fz + 0.002], [0, 0, 0], [1, 1.1, 0.5]));
    f.push(P(sph(0.018, 6, 5), 0xffffff, [sx * 0.105 - sx * 0.018, 0.058, fz - 0.004], [0, 0, 0], [1, 1, 0.5]));
    f.push(P(sph(0.009, 6, 5), 0xffffff, [sx * 0.105 + sx * 0.02, 0.0, fz - 0.004], [0, 0, 0], [1, 1, 0.5]));
    f.push(P(cap(0.014, 0.075, 3, 6), hex(hc, 0.7), [sx * 0.105, 0.125, fz + 0.03], [0, 0, Math.PI / 2 + sx * 0.12], [1, 1, 0.8]));
  };
  eye(-1); eye(1);
}

function eyesInfantil(f, fz) {
  const eye = (sx) => {
    f.push(P(sph(0.095, 10, 8), 0xffffff, [sx * 0.11, 0.045, fz + 0.03], [0, 0, 0], [1, 1.15, 0.5]));
    f.push(P(sph(0.058, 8, 6), 0x1a1410, [sx * 0.11, 0.04, fz + 0.01], [0, 0, 0], [1, 1.1, 0.5]));
    f.push(P(sph(0.016, 5, 4), 0xffffff, [sx * 0.11 - sx * 0.018, 0.065, fz], [0, 0, 0]));
  };
  eye(-1); eye(1);
}

function eyesAnime(f, fz) {
  const eye = (sx) => {
    f.push(P(sph(0.1, 14, 11), 0xffffff, [sx * 0.1, 0.03, fz + 0.035], [0, 0, 0], [0.92, 1.4, 0.5]));
    f.push(P(sph(0.075, 12, 10), ecLight, [sx * 0.1, 0.0, fz + 0.015], [0, 0, 0], [0.9, 1.3, 0.45]));
    f.push(P(sph(0.05, 10, 8), ec, [sx * 0.1, -0.015, fz + 0.005], [0, 0, 0], [0.9, 1.2, 0.45]));
    f.push(P(sph(0.026, 8, 6), 0x0d0b0a, [sx * 0.1, -0.02, fz - 0.002], [0, 0, 0], [0.9, 1.1, 0.45]));
    f.push(P(sph(0.022, 6, 5), 0xffffff, [sx * 0.1 - sx * 0.02, 0.05, fz - 0.006]));
    f.push(P(sph(0.01, 6, 5), 0xffffff, [sx * 0.1 + sx * 0.025, 0.0, fz - 0.006]));
    f.push(P(sph(0.008, 6, 5), 0xffffff, [sx * 0.1, -0.03, fz - 0.006]));
    f.push(P(cap(0.009, 0.06, 3, 6), hex(hc, 0.6), [sx * 0.1, 0.135, fz + 0.03], [0, 0, Math.PI / 2 + sx * 0.18], [1, 1, 0.8]));
  };
  eye(-1); eye(1);
}

function eyesRealista(f, fz, ultra) {
  const eye = (sx) => {
    f.push(P(sph(0.064, ultra ? 14 : 11, ultra ? 11 : 8), 0xfaf6f0, [sx * 0.1, 0.025, fz + 0.025], [0, 0, 0], [1, 0.82, 0.5]));
    f.push(P(sph(0.042, 10, 8), hex(ec, 0.85), [sx * 0.1, 0.022, fz + 0.01], [0, 0, 0], [1, 0.95, 0.5]));
    f.push(P(sph(0.024, 8, 6), 0x0b0906, [sx * 0.1, 0.02, fz + 0.001], [0, 0, 0], [1, 0.95, 0.5]));
    f.push(P(sph(0.011, 6, 5), 0xffffff, [sx * 0.1 - sx * 0.014, 0.038, fz - 0.003]));
    if (ultra) f.push(P(sph(0.006, 5, 4), 0xffffff, [sx * 0.1 + sx * 0.016, 0.01, fz - 0.003]));
    // pálpebra (sombra sutil na borda superior do olho)
    f.push(P(tor(0.064, 0.009, 4, 12, Math.PI), hex(skin, 0.82), [sx * 0.1, 0.045, fz + 0.022], [0, 0, 0], [1, 0.6, 0.5]));
    if (ultra) { f.push(P(tor(0.06, 0.006, 3, 10, Math.PI), hex(skin, 0.88), [sx * 0.1, 0.005, fz + 0.025], [Math.PI, 0, 0], [1, 0.45, 0.5])); }
    // sobrancelha mais natural
    const browParts = ultra ? 3 : 1;
    for (let i = 0; i < browParts; i++) {
      const k = browParts > 1 ? (i - 1) * 0.022 : 0;
      f.push(P(cap(ultra ? 0.009 : 0.012, ultra ? 0.028 : 0.072, 3, 6), hex(hc, 0.55), [sx * 0.1 + k, 0.1, fz + 0.028], [0, 0, Math.PI / 2 + sx * 0.14], [1, 1, 0.8]));
    }
  };
  eye(-1); eye(1);
}

function noseMouthCheeks(f, fz, st) {
  if (st === 'infantil') {
    f.push(P(sph(0.018, 6, 5), hex(skin, 0.88), [0, -0.03, fz - 0.003]));
    f.push(P(tor(0.07, 0.018, 6, 14, Math.PI), 0x6b2f2f, [0, -0.085, fz + 0.015], [0, 0, Math.PI]));
    f.push(P(sph(0.05, 8, 6), 0xff8a93, [-0.17, -0.04, fz + 0.045], [0, 0, 0], [1, 0.7, 0.3]), P(sph(0.05, 8, 6), 0xff8a93, [0.17, -0.04, fz + 0.045], [0, 0, 0], [1, 0.7, 0.3]));
    return;
  }
  if (st === 'normal') {
    f.push(P(sph(0.026, 8, 6), hex(skin, 0.86), [0, -0.035, fz - 0.005], [0, 0, 0], [1, 0.8, 0.8]));
    f.push(P(tor(0.062, 0.014, 6, 14, Math.PI), 0x5a1a26, [0, -0.07, fz + 0.018], [0, 0, Math.PI]));
    f.push(P(sph(0.05, 8, 6), 0x7a2230, [0, -0.095, fz + 0.012], [0, 0, 0], [1.2, 0.55, 0.4]));
    f.push(P(sph(0.026, 6, 5), 0xff7d8a, [0, -0.106, fz + 0.006], [0, 0, 0], [1.3, 0.5, 0.4]));
    f.push(P(sph(0.045, 8, 6), 0xff7a8a, [-0.17, -0.055, fz + 0.04], [0, 0, 0], [1, 0.7, 0.35]), P(sph(0.045, 8, 6), 0xff7a8a, [0.17, -0.055, fz + 0.04], [0, 0, 0], [1, 0.7, 0.35]));
    return;
  }
  if (st === 'anime') {
    f.push(P(box(0.012, 0.02, 0.01, 0.004), hex(skin, 0.82), [0, -0.04, fz - 0.002]));
    f.push(P(tor(0.038, 0.007, 4, 10, Math.PI), 0x8a4a52, [0, -0.08, fz + 0.016], [0, 0, Math.PI]));
    f.push(P(sph(0.034, 8, 6), 0xff9aa6, [-0.15, -0.03, fz + 0.04], [0, 0, 0], [1, 0.55, 0.2]), P(sph(0.034, 8, 6), 0xff9aa6, [0.15, -0.03, fz + 0.04], [0, 0, 0], [1, 0.55, 0.2]));
    return;
  }
  const ultra = st === 'ultra';
  // nariz com ponte e narinas sutis
  f.push(P(cap(0.014, 0.04, 3, 6), hex(skin, 0.92), [0, 0.0, fz + 0.01], [0.35, 0, 0], [0.8, 1, 0.8]));
  f.push(P(sph(0.02, 8, 6), hex(skin, 0.95), [0, -0.038, fz + 0.022], [0, 0, 0], [1, 0.8, 0.8]));
  if (ultra) [-1, 1].forEach((s) => f.push(P(sph(0.007, 5, 4), hex(skin, 0.75), [s * 0.016, -0.045, fz + 0.03])));
  // boca fechada, curva natural
  f.push(P(cap(0.01, 0.07, 3, 8), hex(0x7a3a3a, 1), [0, -0.085, fz + 0.022], [0, 0, Math.PI / 2], [1, 0.42, 0.7]));
  if (ultra) f.push(P(cap(0.008, 0.062, 3, 8), 0x9a5050, [0, -0.095, fz + 0.021], [0, 0, Math.PI / 2], [1, 0.3, 0.6]));
  f.push(P(sph(0.038, 10, 8), hex(0xff8a8a, 0.9), [-0.15, -0.045, fz + 0.035], [0, 0, 0], [1, 0.6, 0.28]), P(sph(0.038, 10, 8), hex(0xff8a8a, 0.9), [0.15, -0.045, fz + 0.035], [0, 0, 0], [1, 0.6, 0.28]));
}

function hairCap(f, st) {
  const capR = R * 1.07;
  if (st === 'infantil') { f.push(P(sph(0.3, 12, 9), hc, [0, 0.07, 0.01], [0, 0, 0], [1, 0.95, 0.95])); return; }
  if (st === 'anime') {
    f.push(P(dome(capR * 0.98, 0, 1.7, 16, 9), hc, [0, 0.015, 0.01], [0.3, 0, 0], [1.03, 1.03, 1.03]));
    [[-0.17, 0.2, 0.2, 0.65], [0.17, 0.2, 0.2, -0.65], [-0.26, 0.05, 0.1, 0.9], [0.26, 0.05, 0.1, -0.9]].forEach(([x, y, z, rz]) => f.push(P(cone(0.07, 0.3, 8), hc, [x, y, -z], [Math.PI, 0, rz])));
    f.push(P(cone(0.09, 0.22, 8), hc, [0, 0.42, -0.08], [Math.PI * 0.92, 0, 0]));
    return;
  }
  if (st === 'realista' || st === 'ultra') {
    const n = st === 'ultra' ? 10 : 1;
    if (n === 1) { f.push(P(dome(capR, 0, 1.75, 20, 12), hex(hc, 0.96), [0, 0.015, 0.012], [0.3, 0, 0], [1, 1.02, 1.02])); return; }
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, rr = 0.18 + (i % 3) * 0.02;
      f.push(P(cap(0.055, 0.1, 3, 8), hex(hc, 0.9 + (i % 3) * 0.04), [Math.cos(a) * rr, 0.22 - (i % 2) * 0.02, Math.sin(a) * rr * 0.9 - 0.02], [0.2 + Math.sin(a) * 0.3, a, 0]));
    }
    f.push(P(dome(capR * 0.9, 0, 1.4, 18, 10), hex(hc, 0.95), [0, 0.03, 0.01], [0.3, 0, 0]));
    return;
  }
  // normal
  f.push(P(dome(capR, 0, 1.78, 18, 10), hc, [0, 0.015, 0.012], [0.3, 0, 0], [1, 1.02, 1.02]));
  [[-0.12, 0.17, 0.19, 0.5], [0, 0.205, 0.215, 0.2], [0.12, 0.17, 0.19, -0.5]].forEach(([x, y, z, rz]) => f.push(P(sph(0.095, 9, 7), hc, [x, y, -z], [0.3, 0, rz], [1.15, 0.75, 0.8])));
}

function buildHead(st) {
  const group = new THREE.Group();
  const base = []; headShape(base);
  const outline = st !== 'realista' && st !== 'ultra';
  group.add(toMesh(base, { thin: st !== 'infantil', outline, material: mat }));
  if (st === 'infantil') { // contorno extra grosso, estilo giz de cera
    const geo = toMesh(base, { outline: false }).userData.main.geometry;
    group.add(new THREE.Mesh(geo, outlineMaterial(0.05)));
  }

  const fz = -R;
  const f = [];
  if (st === 'infantil') eyesInfantil(f, fz);
  else if (st === 'normal') eyesNormal(f, fz);
  else if (st === 'anime') eyesAnime(f, fz);
  else eyesRealista(f, fz, st === 'ultra');
  noseMouthCheeks(f, fz, st);
  group.add(toMesh(f, { outline: false, material: mat }));

  const hp = []; hairCap(hp, st);
  group.add(toMesh(hp, { thin: true, material: mat }));

  return group;
}

const head = buildHead(style);
scene.add(head);

// o rosto fica no lado -Z da cabeça (o jogo vê o personagem por trás, em +Z); aqui olhamos de frente, do lado -Z
const camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 10);
camera.position.set(0, -0.02, -1.0); camera.lookAt(0, -0.03, 0);

const label = document.createElement('div');
label.textContent = LABELS[style] || style;
Object.assign(label.style, { position: 'fixed', left: '0', right: '0', bottom: '14px', textAlign: 'center', color: '#1b2a49', fontSize: '26px', fontWeight: '700', textShadow: '0 1px 0 #fff, 0 2px 6px rgba(255,255,255,0.8)' });
document.body.appendChild(label);

renderer.render(scene, camera);
window.__ready = true;
