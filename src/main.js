// Entrada: a versão 3D (tela inicial nova + jogo em Three.js) é a padrão; ?2d abre a versão 2D antiga (Phaser).
const q = new URLSearchParams(location.search);
if (q.has('2d')) import('./legacy2d.js');
else import('./front/app.js').then((m) => m.startApp());
window.addEventListener('contextmenu', (e) => e.preventDefault());
