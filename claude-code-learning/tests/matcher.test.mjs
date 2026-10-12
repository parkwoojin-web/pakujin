import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { matchStep } = require("../lib/terminal/matcher.cjs");

test("exact: 대소문자와 앞뒤 공백, 중복 공백을 무시한다", () => {
  const expect = { type: "exact", value: "cd my-first-project" };
  assert.equal(matchStep(expect, { text: "  CD   my-first-project " }), true);
  assert.equal(matchStep(expect, { text: "cdmy-first-project" }), false);
});

test("prefix + requireArgs: 명령어 뒤에 내용이 있어야 한다", () => {
  const expect = { type: "prefix", value: "/plan", requireArgs: true };
  assert.equal(matchStep(expect, { text: "/plan 다크 모드 추가" }), true);
  assert.equal(matchStep(expect, { text: "/plan" }), false);
  assert.equal(matchStep(expect, { text: "/planning" }), false);
});

test("prefix: 인자 없이도 통과한다", () => {
  const expect = { type: "prefix", value: "/compact" };
  assert.equal(matchStep(expect, { text: "/compact" }), true);
  assert.equal(matchStep(expect, { text: "/compact 버튼 위주로" }), true);
});

test("keywords: all은 모두, any는 하나 이상 포함해야 한다", () => {
  const expect = { type: "keywords", all: ["hello.html"], any: ["만들어", "생성"] };
  assert.equal(matchStep(expect, { text: "hello.html 파일 만들어 줘" }), true);
  assert.equal(matchStep(expect, { text: "hello.html 설명해 줘" }), false);
  assert.equal(matchStep(expect, { text: "파일 만들어 줘" }), false);
});

test("any: 빈 입력만 아니면 통과한다", () => {
  assert.equal(matchStep({ type: "any" }, { text: "아무거나" }), true);
  assert.equal(matchStep({ type: "any" }, { text: "   " }), false);
});

test("key: 특수 키 입력을 판별한다", () => {
  assert.equal(matchStep({ type: "key", value: "shift+tab" }, { key: "shift+tab" }), true);
  assert.equal(matchStep({ type: "key", value: "shift+tab" }, { text: "shift+tab" }), false);
  assert.equal(matchStep({ type: "exact", value: "/rewind", keys: ["esc-esc"] }, { key: "esc-esc" }), true);
  assert.equal(matchStep({ type: "exact", value: "/rewind" }, { key: "esc-esc" }), false);
});

test("모든 시나리오 단계는 올바른 기대값과 목표, 힌트를 가진다", () => {
  const dir = new URL("../content/scenarios/", import.meta.url);
  const types = new Set(["exact", "prefix", "keywords", "any", "key"]);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const scenario = JSON.parse(readFileSync(new URL(file, dir), "utf8"));
    assert.ok(scenario.id && scenario.title && scenario.lesson, `${file}: id/title/lesson`);
    for (const [i, step] of scenario.steps.entries()) {
      assert.ok(types.has(step.expect.type), `${file} #${i}: type`);
      assert.ok(step.goal && step.hint, `${file} #${i}: goal/hint`);
      assert.ok(Array.isArray(step.output), `${file} #${i}: output`);
    }
  }
});
