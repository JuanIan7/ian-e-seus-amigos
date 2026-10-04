# Ian e Seus Amigos

Jogo infantil de corrida e resgate para Android (para o Ian, 4 anos, e seus primos de 5 e 7). Corrida lateral automática, dois botões grandes, três modos de dificuldade (Fácil, Aventura, Desafio).

## Como jogar
- Menu: escolha a **dificuldade**, a **fase inicial (1 a 5)** e, se quiser, monte o personagem (botão do rostinho). Toque no **▶** para começar.
- **Seta verde (direita): pular.** No ar, **segurar** o botão faz planar (quando tem as asas).
- **Botão laranja (esquerda): ação** — o ícone muda conforme a missão (gota, osso, mãozinha, caixa, ovo, cesta, coração) e acende quando há algo para fazer.
- A cada **50 estrelas** nasce um poder aleatório: escudo, ímã de estrelas, super pulo, turbo, voo ou jato forte (ícone com anel de tempo no topo).
- Pause no canto superior direito (continuar, voltar ao menu, som).

## Versão atual (3D) — o que tem
Jogo em **Three.js** (3D cartoon, tudo modelado por código, sem imagens externas). A versão 2D antiga continua com `?2d` na URL.
- **Tela inicial 3D:** personagem num palco com o cãozinho e a viatura; escolha de modo (⭐ Fácil, ⭐⭐ Aventura, ⭐⭐⭐ Desafio), fase inicial (1 a 7), **Personagem** e **Lojinha**.
- **Personalização:** roupa (10), pele (7), rosto (3), cabelo (10, inclui moicano e raspadinho), cor do cabelo (8), olhos (6), acessório (óculos, óculos escuros, laço, tiara, mochila, cachecol), sardas e sobrancelhas. Prévia 3D que gira com o dedo; botão 🎲 sorteia.
- **7 fases** na mesma partida: 1 Pequeno bombeiro, 2 Resgate na cidade, 3 Floresta, 4 Alturas (refeita, com menos obstáculos), 5 Dinossauros, 6 **Resgate aquático**, 7 **Resgate no vulcão**. Depois da 7ª, a próxima fase é **sorteada**. Cada fase tem **música própria**.
- **Vidas:** 3 corações. Bater ou cair tira 1; ganha 1 ao mudar de fase e ao vencer o desafio da fase (máximo 5). Sem vidas = fim de jogo e recomeça do zero.
- **Desafio da fase (30 s, vale +1 vida):** F1 quebra-cabeça 4×4, F2 labirinto, F3 quebra-cabeça 5×5, F4 pegar maçãs, F5 mirar a mangueira, F6 guiar o barco, F7 esfriar a lava. Abre sozinho ao chegar no baú do caminho; o jogo para enquanto isso. No Fácil metade das peças do quebra-cabeça já começa no lugar (ajustável em `src/g3/minigames.js`).
- **Lojinha:** no fim do jogo (perdeu as vidas ou tocou em encerrar 🏁) as estrelas da corrida vão para a lojinha. Cada poder custa ⭐100 (escudo, viatura, voo, planador, ímã, super pulo, turbo, jato forte). Os comprados aparecem na **janela de poderes** (canto superior direito) e são usados com um toque. **Com qualquer poder ativo, os obstáculos são afastados** (viatura e voo também passam por cima dos buracos).
- **Controles:** setas (faixas), pular (segurar no ar = desce devagar; dois toques = pulo duplo), ação (ícone muda: gota, coração, boia…), **⏩ correr** (segurar: até +45–55% de velocidade, com vento e câmera abrindo).
- **Gráficos (escolhidos fase a fase, ver `docs/qualidade-escolhas.md`):** cada elemento usa o nível escolhido — *Alta* (cartoon detalhado) ou *Muito alta* (materiais com reflexo do ambiente, texturas desenhadas por código, sombras). Exemplos: árvores e pinheiros com milhares de folhas, cães/gato/coelho com pelo de verdade, fogo animado por sombreador, mar com ondulação e reflexo, lava rachada brilhando, helicóptero com cabine de vidro. Tudo continua modelado por código (sem imagens externas). Os modelos ficam em `src/g3/hq*.js`; `src/g3/final.js` aplica as escolhas no jogo. A página `showcase.html` (`node tests/showcase.mjs`) gera as imagens de comparação.
- **Desempenho (medido no computador, GPU por software):** ~200–320 mil triângulos e ~210–330 chamadas de desenho por quadro na maioria das fases; a fase 2 (praça, com lojas e cães peludos) chega a ~650 chamadas. Para aguentar no celular: o cenário distante troca para a versão simples (a partir de 28 m), malhas do mesmo material são juntadas, o pelo é uma malha só, as luzes extras foram tiradas, a resolução cai se o jogo ficar abaixo de ~44 fps e, se continuar lento, as sombras desligam sozinhas. `node tests/perf3d.mjs` mede fase por fase.

