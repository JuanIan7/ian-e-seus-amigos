// Tela inicial em 3D: o personagem fica num palco (com o cãozinho e a viatura), e por cima vêm os botões grandes:
// modo de jogo, fase inicial, personalização completa (com prévia 3D que gira com o dedo) e a lojinha de poderes.
// Tudo funciona sem internet e sem leitura obrigatória (ícones grandes + voz).
import { THREE, blobShadow } from '../g3/kit.js';
import { buildKid, poseKid, HAIR_STYLES3, ACCESSORIES } from '../g3/kid.js';
import { SKINS, HAIR_COLORS, EYE_COLORS, OUTFITS, FACES } from '../character.js';
import { buildDog, animCreature } from '../g3/creatures.js';
import { buildFireTruck, SCENERY } from '../g3/props.js';
import { rng, lowDetail } from '../g3/kit.js';
import { MODES3, PHASES3, SHOP } from '../g3/config3.js';
import { load, save, DEFAULT_LOOK } from '../save.js';
import { sfx, unlock, startMusic, stopMusic, speak } from '../audio.js';
import { Game3D } from '../g3/game3d.js';

const hexs = (c) => '#' + c.toString(16).padStart(6, '0');
const PHASE_ICON = ['🚒', '🐶', '🌲', '🏙️', '🦖', '🌊', '🌋'];
const POWER_ICON = { shield: '🛡️', truck: '🚒', fly: '🪽', glide: '🪂', magnet: '🧲', jump: '🦘', speed: '⚡', jet: '💦' };
const OUTFIT_ICON = ['🧑‍🚒', '🐾', '🦖', '🧭', '🚁', '🌳', '🚀', '🦸', '⚽', '👕'];
const ACC_ICON = ['🚫', '👓', '🕶️', '🎀', '⭐', '🎒', '🧣'];

