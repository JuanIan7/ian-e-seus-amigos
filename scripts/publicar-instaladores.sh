#!/bin/bash
# Gera o APK de teste assinado com a chave fixa dos jogos do Ian e copia para a pasta do Google Drive que o Juan
# compartilha com os amigos ("Jogos Filho Versão APK e Versão IOS atualizados"). Rodar depois de cada atualização.
# Com a mesma chave e o mesmo identificador, quem já tem o jogo instala por cima e NÃO perde o progresso.
# Uso: bash scripts/publicar-instaladores.sh ["o que mudou nesta versão"]
#   PULAR_BUILD=1 pula o "npm run build" (quando o dist/ já foi gerado e testado agora)
set -euo pipefail
cd "$(dirname "$0")/.."

JOGO="Ian e Seus Amigos - Corrida de Resgate"
ARQ="Ian-e-Seus-Amigos-Android.apk"
CHAVES="$HOME/Projetos/_identidade/android"
DRIVE="$HOME/Library/CloudStorage/GoogleDrive-juanhanzi@gmail.com/Meu Drive/Jogos Filho Versão APK e Versão IOS atualizados"
MUDOU="${1:-}"

[ -f "$CHAVES/jogos-do-ian-teste.keystore" ] || { echo "Falta a chave fixa em $CHAVES (sem ela a atualização apaga o progresso dos amigos)."; exit 1; }
[ -d "$DRIVE" ] || { echo "Pasta do Google Drive não encontrada: $DRIVE"; exit 1; }

export ANDROID_KEYSTORE_FILE="$CHAVES/jogos-do-ian-teste.keystore"
export ANDROID_KEYSTORE_PASSWORD="$(grep '^senha=' "$CHAVES/jogos-do-ian-teste.senha.txt" | cut -d= -f2)"
export ANDROID_KEY_ALIAS="jogosdoian"
export ANDROID_VERSION_CODE="$(date +%y%j%H%M)"   # ano, dia do ano, hora e minuto: sempre cresce
export ANDROID_VERSION_NAME="$(date +%Y.%m.%d-%H%M)"
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home)}"

[ "${PULAR_BUILD:-}" = "1" ] || npm run build
npx cap sync android
(cd android && ./gradlew assembleDebug --console=plain -q)

mkdir -p builds/android "$DRIVE/$JOGO"
cp android/app/build/outputs/apk/debug/app-debug.apk "builds/android/$ARQ"
cp "builds/android/$ARQ" "$DRIVE/$JOGO/$ARQ"
{
  echo "$JOGO - instalador Android"
  echo "Versão: $ANDROID_VERSION_NAME (código $ANDROID_VERSION_CODE)"
  echo "Gerado em: $(date '+%d/%m/%Y %H:%M')"
  echo "Commit: $(git rev-parse --short HEAD)"
  [ -n "$MUDOU" ] && echo "O que mudou: $MUDOU"
  echo
  echo "Para atualizar: instale este arquivo por cima do jogo já instalado. NÃO desinstale antes, para não perder o progresso."
  echo "(Só na primeira vez depois de 18/11/2026: quem instalou um APK antigo deste jogo precisa desinstalar uma vez, porque a assinatura mudou para a chave fixa.)"
} > "$DRIVE/$JOGO/versao.txt"
echo "APK publicado em: $DRIVE/$JOGO/$ARQ"
