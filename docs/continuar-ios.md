# Continuar por aqui: build iOS do "Ian e Seus Amigos"

> Atualizado em 05/11/2026 (Claude Code). Comece dizendo algo como "continuando o jogo, vamos pro iOS".

## Onde estamos

- Repo: `JuanIan7/ian-e-seus-amigos`, branch `main`.
- **Android:** funcionando (APK gerado pelo Android Studio e pelo GitHub Actions em Releases → latest). O Juan relatou
  lentidão e alguns travamentos; em 05/11 foram corrigidos (ver "Revisão de 05/11" abaixo). O próximo APK já sai com as correções.
- **iOS:** plataforma adicionada (`ios/`, Capacitor 8.6, SPM, sem CocoaPods), ícone e splash próprios, orientação travada em
  paisagem, bundle `br.com.ianeamigos.jogo`, iOS mínimo 15. `npx cap sync ios` já foi rodado com o build atual.
  **Falta:** o Xcode não está instalado neste Mac.

## Bloqueio: espaço em disco

Em 05/11 o Mac tinha só **~14 GB livres** (de 926 GB). A instalação do Xcode pela App Store precisa de uns 40 GB
livres durante a instalação (baixa ~3 GB comprimidos, expande para ~15 GB e ainda usa espaço temporário).
Antes de instalar, liberar espaço. Onde está o volume (medido em 05/11, nada foi apagado):
Downloads 50 GB, Library/Caches 23 GB, Lixeira 14 GB, Library/Android 13 GB (imagens do emulador), Desktop 103 GB, Documents 89 GB.
Esvaziar a Lixeira e limpar Caches já libera ~37 GB sem perder nada de trabalho.

## Instalar no iPhone com Apple ID grátis (7 dias)

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

## Ideias para depois (não feitas)

- Voz em Android: o WebView do Android pode não ter `speechSynthesis` (as frases faladas ficariam mudas). Se for o caso no
  celular, usar o plugin `@capacitor-community/text-to-speech` dentro da mesma função `speak()`.
- Testar com o Ian o equilíbrio do quebra-cabeça 5×5 em 30 s (fase 3) e a velocidade do modo Desafio.
