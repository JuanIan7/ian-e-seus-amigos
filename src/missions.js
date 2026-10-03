// Missões: cada uma tem equipamento necessário, ícone do botão de ação e animações.
// build(scene, ctx) -> { root, w, h, aim:{x,y}, parts } ; finish(scene, m) anima a conclusão.
import Phaser from 'phaser';
import { GROUND } from './config.js';
import { buildChild } from './character.js';
import { buildDog, poseDog, buildDino, buildCat, buildBunny, buildCrates, buildShelter, buildNest, buildEgg, buildHeli, buildBasketRig } from './creatures.js';
import { sfx, speak } from './audio.js';

const npcLook = (outfit, skin, hair, hairColor) => ({ skin, face: 0, hair, hairColor, eyes: 0, outfit });
const flameG = (scene, x, y, size) => {
  const f = scene.add.graphics(); f.x = x; f.y = y;
  f.fillStyle(0xff6a1a, 1); f.fillCircle(0, -size * 0.5, size * 0.5); f.fillTriangle(-size * 0.5, -size * 0.55, size * 0.5, -size * 0.55, 0, -size * 1.5);
  f.fillStyle(0xffd23f, 1); f.fillCircle(0, -size * 0.35, size * 0.28); f.fillTriangle(-size * 0.28, -size * 0.4, size * 0.28, -size * 0.4, 0, -size * 0.95);
  f.phase = Math.random() * 6; return f;
};
const puffs = (scene, x, y, n = 8, tint = 0xcfd8e3) => {
  for (let i = 0; i < n; i++) {
    const pf = scene.add.image(x, y, 'puff').setDepth(15).setTint(tint).setScale(0.6);
    scene.tweens.add({ targets: pf, x: x + Phaser.Math.Between(-80, 80), y: y - Phaser.Math.Between(40, 150), alpha: 0, scale: 1.8, duration: 800, onComplete: () => pf.destroy() });
  }
};
const hearts = (scene, x, y, n = 5) => {
  for (let i = 0; i < n; i++) {
    const h = scene.add.image(x + Phaser.Math.Between(-40, 40), y, 'heart').setDepth(16).setScale(0.8);
    scene.tweens.add({ targets: h, y: y - 120 - i * 14, alpha: 0, duration: 1000, delay: i * 80, onComplete: () => h.destroy() });
  }
};

