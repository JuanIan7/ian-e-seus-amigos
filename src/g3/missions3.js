// Missões de resgate em 3D (fases 2 a 5). Cada missão define o modelo, como reage a cada ajuda e como termina.
// Convenção: o objeto fica ao lado da pista e "olha" para a pista (frente = -Z local). O eixo X local aponta
// para a frente do percurso quando o alvo está à direita (side = 1) e para trás quando está à esquerda; por isso
// as posições "ao longo da pista" usam side * distância.
import { THREE, P, sph, box, cyl, cone, toMesh } from './kit.js';
import { buildKid, poseKid } from './kid.js';
import { buildDog, buildCat, buildBunny, buildDino, animCreature, buildCrates, buildShelter, buildNest, buildEgg, buildTent, buildHeli, buildBasket, DOGS3 } from './creatures.js';
import { buildBin, buildHouse } from './props.js';
import { buildLifeRing, buildWaterPatch, buildRescueBoat, buildFloatCrate, buildLavaFlow, buildLavaIsland, buildHut } from './creatures.js';

const ease = (x) => x * x * (3 - 2 * x);
const npc = (outfit, skin, hair, hairColor, eyes = 0) => { const k = buildKid({ skin, face: 1, hair, hairColor, eyes, outfit }); k.scale.setScalar(1.15); return k; };

export const ACTIONS = {
  // ícone do botão, projétil que o botão lança e frase falada
  drop: { proj: 'water' }, bone: { proj: 'bone' }, ring: { proj: 'ring' }, helpHand: { proj: 'heart' }, box: { proj: 'box' }, basket: { proj: 'none' }, egg: { proj: 'egg' }, fruit: { proj: 'fruit' }, heart: { proj: 'heart' },
};

