# Ian e Seus Amigos

Jogo infantil de corrida e resgate para Android (para o Ian, 4 anos, e seus primos de 5 e 7). Corrida lateral automática, dois botões grandes, três modos de dificuldade (Fácil, Aventura, Desafio).

## Como jogar
- Menu: escolha a **dificuldade**, a **fase inicial (1 a 5)** e, se quiser, monte o personagem (botão do rostinho). Toque no **▶** para começar.
- **Seta verde (direita): pular.** No ar, **segurar** o botão faz planar (quando tem as asas).
- **Botão laranja (esquerda): ação** — o ícone muda conforme a missão (gota, osso, mãozinha, caixa, ovo, cesta, coração) e acende quando há algo para fazer.
- A cada **50 estrelas** nasce um poder aleatório: escudo, ímã de estrelas, super pulo, turbo, voo ou jato forte (ícone com anel de tempo no topo).
- Pause no canto superior direito (continuar, voltar ao menu, som).

## Estado atual (etapa 2 — todas as fases jogáveis)
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
