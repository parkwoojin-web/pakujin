// content/의 레슨(MDX)과 시나리오(JSON)를 읽어, 인터넷 없이도 열리는 HTML 파일 하나로 만든다.
// 결과: dist/index.html
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { marked } from "marked";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(path.join(root, ...p), "utf8");

function parseFrontmatter(source) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) throw new Error("frontmatter가 없습니다");
  const meta = {};
  for (const line of match[1].split("\n")) {
    const m = /^(\w+):\s*(.*)$/.exec(line);
    if (m) meta[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return { meta, body: source.slice(match[0].length) };
}

// "이 페이지에서 배울 것" 목록의 첫 두 항목을 홈 화면 카드 설명으로 쓴다.
function summarize(body) {
  const section = /##\s*📌[^\n]*\n([\s\S]*?)(\n##|\n⏱|$)/.exec(body);
  if (!section) return "";
  return section[1]
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .slice(0, 2)
    .map((line) => line.slice(2).replace(/`/g, "").replace(/\*\*/g, ""))
    .join(" · ");
}

// CommonMark 규칙상 `**굵게**` 바로 뒤에 한글 조사가 붙으면("**자동 모드(auto mode)**에서는")
// 굵게 처리가 되지 않는다. 코드 부분을 잠시 치워 두고 남은 `**…**`를 <strong>으로 바꾼다.
function fixKoreanBold(html) {
  const saved = [];
  const protectedHtml = html.replace(/<pre[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>/g, (m) => {
    saved.push(m);
    return `\u0000${saved.length - 1}\u0000`;
  });
  return protectedHtml
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\u0000(\d+)\u0000/g, (_, i) => saved[Number(i)]);
}

function renderMarkdown(body) {
  const html = fixKoreanBold(marked.parse(body, { gfm: true }));
  // 레슨끼리의 상대 링크(./03-basics)를 앱 안의 화면 이동 주소로 바꾼다.
  return html.replace(/href="\.\/([\w-]+)"/g, 'href="#/lesson/$1"');
}

const lessonDir = path.join(root, "content", "lessons");
const lessons = readdirSync(lessonDir)
  .filter((f) => f.endsWith(".mdx"))
  .map((file) => {
    const { meta, body } = parseFrontmatter(readFileSync(path.join(lessonDir, file), "utf8"));
    return {
      id: file.replace(/\.mdx$/, ""),
      title: meta.title,
      order: Number(meta.order),
      duration: meta.duration,
      lastVerified: meta.lastVerified,
      summary: summarize(body),
      html: renderMarkdown(body),
    };
  })
  .sort((a, b) => a.order - b.order);

const lessonIds = new Set(lessons.map((l) => l.id));
const scenarioDir = path.join(root, "content", "scenarios");
const scenarios = readdirSync(scenarioDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(readFileSync(path.join(scenarioDir, file), "utf8")));

for (const s of scenarios) {
  if (!lessonIds.has(s.lesson)) throw new Error(`시나리오 ${s.id}: 없는 레슨 ${s.lesson}`);
}
for (const l of lessons) {
  for (const [, target] of l.html.matchAll(/href="#\/lesson\/([\w-]+)"/g)) {
    if (!lessonIds.has(target)) throw new Error(`${l.id}: 없는 레슨으로 가는 링크 ${target}`);
  }
}

const lastVerified = lessons.map((l) => l.lastVerified).sort().at(-1);
// </script>가 데이터 안에 있으면 HTML이 깨지므로 </ 를 이스케이프한다.
const data = JSON.stringify({ lessons, scenarios, lastVerified }).replace(/<\//g, "<\\/");

// 템플릿 치환에 함수를 써서 $& 같은 특수 패턴이 해석되지 않게 한다.
const html = read("src", "index.html")
  .replace("{{STYLE}}", () => read("src", "styles.css"))
  .replace("{{DATA}}", () => data)
  .replace("{{MATCHER}}", () => read("lib", "terminal", "matcher.cjs"))
  .replace("{{APP}}", () => read("src", "app.js"));

mkdirSync(path.join(root, "dist"), { recursive: true });
writeFileSync(path.join(root, "dist", "index.html"), html);
console.log(`dist/index.html 생성: 레슨 ${lessons.length}개, 실습 ${scenarios.length}개, ${(html.length / 1024).toFixed(0)}KB`);
