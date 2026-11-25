// Modelos 3D prontos (.glb gerados no Tripo pelo Juan, arte original) usados no lugar de alguns objetos feitos por código.
// Os arquivos ficam em public/modelos/ (já com a textura reduzida por scripts/modelos/preparar-modelos.py).
// Carregam em segundo plano; enquanto um modelo não chega (ou se falhar), o jogo usa o objeto antigo feito por código.
import { THREE } from './kit.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** nome → para onde a FRENTE do modelo aponta no arquivo (ângulo em Y que o deixa de frente para +Z) */
const Q = Math.PI / 2;
export const MODELOS = {
  ambulancia: { giro: 0 }, jipe: { giro: 0 }, lancha: { giro: Q }, helicoptero: { giro: Q }, quartel: { giro: 0 },
  hidrante: { giro: 0 }, 'arvore-gato': { giro: 0 }, cachorro: { giro: -Q },
  'dino-rex': { giro: 0 }, 'dino-tri': { giro: 0 }, 'dino-braqui': { giro: Q }, 'dino-estego': { giro: Q },
};
// Ficaram de fora (decisão do Juan em 25/11/2026, depois da prévia): caminhão como viatura, cones, boia e pterossauro.
// Sem uso por enquanto: bombeiro, bombeira e salva-vidas (sem esqueleto) e a casa em chamas (o fogo faz parte da malha).
// Os originais de todos continuam na pasta do Juan; para trazer outro, rodar scripts/modelos/preparar-modelos.py com --so <nome>.

// ---------------------------------------------------------------------------------------------
// O que usa os modelos no jogo. Cada item é uma troca independente; só vale o que estiver em ITENS_APROVADOS
// (aprovado pelo Juan). Para comparar: ?modelos= (vazio) mostra o jogo sem nenhum modelo pronto; ?modelos=hidrante liga só um item.
// ---------------------------------------------------------------------------------------------
export const ITENS = {
  hidrante: ['hidrante'],
  'cenario-bairro': ['quartel', 'ambulancia', 'cachorro'], 'cenario-praca': ['jipe', 'arvore-gato'],
  'cenario-dinos': ['dino-rex', 'dino-tri', 'dino-braqui', 'dino-estego'], 'cenario-mar': ['lancha'], 'cenario-alturas': ['helicoptero'],
};
export const ITENS_APROVADOS = ['cenario-bairro', 'cenario-praca', 'cenario-dinos', 'cenario-mar', 'cenario-alturas', 'hidrante'];   // aprovados pelo Juan em 25/11/2026
const pedido = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('modelos') : null;
const ativos = new Set(pedido === null ? ITENS_APROVADOS : pedido === 'todos' ? Object.keys(ITENS) : pedido.split(',').filter((k) => ITENS[k]));
export const usa = (item) => ativos.has(item);
/** nomes dos modelos que os itens ligados precisam (o que não está ligado nem é baixado) */
export const modelosEmUso = () => [...new Set([...ativos].flatMap((k) => ITENS[k]))];
const cache = {}, pend = {};
const url = (nome) => new URL('modelos/' + nome + '.glb', document.baseURI).href;
let loader = null;

/** carrega um modelo (uma vez só); devolve null se o arquivo não puder ser lido */
export function carregarModelo(nome) {
  if (cache[nome] !== undefined) return Promise.resolve(cache[nome]);
  if (pend[nome]) return pend[nome];
  loader = loader || new GLTFLoader();
  pend[nome] = new Promise((res) => {
    loader.load(url(nome), (g) => {
      const raiz = g.scene, caixa = new THREE.Box3().setFromObject(raiz), c = caixa.getCenter(new THREE.Vector3()), tam = caixa.getSize(new THREE.Vector3());
      // origem no chão, no centro; tamanho guardado para o ajuste de escala
      raiz.position.set(-c.x, -caixa.min.y, -c.z);
      raiz.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = false; o.geometry.userData.shared = true;      // a geometria é compartilhada pelos clones: nunca é descartada
        const m = o.material; if (m.map) { m.map.anisotropy = 4; m.map.userData.shared = true; } m.userData.shared = true; m.envMapIntensity = 0.6;
      });
      const base = new THREE.Group(); base.add(raiz); base.userData.tam = tam;
      cache[nome] = base; delete pend[nome]; res(base);
    }, undefined, () => { cache[nome] = null; delete pend[nome]; res(null); });
  });
  return pend[nome];
}
export const carregarModelos = (nomes = modelosEmUso()) => Promise.all(nomes.map(carregarModelo));
export const modeloPronto = (nome) => !!cache[nome];

/**
 * Uma cópia do modelo, com a origem no chão, virada para +Z e do tamanho pedido.
 * Informe UMA medida (altura, largura ou comprimento, em metros); as outras seguem a proporção. Devolve null se ainda não carregou.
 */
export function modelo(nome, { altura, largura, comprimento, giro = 0 } = {}) {
  const base = cache[nome]; if (!base) return null;
  const tam = base.userData.tam, def = MODELOS[nome] || { giro: 0 };
  const virado = Math.abs(Math.sin(def.giro)) > 0.5;                           // se a frente original aponta para X, largura e comprimento trocam
  const lx = virado ? tam.z : tam.x, lz = virado ? tam.x : tam.z;
  const k = altura ? altura / tam.y : largura ? largura / lx : comprimento ? comprimento / lz : 1;
  const interno = base.clone(); interno.rotation.y = def.giro; interno.scale.setScalar(k);
  const g = new THREE.Group(); g.add(interno); g.rotation.y = giro;
  g.userData.modelo = nome; g.userData.tam = { x: lx * k, y: tam.y * k, z: lz * k };
  return g;
}
