// Dimensões lógicas (paisagem ~19.5:9, comum nos celulares atuais; outras proporções ganham faixas laterais).
export const W = 1560;
export const H = 720;
export const GROUND = 590; // linha dos pés do personagem
export const PLAYER_X = 470;

// Modos de dificuldade. Todo o conteúdo fica disponível nos três; muda só assistência e obstáculos.
export const MODES = {
  facil: {
    id: 'facil', label: 'Fácil', stars: 1,
    speed0: 190, speedMax: 265, ramp: 1.6,          // px/s e crescimento suave por segundo
    gap: [2.6, 3.6],                                  // segundos entre obstáculos
    jumpV: 980, gravity: 2000,                        // salto longo e "flutuante"
    coyote: 0.20, buffer: 0.30,                       // tolerância para apertar cedo/tarde
    fireHits: 3, hintDist: 560, slow: 0.35, groups: ['single'],
    autoHelpAfter: 12,                                // segundos parado no fogo até o amigo ajudar
  },
  aventura: {
    id: 'aventura', label: 'Aventura', stars: 2,
    speed0: 250, speedMax: 340, ramp: 2.0,
    gap: [1.9, 2.8],
    jumpV: 940, gravity: 2200,
    coyote: 0.13, buffer: 0.20,
    fireHits: 4, hintDist: 0, slow: 0.45, groups: ['single', 'single', 'double'],
    autoHelpAfter: 0,
  },
  desafio: {
    id: 'desafio', label: 'Desafio', stars: 3,
    speed0: 300, speedMax: 400, ramp: 2.4,
    gap: [1.5, 2.3],
    jumpV: 900, gravity: 2400,
    coyote: 0.08, buffer: 0.14,
    fireHits: 5, hintDist: 0, slow: 0.5, groups: ['single', 'double', 'conelog'],
    autoHelpAfter: 0,
  },
};
export const MODE_ORDER = ['facil', 'aventura', 'desafio'];

export const COLORS = {
  sky1: 0x7fd4ff, sky2: 0xdff6ff,
  red: 0xe53935, yellow: 0xffd23f, orange: 0xff8a1f, blue: 0x2f9bff, green: 0x3ecb6b,
  dark: 0x1b2a49, white: 0xffffff,
};

// ---------------------------------------------------------------------------
// Fases. Cada roteiro é uma lista de "fichas" que o diretor do jogo vai soltando:
//  obs = obstáculos simples | stars = fileira de estrelas | gap = buraco (pular)
//  pad = trampolim | leaf = folhas/plataformas | glidegap = buraco largo (planar)
//  pickup:X = equipamento (hose, bone, glider, egg, truck, flight)
//  mission:X = missão com botão de ação contextual | flystars = estrelas no ar | ptero = réptil voador
// ---------------------------------------------------------------------------
export const PHASES = [
  { id: 1, name: 'Pequeno bombeiro', theme: 'bairro', dog: null,
    script: ['obs', 'stars', 'obs', 'pickup:hose', 'obs', 'stars', 'mission:fire_bin', 'obs', 'obs', 'stars', 'mission:fire_house', 'obs', 'stars', 'obs', 'mission:fire_building'] },
  { id: 2, name: 'Equipe de resgate na cidade', theme: 'praca', dog: 'bolota',
    script: ['obs', 'stars', 'obs', 'mission:rescue_cat', 'obs', 'stars', 'pickup:bone', 'obs', 'mission:distract_dog', 'obs', 'stars', 'mission:person_safe', 'obs', 'pickup:truck', 'obs', 'stars', 'mission:fire_dog'] },
  { id: 3, name: 'Aventura na floresta', theme: 'floresta', dog: 'trovao',
    script: ['obs', 'stars', 'gap', 'pad', 'leaf', 'obs', 'pickup:glider', 'gap', 'stars', 'obs', 'glidegap', 'obs', 'leaf', 'mission:rescue_bunny', 'obs', 'gap', 'stars', 'mission:supplies'] },
  { id: 4, name: 'Resgate nas alturas', theme: 'altura', dog: 'pipoca',
    script: ['obs', 'gap', 'pad', 'leaf', 'stars', 'gap', 'pickup:flight', 'flystars', 'flystars', 'obs', 'glidegap', 'leaf', 'mission:rescue_roof', 'obs', 'gap', 'pad', 'stars', 'mission:fire_building'] },
  { id: 5, name: 'Mundo dos dinossauros', theme: 'pre', dog: 'pipoca',
    script: ['obs', 'gap', 'stars', 'leaf', 'mission:distract_dino', 'obs', 'pickup:egg', 'gap', 'obs', 'mission:nest', 'obs', 'stars', 'ptero', 'obs', 'mission:baby_free', 'obs', 'mission:baby_reunite'] },
];

// Poderes temporários (um sorteado a cada 50 estrelas). dur = segundos.
export const POWERS = {
  shield: { name: 'Escudo', say: 'Escudo!', dur: 25, color: 0x4db8ff },
  magnet: { name: 'Ímã de estrelas', say: 'Ímã de estrelas!', dur: 12, color: 0xff6fb5 },
  jump:   { name: 'Super pulo', say: 'Super pulo!', dur: 12, color: 0x3ecb6b },
  speed:  { name: 'Turbo', say: 'Turbo!', dur: 6, color: 0xff8a1f },
  fly:    { name: 'Voo', say: 'Voar!', dur: 8, color: 0xb18cff },
  jet:    { name: 'Jato forte', say: 'Jato forte!', dur: 20, color: 0x2f9bff },
};
export const POWER_KEYS = Object.keys(POWERS);
export const STARS_PER_POWER = 50;
