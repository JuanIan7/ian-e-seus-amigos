// Interface do jogo 3D em HTML: botões grandes com multitoque, ícones que dispensam leitura, faixa de fase e pausa.
const css = `
.g3{position:fixed;inset:0;overflow:hidden;background:#8fd3ff;touch-action:none;-webkit-user-select:none;user-select:none;font-family:'Arial Black',Arial,sans-serif}
.g3 canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.g3 .ui{position:absolute;inset:0;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.g3 .btn{position:absolute;pointer-events:auto;border-radius:50%;border:5px solid #1b2a49;display:flex;align-items:center;justify-content:center;box-shadow:0 7px 0 rgba(27,42,73,.55),inset 0 8px 0 rgba(255,255,255,.28);touch-action:none;transition:transform .06s;cursor:pointer}
.g3 .btn svg{width:56%;height:56%;pointer-events:none;filter:drop-shadow(0 3px 0 rgba(0,0,0,.25))}
.g3 .btn.on{transform:translateY(5px) scale(.95);box-shadow:0 2px 0 rgba(27,42,73,.55),inset 0 6px 0 rgba(255,255,255,.2)}
.g3 .btn.off{opacity:.38;filter:grayscale(.6)}
.g3 .btn.pulse{animation:g3pulse .7s ease-in-out infinite}
@keyframes g3pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.13)}}
.g3 .jump{background:#3ecb6b;width:min(30vh,150px);height:min(30vh,150px);right:calc(env(safe-area-inset-right) + 3vw);bottom:calc(env(safe-area-inset-bottom) + 4vh)}
.g3 .act{background:#ff8a1f;width:min(24vh,120px);height:min(24vh,120px);right:calc(env(safe-area-inset-right) + 3vw + min(32vh,160px));bottom:calc(env(safe-area-inset-bottom) + 3vh)}
.g3 .run{background:#9b5cff;width:min(20vh,100px);height:min(20vh,100px);right:calc(env(safe-area-inset-right) + 3vw + min(3vh,12px));bottom:calc(env(safe-area-inset-bottom) + 4vh + min(32vh,160px))}
.g3 .lane{background:#2f9bff;width:min(24vh,118px);height:min(24vh,118px);bottom:calc(env(safe-area-inset-bottom) + 4vh)}
.g3 .lane.l{left:calc(env(safe-area-inset-left) + 3vw)}
.g3 .lane.r{left:calc(env(safe-area-inset-left) + 3vw + min(28vh,138px))}
.g3 .pause{background:#2f9bff;width:min(11vh,56px);height:min(11vh,56px);right:calc(env(safe-area-inset-right) + 2vw);top:calc(env(safe-area-inset-top) + 2vh);border-width:4px}
.g3 .chip{position:absolute;left:calc(env(safe-area-inset-left) + 2.2vw);top:calc(env(safe-area-inset-top) + 2vh);display:flex;align-items:center;gap:10px;color:#fff;font-size:min(8vh,46px);text-shadow:0 3px 0 #1b2a49,3px 0 0 #1b2a49,-3px 0 0 #1b2a49,0 -3px 0 #1b2a49;pointer-events:none}
.g3 .chip svg{width:min(8vh,44px);height:min(8vh,44px);filter:drop-shadow(0 3px 0 #1b2a49)}
.g3 .bar{position:absolute;left:calc(env(safe-area-inset-left) + 2.2vw);top:calc(env(safe-area-inset-top) + 2vh + min(10vh,56px));width:min(26vw,170px);height:min(3.2vh,18px);border-radius:12px;background:rgba(0,0,0,.35);border:3px solid #1b2a49;overflow:hidden}
.g3 .bar i{display:block;height:100%;width:0;background:#ffd23f;border-radius:10px;transition:width .15s}
.g3 .power{position:absolute;left:calc(env(safe-area-inset-left) + 2.2vw);top:calc(env(safe-area-inset-top) + 2vh + min(16vh,92px));display:none;align-items:center;gap:8px;padding:4px 12px 4px 6px;border-radius:30px;background:rgba(27,42,73,.75);border:3px solid #fff}
.g3 .power b{font-size:min(7vh,38px);font-weight:400}
.g3 .power i{display:block;width:min(16vw,110px);height:min(2.6vh,14px);background:rgba(255,255,255,.3);border-radius:8px;overflow:hidden}
.g3 .power i u{display:block;height:100%;background:#fff;border-radius:8px}
.g3 .dots{position:absolute;left:50%;top:calc(env(safe-area-inset-top) + 2vh);transform:translateX(-50%);display:flex;gap:min(1.4vh,9px);align-items:center;pointer-events:none}
.g3 .dots span{width:min(3.4vh,20px);height:min(3.4vh,20px);border-radius:50%;background:rgba(255,255,255,.55);border:3px solid #1b2a49;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.g3 .dots span.done{background:#3ecb6b}.g3 .dots span.cur{background:#ffd23f;transform:scale(1.35)}
.g3 .dots em{font-style:normal;color:#fff;font-size:min(4vh,26px);text-shadow:0 2px 0 #1b2a49;margin-left:6px}
.g3 .banner{position:absolute;left:0;right:0;top:20%;text-align:center;color:#fff;pointer-events:none;opacity:0}
.g3 .banner h1{margin:0;font-size:min(22vh,130px);text-shadow:0 6px 0 #1b2a49,6px 0 0 #1b2a49,-6px 0 0 #1b2a49,0 -6px 0 #1b2a49}
.g3 .banner h2{margin:6px 0 0;font-size:min(8vh,48px);color:#ffd23f;text-shadow:0 4px 0 #1b2a49,4px 0 0 #1b2a49,-4px 0 0 #1b2a49,0 -4px 0 #1b2a49}
.g3 .banner.show{animation:g3ban 2.4s ease-out forwards}
@keyframes g3ban{0%{opacity:0;transform:scale(.6)}15%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:scale(1.05)}}
.g3 .toast{position:absolute;left:50%;top:14%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:6px 22px;border-radius:40px;background:rgba(27,42,73,.85);border:4px solid #ffd23f;color:#fff;font-size:min(5vh,30px);opacity:0;pointer-events:none;white-space:nowrap}
.g3 .toast.show{animation:g3toast 2.2s ease-out forwards}
.g3 .toast span{font-size:min(6.5vh,38px)}
@keyframes g3toast{0%{opacity:0;transform:translateX(-50%) scale(.6)}12%{opacity:1;transform:translateX(-50%) scale(1.05)}20%{transform:translateX(-50%) scale(1)}85%{opacity:1}100%{opacity:0}}
.g3 .hand{position:absolute;width:min(14vh,80px);height:min(14vh,80px);pointer-events:none;display:none;animation:g3hand .7s ease-in-out infinite;filter:drop-shadow(0 4px 0 rgba(0,0,0,.35))}
@keyframes g3hand{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.g3 .prog{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 3vh);transform:translateX(-50%);display:none;gap:10px;pointer-events:none}
.g3 .prog span{width:min(6vh,34px);height:min(6vh,34px);border-radius:50%;background:rgba(255,255,255,.4);border:4px solid #1b2a49}
.g3 .prog span.f{background:#4db8ff}
.g3 .equip{position:absolute;left:calc(env(safe-area-inset-left) + 2.2vw);top:calc(env(safe-area-inset-top) + 2vh + min(25vh,138px));display:flex;gap:6px;pointer-events:none}
.g3 .equip b{font-size:min(6vh,32px);font-weight:400;background:rgba(27,42,73,.7);border:3px solid #fff;border-radius:50%;width:min(8vh,44px);height:min(8vh,44px);display:flex;align-items:center;justify-content:center}
.g3 .quest{background:radial-gradient(circle at 35% 30%,#fff 0,#bfe8ff 45%,#6cc8ff 100%);width:min(20vh,100px);height:min(20vh,100px);right:calc(env(safe-area-inset-right) + 2vw);top:calc(env(safe-area-inset-top) + 2vh + min(14vh,70px));animation:g3float 1.4s ease-in-out infinite;display:none}
.g3 .quest svg{width:62%;height:62%}
@keyframes g3float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.07)}}
.g3 .veil{position:absolute;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;gap:5vw;pointer-events:auto}
.g3 .veil .btn{position:static;width:min(24vh,120px);height:min(24vh,120px)}
.g3 .veil .big{width:min(34vh,170px);height:min(34vh,170px);background:#3ecb6b}
`;

