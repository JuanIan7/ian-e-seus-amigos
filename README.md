# Ian e Seus Amigos

Jogo infantil de corrida e resgate para Android (para o Ian, 4 anos, e seus primos de 5 e 7). Corrida lateral automática, dois botões grandes, três modos de dificuldade (Fácil, Aventura, Desafio).

## Como jogar
- Menu: escolha a **dificuldade**, a **fase inicial (1 a 5)** e, se quiser, monte o personagem (botão do rostinho). Toque no **▶** para começar.
- **Seta verde (direita): pular.** No ar, **segurar** o botão faz planar (quando tem as asas).
- **Botão laranja (esquerda): ação** — o ícone muda conforme a missão (gota, osso, mãozinha, caixa, ovo, cesta, coração) e acende quando há algo para fazer.
- A cada **50 estrelas** nasce um poder aleatório: escudo, ímã de estrelas, super pulo, turbo, voo ou jato forte (ícone com anel de tempo no topo).
- Pause no canto superior direito (continuar, voltar ao menu, som).

## Versão 3D (branch `feature/3d`) — estado atual
Jogo em **Three.js real** (3D cartoon com contornos, tudo modelado por código, sem imagens externas). O 2D anterior continua disponível com `?2d` na URL.
- **Câmera** atrás e acima da criança; **3 faixas** (setas ← → ou deslizar o dedo). No Fácil há ajuda de direção e de pulo.
- **Controles:** pular (segurar no ar = descida lenta e limitada; **dois toques = pulo duplo** uma vez por salto, com cambalhota), **correr** (segurar acelera aos poucos até um limite seguro e solta suave), **ação** (ícone muda por missão), multitoque. Cada habilidade ganha uma demonstração antes de ser exigida (pulo, pulo duplo, planar).
- **Velocidade:** cresce com o tempo **ativo** de jogo (pausas, missões e minijogos não contam), é mantida entre fases e na repetição após a fase 5, com teto por modo (Fácil 8,6 / Aventura 10,8 / Desafio 14,5 — configurável em `src/g3/config3.js`).
- **Fases 1–5** em 3D na mesma sessão, com missões (fogo, resgates, entregas, ovo/filhote), trampolins, folhas, buracos, planador, voo, viatura, cães companheiros e dinossauros; após a 5 o ciclo recomeça com novas combinações.
- **Minijogos opcionais** (bolha "toque aqui" que some sozinha; nunca em sequência nem durante missões ou perto de obstáculos): **quebra-cabeça** (Fácil 2–4 peças, Aventura 4–6, Desafio 6–9) e **caminho da cobrinha** (arrastar até a bandeira; barra de tempo só no Desafio). O jogo congela enquanto joga; ao concluir ganha **uma** recompensa (escudo é a mais provável; também jato forte, super pulo, planador, ímã ou estrelas) e volta com proteção e arranque suave. Sair pelo X não pune.
- **Desempenho (medido por software, não em celular):** ~80 mil triângulos e ~200 chamadas de desenho por quadro; resolução dinâmica reduz a nitidez se o aparelho cair abaixo de ~44 fps.

### Testes automáticos (Playwright, precisam de `npm run build` antes)
`npm test` = `sim3d` (correr, pulo duplo, descida lenta, progressão, pausa, fases, bot) + `mini3d` (minijogos, recompensa, retorno seguro, bolha) + `ctrl3d` (multitoque, pausa, segundo plano, som salvo, saída ao menu, custo de desenho). `npm run test:fases` roda o bot nas 5 fases × 3 modos (demorado). `npm run test:2d` / `test:ui` cobrem a versão 2D (`?2d`).
Resultado do bot (5 fases × 3 modos): todas as missões concluídas, 0 quedas, 0–2 batidas, sem travar.
**Ainda não validado:** desempenho e toques em celular real; achados de jogabilidade com as crianças; pré-visualização 3D do personagem na tela de personalização (ainda usa o desenho 2D); sons finais.

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
