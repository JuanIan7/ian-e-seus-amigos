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
