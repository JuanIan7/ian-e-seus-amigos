# Continuar por aqui: build iOS do "Ian e Seus Amigos"

> Atualizado em 05/11/2026 (Claude Code). Comece dizendo algo como "continuando o jogo, vamos pro iOS".

## Onde estamos

- Repo: `JuanIan7/ian-e-seus-amigos`, branch `main`.
- **Android:** funcionando (APK gerado pelo Android Studio e pelo GitHub Actions em Releases → latest). O Juan relatou
  lentidão e alguns travamentos; em 05/11 foram corrigidos (ver "Revisão de 05/11" abaixo). O próximo APK já sai com as correções.
- **iOS:** plataforma adicionada (`ios/`, Capacitor 8.6, SPM, sem CocoaPods), ícone e splash próprios, orientação travada em
  paisagem, bundle `br.com.ianeamigos.jogo`, iOS mínimo 15.
  **Instalado no iPhone do Juan em 05/11/2026** (Xcode 27.2, Apple ID gratuito, time `8B992A8Y4H`). Ver "Reinstalar no iPhone".

## Espaço em disco (resolvido em 05/11)

Em 05/11 o Mac tinha só ~14 GB livres (de 926 GB); a instalação do Xcode pela App Store precisa de uns 40 GB
livres durante a instalação. Com autorização do Juan foram apagados: Lixeira (14 GB), instaladores .dmg em
Downloads (3,5 GB) e, em Downloads, as pastas Vídeos, Imagens e Apresentações e os zips exportados do Google
Drive (CATTS 2026, Instrução Light, Fotografia, POPATTS). Resultado: **57 GB livres**. Nada em Documents, Desktop
ou Library/Caches foi tocado. A App Store foi aberta na página do Xcode para o Juan clicar em "Obter".

## Reinstalar no iPhone (processo que funcionou em 05/11)

O app com Apple ID grátis expira em 7 dias. Para reinstalar (ou atualizar depois de mudar o jogo), com o iPhone no cabo e destravado:

```bash
cd ~/ian-e-seus-amigos
npm run build && npx cap sync ios
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -destination 'id=00008140-0002309A2244801C' -allowProvisioningUpdates \
  -derivedDataPath /tmp/dd-ian build
xcrun devicectl device install app --device 00008140-0002309A2244801C /tmp/dd-ian/Build/Products/Debug-iphoneos/App.app
xcrun devicectl device process launch --device 00008140-0002309A2244801C br.com.ianeamigos.jogo
```

- Não precisa abrir o Xcode nem clicar em nada. O projeto é `App.xcodeproj` (não existe `.xcworkspace`, é SPM).
- Na primeira assinatura o macOS pede a **senha do usuário do Mac** (chave "login"): digitar e clicar em "Sempre Permitir".
- **Limite de 3 apps** por iPhone com Apple ID grátis. O iPhone do Juan tinha SideStore, Manic EMU e StikDebug;
  em 05/11 o StikDebug foi removido (com autorização) para o jogo entrar. Se der erro "maximum number of installed
  apps using a free developer profile", é isso: remover um app ou pagar o Apple Developer Program.
- UDID do iPhone de Juan: `00008140-0002309A2244801C` (`xcrun devicectl list devices`).

## Passos originais (primeira instalação, já feitos)

1. Instalar o Xcode pela App Store (gratuito). Abrir uma vez sozinho (instala componentes extras).
2. Xcode > Settings > Accounts > "+" > entrar com o Apple ID pessoal (não precisa pagar nada).
3. No Terminal, na pasta do projeto: `npm run build && npx cap sync ios && npx cap open ios`.
4. No projeto "App" > aba "Signing & Capabilities" > "Team": escolher o Apple ID adicionado (Personal Team).
5. Conectar o iPhone por cabo, destravar, tocar "Confiar neste computador". No iPhone, ativar o Modo Desenvolvedor
   (Ajustes > Privacidade e Segurança > Modo Desenvolvedor) se o Xcode pedir.
6. Selecionar o iPhone como destino (topo da janela do Xcode) e clicar em ▶ Play: instala direto.
7. No iPhone, na primeira vez: Ajustes > Geral > VPN e Gerenciamento de Dispositivo > tocar no Apple ID > Confiar.
8. Com Apple ID grátis o app expira em 7 dias. Para continuar testando, repetir os passos 5-6 (cabo + Play), de graça,
   quantas vezes quiser. Só pagaria (Apple Developer Program, US$99/ano) para publicar na App Store ou distribuir pelo TestFlight.

## Revisão de 05/11 (o que foi corrigido)