const css = `
.front{position:fixed;inset:0;overflow:hidden;background:linear-gradient(#49b4ff 0%,#9fdcff 55%,#d9f3ff 100%);font-family:'Arial Black','Arial Rounded MT Bold',Arial,sans-serif;color:#1b2a49;touch-action:none;-webkit-user-select:none;user-select:none;z-index:5}
.front canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.front .scr{position:absolute;inset:0;display:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);pointer-events:none}
.front .scr.on{display:block}
.front .b{pointer-events:auto;cursor:pointer;border:5px solid #1b2a49;border-radius:22px;box-shadow:0 6px 0 rgba(27,42,73,.55),inset 0 6px 0 rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;transition:transform .08s;-webkit-tap-highlight-color:transparent}
.front .b:active,.front .b.dn{transform:translateY(4px) scale(.97);box-shadow:0 2px 0 rgba(27,42,73,.55)}
.front .title{position:absolute;left:3vw;top:2.5vh;font-size:min(8vh,48px);line-height:.95;color:#fff;text-shadow:0 5px 0 #1b2a49,4px 0 0 #1b2a49,-4px 0 0 #1b2a49,0 -4px 0 #1b2a49,4px 4px 0 #1b2a49,-4px 4px 0 #1b2a49}
.front .title small{display:block;font-size:.55em;color:#ffd23f}
.front .modes{position:absolute;left:3vw;top:calc(3vh + min(25vh,150px));display:flex;gap:1.4vw}
.front .mode{width:min(19vh,118px);height:min(17vh,96px);background:#fff6d8;flex-direction:column;gap:2px;font-size:min(3.6vh,20px)}
.front .mode i{font-style:normal;font-size:min(4.4vh,26px);letter-spacing:-3px}
.front .mode.sel{background:#ffd23f;outline:5px solid #fff;outline-offset:-11px}
.front .phases{position:absolute;left:3vw;top:calc(5vh + min(25vh,150px) + min(17vh,96px));display:flex;gap:min(1.2vh,8px);flex-wrap:wrap;max-width:52vw}
.front .ph{width:min(11.5vh,66px);height:min(11.5vh,66px);background:#fff6d8;border-radius:50%;font-size:min(5.8vh,34px);position:relative;border-width:4px}
.front .ph b{position:absolute;right:-6px;top:-6px;width:min(5vh,26px);height:min(5vh,26px);border-radius:50%;background:#2f9bff;color:#fff;font-size:min(3vh,16px);display:flex;align-items:center;justify-content:center;border:3px solid #1b2a49}
.front .ph.sel{background:#3ecb6b;transform:scale(1.12)}
.front .play{position:absolute;left:3vw;bottom:4vh;width:min(28vh,170px);height:min(22vh,120px);background:#3ecb6b;border-radius:34px}
.front .play svg{width:46%;height:60%}
.front .side{position:absolute;bottom:4vh;display:flex;gap:2vw;left:calc(3vw + min(28vh,170px) + 2.5vw)}
.front .sbtn{width:min(19vh,108px);height:min(19vh,108px);background:#2f9bff;color:#fff;flex-direction:column;font-size:min(7vh,40px);border-radius:28px;position:relative}
.front .sbtn span{font-size:min(3vh,15px);margin-top:2px}
.front .sbtn.shop{background:#ff8a1f}
.front .coins{position:absolute;right:3vw;top:3vh;background:#fff6d8;border:4px solid #1b2a49;border-radius:30px;padding:4px 16px 4px 10px;font-size:min(5.4vh,30px);display:flex;align-items:center;gap:6px;pointer-events:none}
.front .snd{position:absolute;right:calc(3vw + min(30vh,170px));top:3vh;width:min(11vh,60px);height:min(11vh,60px);background:#2f9bff;border-radius:50%;font-size:min(5.5vh,30px)}
.front .back{position:absolute;left:3vw;top:3vh;width:min(13vh,72px);height:min(13vh,72px);background:#2f9bff;border-radius:50%;font-size:min(6vh,34px);color:#fff}
.front .panel{position:absolute;right:2vw;top:3vh;bottom:3vh;width:min(54vw,560px);background:rgba(255,246,216,.94);border:5px solid #1b2a49;border-radius:28px;pointer-events:auto;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 0 rgba(27,42,73,.45)}
.front .tabs{display:flex;gap:6px;padding:8px;background:#ffe2a0;border-bottom:4px solid #1b2a49;overflow-x:auto;flex:none}
.front .tab{flex:none;width:min(11vh,58px);height:min(11vh,58px);background:#fff;border-radius:16px;font-size:min(5.6vh,30px);border-width:4px;box-shadow:0 4px 0 rgba(27,42,73,.45)}
.front .tab.sel{background:#ffd23f;transform:translateY(2px)}
.front .tabname{padding:4px 14px 0;font-size:min(4.4vh,24px);flex:none}
.front .opts{flex:1;overflow-y:auto;padding:10px;display:flex;flex-wrap:wrap;gap:10px;align-content:flex-start;touch-action:pan-y}
.front .opt{width:min(14vh,76px);height:min(14vh,76px);border-radius:50%;background:#fff;font-size:min(6.6vh,36px);border-width:4px;position:relative}
.front .opt.card{border-radius:18px;width:min(17vh,96px);flex-direction:column;font-size:min(6vh,32px)}
.front .opt.card span{font-size:min(2.5vh,13px);font-family:Arial,sans-serif;font-weight:700;text-align:center;line-height:1}
.front .opt.sel{outline:6px solid #3ecb6b;outline-offset:2px}
.front .opt.sel::after{content:'✓';position:absolute;right:-8px;bottom:-8px;width:26px;height:26px;border-radius:50%;background:#3ecb6b;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;border:3px solid #1b2a49}
.front .ebtns{position:absolute;left:3vw;bottom:4vh;display:flex;gap:2vw}
.front .ok{width:min(22vh,120px);height:min(18vh,96px);background:#3ecb6b;font-size:min(9vh,52px);color:#fff;border-radius:30px}
.front .dice{width:min(18vh,96px);height:min(18vh,96px);background:#ff8a1f;font-size:min(8vh,46px);border-radius:28px}
.front .hint{position:absolute;left:24vw;top:45vh;font-size:min(4vh,22px);color:#fff;text-shadow:0 3px 0 #1b2a49;pointer-events:none;animation:fhint 1.6s ease-in-out infinite}
@keyframes fhint{0%,100%{transform:translateX(0)}50%{transform:translateX(16px)}}
.front .grid{position:absolute;left:3vw;right:3vw;top:calc(3vh + min(15vh,84px));bottom:3vh;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:1.6vw;pointer-events:none}
.front .card2{pointer-events:auto;background:#fff6d8;border:5px solid #1b2a49;border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px;box-shadow:0 6px 0 rgba(27,42,73,.45);position:relative}
.front .card2 .ic{font-size:min(10vh,56px);line-height:1}
.front .card2 .nm{font-size:min(3vh,16px);font-family:Arial,sans-serif;font-weight:800;text-align:center}
.front .card2 .buy{width:90%;height:min(8vh,44px);background:#3ecb6b;color:#fff;font-size:min(3.6vh,20px);border-radius:16px;border-width:4px;box-shadow:0 4px 0 rgba(27,42,73,.45)}
.front .card2 .buy.no{background:#b8bcc6}
.front .card2 .own{position:absolute;right:-8px;top:-8px;min-width:34px;height:34px;border-radius:17px;background:#e8352f;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;border:4px solid #1b2a49}
.front .stitle{position:absolute;left:calc(3vw + min(13vh,72px) + 2vw);top:3vh;font-size:min(9vh,52px);color:#fff;text-shadow:0 5px 0 #1b2a49,4px 0 0 #1b2a49,-4px 0 0 #1b2a49,0 -4px 0 #1b2a49}
.front .pop{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-size:min(16vh,90px);pointer-events:none;animation:fpop .9s ease-out forwards}
@keyframes fpop{0%{transform:translate(-50%,-50%) scale(.2);opacity:0}30%{transform:translate(-50%,-60%) scale(1.2);opacity:1}100%{transform:translate(-50%,-120%) scale(1);opacity:0}}
`;
const PLAY_SVG = '<svg viewBox="0 0 100 100"><path d="M26 10 L88 50 L26 90 Z" fill="#fff" stroke="#1b2a49" stroke-width="6" stroke-linejoin="round"/></svg>';

