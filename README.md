# Ian e Seus Amigos

Jogo infantil de corrida e resgate para Android (para o Ian, 4 anos, e seus primos de 5 e 7). Corrida lateral automática, dois botões grandes, três modos de dificuldade (Fácil, Aventura, Desafio).

## Como jogar
- **Seta verde (direita): pular.**
- **Gota laranja (esquerda): ação** — acende quando há algo para fazer (apagar fogo com a mangueira).
- Pause no canto superior direito (continuar, voltar ao menu, som).

## Estado atual (etapa 1 — protótipo)
Funcionando: menu com 3 modos, corrida automática, pulo (com tolerância e dica visual no Fácil), obstáculos, estrelas, mangueira, fogo na lixeira (corrida para na posição de interação, indicador de progresso em gotas), colisão amigável (desacelera, nunca reinicia), ajuda automática após erros repetidos, tutorial de pulo (congela no ponto ideal até tocar), pausa, som, salvamento local, pausa automática em segundo plano. Arte e áudio 100% gerados por código.

Ainda falta: casa e prédio em chamas (resto da Fase 1), personalização e 10 roupas, fases 2–5, transições, ciclo infinito, arte final, áudio final.

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
npm test               # simulação com bots (3 modos) — precisa de build antes
npm run test:ui        # toques emulados + capturas em tests/out/
```
Teste no navegador: Espaço/↑ = pular, ↓/X = ação, P/Esc = pausa. Para PCs sem GPU: `?renderer=canvas`.

## APK
Cada push na `main` roda o GitHub Actions (`.github/workflows/build-apk.yml`): simula o jogo, compila o APK de teste (assinatura de depuração) e publica em **Releases → latest** (`ian-e-seus-amigos.apk`). Abra o link da Release no celular, baixe e instale (permitir "apps desconhecidos").