- Memória de vídeo: tudo que saía da pista (estrelas, missões, plataformas, buracos, projéteis, cãozinho da fase anterior,
  estação do desafio) ficava na GPU para sempre; em 5 minutos de partida as geometrias iam de 154 para 558 e só cresciam.
  Agora estabilizam (~150 por fase). Era a causa mais provável dos travamentos no Android.
- Estrelas: cada uma criava geometria e material próprios; agora são clones de um modelo só.
- Fase 2 (praça) tinha o dobro de triângulos e de chamadas das outras (lojas com 13 mil triângulos cada):
  lojas, chafarizes e prédios trocam para a versão simples a 18–20 m. De ~600 para ~280 chamadas por quadro.
- Celular começa sem antialias e com resolução menor (1,25×, sobe até 1,5×); sombras desligam primeiro quando cai abaixo de 45 fps.
- Perda do contexto WebGL (memória baixa / segundo plano): o jogo pausa e retoma, em vez de ficar preto.
- Botão/gesto "voltar" no Android pausava? Não: fechava o app na hora e perdia a partida. Agora só pausa (`MainActivity.onBackPressed`).
- Música: depois de uma travada ou de voltar do segundo plano, as notas perdidas tocavam todas de uma vez (rajada);
  agora retoma do ponto atual. Música do menu para em segundo plano.
- Voz: cancelar e falar em seguida perdia a frase em alguns Androids; agora fala no ciclo seguinte.
- Personagem: rolar a lista de roupas/cabelos escolhia a opção embaixo do dedo; agora só escolhe ao soltar sem arrastar.
- Música do menu não começava se o primeiro toque fosse num botão (o caso normal: o ▶); corrigido.
- Palco 3D do menu ficava com a tela cheia de memória de vídeo durante o jogo; agora encolhe para 2×2 px enquanto a partida roda.
- Minijogos: pausa (app em segundo plano) cobre o minijogo; labirinto trava o dedo ao chegar na casinha; captura de ponteiro
  perdida libera o arrasto (barco/labirinto); vitória/tempo esgotado não disparam depois do cartão fechado.

## Ajustes de 05/11 (tarde), já no iPhone e no APK

- Correr é por toques (segurar o botão impedia pular junto no celular): 1º toque = acelera (botão lilás, selo "1"),
  2º = acelera 30% a mais (laranja pulsando, selo "2"), 3º = desliga. Teclas W/Shift/R fazem o mesmo ciclo.
- Fases: seguem em ordem a partir da escolhida (1, 2, 3... até a última, voltando ao começo se não começou na 1);
  só depois de passar por todas é que a próxima é sorteada (`this.played` em `advancePhase`).
- Piscadas na tela: a resolução dinâmica mudava a cada 1,5 s e cada troca deixava um quadro em branco. Agora
  (`adaptQuality`) muda antes do render, só com 3 medições seguidas, 10 s de intervalo e no máximo 3 trocas por partida.
- Laterais distorcidas ao correr: a lente abria até 90°; agora no máximo 69°.
- Créditos "Desenvolvido por Juan Carlos Silva de Araujo" + © na tela inicial, Info.plist, strings.xml, package.json e README
  (regra do Juan para todos os apps: só tirar se ele pedir).
- APK local: `cd android && ./gradlew assembleDebug` → copiar para `builds/android/` (pasta ignorada pelo git).

## Atualização de 09/11/2026 (pedidos do Juan depois de jogar no iPhone)

- **Nome**: "Ian e Seus Amigos: Corrida de Resgate" (título novo na tela inicial, README, package.json, strings.xml e CFBundleName;
  o rótulo do ícone continua "Ian e Seus Amigos" para não ser cortado).
- **Dois modos na tela inicial** (`gameMode` no save): **Modo História** (fase a fase; ao passar por todas aparece a medalha e a
  frase "Parabéns, você venceu todos os desafios, meu pequeno herói, meu filho." com voz masculina; `winStory()`) e
  **Corrida Infinita** (só corrida: sem missões nem desafios; começa a 5 m/s e sobe +1 m/s a cada 20 s até 15; a cada degrau
  as estrelas valem ×2, ×3…; obstáculos ficam mais frequentes; no fim, ranking local top 10 por distância com nome editável;
  `INFINITE` em config3.js, `infiniteScript()`, `updateStarMul()`, `ranking`/`playerName` no save).
- **Botão de velocidade** nos dois modos: 1º toque ×2, 2º toque ×3, 3º toque volta ao normal (`RUN_MULS`, selo "2x"/"3x").
- **Fase 4 (alturas)** refeita: o meio da pista fica sempre livre (sem buracos nem plataformas no centro; obstáculos e
  trampolins só nas laterais: `freeCenter`).
