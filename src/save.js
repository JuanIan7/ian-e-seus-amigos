// Salvamento local (sem contas, sem rede, sem dados pessoais).
const KEY = 'ian-e-seus-amigos:v1';
export const DEFAULT_LOOK = { skin: 3, face: 0, hair: 0, hairColor: 1, eyes: 0, outfit: 0, acc: 0, freckles: 0, brows: 0 };
const DEFAULTS = { mode: 'facil', phase: 1, sound: true, tut: { jump: false, water: false }, bestStars: 0, coins: 0, inv: {}, look: { ...DEFAULT_LOOK } };

let cache = null;
export function load() {
  if (cache) return cache;
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { raw = {}; }
  cache = { ...DEFAULTS, ...raw, tut: { ...DEFAULTS.tut, ...(raw.tut || {}) }, look: { ...DEFAULT_LOOK, ...(raw.look || {}) }, inv: { ...(raw.inv || {}) } };
  return cache;
}
export function save(patch) {
  const s = Object.assign(load(), patch);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* sem armazenamento: segue sem salvar */ }
  return s;
}
