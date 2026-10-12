// 가상 터미널: 사용자 입력이 시나리오 단계의 기대값과 맞는지 판단한다.
// 브라우저(빌드 시 인라인)와 Node 테스트 양쪽에서 쓰므로 의존성 없이 작성한다.

function normalize(text) {
  return String(text).trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * @param {{type: string, value?: string, all?: string[], any?: string[], keys?: string[], requireArgs?: boolean}} expect
 * @param {{text?: string, key?: string}} input  text: 입력창 내용, key: 특수 키 이름
 * @returns {boolean}
 */
function matchStep(expect, input) {
  if (input.key) {
    if (expect.type === "key") return expect.value === input.key;
    return Array.isArray(expect.keys) && expect.keys.includes(input.key);
  }
  const text = normalize(input.text || "");
  if (!text) return false;
  switch (expect.type) {
    case "exact":
      return text === normalize(expect.value);
    case "prefix": {
      // requireArgs: "/plan" 처럼 명령어 뒤에 내용이 꼭 있어야 하는 경우
      const value = normalize(expect.value);
      if (text === value) return !expect.requireArgs;
      return text.startsWith(value + " ");
    }
    case "keywords": {
      const all = (expect.all || []).every((k) => text.includes(normalize(k)));
      const any = !expect.any || expect.any.some((k) => text.includes(normalize(k)));
      return all && any;
    }
    case "any":
      return true;
    default:
      return false;
  }
}

if (typeof module !== "undefined") module.exports = { matchStep, normalize };