export const MISSIONS = {
  // ------------------------------------------------------------ Fase 1/2: fogos
  fire_bin: {
    icon: 'drop', proj: 'drop', needs: 'hose', kind: 'fire', hits: (c) => c.fireHits, cue: 'Fogo na lixeira!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const bin = scene.add.graphics();
      bin.fillStyle(0x000000, 0.2); bin.fillEllipse(0, 2, 90, 14);
      bin.fillStyle(0x4f7d9a, 1); bin.fillRoundedRect(-36, -84, 72, 84, 8); bin.fillStyle(0x3d6580, 1); bin.fillRoundedRect(-42, -96, 84, 16, 6);
      bin.fillStyle(0x2d4d63, 1); for (let i = -18; i <= 18; i += 12) bin.fillRect(i - 2, -72, 4, 56);
      const flames = [[-20, 38], [0, 54], [20, 38]].map(([x, s]) => flameG(scene, x, -92, s));
      root.add([bin, ...flames]);
      return { root, w: 90, h: 150, aim: { x: 0, y: 70 }, flames };
    },
    finish(scene, m) { puffs(scene, m.root.x, GROUND - 100); },
  },
  fire_house: {
    icon: 'drop', proj: 'drop', needs: 'hose', kind: 'fire', hits: (c) => c.fireHits + 1, cue: 'Fogo na casa!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const h = scene.add.graphics();
      h.fillStyle(0xffd9a8, 1); h.fillRect(-100, -150, 200, 150); h.fillStyle(0xd9534f, 1); h.fillTriangle(-116, -150, 116, -150, 0, -225);
      h.fillStyle(0x8d5a3b, 1); h.fillRect(-18, -76, 36, 76); h.fillStyle(0x9fdcff, 1); h.fillRect(-84, -112, 44, 44); h.fillRect(40, -112, 44, 44);
      h.fillStyle(0x6e4527, 1); h.fillRect(-84, -92, 44, 4); h.fillRect(-64, -112, 4, 44);
      const flames = [[-62, -66, 40], [62, -66, 40], [0, -178, 50], [-40, -150, 36]].map(([x, y, s]) => flameG(scene, x, y, s));
      root.add([h, ...flames]);
      return { root, w: 200, h: 235, aim: { x: 0, y: 100 }, flames };
    },
    finish(scene, m) { puffs(scene, m.root.x, GROUND - 130, 10); },
  },
  fire_building: {
    icon: 'drop', proj: 'drop', needs: 'hose', kind: 'fire', hits: (c) => c.fireHits + 2, cue: 'Fogo no prédio!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const b = scene.add.graphics();
      b.fillStyle(0x9fb4d6, 1); b.fillRect(-90, -300, 180, 300); b.fillStyle(0x8199c4, 1); b.fillRect(-90, -300, 180, 14);
      b.fillStyle(0xfff2b0, 0.9); for (let yy = -272; yy < -30; yy += 46) for (let xx = -70; xx < 70; xx += 46) b.fillRect(xx, yy, 28, 30);
      b.fillStyle(0x6e4527, 1); b.fillRect(-18, -64, 36, 64);
      const flames = [[-46, -92, 40], [46, -140, 40], [-46, -184, 44], [46, -232, 40], [0, -286, 50]].map(([x, y, s]) => flameG(scene, x, y, s));
      root.add([b, ...flames]);
      return { root, w: 180, h: 340, aim: { x: 0, y: 140 }, flames };
    },
    finish(scene, m) { puffs(scene, m.root.x, GROUND - 160, 12); },
  },
  fire_dog: {
    icon: 'drop', proj: 'drop', needs: 'hose', kind: 'fire', hits: () => 2, cue: 'O Bolota vai ajudar!', dogAssist: true,
    build(scene) { const m = MISSIONS.fire_bin.build(scene); return m; },
    finish(scene, m) { puffs(scene, m.root.x, GROUND - 100); hearts(scene, m.root.x, GROUND - 120, 3); },
  },
  // ------------------------------------------------------------ Fase 2: resgates
  rescue_cat: {
    icon: 'helpHand', proj: 'heart', needs: null, hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Ajude o gatinho!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const crates = buildCrates(scene, 3); const cat = buildCat(scene); cat.x = 4; cat.y = -120;
      root.add([cat, crates]);
      return { root, w: 90, h: 130, aim: { x: 0, y: 80 }, parts: { crates, cat } };
    },
    onHit(scene, m, i, total) { scene.tweens.add({ targets: m.parts.crates, y: m.parts.crates.y + 14, duration: 120, yoyo: true }); m.parts.crates.alpha = 1 - 0.25 * (i / total); },
    finish(scene, m) {
      scene.tweens.add({ targets: m.parts.crates, x: -80, y: 20, angle: -50, alpha: 0, duration: 500 });
      scene.tweens.add({ targets: m.parts.cat, y: -150, duration: 250, yoyo: true, repeat: 1, onComplete: () => scene.tweens.add({ targets: m.parts.cat, x: 300, duration: 900 }) });
      hearts(scene, m.root.x, GROUND - 120);
    },
  },
  distract_dog: {
    icon: 'bone', proj: 'bone', needs: 'bone', hits: () => 2, cue: 'Jogue o ossinho!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const dog = buildDog(scene, 'pipoca', 2.2); dog.scaleX = -2.2; dog.x = 0;
      root.add(dog);
      return { root, w: 160, h: 170, aim: { x: 0, y: 90 }, parts: { dog } };
    },
    onHit(scene, m) { scene.tweens.add({ targets: m.parts.dog, y: -26, duration: 140, yoyo: true }); },
    finish(scene, m) { scene.tweens.add({ targets: m.parts.dog, scaleX: 2.2, duration: 120 }); scene.tweens.add({ targets: m, offX: 900, duration: 1500, ease: 'Sine.in' }); hearts(scene, m.root.x, GROUND - 160, 3); },
  },
  person_safe: {
    icon: 'helpHand', proj: 'heart', needs: null, hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Leve a moça ao abrigo!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const shelter = buildShelter(scene); shelter.x = 210;
      const p = buildChild(scene, npcLook(5, 1, 1, 2)); p.setScale(0.95); p.x = -30; p.y = 0;
      root.add([shelter, p]);
      return { root, w: 120, h: 130, aim: { x: 0, y: 80 }, parts: { p, shelter } };
    },
    onHit(scene, m, i, total) { scene.tweens.add({ targets: m.parts.p, x: -30 + (210 + 30) * (i / total), duration: 400 }); },
    finish(scene, m) { scene.tweens.add({ targets: m.parts.p, x: 210, alpha: 0.2, duration: 400 }); hearts(scene, m.root.x + 200, GROUND - 140); },
  },
  // ------------------------------------------------------------ Fase 3
  rescue_bunny: {
    icon: 'helpHand', proj: 'heart', needs: null, hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Salve o coelhinho!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const bunny = buildBunny(scene); bunny.x = 12;
      const log = scene.add.graphics(); log.fillStyle(0x8a5a35, 1); log.fillRoundedRect(-62, -76, 124, 76, 18); log.fillStyle(0xd9a86a, 1); log.fillCircle(-52, -38, 26); log.lineStyle(4, 0x8a5a35, 1); log.strokeCircle(-52, -38, 16);
      log.fillStyle(0x6e4527, 1); log.fillRect(-30, -62, 80, 4); log.fillRect(-30, -40, 80, 4);
      root.add([bunny, log]);
      return { root, w: 120, h: 100, aim: { x: 0, y: 60 }, parts: { bunny, log } };
    },
    onHit(scene, m) { scene.tweens.add({ targets: m.parts.log, x: m.parts.log.x + 14, duration: 120, yoyo: true }); },
    finish(scene, m) { scene.tweens.add({ targets: m.parts.log, x: 140, angle: 90, duration: 600 }); scene.tweens.add({ targets: m.parts.bunny, y: -80, duration: 220, yoyo: true, repeat: 2, onComplete: () => scene.tweens.add({ targets: m.parts.bunny, x: 400, duration: 900 }) }); hearts(scene, m.root.x, GROUND - 100); },
  },
  supplies: {
    icon: 'box', proj: 'box', needs: null, hits: () => 2, cue: 'Entregue os suprimentos!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const tent = scene.add.graphics(); tent.fillStyle(0xff8a1f, 1); tent.fillTriangle(30, 0, 150, 0, 90, -100); tent.fillStyle(0x7a3b10, 1); tent.fillTriangle(70, 0, 110, 0, 90, -60);
      const camper = buildChild(scene, npcLook(3, 4, 0, 0)); camper.setScale(0.95); camper.x = -20;
      root.add([tent, camper]);
      return { root, w: 120, h: 130, aim: { x: -10, y: 80 }, parts: { camper } };
    },
    onHit(scene, m) { scene.tweens.add({ targets: m.parts.camper, y: -18, duration: 140, yoyo: true }); },
    finish(scene, m) { hearts(scene, m.root.x, GROUND - 130); scene.tweens.add({ targets: m.parts.camper, y: -30, duration: 200, yoyo: true, repeat: 3 }); },
  },
  // ------------------------------------------------------------ Fase 4
  rescue_roof: {
    icon: 'basket', proj: 'basket', needs: null, hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Desça a cesta de resgate!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const plat = scene.add.graphics(); plat.fillStyle(0x7b828c, 1); plat.fillRoundedRect(-80, -250, 160, 20, 6); plat.fillStyle(0xffd23f, 1); for (let x = -70; x < 60; x += 30) plat.fillRect(x, -250, 14, 20);
      plat.lineStyle(6, 0x586380, 1); plat.lineBetween(-66, -230, -66, 0); plat.lineBetween(66, -230, 66, 0);
      const person = buildChild(scene, npcLook(3, 2, 2, 2)); person.setScale(0.9); person.y = -250;
      const heli = buildHeli(scene); heli.setScale(0.7); heli.y = -430; heli.x = 40;
      const basket = buildBasketRig(scene); basket.x = 0; basket.y = -300;
      root.add([plat, person, basket, heli]);
      return { root, w: 160, h: 330, aim: { x: 0, y: 270 }, parts: { person, heli, basket, plat } };
    },
    onHit(scene, m, i, total) { scene.tweens.add({ targets: m.parts.basket, y: -300 + 40 * ((i) / total) + 10, duration: 300 }); },
    finish(scene, m) {
      scene.tweens.add({ targets: m.parts.basket, y: -250, duration: 300, onComplete: () => { m.parts.person.setVisible(false); scene.tweens.add({ targets: m.parts.basket, y: -420, duration: 700 }); } });
      scene.tweens.add({ targets: m.parts.heli, x: 700, y: -520, delay: 900, duration: 1400 }); hearts(scene, m.root.x, GROUND - 280);
    },
  },
  // ------------------------------------------------------------ Fase 5
  distract_dino: {
    icon: 'bone', proj: 'bone', needs: 'bone', hits: () => 2, cue: 'Distraia o dinossauro com o osso!', label: 'stego',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const d = buildDino(scene, 'stego'); d.scaleX = -1; root.add(d);
      return { root, w: 240, h: 190, aim: { x: 0, y: 90 }, parts: { d } };
    },
    onHit(scene, m) { scene.tweens.add({ targets: m.parts.d, y: -14, duration: 140, yoyo: true }); },
    finish(scene, m) { scene.tweens.add({ targets: m.parts.d, scaleX: 1, duration: 120 }); scene.tweens.add({ targets: m, offX: 1100, duration: 2200, ease: 'Sine.in' }); hearts(scene, m.root.x, GROUND - 190, 3); },
  },
  nest: {
    icon: 'egg', proj: 'egg', needs: 'egg', hits: () => 1, cue: 'Leve o ovo ao ninho!',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const nest = buildNest(scene); root.add(nest);
      return { root, w: 130, h: 70, aim: { x: 0, y: 30 }, parts: { nest } };
    },
    finish(scene, m) { const egg = buildEgg(scene); egg.y = -6; m.root.add(egg); scene.tweens.add({ targets: egg, scaleY: 1.1, duration: 300, yoyo: true, repeat: 2 }); hearts(scene, m.root.x, GROUND - 60); },
  },
  baby_free: {
    icon: 'helpHand', proj: 'heart', needs: null, hits: (c) => Math.max(2, c.fireHits - 1), cue: 'Ajude o filhote!', label: 'baby',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const mud = scene.add.graphics(); mud.fillStyle(0x6e4b2a, 1); mud.fillEllipse(0, -8, 150, 34); mud.fillStyle(0x8a5a35, 1); mud.fillEllipse(-10, -12, 90, 18);
      const baby = buildDino(scene, 'baby'); baby.scaleX = -1; baby.y = 6;
      root.add([baby, mud]);
      return { root, w: 130, h: 110, aim: { x: 0, y: 50 }, parts: { baby, mud } };
    },
    onHit(scene, m, i, total) { m.parts.mud.alpha = 1 - (i / total) * 0.8; scene.tweens.add({ targets: m.parts.baby, y: 6 - 10 * (i / total), duration: 150, yoyo: true }); },
    finish(scene, m) { scene.tweens.add({ targets: m.parts.mud, alpha: 0, duration: 400 }); scene.tweens.add({ targets: m.parts.baby, y: -60, duration: 220, yoyo: true, repeat: 2, onComplete: () => { m.parts.baby.scaleX = 1; scene.tweens.add({ targets: m.parts.baby, x: 330, duration: 900 }); } }); hearts(scene, m.root.x, GROUND - 90); },
  },
  baby_reunite: {
    icon: 'heart', proj: 'heart', needs: null, hits: () => 1, cue: 'Leve o filhote para a família!', label: 'brachio',
    build(scene) {
      const root = scene.add.container(0, GROUND).setDepth(6);
      const fam1 = buildDino(scene, 'brachio'); fam1.scaleX = -0.8; fam1.scaleY = 0.8; fam1.x = 120;
      const fam2 = buildDino(scene, 'tricera'); fam2.scaleX = -0.62; fam2.scaleY = 0.62; fam2.x = 270;
      const baby = buildDino(scene, 'baby'); baby.x = -150;
      root.add([fam2, fam1, baby]);
      return { root, w: 120, h: 250, aim: { x: 100, y: 120 }, parts: { baby, fam1, fam2 } };
    },
    finish(scene, m) { scene.tweens.add({ targets: m.parts.baby, x: 40, y: -40, duration: 500, yoyo: false, onComplete: () => { m.parts.baby.y = 0; } }); hearts(scene, m.root.x + 80, GROUND - 160, 8); sfx.win(); speak('A família se reencontrou!'); },
  },
};