const svg = (body, vb = '0 0 100 100') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
export const ICONS = {
  up: svg('<path d="M50 8 L92 52 H66 V90 H34 V52 H8 Z" fill="#fff"/>'),
  left: svg('<path d="M8 50 L52 8 V34 H92 V66 H52 V92 Z" fill="#fff"/>'),
  right: svg('<path d="M92 50 L48 8 V34 H8 V66 H48 V92 Z" fill="#fff"/>'),
  run: svg('<path d="M50 6 L88 40 H66 L88 70 H64 V94 H36 V70 H12 L34 40 H12 Z" fill="#fff"/>'),
  drop: svg('<path d="M50 6 C50 6 18 44 18 64 A32 32 0 0 0 82 64 C82 44 50 6 50 6 Z" fill="#fff"/><path d="M34 66 A16 16 0 0 0 48 80" stroke="#7fd0ff" stroke-width="7" fill="none" stroke-linecap="round"/>'),
  hand: svg('<path d="M40 8 a8 8 0 0 1 16 0 V46 L70 42 a7 7 0 0 1 8 6 L80 60 C80 80 70 94 52 94 C36 94 28 84 20 66 L14 50 a7 7 0 0 1 12-6 L34 56 V18 a8 8 0 0 1 6-10 Z" fill="#fff" stroke="#1b2a49" stroke-width="5" stroke-linejoin="round"/>'),
  pause: svg('<rect x="22" y="14" width="19" height="72" rx="6" fill="#fff"/><rect x="59" y="14" width="19" height="72" rx="6" fill="#fff"/>'),
  play: svg('<path d="M26 12 L88 50 L26 88 Z" fill="#fff"/>'),
  home: svg('<path d="M50 10 L92 46 H80 V88 H58 V60 H42 V88 H20 V46 H8 Z" fill="#fff"/>'),
  sound: svg('<path d="M10 38 H30 L54 16 V84 L30 62 H10 Z" fill="#fff"/><path d="M66 34 A24 24 0 0 1 66 66 M76 20 A42 42 0 0 1 76 80" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>'),
  mute: svg('<path d="M10 38 H30 L54 16 V84 L30 62 H10 Z" fill="#fff"/><path d="M68 36 L92 64 M92 36 L68 64" stroke="#fff" stroke-width="9" stroke-linecap="round"/>'),
  star: svg('<path d="M50 6 L62 36 L94 38 L69 58 L77 90 L50 72 L23 90 L31 58 L6 38 L38 36 Z" fill="#ffd62e" stroke="#1b2a49" stroke-width="6" stroke-linejoin="round"/>'),
  hose: svg('<circle cx="46" cy="52" r="30" fill="none" stroke="#fff" stroke-width="14"/><circle cx="46" cy="52" r="14" fill="none" stroke="#fff" stroke-width="10"/><rect x="66" y="64" width="24" height="12" rx="4" fill="#ffd23f"/>'),
  bone: svg('<circle cx="20" cy="36" r="13" fill="#fff"/><circle cx="20" cy="64" r="13" fill="#fff"/><circle cx="80" cy="36" r="13" fill="#fff"/><circle cx="80" cy="64" r="13" fill="#fff"/><rect x="20" y="38" width="60" height="24" rx="8" fill="#fff"/>'),
  helpHand: svg('<path d="M50 52 C24 34 22 16 35 12 C43 10 50 16 50 22 C50 16 57 10 65 12 C78 16 76 34 50 52 Z" fill="#fff"/><path d="M8 70 H30 L50 82 H74 a7 7 0 0 1 0 14 H40 L8 86 Z" fill="#fff" stroke="#1b2a49" stroke-width="4" stroke-linejoin="round"/>'),
  box: svg('<rect x="14" y="40" width="72" height="50" rx="8" fill="#fff"/><rect x="10" y="30" width="80" height="18" rx="6" fill="#fff" stroke="#1b2a49" stroke-width="4"/><rect x="44" y="30" width="12" height="60" fill="#ffd23f"/><path d="M50 30 C30 4 16 16 30 28 Z M50 30 C70 4 84 16 70 28 Z" fill="#ffd23f" stroke="#1b2a49" stroke-width="3"/>'),
  basket: svg('<path d="M50 4 V38" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M14 44 H86 L74 90 H26 Z" fill="#fff" stroke="#1b2a49" stroke-width="4" stroke-linejoin="round"/><path d="M24 62 H76 M30 78 H70" stroke="#c2864a" stroke-width="5"/>'),
  egg: svg('<ellipse cx="50" cy="56" rx="30" ry="38" fill="#fff"/><circle cx="40" cy="42" r="6" fill="#6fcf6a"/><circle cx="60" cy="58" r="7" fill="#6fcf6a"/><circle cx="42" cy="72" r="5" fill="#6fcf6a"/>'),
  fruit: svg('<circle cx="50" cy="58" r="32" fill="#fff"/><path d="M50 28 C50 14 58 8 68 8 C68 20 60 28 50 28 Z" fill="#3ecb6b" stroke="#1b2a49" stroke-width="3"/>'),
  heart: svg('<path d="M50 90 C10 60 6 34 26 24 C40 18 50 28 50 36 C50 28 60 18 74 24 C94 34 90 60 50 90 Z" fill="#fff"/>'),
};

