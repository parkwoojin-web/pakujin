# CLAUDE.md

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 매번 읽는 지침입니다.
프로젝트가 진행되면서 내용을 계속 업데이트하세요.

## 프로젝트 개요
- **이름(가칭)**: 클로드 코드 첫걸음
- **목적**: 개발 경험이 없는 초보자가 Claude Code 사용법을 배우고, 가상 터미널과 실제 미션으로 직접 실습하는 웹앱
- **대상 사용자**: 터미널과 코딩이 처음인 사람
- **현재 단계**: v1.1.0 완성 (가이드 1~9장·부록, 가상 터미널 실습 5개, HTML·Android APK 배포)

## 저장소
- **GitHub 저장소**: (만든 뒤 주소 적기 — 예: `https://github.com/parkwoojin-web/claude-code-learning`)
- **기본 브랜치**: `main`
- **작업 브랜치**: 기능마다 새 브랜치를 만든다 (예: `feat/lesson-screen`)
- 지금은 임시로 `pakujin` 저장소의 `claude-code-learning/` 폴더에 있다. 새 저장소를 만들면 이 폴더 내용을 옮기고 위 주소를 채운다.

## 핵심 기능
1. 가이드: 1~9장 + 부록. 체크리스트와 "완료" 표시를 기기에 저장
2. 가상 터미널 실습: 시나리오 5개. 틀리면 힌트 제공
3. 진도 표시: 홈 화면 진도율, 목차의 완료 표시
4. 다크 모드: 기기 설정을 따르고, 버튼으로 바꿀 수도 있음
5. 오프라인 동작: 외부 리소스 없이 HTML 파일 하나로 동작
6. 인쇄: 레슨 화면의 "이 장 인쇄", 홈·레슨 화면의 "전체 인쇄"(`#/print` 화면). 인쇄할 때는 항상 밝은 색으로 출력
   - 브라우저는 `window.print()`, Android 앱은 `window.AndroidPrint.print(작업이름)`(`android/smali/.../PrintBridge.smali`)으로 기기의 인쇄 화면을 연다

로그인, 결제, 실제 AI 호출(AI 튜터) 기능은 만들지 않는다.

## 커리큘럼
`GUIDE_OUTLINE.md`와 `content/lessons/`가 기준이다.
| 파일 | 주제 |
|---|---|
| 01 | 시작하기 전에 |
| 02 | 설치와 첫 실행 |
| 03 | 기본 사용법 |
| 04 | CLAUDE.md로 규칙 정하기 |
| 05 | 잘 시키는 법 |
| 06 | 안전하게 쓰기 |
| 07 | Git·GitHub와 함께 쓰기 |
| 08 | 따라 하는 미니 프로젝트 |
| 09 | 한 단계 더 (심화) |
| 10 | 부록 |

## 기술 스택
- 웹앱: HTML + CSS + JavaScript (프레임워크 없음). 빌드하면 **HTML 파일 하나**가 된다
- 레슨 변환: `marked` (빌드할 때만 사용. 마크다운 → HTML)
- 가상 터미널: 직접 만든 가벼운 터미널 (`src/app.js`) + 입력 판정 로직 (`lib/terminal/matcher.cjs`)
- 진도 저장: localStorage (막혀 있어도 앱은 동작해야 함)
- Android 앱: WebView로 HTML을 보여 주는 앱. Android SDK 없이 apktool(aapt2·smali)과 apksig로 빌드
  - 앱 코드는 smali(`android/smali/`)로 작성. 최소 Android 7.0(API 24), 대상 API 34, v2 서명
- 테스트: Node 내장 테스트 러너(`node --test`)
- 패키지 매니저: npm

## 자주 쓰는 명령어
```bash
npm install          # 의존성 설치
npm test             # 단위 테스트 (입력 판정 로직, 시나리오 형식 검사)
npm run build        # dist/index.html 생성
npm run build:apk    # dist/index.html + dist/claude-code-guide.apk 생성 (Java 17 이상 필요)
```
- 빌드 결과를 배포할 때는 `../downloads/`에 `claude-code-guide.html`, `claude-code-guide.apk`로 복사한다.
- APK 서명 키: `android/release.keystore` (Git에 올리지 않음). 키가 바뀌면 기존 앱을 지우고 새로 설치해야 하므로 잘 보관한다.
  비밀번호는 `KEYSTORE_PASSWORD` 환경 변수로 바꿀 수 있다.
- Maven Central(repo1.maven.org)이 429 오류를 내면 스크립트는 Google 미러를 쓴다. `MAVEN_MIRROR`로 바꿀 수 있다.