export const MISSIONS3 = {
  fire_dog: {
    kind: 'fire', icon: 'drop', needs: 'hose', hits: () => 2, cue: 'O Bolota vai ajudar!', say: 'O Bolota vai ajudar!', dogAssist: true, cam: 0,
    build() { const model = buildBin(); model.scale.setScalar(1.7); return { model, tx: 3.9, flames: [[0, 2.3, 0, 1.9]], aim: [0, 1.4, 0], cheer: 0 }; },
  },
  rescue_cat: {
    kind: 'help', icon: 'helpHand', hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Ajude o gatinho!', say: 'Ajude o gatinho a descer!', cam: 0,
    build() {
      const model = new THREE.Group(), crates = buildCrates(2), cat = buildCat(); cat.scale.setScalar(1.8); cat.position.set(0, 1.9, 0); crates.scale.setScalar(1.15); model.add(crates, cat);
      return { model, tx: 4.2, aim: [0, 1.6, 0], parts: { crates, cat } };
    },
    update(m, t, dt) {
      const { cat, crates } = m.parts; animCreature(cat, t, { wag: 3 + m.prog * 6, tilt: Math.sin(t * 3) * 0.2 });
      if (!m.done) { cat.position.y = 1.9 + Math.abs(Math.sin(t * 6)) * (0.1 + 0.2 * (1 - m.prog)); crates.rotation.z = Math.sin(t * 30) * 0.03 * m.shakeT; m.shakeT = Math.max(0, (m.shakeT || 0) - dt * 3); }
      else { m.a = (m.a || 0) + dt; crates.position.x += Math.min(1, m.a * 3) * dt * -4 * m.side; crates.position.y += dt * (m.a < 0.4 ? 3 : -4); crates.rotation.z -= dt * 3 * m.side; crates.visible = m.a < 1.4; cat.position.y = Math.max(0, 1.9 - m.a * 3.4) + Math.abs(Math.sin(m.a * 8)) * 0.4 * (m.a < 1.8 ? 1 : 0); if (m.a > 1.0) cat.position.z -= dt * 0.8; }
    },
    onHit(m) { m.shakeT = 1; },
  },
  distract_dog: {
    kind: 'help', icon: 'heart', hits: () => 2, cue: 'Mande um coraçãozinho para o cachorro!', say: 'Mande carinho para o cachorro!', cam: 0, hold: 2.4,
    build() { const model = new THREE.Group(), dog = buildDog('pipoca'); dog.scale.setScalar(2.4); model.add(dog); return { model, tx: 4.6, aim: [0, 1.4, -0.4], parts: { dog } }; },
    update(m, t, dt) {
      const dog = m.parts.dog;
      if (!m.done) animCreature(dog, t, { walk: 0.0, wag: 4 + m.prog * 8, headX: -0.15, lift: m.hop > 0 ? Math.abs(Math.sin(m.hop * 9)) * 0.45 : 0 }), m.hop = Math.max(0, (m.hop || 0) - dt);
      else { m.a = (m.a || 0) + dt; if (m.a < 0.35) dog.rotation.y += dt * 9; else { dog.position.z += dt * 5.5 * Math.min(1, m.a - 0.35); animCreature(dog, t, { walk: 1, rate: 14, wag: 14, wagAmp: 0.6 }); } }
    },
    onHit(m) { m.hop = 0.5; },
  },
  person_safe: {
    kind: 'help', icon: 'helpHand', hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Leve a moça ao abrigo!', say: 'Leve a moça ao abrigo!', cam: 1, hold: 2.0,
    build(side) {
      const model = new THREE.Group(), shelter = buildShelter(), p = npc(5, 1, 1, 2);
      shelter.position.set(side * 5.6, 0, 0); shelter.rotation.y = 0; p.position.set(0, 0, 0); p.rotation.y = 0; model.add(shelter, p);
      return { model, tx: 4.8, aim: [0, 1.2, 0], parts: { p, shelter }, side };
    },
    update(m, t, dt) {
      const p = m.parts.p, total = m.max, goal = m.side * 5.6;
      const f = m.done ? 1 : m.prog; m.walk = (m.walk || 0) + ((f - (m.walk || 0)) * Math.min(1, dt * 2.2));
      const x = goal * 0.88 * m.walk; const moving = Math.abs(f - m.walk) > 0.02;
      p.position.x = x;
      poseKid(p, m.done && !moving ? 'cheer' : moving ? 'run' : 'idle', t * 5, t);
      p.rotation.y = moving ? -Math.sign(goal) * Math.PI / 2 : 0;
    },
  },
  rescue_bunny: {
    kind: 'help', icon: 'helpHand', hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Salve o coelhinho!', say: 'Salve o coelhinho!', cam: 0, hold: 2.2,
    build() {
      const model = new THREE.Group(), bunny = buildBunny(), log = toMesh([P(cyl(0.55, 0.55, 2.4, 14), 0x9a6a3a, [0, 0.55, 0], [0, 0, Math.PI / 2]), P(cyl(0.56, 0.56, 0.05, 14), 0xe9c58f, [1.2, 0.55, 0], [0, 0, Math.PI / 2]), P(cyl(0.56, 0.56, 0.05, 14), 0xe9c58f, [-1.2, 0.55, 0], [0, 0, Math.PI / 2]), P(sph(0.25, 8, 6), 0x59c24a, [0.5, 1.05, 0.1], [0, 0, 0], [1.6, 0.5, 1])], { thin: true });
      bunny.scale.setScalar(1.7); bunny.position.set(-0.3, 1.1, 0); log.rotation.y = 0; model.add(log, bunny);
      return { model, tx: 4.4, aim: [0, 1.2, 0], parts: { bunny, log } };
    },
    update(m, t, dt) {
      const { bunny, log } = m.parts;
      if (!m.done) { animCreature(bunny, t, { tilt: Math.sin(t * 4) * 0.15 }); log.position.x = Math.sin(t * 20) * 0.04 * (m.shakeT || 0); m.shakeT = Math.max(0, (m.shakeT || 0) - dt * 2); }
      else { m.a = (m.a || 0) + dt; log.position.z += dt * (m.a < 0.6 ? 2 : 0) ; log.rotation.y += dt * 0.5 * (m.a < 0.6 ? 1 : 0); const k = Math.max(0, m.a - 0.2); bunny.position.y = Math.abs(Math.sin(k * 7)) * 0.9 * (k < 1.4 ? 1 : 0); bunny.position.z -= dt * (k > 0.3 ? 1.4 : 0); bunny.rotation.y = 0; }
    },
    onHit(m) { m.shakeT = 1; },
  },
  supplies: {
    kind: 'throw', icon: 'box', hits: () => 2, cue: 'Entregue os suprimentos!', say: 'Entregue os suprimentos!', cam: 0, hold: 2.0,
    build() { const model = new THREE.Group(), tent = buildTent(), camper = npc(3, 4, 0, 0); tent.position.set(0, 0, 2.6); camper.position.set(0, 0, 0); model.add(tent, camper); return { model, tx: 4.6, aim: [0, 1.1, -0.2], parts: { camper } }; },
    update(m, t, dt) { const k = m.parts.camper; m.hop = Math.max(0, (m.hop || 0) - dt); if (m.done) poseKid(k, 'cheer', 0, t); else { poseKid(k, 'idle', 0, t); k.position.y = m.hop > 0 ? Math.abs(Math.sin(m.hop * 10)) * 0.4 : 0; } },
    onHit(m) { m.hop = 0.5; },
  },
  rescue_roof: {
    kind: 'help', icon: 'basket', hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Desça a cesta de resgate!', say: 'Desça a cesta de resgate!', cam: 2, camTall: 6.2, hold: 3.0,
    build() {
      const model = new THREE.Group(), top = 5.2;
      const tower = toMesh([P(box(3.4, top, 3.0, 0.1), 0xb9c6dd, [0, top / 2, 0]), P(box(3.8, 0.35, 3.4, 0.05), 0x7b8cae, [0, top + 0.17, 0]), P(box(3.6, 0.2, 0.15, 0.03), 0xffd23f, [0, top + 0.5, -1.6]), P(box(0.9, 1.5, 0.12, 0.04), 0x4b5d86, [0, 0.8, -1.55])].concat([0, 1, 2].flatMap((f) => [-1, 1].map((s) => P(box(0.8, 0.9, 0.1, 0.03), 0xcdeeff, [s * 0.9, 1.4 + f * 1.3, -1.55])))), { thin: true });
      const person = npc(3, 2, 2, 2); person.position.set(0, top + 0.35, 0); person.rotation.y = 0;
      const heli = buildHeli(); heli.scale.setScalar(0.8); heli.position.set(0.4, top + 4.6, -0.5);
      const basket = buildBasket(); basket.position.set(0, top + 3.6, 0);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 5), new THREE.MeshBasicMaterial({ color: 0xdfe6f1 }));
      model.add(tower, person, heli, basket, rope);
      return { model, tx: 4.6, aim: [0, top + 1.0, 0], parts: { person, heli, basket, rope, top } };
    },
    update(m, t, dt) {
      const { person, heli, basket, rope, top } = m.parts; heli.userData.rotor.rotation.y += dt * 26;
      const f = m.done ? 1 : m.prog;
      const target = top + 3.6 - 3.0 * Math.min(1, f * 1.15); m.by = (m.by ?? top + 3.6); m.by += (target - m.by) * Math.min(1, dt * 3);
      let hx = 0.4, hy = top + 4.6;
      if (m.done) { m.a = (m.a || 0) + dt; if (m.a > 0.5) { person.visible = false; basket.userData.full = true; } if (m.a > 1.0) { hy += (m.a - 1.0) * 2.4; hx += (m.a - 1.0) * 5.0 * -m.side * 0; basket.position.y += dt * 2.4; m.by = basket.position.y; } }
      heli.position.set(hx, hy + Math.sin(t * 2) * 0.1, -0.5); basket.position.set(0, m.by, 0);
      if (m.done && m.a > 1.0) heli.position.z -= (m.a - 1.0) * 4 * m.side * 0;
      const topY = heli.position.y - 0.9, len = Math.max(0.1, topY - (basket.position.y + 0.9)); rope.scale.y = len; rope.position.set(0, basket.position.y + 0.9 + len / 2, 0);
      if (m.done && m.a > 0.5) { /* a pessoa já está na cesta */ }
      if (!m.done) poseKid(person, 'idle', 0, t); person.position.y = top + 0.35;
    },
  },
  distract_dino: {
    kind: 'throw', icon: 'fruit', needs: 'fruit', hits: () => 2, cue: 'Distraia o dinossauro com uma fruta!', say: 'Distraia o dinossauro com uma fruta!', cam: 1, hold: 3.2,
    build() { const model = new THREE.Group(), d = buildDino('stego'); d.scale.setScalar(1.15); model.add(d); return { model, tx: 5.6, aim: [0, 1.7, -1.6], parts: { d } }; },
    update(m, t, dt) {
      const d = m.parts.d;
      if (!m.done) { animCreature(d, t, { walk: 0, wagAmp: 0.25, lift: m.hop > 0 ? Math.abs(Math.sin(m.hop * 8)) * 0.3 : 0, headX: 0.1 }); m.hop = Math.max(0, (m.hop || 0) - dt); }
      else { m.a = (m.a || 0) + dt; if (m.a < 0.5) d.rotation.y += dt * 6; else { d.position.z += dt * 3.2 * Math.min(1, m.a - 0.5); animCreature(d, t, { walk: 1, rate: 6, wagAmp: 0.4 }); } }
    },
    onHit(m) { m.hop = 0.6; },
  },
  nest: {
    kind: 'throw', icon: 'egg', needs: 'egg', hits: () => 1, cue: 'Leve o ovo ao ninho!', say: 'Leve o ovo ao ninho!', cam: 0, hold: 2.2,
    build() { const model = new THREE.Group(), nest = buildNest(); nest.scale.setScalar(1.3); const egg = buildEgg(1.4); egg.position.y = 0.45; egg.visible = false; model.add(nest, egg); return { model, tx: 3.8, aim: [0, 0.9, 0], parts: { nest, egg } }; },
    update(m, t, dt) { const e = m.parts.egg; e.visible = !!m.done; if (m.done) { m.a = (m.a || 0) + dt; e.scale.setScalar(1.4 * (1 + Math.max(0, Math.sin(m.a * 8)) * 0.1 * Math.max(0, 1.4 - m.a))); e.rotation.z = Math.sin(m.a * 14) * 0.12 * Math.max(0, 1.4 - m.a); } },
  },
  baby_free: {
    kind: 'help', icon: 'helpHand', hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Ajude o filhote!', say: 'Ajude o filhote!', cam: 0, hold: 2.4,
    build() {
      const model = new THREE.Group(), mud = toMesh([P(cyl(1.5, 1.6, 0.3, 18), 0x6e4b2a, [0, 0.12, 0]), P(cyl(1.0, 1.1, 0.12, 14), 0x8a5a35, [-0.2, 0.3, 0.1]), P(sph(0.5, 8, 6), 0x9aa3b5, [-1.4, 0.4, -0.3], [0, 0, 0], [1.2, 0.9, 1]), P(sph(0.4, 8, 6), 0xa9b1c4, [1.4, 0.3, 0.4], [0, 0, 0], [1.2, 0.8, 1])], { thin: true });
      const baby = buildDino('baby'); baby.scale.setScalar(1.7); baby.position.y = -0.05; model.add(mud, baby);
      return { model, tx: 4.3, aim: [0, 1.0, 0], parts: { baby, mud } };
    },
    update(m, t, dt) {
      const { baby, mud } = m.parts; const f = m.done ? 1 : m.prog;
      mud.scale.set(1 - f * 0.5, 1 - f * 0.8, 1 - f * 0.5);
      if (!m.done) { animCreature(baby, t, { wagAmp: 0.5, wag: 8, tilt: Math.sin(t * 5) * 0.12 }); baby.position.y = -0.05 + f * 0.1; }
      else { m.a = (m.a || 0) + dt; mud.visible = m.a < 0.6; baby.position.y = Math.abs(Math.sin(m.a * 6)) * 0.8 * (m.a < 1.6 ? 1 : 0); animCreature(baby, t, { wagAmp: 0.7, wag: 14 }); }
    },
    onHit(m) { m.pop = 1; },
  },
  baby_reunite: {
    kind: 'help', icon: 'heart', hits: () => 1, cue: 'Leve o filhote para a família!', say: 'Leve o filhote para a família!', cam: 1, hold: 3.0,
    build(side) {
      const model = new THREE.Group(), baby = buildDino('baby'), fam1 = buildDino('brachio'), fam2 = buildDino('tricera');
      baby.scale.setScalar(1.7); fam1.scale.setScalar(0.62); fam2.scale.setScalar(0.85);
      fam1.position.set(side * 6.6, 0, 1.2); fam2.position.set(side * 10.2, 0, 0.6);
      model.add(fam2, fam1, baby);
      return { model, tx: 4.6, aim: [0, 1.0, 0], parts: { baby, fam1, fam2 }, side };
    },
    update(m, t, dt) {
      const { baby, fam1, fam2 } = m.parts; animCreature(fam1, t, { wagAmp: 0.2, bob: 1 }); animCreature(fam2, t + 1, { wagAmp: 0.2, bob: 1 });
      if (!m.done) animCreature(baby, t, { wagAmp: 0.5, wag: 8, tilt: Math.sin(t * 5) * 0.1 });
      else { m.a = (m.a || 0) + dt; const goal = m.side * 5.2; const k = Math.min(1, m.a / 1.8); baby.position.x = goal * ease(k); baby.rotation.y = -Math.sign(goal) * Math.PI / 2; baby.position.y = Math.abs(Math.sin(m.a * 9)) * 0.35 * (k < 1 ? 1 : 0); animCreature(baby, t, { walk: k < 1 ? 1 : 0, rate: 12, wag: 14, wagAmp: 0.7 }); if (k >= 1) baby.rotation.y = 0; }
    },
  },

  // =================================================================== fase 6: resgate aquático
  rescue_swimmer: {
    kind: 'help', icon: 'ring', hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Jogue a boia para o nadador!', say: 'Jogue a boia!', cam: 0, hold: 2.6,
    build(side) {
      const model = new THREE.Group(), water = buildWaterPatch(2.6), p = npc(8, 3, 3, 0); p.position.set(0, -0.9, 0); p.rotation.y = 0;
      const ring = buildLifeRing(1.4); ring.visible = false; model.add(water, p, ring);
      return { model, tx: 5.2, aim: [0, 0.5, 0], parts: { p, ring, water }, side };
    },
    update(m, t, dt) {
      const { p, ring } = m.parts;
      if (!m.done) { p.position.y = -0.9 + Math.sin(t * 3) * 0.08; poseKid(p, 'cheer', 0, t); p.rotation.z = Math.sin(t * 2) * 0.1; ring.visible = m.prog > 0; ring.position.set(0.3, 0.05 + Math.sin(t * 3) * 0.05, 0); }
      else { m.a = (m.a || 0) + dt; ring.visible = true; const k = Math.min(1, m.a / 1.6); p.position.z = -k * 2.4; p.position.y = -0.9 + k * 0.9; ring.position.set(0.3, 0.05 + k * 0.4, p.position.z); poseKid(p, k < 1 ? 'idle' : 'cheer', 0, t); p.rotation.z = 0; }
    },
  },
  boat_fire: {
    kind: 'fire', icon: 'drop', needs: 'hose', hits: (c) => c.fireHits + 1, cue: 'Fogo no barco!', say: 'Fogo no barco! Use a mangueira!', cam: 1,
    build() { const model = new THREE.Group(), boat = buildRescueBoat(0xffffff, 0x2f78e0), water = buildWaterPatch(4.2); boat.position.y = 0.0; model.add(water, boat); return { model, tx: 6.4, flames: [[-0.3, 1.6, 0.6, 1.3], [0.4, 1.3, -1.2, 1.0]], aim: [0, 1.4, 0], parts: { boat } }; },
    update(m, t) { m.parts.boat.rotation.z = Math.sin(t * 1.6) * 0.04; m.parts.boat.position.y = Math.sin(t * 2) * 0.05; },
  },
  rescue_pup: {
    kind: 'help', icon: 'heart', hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Salve o cachorrinho na água!', say: 'Salve o cachorrinho!', cam: 0, hold: 2.6,
    build(side) {
      const model = new THREE.Group(), water = buildWaterPatch(2.6), crate = buildFloatCrate(), pup = buildDog('marola'); pup.scale.setScalar(0.85); pup.position.set(0, 0.62, 0); crate.add(pup);
      model.add(water, crate); return { model, tx: 5.0, aim: [0, 1.0, 0], parts: { crate, pup }, side };
    },
    update(m, t, dt) {
      const { crate, pup } = m.parts;
      if (!m.done) { crate.position.y = Math.sin(t * 2.5) * 0.08; crate.rotation.z = Math.sin(t * 1.7) * 0.08; animCreature(pup, t, { wag: 6 + m.prog * 8, tilt: Math.sin(t * 3) * 0.2 }); }
      else { m.a = (m.a || 0) + dt; const k = Math.min(1, m.a / 1.4); crate.position.z = -k * 2.2; crate.rotation.z = 0; pup.position.y = 0.62 + Math.abs(Math.sin(m.a * 8)) * 0.4 * (k < 1 ? 0.4 : 1); animCreature(pup, t, { wag: 16, wagAmp: 0.6 }); }
    },
  },
  // =================================================================== fase 7: resgate no vulcão
  cool_lava: {
    kind: 'fire', icon: 'drop', needs: 'hose', hits: (c) => c.fireHits + 1, cue: 'Esfrie a lava com água!', say: 'A lava está bloqueando! Use a mangueira!', cam: 0,
    build() { const flow = buildLavaFlow(); return { model: flow, tx: 4.2, flames: [[-0.8, 0.4, -0.2, 0.9], [0.6, 0.35, 0.5, 0.8], [0, 0.5, -1.0, 0.8]], aim: [0, 0.6, 0], parts: { flow } }; },
    update(m, t) { const f = m.parts.flow.userData; if (f.lava) { const k = m.done ? 0 : m.hp / m.max; f.lava.material.color.setRGB(1, 0.42 * k + 0.55 * (1 - k), 0.1 * k + 0.55 * (1 - k)); f.glow.visible = k > 0.05; f.glow.scale.setScalar(0.9 + Math.sin(t * 4) * 0.06); } },
  },
  rescue_dino_lava: {
    kind: 'help', icon: 'heart', hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Ajude o dinossaurinho a sair da lava!', say: 'Ajude o dinossaurinho!', cam: 1, hold: 2.8,
    build(side) {
      const model = buildLavaIsland(), baby = buildDino('baby'); baby.scale.setScalar(1.6); baby.position.set(0, 0.55, 0); model.add(baby);
      return { model, tx: 5.4, aim: [0, 1.2, 0], parts: { baby, isl: model }, side };
    },
    update(m, t, dt) {
      const { baby, isl } = m.parts; const st = isl.userData.stones; const f = m.done ? 1 : m.prog;
      st.forEach((s, i) => { const want = f * st.length > i ? 0.18 : -0.6; s.position.y += (want - s.position.y) * Math.min(1, dt * 4); });
      if (!m.done) animCreature(baby, t, { wagAmp: 0.5, wag: 8, tilt: Math.sin(t * 5) * 0.12 });
      else { m.a = (m.a || 0) + dt; const k = Math.min(1, m.a / 1.8); baby.position.z = -k * 3.4; baby.rotation.y = 0; baby.position.y = 0.55 + Math.abs(Math.sin(m.a * 9)) * 0.3 * (k < 1 ? 1 : 0); animCreature(baby, t, { walk: k < 1 ? 1 : 0, rate: 12, wagAmp: 0.6, wag: 14 }); }
    },
  },
  hut_fire: {
    kind: 'fire', icon: 'drop', needs: 'hose', hits: (c) => c.fireHits + 1, cue: 'Fogo na cabana!', say: 'Fogo na cabana! Apague com a mangueira!', cam: 1,
    build() { const hut = buildHut(); return { model: hut, tx: 6.6, flames: [[-0.9, 1.0, -1.75, 1.0], [0.9, 2.4, -1.9, 1.1], [0, 3.9, -0.6, 1.3]], aim: [0, 2.2, -1.2] }; },
  },
};
export { DOGS3 };
