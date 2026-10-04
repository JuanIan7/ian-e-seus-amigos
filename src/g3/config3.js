// Dificuldade do modo 3D. Unidades: metros/segundo. A velocidade básica cresce com o TEMPO ATIVO de corrida
// (não conta pausas, menus, missões nem minijogos) e é limitada por speedMax (teto configurável).
export const MODES3 = {
  facil: {
    id: 'facil', label: 'Fácil', speed0: 6.0, speedMax: 8.6, ramp: 0.06,
    gap: [2.4, 3.4], apex: 2.0, airT: 0.9, coyote: 0.2, buffer: 0.3,
    runBoost: 1.45, steerAssist: true, jumpAssist: true, fireHits: 3, hintDist: 20, slow: 0.4,
    groups: ['single', 'single', 'full'], showRun: true, autoHelpAfter: 12,
  },
  aventura: {
    id: 'aventura', label: 'Aventura', speed0: 7.6, speedMax: 10.8, ramp: 0.07,
    gap: [1.9, 2.7], apex: 1.9, airT: 0.82, coyote: 0.13, buffer: 0.2,
    runBoost: 1.5, steerAssist: false, jumpAssist: false, fireHits: 4, hintDist: 0, slow: 0.5,
    groups: ['single', 'double', 'full'], showRun: true, autoHelpAfter: 0,
  },
  desafio: {
    id: 'desafio', label: 'Desafio', speed0: 9.2, speedMax: 14.5, ramp: 0.045,
    gap: [1.5, 2.2], apex: 1.8, airT: 0.76, coyote: 0.08, buffer: 0.14,
    runBoost: 1.55, steerAssist: false, jumpAssist: false, fireHits: 5, hintDist: 0, slow: 0.55,
    groups: ['single', 'double', 'full', 'double'], showRun: true, autoHelpAfter: 0,
  },
};

// ---------------------------------------------------------------------------
// Fases do 3D (7). Fichas do roteiro:
//  obs | stars | gap (buraco) | pad (trampolim) | leaf (plataformas) | glidegap (planar) | flystars | ptero
//  pickup:X (hose, glider, egg, truck, flight) | mission:X | puzzle (desafio da fase: vale +1 vida)
// As fases ficaram mais longas (mais trechos entre as missões). Depois da última, a próxima é sorteada.
// ---------------------------------------------------------------------------
export const PHASES3 = [
  { id: 1, name: 'Pequeno bombeiro', theme: 'bairro', dog: null, puzzle: 'jigsaw4', music: 'bairro',
    script: ['obs', 'stars', 'obs', 'pickup:hose', 'obs', 'stars', 'obs', 'mission:fire_bin', 'obs', 'stars', 'obs', 'obs', 'stars', 'puzzle', 'obs', 'stars', 'mission:fire_house', 'obs', 'stars', 'obs', 'obs', 'stars', 'obs', 'mission:fire_building', 'obs', 'stars', 'obs'] },
  { id: 2, name: 'Equipe de resgate na cidade', theme: 'praca', dog: 'bolota', puzzle: 'maze', music: 'praca',
    script: ['obs', 'stars', 'obs', 'mission:rescue_cat', 'obs', 'stars', 'obs', 'obs', 'mission:distract_dog', 'obs', 'stars', 'obs', 'puzzle', 'obs', 'stars', 'mission:person_safe', 'obs', 'obs', 'pickup:truck', 'obs', 'stars', 'obs', 'mission:fire_dog', 'obs', 'stars'] },
  { id: 3, name: 'Aventura na floresta', theme: 'floresta', dog: 'trovao', puzzle: 'jigsaw5', music: 'floresta',
    script: ['obs', 'stars', 'gap', 'obs', 'pad', 'leaf', 'obs', 'stars', 'pickup:glider', 'gap', 'stars', 'obs', 'glidegap', 'obs', 'leaf', 'mission:rescue_bunny', 'obs', 'stars', 'puzzle', 'obs', 'gap', 'stars', 'obs', 'pad', 'leaf', 'mission:supplies', 'obs', 'stars'] },
  // fase 4 refeita: menos obstáculos (um por vez), mais estrelas, telhados e voo
  { id: 4, name: 'Resgate nas alturas', theme: 'altura', dog: 'pipoca', puzzle: 'apples', music: 'altura', calm: true,
    script: ['stars', 'obs', 'stars', 'pad', 'stars', 'gap', 'stars', 'pickup:flight', 'flystars', 'flystars', 'stars', 'obs', 'leaf', 'mission:rescue_roof', 'stars', 'puzzle', 'stars', 'gap', 'stars', 'pad', 'stars', 'obs', 'mission:fire_building', 'stars', 'flystars'] },
  { id: 5, name: 'Mundo dos dinossauros', theme: 'pre', dog: 'pipoca', puzzle: 'hose', music: 'pre',
    script: ['obs', 'stars', 'gap', 'stars', 'leaf', 'mission:distract_dino', 'obs', 'stars', 'pickup:egg', 'gap', 'obs', 'mission:nest', 'obs', 'stars', 'puzzle', 'ptero', 'obs', 'stars', 'mission:baby_free', 'obs', 'leaf', 'stars', 'mission:baby_reunite', 'obs', 'stars'] },
  { id: 6, name: 'Resgate aquático', theme: 'agua', dog: 'bolota', puzzle: 'boat', music: 'agua',
    script: ['obs', 'stars', 'gap', 'obs', 'mission:rescue_swimmer', 'obs', 'stars', 'leaf', 'obs', 'stars', 'mission:boat_fire', 'obs', 'stars', 'puzzle', 'gap', 'stars', 'obs', 'leaf', 'mission:rescue_pup', 'obs', 'stars', 'glidegap', 'obs', 'stars'] },
  { id: 7, name: 'Resgate no vulcão', theme: 'vulcao', dog: 'trovao', puzzle: 'lava', music: 'vulcao',
    script: ['obs', 'stars', 'gap', 'obs', 'mission:cool_lava', 'obs', 'stars', 'pad', 'obs', 'stars', 'mission:rescue_dino_lava', 'obs', 'stars', 'puzzle', 'gap', 'stars', 'obs', 'leaf', 'mission:hut_fire', 'obs', 'stars', 'glidegap', 'obs', 'stars'] },
];

// Vidas: 3 no começo; uma batida ou queda tira 1; ganha 1 ao mudar de fase e ao vencer o desafio da fase.
export const LIVES = { start: 3, max: 5 };

// Lojinha: as estrelas da partida viram estrelas da loja no fim do jogo. Cada poder custa 100.
export const SHOP = [
  { key: 'shield', name: 'Escudo', price: 100, dur: 20 },
  { key: 'truck', name: 'Viatura', price: 100, dur: 12 },
  { key: 'fly', name: 'Voo', price: 100, dur: 10 },
  { key: 'glide', name: 'Planador', price: 100, dur: 16 },
  { key: 'magnet', name: 'Ímã de estrelas', price: 100, dur: 15 },
  { key: 'jump', name: 'Super pulo', price: 100, dur: 15 },
  { key: 'speed', name: 'Turbo', price: 100, dur: 8 },
  { key: 'jet', name: 'Jato forte', price: 100, dur: 20 },
];
