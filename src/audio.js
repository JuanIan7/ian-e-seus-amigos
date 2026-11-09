// Áudio 100% gerado por código (sem arquivos externos, sem licenças a registrar).
import { load } from './save.js';
import { VOICES } from './vozes-manifest.js';

let ctx = null, master = null, musicTimer = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; }
  return ctx;
}
export function unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }
const on = () => load().sound;

function tone(freq, dur, { type = 'sine', vol = 0.25, slide = 0, delay = 0 } = {}) {
  if (!on()) return;
  const c = ensure(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.2, hp = 1500) {
  if (!on()) return;
  const c = ensure(); if (!c) return;
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start();
}

export const sfx = {
  jump: () => tone(380, 0.22, { type: 'square', vol: 0.12, slide: 420 }),
  // estrela: "moedinha" bem audível por cima da música (duas notas fortes + brilho)
  star: () => { tone(988, 0.09, { type: 'square', vol: 0.3 }); tone(1319, 0.3, { type: 'square', vol: 0.32, delay: 0.08 }); tone(2637, 0.16, { vol: 0.14, delay: 0.1 }); },
  // estrelas valendo mais (corrida infinita): arpejo subindo
  mult: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.26, delay: i * 0.07 })),
  // clique/“pop” de fruta pega: estalo curto + nota subindo
  catch: () => { noise(0.05, 0.22, 3000); tone(700, 0.09, { type: 'triangle', vol: 0.25, slide: 500 }); tone(1500, 0.07, { vol: 0.12, delay: 0.05 }); },
  hit: () => tone(180, 0.28, { type: 'triangle', vol: 0.3, slide: -120 }),
  splash: () => noise(0.25, 0.18, 2200),
  hose: () => { tone(520, 0.12, { type: 'triangle' }); tone(780, 0.12, { type: 'triangle', delay: 0.1 }); tone(1040, 0.2, { type: 'triangle', delay: 0.2 }); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.22, delay: i * 0.11 })),
  bark: () => { tone(330, 0.1, { type: 'sawtooth', vol: 0.1, slide: -140 }); tone(300, 0.12, { type: 'sawtooth', vol: 0.1, slide: -140, delay: 0.15 }); },
  tap: () => tone(600, 0.08, { type: 'triangle', vol: 0.15 }),
};

