// Página de apoio: mostra modelos 3D lado a lado para conferir o acabamento. ?cam=back|front|side&what=kids|outfits
import { THREE } from './kit.js';
import { buildKid, poseKid } from './kid.js';

const q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8fd3ff);
scene.add(new THREE.HemisphereLight(0xdff2ff, 0xb59a6a, 1.25));
const sun = new THREE.DirectionalLight(0xfff1d6, 2.2); sun.position.set(-3, 8, 6); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x5ccf6b })); scene.add(ground);
const cols = +(q.get('cols') || 5);
const items = [];
const mk = (look, i) => { const k = buildKid(look); const row = Math.floor(i / cols), c = i % cols; k.position.set((c - (cols - 1) / 2) * 1.5, 0, -row * 2.6); scene.add(k); items.push(k); return k; };
const what = q.get('what') || 'outfits';
if (what === 'outfits') for (let i = 0; i < 10; i++) mk({ skin: [1, 3, 5, 2, 4, 0, 6, 3, 2, 5][i], face: i % 3, hair: [0, 5, 3, 4, 1, 6, 2, 7, 0, 3][i], hairColor: [1, 2, 0, 0, 3, 4, 5, 6, 7, 1][i], eyes: i % 6, outfit: i }, i);
else if (what === 'hair') for (let i = 0; i < 8; i++) mk({ skin: 3, face: 0, hair: i, hairColor: [1, 0, 2, 0, 0, 3, 4, 7][i], eyes: 0, outfit: 9 }, i);
else if (what === 'faces') for (let i = 0; i < 3; i++) mk({ skin: [1, 3, 5][i], face: i, hair: 0, hairColor: 1, eyes: 2, outfit: 9 }, i);
const cam = new THREE.PerspectiveCamera(+(q.get('fov') || 32), innerWidth / innerHeight, 0.1, 100);
const view = q.get('cam') || 'back';
const rows = Math.ceil(items.length / cols);
const cx = 0, cz = -(rows - 1) * 1.3, d = +(q.get('dist') || 13);
if (view === 'back') { cam.position.set(cx, 3.2, cz + d); cam.lookAt(cx, 0.55, cz); }
else if (view === 'front') { cam.position.set(cx, 2.6, cz - d); cam.lookAt(cx, 0.55, cz); }
else { cam.position.set(cx + d * 0.55, 1.8, cz + d * 0.8); cam.lookAt(cx, 0.7, cz); }
const st = q.get('state') || 'idle';
items.forEach((k, i) => { poseKid(k, st, i * 0.7, 0.3); });
renderer.render(scene, cam);
window.__ready = true;