export class FrontApp {
  constructor() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.className = 'front'; document.body.appendChild(this.el);
    this.game = null; this.screen = 'home'; this.tab = 'outfit'; this.yaw = 0; this.yawV = 0;
    this.setupStage();
    this.buildHome(); this.buildEditor(); this.buildShop();
    this.show('home');
    this.onResize = () => this.resize(); window.addEventListener('resize', this.onResize); this.resize();
    this.last = performance.now(); this.loopFn = (t) => { this.raf = requestAnimationFrame(this.loopFn); this.frame(t); }; this.raf = requestAnimationFrame(this.loopFn);
    const first = () => { unlock(); startMusic('menu'); window.removeEventListener('pointerdown', first); }; window.addEventListener('pointerdown', first);
  }

  // ------------------------------------------------------------------ palco 3D
  setupStage() {
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.setClearColor(0x000000, 0); this.el.appendChild(r.domElement);
    const s = this.scene = new THREE.Scene();
    s.add(new THREE.HemisphereLight(0xeaf6ff, 0xb5a27a, 1.25));
    const sun = new THREE.DirectionalLight(0xfff2d8, 2.1); sun.position.set(-4, 8, 6); s.add(sun);
    this.camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 200);
    // chão com gramado, caminho e palco redondo
    const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshToonMaterial({ color: 0x5fd36a })); ground.rotation.x = -Math.PI / 2; s.add(ground);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 40), new THREE.MeshToonMaterial({ color: 0xe9d29a })); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, -18); s.add(path);
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.24, 40), new THREE.MeshToonMaterial({ color: 0xffd23f })); stage.position.y = 0.12; s.add(stage);
    const stage2 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.07, 8, 40), new THREE.MeshToonMaterial({ color: 0xff8a1f })); stage2.rotation.x = Math.PI / 2; stage2.position.y = 0.24; s.add(stage2);
    this.stage = new THREE.Group(); this.stage.add(stage, stage2); s.add(this.stage);
    // cenário em volta
    const R = rng('front');
    const put = (key, x, z, sc = 1, ry = 0) => { const o = lowDetail(() => SCENERY[key](R)); o.position.set(x, 0, z); o.scale.setScalar(sc); o.rotation.y = ry; s.add(o); return o; };
    put('house', -9, -9, 1, 0.5); put('house', 8, -12, 1, -0.4); put('tree', -5, -6, 1.1); put('tree', 5.5, -5, 1.2); put('tree', -11, -3, 1.3); put('bush', -3.4, -2.5, 0.9); put('bush', 3.6, -2.2, 0.8); put('flowers', 2.6, 1.5, 0.6); put('flowers', -2.8, 1.2, 0.55);
    for (let i = 0; i < 6; i++) { const c = put('cloud', -30 + i * 12, -46 - (i % 2) * 6, 0.75); c.position.y = 15 + (i % 3) * 3; }
    this.truck = buildFireTruck(); this.truck.scale.setScalar(0.62); this.truck.position.set(4.6, 0, -3.6); this.truck.rotation.y = -0.7; s.add(this.truck);
    this.dog = buildDog('bolota'); this.dog.scale.setScalar(1.1); this.dog.position.set(1.75, 0, 0.7); this.dog.rotation.y = Math.PI - 0.5; s.add(this.dog);
    const dsh = blobShadow(1.1, 1.4); dsh.position.set(1.75, 0.02, 0.7); s.add(dsh);
    this.shadow = blobShadow(1.1, 1.1); this.shadow.position.y = 0.25; s.add(this.shadow);
    this.rebuildKid();
    // girar o personagem arrastando o dedo (na personalização)
    let drag = null;
    r.domElement.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: this.yaw }; });
    window.addEventListener('pointermove', (e) => { if (!drag || this.screen !== 'editor') return; this.yaw = drag.y + (e.clientX - drag.x) * 0.012; this.yawV = 0; this.touched = true; });
    window.addEventListener('pointerup', () => { drag = null; });
  }
  rebuildKid() {
    if (this.kid) this.scene.remove(this.kid);
    this.kid = buildKid(load().look, { noHat: this.screen === 'editor' && (this.tab === 'hair' || this.tab === 'hairColor') }); this.kid.scale.setScalar(1.45); this.kid.position.y = 0.24; this.scene.add(this.kid);
    this.cheer = 0.9;
  }
  resize() {
    const w = this.el.clientWidth || window.innerWidth, h = this.el.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.t = (this.t || 0) + dt;
    if (this.game || this.el.style.display === 'none') return;
    const t = this.t, ed = this.screen === 'editor', shop = this.screen === 'shop';
    // enquadramento: na tela inicial o personagem fica à direita; na personalização, grande à esquerda
    const target = ed ? { x: 2.45, y: 1.25, z: 5.2, lx: 2.45, ly: 1.15 } : shop ? { x: 0, y: 1.6, z: 9.5, lx: 0, ly: 1.0 } : { x: -2.0, y: 1.55, z: 7.6, lx: -2.0, ly: 1.15 };
    this.cam = this.cam || { ...target };
    for (const k of Object.keys(target)) this.cam[k] += (target[k] - this.cam[k]) * Math.min(1, dt * 4);
    this.camera.position.set(this.cam.x, this.cam.y, this.cam.z); this.camera.lookAt(this.cam.lx, this.cam.ly, 0);
    // personagem: parado, acenando de vez em quando; gira quando a criança arrasta
    if (!ed) { this.yaw += (0 - this.yaw) * Math.min(1, dt * 3); }
    else if (!this.touched) this.yaw = Math.sin(t * 0.6) * 0.5;
    this.kid.rotation.y = Math.PI + this.yaw;
    if (this.cheer > 0) this.cheer -= dt;
    const st = this.cheer > 0 || (!ed && (t % 7) < 1.2) ? 'cheer' : 'idle';
    poseKid(this.kid, st, 0, t, {});
    this.kid.position.y = 0.24 + (st === 'cheer' ? 0 : 0);
    animCreature(this.dog, t, { wag: 9, wagAmp: 0.5, lift: (t % 5) < 0.6 ? Math.abs(Math.sin(t * 10)) * 0.3 : 0 });
    const lt = this.truck.userData.lights; if (lt) lt.forEach((l, i) => { l.visible = Math.floor(t * 4) % 2 === i; });
    this.renderer.render(this.scene, this.camera);
  }

  // ------------------------------------------------------------------ telas
  mkBtn(parent, cls, html, fn) {
    const b = document.createElement('div'); b.className = 'b ' + cls; b.innerHTML = html; parent.appendChild(b);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); unlock(); b.classList.add('dn'); sfx.tap && sfx.tap(); fn(e, b); });
    b.addEventListener('pointerup', () => b.classList.remove('dn')); b.addEventListener('pointerleave', () => b.classList.remove('dn'));
    return b;
  }
  scr(name) { const d = document.createElement('div'); d.className = 'scr ' + name; this.el.appendChild(d); return d; }
  show(name) {
    const was = this.screen; this.screen = name; this.touched = false;
    if (was !== name && (was === 'editor' || name === 'editor')) this.rebuildKid();
    this.el.querySelectorAll('.scr').forEach((d) => d.classList.toggle('on', d.classList.contains(name)));
    if (name === 'home') this.refreshHome();
    if (name === 'editor') this.refreshEditor();
    if (name === 'shop') this.refreshShop();
  }

  buildHome() {
    const d = this.homeEl = this.scr('home');
    d.innerHTML = `<div class="title">Ian e<br>Seus Amigos<small>corrida de resgate</small></div>`;
    const modes = document.createElement('div'); modes.className = 'modes'; d.appendChild(modes);
    this.modeBtns = Object.values(MODES3).map((m, i) => this.mkBtn(modes, 'mode', `<i>${'⭐'.repeat(i + 1)}</i>${m.label}`, () => { save({ mode: m.id }); speak(m.label); this.refreshHome(); }));
    const phs = document.createElement('div'); phs.className = 'phases'; d.appendChild(phs);
    this.phaseBtns = PHASES3.map((p, i) => this.mkBtn(phs, 'ph', `${PHASE_ICON[i]}<b>${p.id}</b>`, () => { save({ phase: p.id }); speak('Fase ' + p.id + '. ' + p.name); this.refreshHome(); }));
    this.mkBtn(d, 'play', PLAY_SVG, () => this.startGame());
    const side = document.createElement('div'); side.className = 'side'; d.appendChild(side);
    this.mkBtn(side, 'sbtn', '🧒<span>Personagem</span>', () => { speak('Monte o seu personagem!'); this.show('editor'); });
    this.mkBtn(side, 'sbtn shop', '🛍️<span>Lojinha</span>', () => { speak('Lojinha de poderes!'); this.show('shop'); });
    this.coinsEl = document.createElement('div'); this.coinsEl.className = 'coins'; d.appendChild(this.coinsEl);
    this.sndBtn = this.mkBtn(d, 'snd', '🔊', () => { const on = !load().sound; save({ sound: on }); if (on) startMusic('menu'); else stopMusic(); this.refreshHome(); });
  }
  refreshHome() {
    const s = load();
    this.modeBtns.forEach((b, i) => b.classList.toggle('sel', Object.keys(MODES3)[i] === s.mode));
    this.phaseBtns.forEach((b, i) => b.classList.toggle('sel', PHASES3[i].id === (s.phase || 1)));
    this.coinsEl.innerHTML = `⭐ ${s.coins || 0}`; this.sndBtn.innerHTML = s.sound ? '🔊' : '🔇';
  }

  // ---- personalização ----
  tabsDef() {
    const L = () => load().look;
    return [
      { id: 'outfit', icon: '👕', name: 'Roupa', items: OUTFITS.map((o, i) => ({ v: i, icon: OUTFIT_ICON[i], label: o.name })), key: 'outfit' },
      { id: 'skin', icon: '🎨', name: 'Pele', items: SKINS.map((c, i) => ({ v: i, color: c })), key: 'skin' },
      { id: 'face', icon: '🙂', name: 'Rosto', items: FACES.map((f, i) => ({ v: i, icon: ['⚪', '🥚', '🟧'][i], label: f })), key: 'face' },
      { id: 'hair', icon: '💇', name: 'Cabelo', items: HAIR_STYLES3.map((h, i) => ({ v: i, icon: ['💈', '👱', '〰️', '➰', '☁️', '🐴', '🥨', '🍡', '🦔', '🔘'][i], label: h })), key: 'hair' },
      { id: 'hairColor', icon: '🖍️', name: 'Cor do cabelo', items: HAIR_COLORS.map((c, i) => ({ v: i, color: c })), key: 'hairColor' },
      { id: 'eyes', icon: '👀', name: 'Olhos', items: EYE_COLORS.map((c, i) => ({ v: i, color: c, eye: true })), key: 'eyes' },
      { id: 'acc', icon: '🎀', name: 'Acessório', items: ACCESSORIES.map((a, i) => ({ v: i, icon: ACC_ICON[i], label: a })), key: 'acc' },
      { id: 'extra', icon: '✨', name: 'Detalhes', items: [{ v: 'fr0', icon: '😶', label: 'Sem sardas', key: 'freckles', val: 0 }, { v: 'fr1', icon: '😊', label: 'Sardinhas', key: 'freckles', val: 1 }, { v: 'br0', icon: '🙂', label: 'Sobrancelha fina', key: 'brows', val: 0 }, { v: 'br1', icon: '🤨', label: 'Sobrancelha grossa', key: 'brows', val: 1 }] },
    ].map((t) => ({ ...t, cur: L }));
  }
  buildEditor() {
    const d = this.scr('editor');
    this.mkBtn(d, 'back', '⬅', () => this.show('home'));
    const panel = document.createElement('div'); panel.className = 'panel'; d.appendChild(panel);
    this.tabsEl = document.createElement('div'); this.tabsEl.className = 'tabs'; panel.appendChild(this.tabsEl);
    this.tabName = document.createElement('div'); this.tabName.className = 'tabname'; panel.appendChild(this.tabName);
    this.optsEl = document.createElement('div'); this.optsEl.className = 'opts'; panel.appendChild(this.optsEl);
    this.tabBtns = this.tabsDef().map((t) => { const b = this.mkBtn(this.tabsEl, 'tab', t.icon, () => { this.tab = t.id; speak(t.name); this.rebuildKid(); this.refreshEditor(); }); b.dataset.tab = t.id; return b; });
    const eb = document.createElement('div'); eb.className = 'ebtns'; d.appendChild(eb);
    this.mkBtn(eb, 'dice', '🎲', () => this.randomLook());
    this.mkBtn(eb, 'ok', '✔', () => { speak('Ficou lindo!'); this.show('home'); });
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = '👆 ↔'; d.appendChild(h);
  }
  setLook(patch) { const look = { ...load().look, ...patch }; save({ look }); this.rebuildKid(); this.refreshEditor(); }
  randomLook() {
    const r = () => Math.random();
    this.setLook({ skin: Math.floor(r() * SKINS.length), face: Math.floor(r() * 3), hair: Math.floor(r() * HAIR_STYLES3.length), hairColor: Math.floor(r() * HAIR_COLORS.length), eyes: Math.floor(r() * EYE_COLORS.length), outfit: Math.floor(r() * OUTFITS.length), acc: Math.floor(r() * ACCESSORIES.length), freckles: r() < 0.3 ? 1 : 0, brows: r() < 0.3 ? 1 : 0 });
    sfx.star();
  }
  refreshEditor() {
    const look = load().look, defs = this.tabsDef(), t = defs.find((x) => x.id === this.tab) || defs[0];
    this.tabBtns.forEach((b) => b.classList.toggle('sel', b.dataset.tab === t.id));
    this.tabName.textContent = t.name; this.optsEl.innerHTML = '';
    t.items.forEach((it) => {
      const key = it.key || t.key, val = it.val ?? it.v, sel = (look[key] ?? 0) === val;
      let html, cls = 'opt';
      if (it.color !== undefined) html = it.eye ? `<div style="width:62%;height:62%;border-radius:50%;background:radial-gradient(circle at 50% 50%,#0d0b0a 0 28%,${hexs(it.color)} 30% 62%,#fff 64%)"></div>` : `<div style="width:76%;height:76%;border-radius:50%;background:${hexs(it.color)};box-shadow:inset 0 -6px 0 rgba(0,0,0,.15)"></div>`;
      else { html = `${it.icon}<span>${it.label || ''}</span>`; cls += ' card'; }
      const b = this.mkBtn(this.optsEl, cls + (sel ? ' sel' : ''), html, () => { this.setLook({ [key]: val }); if (it.label) speak(it.label); });
      b.dataset.key = key; b.dataset.val = val;
    });
  }

  // ---- lojinha ----
  buildShop() {
    const d = this.scr('shop');
    this.mkBtn(d, 'back', '⬅', () => this.show('home'));
    const ti = document.createElement('div'); ti.className = 'stitle'; ti.textContent = 'Lojinha'; d.appendChild(ti);
    this.shopCoins = document.createElement('div'); this.shopCoins.className = 'coins'; d.appendChild(this.shopCoins);
    this.shopGrid = document.createElement('div'); this.shopGrid.className = 'grid'; d.appendChild(this.shopGrid);
  }
  refreshShop() {
    const s = load(); this.shopCoins.innerHTML = `⭐ ${s.coins || 0}`; this.shopGrid.innerHTML = '';
    SHOP.forEach((it) => {
      const c = document.createElement('div'); c.className = 'card2'; c.dataset.key = it.key;
      const own = (s.inv || {})[it.key] || 0, can = (s.coins || 0) >= it.price;
      c.innerHTML = `<div class="ic">${POWER_ICON[it.key]}</div><div class="nm">${it.name}</div>${own ? `<div class="own">${own}</div>` : ''}`;
      this.mkBtn(c, 'buy' + (can ? '' : ' no'), `⭐ ${it.price}`, () => this.buy(it));
      this.shopGrid.appendChild(c);
    });
  }
  buy(it) {
    const s = load();
    if ((s.coins || 0) < it.price) { sfx.hit(); speak('Faltam estrelas! Corra mais para juntar.'); return false; }
    const inv = { ...(s.inv || {}) }; inv[it.key] = (inv[it.key] || 0) + 1;
    save({ coins: s.coins - it.price, inv }); sfx.win(); speak(it.name + '! Use durante a corrida.'); this.cheer = 1.4;
    const p = document.createElement('div'); p.className = 'pop'; p.textContent = POWER_ICON[it.key]; this.el.appendChild(p); setTimeout(() => p.remove(), 1000);
    this.refreshShop(); return true;
  }

  // ------------------------------------------------------------------ jogo
  startGame(o = {}) {
    const s = load(); unlock();
    if (this.game) { this.game.destroy(); this.game = null; }
    this.el.style.display = 'none'; stopMusic();
    const mode = o.mode || s.mode || 'facil', phase = o.phase || s.phase || 1;
    this.lastStart = { mode, phase };
    this.game = new Game3D({ root: document.body, mode, phase, seed: o.seed, manual: o.manual, look: s.look, onExit: (d) => this.onGameExit(d) });
    return this.game;
  }
  onGameExit(d = {}) {
    this.game = null;
    if (d.action === 'again') { this.startGame(this.lastStart || {}); return; }
    this.el.style.display = ''; this.resize(); startMusic('menu');
    this.show(d.action === 'shop' ? 'shop' : 'home');
  }
  toHome() { if (this.game) { this.game.destroy(); this.game = null; } this.el.style.display = ''; this.show('home'); }
}

export function startApp() {
  const app = new FrontApp();
  // ponte de compatibilidade para os testes automáticos (mesma interface usada antes com o Phaser)
  const scene = {
    isActive: (n) => (n === 'Menu' ? !app.game && app.screen === 'home' && app.el.style.display !== 'none' : n === 'Game3D' ? !!app.game : n === 'Character' ? app.screen === 'editor' : false),
    start: (n, d = {}) => { if (n === 'Game3D') app.startGame(d); else if (n === 'Character') { app.toHome(); app.show('editor'); } else app.toHome(); },
    stop: () => {},
  };
  window.__ian = { app, game: { scene } };
  return app;
}