- **Som ao pegar estrela** bem mais audível (`sfx.star`) e arpejo quando o multiplicador sobe (`sfx.mult`).
- **Falas com voz natural**: `speak()` agora toca arquivos gravados (`public/vozes/*.m4a`, manifesto `src/vozes-manifest.js`)
  e só cai na voz do sistema se a frase não tiver gravação. Gênero por frase em `scripts/vozes/falas.json`: feminina (a mãe,
  voz Kore) para o dia a dia e para ajudar bichinhos; masculina (o pai) para salvar pessoas, apagar fogo e a frase final.
  **Gerar** (API paga do Gemini, só com autorização do Juan): `python3 scripts/vozes/gerar-vozes.py [--voz-m Charon]`
  (chave em ~/Projetos/gbs-online/.env.local), depois `npm run build && npx cap sync` e reinstalar. 123 falas (11 masculinas).
  **Geradas em 09/11/2026** (Kore + Charon; 3,3 MB em `public/vozes/`). O modelo flash tem limite de **100 pedidos/dia**: as últimas
  22 saíram com `--modelo gemini-2.5-pro-preview-tts` (mesmas vozes). O gerador só cria o que falta e apaga arquivos órfãos; ao
  mudar/adicionar uma frase no jogo, incluí-la em `falas.json` e rodar de novo.
  **Armadilha do iOS (09/11):** o Capacitor serve arquivos de mídia (.m4a, .mp3…) com uma resposta sem status HTTP, pensada
  para o elemento `<audio>`; um `fetch()` que exige `r.ok` falha e o jogo caía na voz do sistema. Por isso `speak()` toca
  primeiro pelo `<audio>` nativo, depois tenta Web Audio (fetch tolerante) e só então a voz do sistema. `window.__ianVoice`
  guarda o último problema para diagnóstico no aparelho.
- Testes novos em `tests/sim3d.mjs`: corrida infinita (aceleração, multiplicador, sem missões, ranking) e modo história zerado.

## Travadinhas na troca de fase (09/11, tarde)

Causa: na troca de fase (e no meio dela) o jogo montava no mesmo quadro o cenário novo, o cãozinho, cada casa/prédio das
missões (13 mil triângulos) e os moradores que comemoram, e ainda enviava tudo para a placa de vídeo na primeira vez que
aparecia. Solução: **preparo em segundo plano** (`scheduleWarmup`/`runJobs` em game3d.js): a cada quadro folgado, até 3 ms de
trabalho, na ordem: modelos das missões e do desafio desta fase → estoque de 3 moradores → moldes dos obstáculos desta fase e
da próxima → cenário da próxima fase, uma peça por vez (`World.prewarmStep`) → cãozinho da próxima fase → cada peça nova é
desenhada um quadro fora da tela (y = -1000, sem recorte) para a geometria subir e o material compilar antes de aparecer
(níveis de detalhe todos visíveis; o cão vai sem clonar, pois clonar os pelos custava mais de 1 s). A próxima fase passa a ser
decidida no começo da fase atual (`pickNextPhase`). Medido no navegador de teste: troca de fase de ~90 ms para ~5 ms de
lógica e ~24 ms no pior quadro; criar missão de 40 ms para 0,2 ms; moradores de 32 ms para 0,5 ms.

## Ajustes de 09/11 (fim do dia)

- **Fase 4 de verdade limpa**: o que atravessava a pista era a *grade do telhado* (`rail`, 12 m), colocada com rotação
  aleatória pelo layout do tema; agora `rot: 0` (alinhada com a pista; `fillChunk` aceita `rot`). Sem buracos, sem
  plataformas no centro, obstáculos só nas laterais.
- **Batida mais visível**: clarão vermelho nas bordas (`hud.hitFlash`), aviso "💥 Opa!", piscada mais lenta (9 Hz por 1,6 s)
  e recuperação da velocidade em 1,4 s (`RECOVER_T`, começa em 40%).
- **Descer rápido (mergulho)**: com o dedo nos botões azuis, arrastar para baixo (joystick) ou deslizar para baixo em
  qualquer lugar; no teclado, seta para baixo / S no ar. `dive()`: gravidade ×3,5 por 0,6 s e cancela o planar.
  Seta para baixo no chão continua sendo a ação; X/Z só ação. Teste em sim3d ("mergulho encurta o pulo").
  Um botão ↓ visível foi testado e o Juan preferiu **sem botão**: o mergulho fica "velado", só pelo gesto.

## Ideias para depois (não feitas)

- Voz em Android: o WebView do Android pode não ter `speechSynthesis` (as frases faladas ficariam mudas). Se for o caso no
  celular, usar o plugin `@capacitor-community/text-to-speech` dentro da mesma função `speak()`.
- Testar com o Ian o equilíbrio do quebra-cabeça 5×5 em 30 s (fase 3) e a velocidade do modo Desafio.