// ---------------------------------------------------------------------------------------------
// Música: uma trilha própria para cada fase, sintetizada na hora (sem arquivos, sem licenças).
// Cada trilha tem andamento, escala, melodia, baixo, timbre e percussão diferentes; ao mudar de fase a música muda junto.
// Notação: números = semitons a partir da tônica; null = pausa. 16 passos por compasso (semicolcheias agrupadas de 2 em 2).
// ---------------------------------------------------------------------------------------------
const N = null;
export const TRACKS = {
  menu:     { bpm: 104, root: 60, lead: 'triangle', vol: 0.06, bassWave: 'sine', swing: 0, perc: 'soft',
    mel: [0, N, 4, N, 7, N, 4, N, 9, N, 7, N, 4, N, 2, N, 0, N, 4, N, 7, N, 12, N, 11, N, 9, N, 7, N, N, N],
    bass: [0, 0, 5, 5, 7, 7, 0, 0], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]] },
  bairro:   { bpm: 132, root: 60, lead: 'square', vol: 0.045, bassWave: 'triangle', swing: 0, perc: 'march',            // marchinha de bombeiro, alegre
    mel: [0, 4, 7, 12, 7, 4, 7, N, 5, 9, 12, 9, 7, N, N, N, 4, 7, 12, 16, 14, 12, 11, 12, 7, N, 4, N, 0, N, N, N],
    bass: [0, 7, 5, 7, 0, 7, 5, 0], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]] },
  praca:    { bpm: 118, root: 65, lead: 'triangle', vol: 0.06, bassWave: 'sine', swing: 0.18, perc: 'claps',            // balanço de pracinha
    mel: [7, N, 9, 7, 4, N, 2, N, 4, 7, N, 9, 12, N, N, N, 9, N, 7, 4, 2, N, 4, N, 7, N, 4, 2, 0, N, N, N],
    bass: [0, 0, 7, 7, 5, 5, 7, 0], chords: [[0, 4, 7], [7, 11, 14], [5, 9, 12], [0, 4, 7]] },
  floresta: { bpm: 100, root: 62, lead: 'flute', vol: 0.07, bassWave: 'sine', swing: 0.1, perc: 'wood',                  // flauta da mata (modo dórico)
    mel: [0, N, 3, 5, 7, N, 10, N, 9, N, 7, 5, 3, N, N, N, 5, N, 7, 10, 12, N, 10, 9, 7, N, 5, N, 3, N, 2, N],
    bass: [0, 0, 10, 10, 5, 5, 7, 7], chords: [[0, 3, 7], [10, 14, 17], [5, 9, 12], [7, 10, 14]] },
  altura:   { bpm: 140, root: 67, lead: 'pluck', vol: 0.06, bassWave: 'triangle', swing: 0, perc: 'drive',              // arpejos lá no alto
    mel: [0, 7, 12, 7, 4, 7, 12, 7, 2, 9, 14, 9, 5, 9, 14, 9, 0, 7, 12, 7, 4, 7, 12, 16, 14, 12, 11, 9, 7, N, N, N],
    bass: [0, 0, 2, 2, 5, 5, 7, 7], chords: [[0, 4, 7], [2, 5, 9], [5, 9, 12], [7, 11, 14]] },
  pre:      { bpm: 96, root: 57, lead: 'marimba', vol: 0.08, bassWave: 'sine', swing: 0.12, perc: 'tribal',             // tambores pré-históricos e marimba
    mel: [0, N, 3, N, 5, 7, N, 5, 3, N, 0, N, N, N, N, N, 7, N, 10, N, 12, 10, N, 7, 5, N, 3, N, 0, N, N, N],
    bass: [0, 0, 0, 3, 5, 5, 7, 3], chords: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [7, 10, 14]] },
  agua:     { bpm: 112, root: 63, lead: 'steel', vol: 0.07, bassWave: 'sine', swing: 0.2, perc: 'shaker',               // tambor de aço, clima de praia
    mel: [0, 4, 7, N, 9, 7, 4, N, 2, 5, 9, N, 7, N, N, N, 4, 7, 11, N, 12, 11, 9, 7, 4, N, 2, N, 0, N, N, N],
    bass: [0, 7, 5, 9, 7, 2, 0, 7], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 9]] },
  vulcao:   { bpm: 126, root: 62, lead: 'square', vol: 0.04, bassWave: 'sawtooth', swing: 0, perc: 'boom',              // aventura no vulcão (menor harmônico, sem susto)
    mel: [0, N, 3, 7, 8, N, 7, N, 3, N, 2, 3, 7, N, N, N, 0, N, 3, 7, 11, N, 12, N, 8, 7, 3, N, 2, N, 0, N],
    bass: [0, 0, 8, 8, 5, 5, 7, 7], chords: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 11, 14]] },
};
let curTrack = null, nextAt = 0, stepN = 0;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function voice(freq, t, dur, kind, vol) {
  const c = ctx; if (!c) return;
  const o = c.createOscillator(), g = c.createGain(); let o2 = null;
  const wave = kind === 'flute' || kind === 'marimba' || kind === 'steel' ? 'sine' : kind === 'pluck' ? 'triangle' : kind;
  o.type = wave; o.frequency.setValueAtTime(freq, t);
  if (kind === 'flute') { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.value = freq * 0.012; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.1); }
  if (kind === 'steel' || kind === 'marimba') { o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(freq * (kind === 'steel' ? 2.01 : 4), t); const g2 = c.createGain(); g2.gain.setValueAtTime(vol * 0.35, t); g2.gain.exponentialRampToValueAtTime(0.0008, t + dur * 0.5); o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + dur + 0.05); }
  const att = kind === 'flute' ? 0.04 : 0.008, rel = kind === 'marimba' || kind === 'pluck' || kind === 'steel' ? dur * 0.9 : dur;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0008, t + rel);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function drum(t, type, vol = 1) {
  const c = ctx; if (!c) return;
  if (type === 'kick' || type === 'tom' || type === 'boom') {
    const o = c.createOscillator(), g = c.createGain(); const f0 = type === 'kick' ? 120 : type === 'boom' ? 90 : 180;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(type === 'tom' ? 90 : 42, t + 0.18);
    g.gain.setValueAtTime(0.22 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25); return;
  }
  // ruído: chimbal, palmas, chocalho, bloco de madeira
  const dur = type === 'clap' ? 0.12 : type === 'wood' ? 0.05 : 0.05;
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, type === 'clap' ? 2 : 3);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  f.type = type === 'wood' ? 'bandpass' : 'highpass'; f.frequency.value = type === 'wood' ? 1600 : type === 'clap' ? 1200 : type === 'shaker' ? 5000 : 7000; if (type === 'wood') f.Q.value = 8;
  g.gain.value = (type === 'clap' ? 0.12 : type === 'wood' ? 0.35 : 0.05) * vol;
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start(t);
}
const PERC = {
  soft:   (i) => [i % 8 === 0 && 'kick', i % 4 === 2 && ['hat', 0.5]],
  march:  (i) => [i % 4 === 0 && 'kick', i % 8 === 4 && 'clap', i % 2 === 1 && ['hat', 0.7]],
  claps:  (i) => [i % 8 === 0 && 'kick', i % 8 === 4 && 'clap', i % 4 === 2 && ['hat', 0.8]],
  wood:   (i) => [i % 8 === 0 && ['kick', 0.7], (i % 8 === 3 || i % 8 === 6) && 'wood'],
  drive:  (i) => [i % 4 === 0 && 'kick', i % 8 === 4 && 'clap', 'hat'],
  tribal: (i) => [i % 8 === 0 && 'boom', (i % 8 === 3 || i % 8 === 5) && 'tom', i % 16 === 14 && 'tom'],
  shaker: (i) => [i % 8 === 0 && 'kick', i % 8 === 6 && ['kick', 0.6], 'shaker'],
  boom:   (i) => [i % 4 === 0 && 'boom', i % 8 === 4 && 'clap', i % 2 === 1 && ['hat', 0.6]],
};
function schedule() {
  if (!ctx || !curTrack) return;
  const T = TRACKS[curTrack], stepDur = 60 / T.bpm / 2;               // colcheias
  if (nextAt < ctx.currentTime - 0.2) nextAt = ctx.currentTime + 0.05;   // depois de uma travada ou volta do segundo plano: retoma, sem tocar as notas perdidas de uma vez
  while (nextAt < ctx.currentTime + 0.25) {
    const i = stepN, t = nextAt + (i % 2 ? T.swing * stepDur : 0);
    if (on()) {
      const m = T.mel[i % T.mel.length];
      if (m !== null && m !== undefined) voice(mtof(T.root + 12 + m), t, stepDur * (T.lead === 'flute' ? 1.8 : 1.4), T.lead, T.vol);
      const bar = Math.floor(i / 4) % T.bass.length;
      if (i % 4 === 0) voice(mtof(T.root - 12 + T.bass[bar]), t, stepDur * 3.2, T.bassWave, T.bassWave === 'sawtooth' ? 0.035 : 0.09);
      if (i % 16 === 0) { const ch = T.chords[Math.floor(i / 16) % T.chords.length]; ch.forEach((n, k) => voice(mtof(T.root + n), t + k * 0.012, stepDur * 7, 'sine', 0.022)); }
      PERC[T.perc](i % 16).forEach((x) => { if (x) { const [k, v] = Array.isArray(x) ? x : [x, 1]; drum(t, k, v); } });
    }
    nextAt += stepDur; stepN++;
  }
}
/** começa (ou troca) a música; name = tema da fase ou 'menu' */
export function startMusic(name = 'menu') {
  const c = ensure(); if (!c) return;
  if (!TRACKS[name]) name = 'menu';
  if (musicTimer && curTrack === name) return;
  stopMusic(); curTrack = name; nextAt = c.currentTime + 0.12; stepN = 0;
  musicTimer = setInterval(schedule, 60); schedule();
}
export function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } curTrack = null; }
// app em segundo plano: a música (do menu ou do jogo) para e volta sozinha ao retornar
let pausedTrack = null;
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (curTrack) pausedTrack = curTrack; stopMusic(); silenceVoice(); }
  else if (pausedTrack) { const t = pausedTrack; pausedTrack = null; if (!window.__ian3) { unlock(); startMusic(t); } }   // dentro do jogo a partida volta pausada: a música só retoma no botão de continuar
});
export function currentTrack() { return curTrack; }