export function createHud(root, h) {
  const style = document.createElement('style'); style.textContent = css; root.appendChild(style);
  const ui = document.createElement('div'); ui.className = 'ui'; root.appendChild(ui);
  const mk = (cls, icon, down, up) => {
    const b = document.createElement('div'); b.className = 'btn ' + cls; b.innerHTML = icon; ui.appendChild(b);
    let held = false;
    const on = (e) => { e.preventDefault(); e.stopPropagation(); if (held) return; held = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (x) { /* ignora */ } down && down(); };
    const off = (e) => { e.preventDefault(); e.stopPropagation(); if (!held) return; held = false; b.classList.remove('on'); up && up(); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    return b;
  };
  const els = {};
  els.left = mk('lane l', ICONS.left, () => h.lane(-1));
  els.right = mk('lane r', ICONS.right, () => h.lane(1));
  els.jump = mk('jump', ICONS.up, () => h.jump(true), () => h.jump(false));
  els.act = mk('act', ICONS.drop, () => h.action());
  els.run = mk('run', ICONS.run, () => h.run(true), () => h.run(false));
  els.quest = mk('quest', ICONS.up, () => { const f = els.quest._tap; f && f(); });
  els.pause = mk('pause', ICONS.pause, () => h.pause());
  els.act.classList.add('off');

  const chip = document.createElement('div'); chip.className = 'chip'; chip.innerHTML = ICONS.star + '<span>0</span>'; ui.appendChild(chip);
  const bar = document.createElement('div'); bar.className = 'bar'; bar.innerHTML = '<i></i>'; ui.appendChild(bar);
  const power = document.createElement('div'); power.className = 'power'; power.innerHTML = '<b></b><i><u></u></i>'; ui.appendChild(power);
  const dots = document.createElement('div'); dots.className = 'dots'; ui.appendChild(dots);
  const banner = document.createElement('div'); banner.className = 'banner'; banner.innerHTML = '<h1></h1><h2></h2>'; ui.appendChild(banner);
  const toast = document.createElement('div'); toast.className = 'toast'; toast.innerHTML = '<span></span><div></div>'; ui.appendChild(toast);
  const hand = document.createElement('div'); hand.className = 'hand'; hand.innerHTML = ICONS.hand; ui.appendChild(hand);
  const equip = document.createElement('div'); equip.className = 'equip'; ui.appendChild(equip);
  const prog = document.createElement('div'); prog.className = 'prog'; ui.appendChild(prog);
  const veil = document.createElement('div'); veil.className = 'veil'; ui.appendChild(veil);

  // deslizar o dedo para os lados também muda de faixa
  let sx = null, sy = null, st = 0;
  root.addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('.btn')) return; sx = e.clientX; sy = e.clientY; st = performance.now(); });
  root.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2 && performance.now() - st < 600) h.lane(dx > 0 ? 1 : -1); sx = null; });

  let lastStars = -1, lastBar = -1, lastDots = '';
  const api = {
    els,
    setStars(n) { if (n !== lastStars) { lastStars = n; chip.lastChild.textContent = n; } },
    setBar(f) { const v = Math.round(f * 100); if (v !== lastBar) { lastBar = v; bar.firstChild.style.width = Math.max(6, v) + '%'; } },
    setDots(cur, total, loop) {
      const key = cur + '/' + total + '/' + loop; if (key === lastDots) return; lastDots = key;
      dots.innerHTML = Array.from({ length: total }, (_, i) => `<span class="${i < cur ? 'done' : i === cur ? 'cur' : ''}"></span>`).join('') + (loop > 0 ? `<em>×${loop + 1}</em>` : '');
    },
    banner(t, sub) { const h1 = banner.querySelector('h1'), h2 = banner.querySelector('h2'); h1.textContent = t; h2.textContent = sub || ''; banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show'); },
    toast(icon, text) { toast.firstChild.textContent = icon; toast.lastChild.textContent = text || ''; toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show'); },
    setAction(icon, enabled, pulse) {
      if (icon && els.act.dataset.icon !== icon) { els.act.dataset.icon = icon; els.act.innerHTML = ICONS[icon] || ICONS.drop; }
      els.act.classList.toggle('off', !enabled); els.act.classList.toggle('pulse', !!pulse && enabled);
    },
    setEquip(list) { const k = list.join(''); if (equip.dataset.k === k) return; equip.dataset.k = k; equip.innerHTML = list.map((e) => '<b>' + e + '</b>').join(''); },
    setProg(done, total) { if (total <= 0) { prog.style.display = 'none'; prog.dataset.k = ''; return; } const k = done + '/' + total; if (prog.dataset.k === k) return; prog.dataset.k = k; prog.style.display = 'flex'; prog.innerHTML = Array.from({ length: total }, (_, i) => '<span class="' + (i < done ? 'f' : '') + '"></span>').join(''); },
    quest(icon, on) { if (!icon) { els.quest.style.display = 'none'; els.quest._tap = null; return; } els.quest.innerHTML = icon; els.quest._tap = on; els.quest.style.display = 'flex'; },
    pulseJump(v) { els.jump.classList.toggle('pulse', !!v); },
    showRun(v) { els.run.style.display = v ? 'flex' : 'none'; },
    setRunActive(v) { els.run.classList.toggle('on', !!v); },
    power(emoji, frac, color) {
      if (!emoji) { power.style.display = 'none'; return; }
      power.style.display = 'flex'; power.firstChild.textContent = emoji; power.querySelector('u').style.width = Math.round(frac * 100) + '%'; power.querySelector('u').style.background = color || '#fff';
    },
    hand(btn, on) {
      if (!on) { hand.style.display = 'none'; return; }
      const r = btn.getBoundingClientRect(), rr = root.getBoundingClientRect();
      hand.style.display = 'block'; hand.style.left = (r.left - rr.left + r.width / 2 - hand.offsetWidth / 2) + 'px'; hand.style.top = (r.top - rr.top - hand.offsetHeight - 6) + 'px'; hand.style.transform = 'rotate(180deg)';
    },
    pauseUI(show, handlers, soundOn) {
      if (!show) { veil.style.display = 'none'; veil.innerHTML = ''; return; }
      veil.style.display = 'flex'; veil.innerHTML = '';
      const add = (cls, icon, fn) => { const b = document.createElement('div'); b.className = 'btn ' + cls; b.innerHTML = icon; b.style.background = cls.includes('big') ? '#3ecb6b' : '#2f9bff'; b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(b); }); veil.appendChild(b); return b; };
      add('', ICONS.home, handlers.home);
      add('big', ICONS.play, handlers.resume);
      add('', soundOn ? ICONS.sound : ICONS.mute, (b) => { const on = handlers.sound(); b.innerHTML = on ? ICONS.sound : ICONS.mute; });
    },
    destroy() { root.removeChild(style); root.removeChild(ui); },
  };
  return api;
}
