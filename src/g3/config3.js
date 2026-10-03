// Dificuldade do modo 3D. Unidades: metros/segundo. A velocidade básica cresce com o TEMPO ATIVO de corrida
// (não conta pausas, menus, missões nem minijogos) e é limitada por speedMax (teto configurável).
export const MODES3 = {
  facil: {
    id: 'facil', label: 'Fácil', speed0: 6.0, speedMax: 8.6, ramp: 0.06,
    gap: [2.4, 3.4], apex: 2.0, airT: 0.9, coyote: 0.2, buffer: 0.3,
    runBoost: 1.18, steerAssist: true, jumpAssist: true, fireHits: 3, hintDist: 20, slow: 0.4,
    groups: ['single', 'single', 'full'], showRun: false, autoHelpAfter: 12,
  },
  aventura: {
    id: 'aventura', label: 'Aventura', speed0: 7.6, speedMax: 10.8, ramp: 0.07,
    gap: [1.9, 2.7], apex: 1.9, airT: 0.82, coyote: 0.13, buffer: 0.2,
    runBoost: 1.28, steerAssist: false, jumpAssist: false, fireHits: 4, hintDist: 0, slow: 0.5,
    groups: ['single', 'double', 'full'], showRun: true, autoHelpAfter: 0,
  },
  desafio: {
    id: 'desafio', label: 'Desafio', speed0: 9.2, speedMax: 14.5, ramp: 0.045,
    gap: [1.5, 2.2], apex: 1.8, airT: 0.76, coyote: 0.08, buffer: 0.14,
    runBoost: 1.35, steerAssist: false, jumpAssist: false, fireHits: 5, hintDist: 0, slow: 0.55,
    groups: ['single', 'double', 'full', 'double'], showRun: true, autoHelpAfter: 0,
  },
};