// ---------------------------------------------------------------------------------------------
// Falas: gravadas com voz natural (arquivos em vozes/, manifesto em src/vozes-manifest.js, gerados por
// scripts/vozes/gerar-vozes.py). Voz feminina (a mãe) para o dia a dia e para ajudar bichinhos; voz masculina
// (o pai) para salvar pessoas, apagar fogo e para a frase final do modo história. Se a frase ainda não tiver
// gravação, cai na voz do sistema (speechSynthesis) com o tom certo.
// ---------------------------------------------------------------------------------------------
const voiceBuf = {}, voicePending = {}, voiceEls = {};
let voiceSrc = null, voiceEl = null, voiceSeq = 0;
const voiceUrl = (f) => new URL('vozes/' + f, document.baseURI).href;
const norm = (t) => String(t).replace(/\s+/g, ' ').trim();
// caminho 1 (principal): elemento <audio> nativo. Toca .m4a no iOS, Android e navegadores sem decodificar nada.
function voiceElement(f) {
  let a = voiceEls[f];
  if (!a) { a = new Audio(voiceUrl(f)); a.preload = 'auto'; a.setAttribute('playsinline', ''); voiceEls[f] = a; try { a.load(); } catch (e) {} }
  return a;
}
// caminho 2 (reserva): Web Audio com o arquivo decodificado
function loadVoice(f) {
  if (voiceBuf[f]) return Promise.resolve(voiceBuf[f]);
  if (voicePending[f]) return voicePending[f];
  const c = ensure(); if (!c) return Promise.resolve(null);
  // no iOS (Capacitor) a resposta de arquivos de mídia vem sem status HTTP: não exigir r.ok, só conteúdo
  voicePending[f] = fetch(voiceUrl(f)).then((r) => r.arrayBuffer()).then((ab) => (ab && ab.byteLength > 0 ? ab : Promise.reject(new Error('vazio'))))
    .then((ab) => new Promise((res, rej) => c.decodeAudioData(ab, res, rej)))
    .then((b) => { voiceBuf[f] = b; return b; }).catch(() => { voiceBuf[f] = false; return null; })
    .finally(() => { delete voicePending[f]; });
  return voicePending[f];
}
/** pré-carrega as falas (chamado ao começar a partida: evita atraso na primeira frase) */
export function preloadVoices(texts) { texts.forEach((t) => { const e = VOICES[norm(t)]; if (e) voiceElement(e.f); }); }
function stopVoiceFile() {
  if (voiceSrc) { try { voiceSrc.stop(); } catch (e) {} voiceSrc = null; }
  if (voiceEl) { try { voiceEl.pause(); voiceEl.currentTime = 0; } catch (e) {} voiceEl = null; }
}
function playVoiceBuffer(b) {
  const c = ensure(); if (!c || !b) return false;
  stopVoiceFile(); const src = c.createBufferSource(), g = c.createGain(); g.gain.value = 1.0;
  src.buffer = b; src.connect(g); g.connect(master); src.start(); voiceSrc = src; src.onended = () => { if (voiceSrc === src) voiceSrc = null; };
  return true;
}
/** toca pelo elemento <audio>; onFail é chamado se o aparelho não conseguir tocar o arquivo */
function playVoiceElement(f, onFail) {
  stopVoiceFile();
  const a = voiceElement(f); voiceEl = a; let failed = false;
  const fail = () => { if (failed) return; failed = true; a.removeEventListener('error', fail); if (voiceEl === a) voiceEl = null; onFail && onFail(); };
  a.addEventListener('error', fail);
  try { a.currentTime = 0; } catch (e) {}
  a.volume = 1;
  let p = null; try { p = a.play(); } catch (e) { fail(); return; }
  if (p && p.catch) p.catch(fail);
  a.onended = () => { a.removeEventListener('error', fail); if (voiceEl === a) voiceEl = null; };
}
/** voz do sistema (última reserva): gênero só muda o tom */
function speakSynth(text, voice) {
  if (!('speechSynthesis' in window)) return;
  try {
    const ss = window.speechSynthesis; if (ss.speaking || ss.pending) ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR'; u.rate = 0.92; u.pitch = voice === 'm' ? 0.75 : 1.15; u.volume = 0.9;
    const vs = ss.getVoices ? ss.getVoices().filter((v) => /pt/i.test(v.lang)) : [];
    const pick = vs.find((v) => /(Luciana|Francisca|Camila|Google português)/i.test(v.name) && voice !== 'm') || vs.find((v) => /(Felipe|Daniel|Ricardo)/i.test(v.name) && voice === 'm') || vs[0];
    if (pick) u.voice = pick;
    setTimeout(() => { try { ss.speak(u); } catch (e) { /* sem voz */ } }, 0);     // falar logo depois de cancelar perde a frase em alguns Androids
  } catch (e) { /* sem voz: segue só com o visual */ }
}
/** último problema ao tocar uma gravação (para diagnóstico no aparelho: window.__ianVoice) */
export const voiceDebug = { last: null, played: 0, fallbacks: 0 };
if (typeof window !== 'undefined') window.__ianVoice = voiceDebug;
/** fala uma frase. voice: 'f' (padrão) ou 'm'; se a frase tiver gravação, o gênero vem do manifesto */
export function speak(text, voice = 'f') {
  if (!on()) return;
  const e = VOICES[norm(text)]; const seq = ++voiceSeq;
  silenceVoice();
  if (!e) { voiceDebug.last = 'sem gravação: ' + text; voiceDebug.fallbacks++; speakSynth(text, voice); return; }
  // 1) <audio> nativo; 2) Web Audio decodificado; 3) voz do sistema
  playVoiceElement(e.f, () => {
    if (seq !== voiceSeq) return;
    voiceDebug.last = 'audio falhou: ' + e.f;
    loadVoice(e.f).then((buf) => { if (seq !== voiceSeq) return; if (buf && playVoiceBuffer(buf)) { voiceDebug.played++; return; } voiceDebug.last = 'decode falhou: ' + e.f; voiceDebug.fallbacks++; speakSynth(text, e.v || voice); });
  });
  voiceDebug.played++;
}
export function silenceVoice() { stopVoiceFile(); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }
