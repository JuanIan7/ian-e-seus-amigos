# Modelos 3D do Tripo no jogo (25/11/2026)

O Juan gerou 20 modelos no Tripo (studio.tripo3d.ai, conta Pro, créditos até 22/12/2026) e pediu para usá-los no jogo, com prévia
antes de aplicar. Originais em `iCloud/Jogos do Ian/Modelos 3D (Tripo 2026-11-24)/` (não foram alterados). Arte original dele,
gerada por IA. Prévia que ele avaliou (hoje × com o modelo novo): https://claude.ai/artifact/4x56M3w22qqQiPx1k4w6q1
(cópia local em `builds/previa-modelos-2026-11-25/`, fora do Git).

## O que entrou (aprovado pelo Juan em 25/11/2026)
| Item (`src/g3/modelos.js`) | Onde aparece | Modelos |
|---|---|---|
| `cenario-bairro` | Fase 1: de tempos em tempos, casas dão lugar ao quartel, com ambulância e filhote dálmata | quartel, ambulancia, cachorro |
| `cenario-praca` | Fase 2: jipe estacionado e árvore com gatinho (enfeite) | jipe, arvore-gato |
| `cenario-dinos` | Fase 5: um dinossauro a cada trecho, na beira da pista | dino-rex, dino-tri, dino-braqui, dino-estego |
| `cenario-mar` | Fase 6: lancha de resgate ancorada perto do píer | lancha |
| `cenario-alturas` | Fase 4: helicóptero pousado ao lado da pista (o meio continua livre) | helicoptero |
| `hidrante` | Obstáculo das fases 1 e 2: hidrante com rostinho e mangueira (mesma área de batida) | hidrante |

São 12 arquivos em `public/modelos/` (2,1 MB no total). Tudo é enfeite, menos o hidrante, que só muda de aparência.

## O que não entrou
- **Não aprovados pelo Juan na prévia:** pterossauro roxo (não bate asas), cones com barreirinha amarela, boia no poste (menor e
  menos visível) e o caminhão como viatura do poder e da tela inicial (traseira lisa, criança na ponta da escada). O código dessas
  quatro trocas foi retirado; cone, boia, pterossauro e viatura continuam os feitos por código.
- **Bombeiro, bombeira e salva-vidas:** pose de braços abertos, sem esqueleto. Para andar e comemorar, falta gerar o esqueleto
  (Tripo, 20 créditos cada, antes de 22/12/2026).
- **Casa pegando fogo:** chamas e fumaça fazem parte da malha; na missão o fogo precisa diminuir. Serviria uma casa sem fogo.
- **Árvore com gato como missão** e **dálmata como companheiro:** entram só como enfeite; a missão do gato e os cães com nome,
  fala e animação continuam os de hoje.
- **Dinossauros das missões da fase 5:** os de hoje andam e mexem a cabeça; os novos são peça única. Ficou para outra etapa.

## Estado dos modelos
Vistos de quatro lados dentro do cenário do jogo: nenhum furo, peça faltando ou tamanho errado. Todos são uma malha só, com cerca de
4 mil triângulos e uma textura; rodas, hélice e asas não se mexem. Nada foi corrigido nos modelos.

## Como funciona
O jogo é 3D (Three.js), então entram os `.glb`, não as imagens.
- `scripts/modelos/preparar-modelos.py "<pasta dos originais>" [--so nome1,nome2]`: reduz a textura de 2048 para 512 e tira
  extensões de vidro que o Tripo põe em tudo. Saída em `public/modelos/`.
- `src/g3/modelos.js`: baixa em segundo plano (começa na tela inicial), põe a origem no chão, acerta a frente de cada modelo
  (`MODELOS[nome].giro`) e devolve cópias no tamanho pedido. Se um arquivo não carregar, o jogo segue com o objeto feito por código
  (hidrante) ou sem o enfeite (cenário).
- Cada troca é um item de `ITENS`; só vale o que está em `ITENS_APROVADOS`.
- Cenário: `EXTRAS` em `src/g3/world.js`, com sorteio à parte para o resto da paisagem não mudar. Obstáculo: `buildObstacle` em
  `src/g3/final.js`.

## Como testar
```bash
npm run build && npm test && npm run test:bugs      # o robô joga a história inteira com os modelos carregados
npm run dev        # http://localhost:5173/            jogo com os itens aprovados
                   # http://localhost:5173/?modelos=   jogo sem nenhum modelo pronto (como era antes)
# fotos lado a lado, sem modelos × com modelos (para mostrar uma troca nova antes de aplicar):
OUT=tests/out/previa-modelos node tests/previa-modelos.mjs
```
Onde olhar no jogo: fase 1 (quartel logo nos primeiros trechos e hidrante na pista), fase 2 (jipe e árvore), fase 4 (helicóptero),
fase 5 (dinossauros) e fase 6 (lancha).

## Regra para as próximas trocas
Mostrar ao Juan a lista e a prévia antes de aplicar, e não publicar nada (push, APK, iPhone, Drive) sem ele pedir.