### Testes automáticos (Playwright, precisam de `npm run build` antes)
`npm test` = `sim3d` (controles, velocidade, fases, robô) + `mini3d` (os 7 desafios resolvidos por toque nos 3 modos, tempo esgotado, baú no caminho) + `ctrl3d` (multitoque, pausa, segundo plano, encerrar → estrelas na lojinha, 3 batidas = fim de jogo, compra e uso de poderes). `npm run test:fases` roda o robô nas 7 fases × 3 modos (demorado).
**Ainda não validado:** desempenho dos gráficos novos e toque em celular real; equilíbrio de dificuldade com as crianças (principalmente o 5×5 em 30 s).

## Versão 2D anterior (legado, `?2d`)
- **Fases 1–5** conectadas na mesma sessão (banner "Fase N", cenário em fusão, sem menu): bairro (bombeiro), praça (cães + gatinho, osso, caminhão), floresta (buracos, folhas, trampolim, planar, coelhinho, suprimentos), alturas (telhados, voo, resgate com helicóptero) e mundo dos dinossauros (osso para o estegossauro, ovo ao ninho, filhote e família, pterossauro). Depois da 5 volta ao tema 1 com contador (×2…), dificuldade com teto.
- **Personalização:** 7 tons de pele, 3 formatos de rosto, 6 cores de olhos, 8 penteados (liso, ondulado, cacheado, crespo, rabo, trança, coquinhos), 8 cores de cabelo, 10 roupas (bombeiro, equipe de cães, dinossauro, explorador, piloto, guarda-florestal, astronauta, super-herói, esportiva, casual). Salvo localmente.
- **Recuperação amigável:** colisões só desaceleram; quedas em buracos voltam o mundo e reaparecem em chão firme; no Fácil há pulo assistido, planar automático e salto de resgate; objetivos perdidos reaparecem adiante.
- Visual ainda é provisório (formas geradas por código). A arte final seguirá o estilo de jogos de corrida coloridos enviados como referência (contornos grossos, cores saturadas, camadas de fundo com profundidade).

Ainda falta: arte final, áudio final, ajuste fino de dificuldade com as crianças, medição de desempenho em celular real.

## Decisões registradas
- **Tecnologia:** Phaser 3 + Vite (HTML5) empacotado com Capacitor. Funciona offline, desenvolvimento e testes no navegador, APK gerado pelo GitHub Actions.
- **Câmera:** corrida lateral com profundidade por paralaxe, celular na horizontal. Tela lógica 1560×720 (≈19,5:9); outras proporções ganham faixas.
- **Controles:** 2 botões grandes (ação à esquerda, pular à direita), toque imediato (pointerdown), até 3 toques simultâneos.
- **Arte/áudio:** tudo desenhado/sintetizado por código; nenhuma imagem de referência foi incorporada ao jogo (as referências do projeto servem só para entender temas). Nenhum recurso externo → nada a atribuir.
- **Sem** anúncios, compras, contas, chat, ranking ou coleta de dados. O app mantém a permissão INTERNET padrão do Capacitor (a remover/validar numa etapa de endurecimento).

## Desenvolver
```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # gera dist/
npm test               # simulação com bots: 5 fases × 3 modos, poderes, aparências — precisa de build antes
npm run test:ui        # toques emulados + capturas em tests/out/
node tests/shots.mjs   # capturas de cada missão em tests/out/shots/
```
Teste no navegador: Espaço/↑ = pular, ↓/X = ação, P/Esc = pausa. Para PCs sem GPU: `?renderer=canvas`.

## APK
Cada push na `main` roda o GitHub Actions (`.github/workflows/build-apk.yml`): simula o jogo, compila o APK de teste (assinatura de depuração) e publica em **Releases → latest** (`ian-e-seus-amigos.apk`). Abra o link da Release no celular, baixe e instale (permitir "apps desconhecidos").