## 폴더 구조
- `content/lessons/` — 레슨 내용 (MDX 형식의 마크다운, 레슨당 1파일, frontmatter에 title·order·duration·lastVerified)
- `content/scenarios/` — 가상 터미널 시나리오 (JSON: goal, expect, hint, output)
- `src/` — 앱 화면: `index.html`(템플릿), `styles.css`, `app.js`
- `lib/terminal/matcher.cjs` — 입력이 시나리오 단계와 맞는지 판정 (브라우저·테스트 공용)
- `scripts/` — `build-html.mjs`(HTML 빌드), `build-apk.sh`(APK 빌드), `SignApk.java`(서명)
- `android/` — Android 앱 소스 (매니페스트, 리소스, smali, 아이콘 원본 `icon.svg`)
- `tests/` — 단위 테스트
- `dist/`, `build/` — 빌드 결과 (Git에 올리지 않음)

### 시나리오 expect 형식
- `exact`: 정확히 같은 입력 (대소문자·공백 무시)
- `prefix`: 이 말로 시작 (`requireArgs: true`면 뒤에 내용이 꼭 있어야 함)
- `keywords`: `all`은 모두, `any`는 하나 이상 포함
- `any`: 빈칸만 아니면 통과
- `key`: 특수 키 (`shift+tab`). 다른 형식에 `keys: ["esc-esc"]`를 더하면 키 입력도 허용
- output 줄 앞에 `claude:`, `dim:`, `tool:`, `ok:`, `warn:`, `ask:`, `status:`를 붙이면 색이 달라진다

## 코딩 규칙
- 기존 코드의 스타일, 네이밍, 구조를 따른다.
- 함수와 컴포넌트는 작고 한 가지 역할만 하도록 만든다.
- 변수·함수 이름은 영어로, 의미가 드러나게 짓는다.
- 주석은 "무엇을"보다 "왜"가 필요한 곳에만 단다.
- 사용하지 않는 코드, 디버그용 `console.log`는 남기지 않는다.
- 새 라이브러리를 추가하기 전에 꼭 필요한지 먼저 확인하고, 추가하면 이유를 알려준다.

## 콘텐츠 규칙
- 레슨 내용은 코드에 직접 쓰지 않고 `content/`의 MDX·JSON 파일에 둔다. 코드를 몰라도 내용을 고칠 수 있어야 한다.
- 레슨마다 "배울 것 → 설명 → 따라 하기 → 확인하기 → 자주 하는 실수 → 퀴즈 → 다음 단계" 형식을 지킨다.
- 레슨 내용을 바꾸면 frontmatter의 `lastVerified`도 바꾼다.
- 쉬운 말을 쓰고, 전문 용어는 처음 나올 때 한 줄로 설명한다.
- Claude Code는 자주 업데이트되므로, 명령어·단축키·화면 설명은 공식 문서(https://code.claude.com/docs)로 확인하고 추측해서 쓰지 않는다.
- 유료 요금제가 필요하다는 점, Windows 설치 방법은 1단계에서 따로 안내한다.

## 가상 터미널 규칙
- 실제 명령을 실행하거나 실제 AI를 호출하지 않는다. 미리 정한 시나리오만 재현한다.
- 틀린 입력에는 혼내지 말고 다음에 입력할 것을 힌트로 알려준다.
- 모바일 화면에서도 입력할 수 있게 한다.

## 작업 방식
- 큰 작업은 시작 전에 계획을 먼저 짧게 설명하고 진행한다.
- 한 번에 하나의 기능만 작게 구현하고, 동작을 확인한 뒤 다음으로 넘어간다.
- 코드를 바꾼 뒤에는 가능하면 테스트·린트·빌드를 실행해 확인한다.
- 요구사항이 모호하면 추측하지 말고 질문한다.
- 에러가 나면 원인을 설명하고 고친다. 테스트를 끄거나 건너뛰어서 통과시키지 않는다.

## Git 규칙
- 커밋은 의미 있는 단위로 작게 나눈다.
- 커밋 메시지는 무엇을 왜 바꿨는지 한 줄로 요약한다.
  - 예: `feat: 레슨 목록 화면 추가`, `fix: 터미널 힌트가 두 번 나오는 오류 수정`
- `main` 브랜치에 직접 푸시하지 않는다.

## 보안
- API 키, 비밀번호, 토큰을 코드에 직접 쓰지 않는다. `.env` 파일을 쓰고 `.env`는 커밋하지 않는다.
- 필요한 환경 변수는 `.env.example`에 이름만 적어 둔다.
- 사용자 입력은 항상 검증한다.

## 커뮤니케이션
- 설명과 답변은 **한국어**로 한다.
- 개발 초보도 이해할 수 있게 쉽게 설명한다.
- 작업이 끝나면 무엇을 바꿨는지, 직접 확인해야 할 것이 무엇인지 짧게 정리한다.
