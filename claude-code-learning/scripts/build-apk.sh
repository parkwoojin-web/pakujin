#!/usr/bin/env bash
# dist/index.html을 Android WebView 앱으로 감싸서 서명된 APK를 만든다.
# Android SDK 없이 Maven Central의 apktool(aapt2·smali 포함)과 apksig만 사용한다.
# 결과: dist/claude-code-guide.apk
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/build"
TOOLS="$BUILD/tools"
# repo1.maven.org가 요청 제한(429)을 걸 때가 많아 Google의 Maven Central 미러를 쓴다.
MAVEN="${MAVEN_MIRROR:-https://maven-central.storage-download.googleapis.com/maven2}"
APKTOOL="$TOOLS/apktool-cli-3.0.3.jar"
APKSIG="$TOOLS/apksig-2.3.0.jar"
KEYSTORE="${ANDROID_KEYSTORE:-$ROOT/android/release.keystore}"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-claudeguide}"
export KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:-claudeguide-local}"

if [ ! -f "$ROOT/dist/index.html" ]; then
  echo "dist/index.html이 없습니다. 먼저 npm run build 를 실행하세요." >&2
  exit 1
fi

mkdir -p "$TOOLS"
fetch() {
  local path="$1" dest="$2"
  if [ ! -s "$dest" ]; then
    echo "내려받는 중: $(basename "$dest")"
    curl -fsSL --retry 4 --retry-delay 5 -o "$dest.part" "$MAVEN/$path"
    mv "$dest.part" "$dest"
  fi
}
fetch org/apktool/apktool-cli/3.0.3/apktool-cli-3.0.3.jar "$APKTOOL"
fetch com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar "$APKSIG"

# apktool이 읽는 형식의 소스 폴더를 새로 만든다
SRC="$BUILD/apk-src"
rm -rf "$SRC"
mkdir -p "$SRC/assets"
cp -r "$ROOT/android/AndroidManifest.xml" "$ROOT/android/apktool.yml" "$ROOT/android/res" "$ROOT/android/smali" "$SRC/"
cp "$ROOT/dist/index.html" "$SRC/assets/index.html"

java -jar "$APKTOOL" build "$SRC" -o "$BUILD/unsigned.apk" -f

if [ ! -f "$KEYSTORE" ]; then
  echo "서명 키가 없어 새로 만듭니다: $KEYSTORE"
  keytool -genkeypair -keystore "$KEYSTORE" -storetype PKCS12 \
    -storepass "$KEYSTORE_PASSWORD" -keypass "$KEYSTORE_PASSWORD" \
    -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Claude Code Guide, O=pakujin, C=KR"
fi

# apksig 2.3.0은 JDK 내부 보안 클래스를 직접 쓰므로, 최신 JDK에서는 모듈 접근을 열어 줘야 한다.
JDK_EXPORTS=()
for pkg in sun.security.x509 sun.security.util; do
  JDK_EXPORTS+=(--add-exports "java.base/$pkg=ALL-UNNAMED")
done
java -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8 "${JDK_EXPORTS[@]}" -cp "$APKSIG" "$ROOT/scripts/SignApk.java" \
  "$BUILD/unsigned.apk" "$ROOT/dist/claude-code-guide.apk" "$KEYSTORE" "$KEY_ALIAS"

echo "APK 생성: dist/claude-code-guide.apk ($(du -k "$ROOT/dist/claude-code-guide.apk" | cut -f1)KB)"
