/* global matchStep */
(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("app-data").textContent);
  var LESSONS = DATA.lessons;
  var SCENARIOS = DATA.scenarios;
  var STORAGE_KEY = "ccl-progress-v1";

  // ── 진도 저장 ──────────────────────────────────────────────
  // 사생활 보호 모드 등에서 localStorage가 막혀도 앱은 동작해야 하므로 메모리 상태를 기본으로 둔다.
  var progress = loadProgress();

  function loadProgress() {
    var empty = { lessons: {}, checks: {}, scenarios: {}, theme: null, last: null };
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty;
      var parsed = JSON.parse(raw);
      return Object.assign(empty, parsed);
    } catch (e) {
      return empty;
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) { /* 저장할 수 없어도 화면은 계속 동작 */ }
    renderNav();
    renderProgressPill();
  }

  function completedLessonCount() {
    return LESSONS.filter(function (l) { return progress.lessons[l.id]; }).length;
  }

  function percentDone() {
    var total = LESSONS.length + SCENARIOS.length;
    var done = completedLessonCount() +
      SCENARIOS.filter(function (s) { return progress.scenarios[s.id]; }).length;
    return total ? Math.round((done / total) * 100) : 0;
  }

  // ── 공통 도우미 ────────────────────────────────────────────
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var main = $("#main");

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "html") node.innerHTML = attrs[key];
      else if (key.indexOf("on") === 0) node.addEventListener(key.slice(2), attrs[key]);
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  var toastTimer;
  function toast(message) {
    var t = $("#toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  function copyText(text) {
    // Android WebView의 file:// 페이지에서는 Clipboard API가 막힐 수 있어 예전 방식으로 대체한다.
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var area = el("textarea", { readonly: "", style: "position:fixed;top:-1000px;opacity:0" });
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch (e) { /* 무시 */ }
    document.body.removeChild(area);
  }

  function lessonById(id) {
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i];
    return null;
  }
  function scenarioById(id) {
    for (var i = 0; i < SCENARIOS.length; i++) if (SCENARIOS[i].id === id) return SCENARIOS[i];
    return null;
  }

  // ── 테마 ──────────────────────────────────────────────────
  function applyTheme() {
    if (progress.theme) document.documentElement.setAttribute("data-theme", progress.theme);
    else document.documentElement.removeAttribute("data-theme");
  }
  $("#theme-btn").addEventListener("click", function () {
    var dark = progress.theme
      ? progress.theme === "dark"
      : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    progress.theme = dark ? "light" : "dark";
    applyTheme();
    saveProgress();
  });

  // ── 사이드바 ──────────────────────────────────────────────
  $("#menu-btn").addEventListener("click", function () { document.body.classList.toggle("nav-open"); });
  $("#backdrop").addEventListener("click", function () { document.body.classList.remove("nav-open"); });

  function renderNav() {
    var nav = $("#nav");
    nav.innerHTML = "";
    var route = location.hash || "#/";
    nav.appendChild(navLink("#/", "🏠", "홈", route === "#/" || route === "#"));
    nav.appendChild(el("h2", { text: "가이드" }));
    LESSONS.forEach(function (lesson) {
      var href = "#/lesson/" + lesson.id;
      var done = !!progress.lessons[lesson.id];
      nav.appendChild(navLink(href, done ? "✓" : "○", lesson.title, route === href, done));
    });
    nav.appendChild(el("h2", { text: "가상 터미널 실습" }));
    nav.appendChild(navLink("#/practice", "💻", "실습 목록", route === "#/practice"));
    SCENARIOS.forEach(function (s) {
      var href = "#/practice/" + s.id;
      var done = !!progress.scenarios[s.id];
      nav.appendChild(navLink(href, done ? "✓" : "○", s.title, route === href, done));
    });
  }

  function navLink(href, icon, label, active, done) {
    return el("a", { href: href, class: "nav-link" + (active ? " active" : "") }, [
      el("span", { class: "status" + (done ? " done" : ""), text: icon, "aria-hidden": "true" }),
      el("span", { text: label })
    ]);
  }

  function renderProgressPill() {
    $("#progress-pill").textContent = percentDone() + "% 완료";
  }

  // ── 홈 ────────────────────────────────────────────────────
  function renderHome() {
    var pct = percentDone();
    var next = progress.last && lessonById(progress.last) ? lessonById(progress.last) :
      LESSONS.filter(function (l) { return !progress.lessons[l.id]; })[0] || LESSONS[0];
    var startLabel = completedLessonCount() === 0 ? "1장부터 시작하기" : "이어서 학습하기: " + next.title;

    var content = el("div", { class: "content" }, [
      el("section", { class: "hero" }, [
        el("h1", { text: "클로드 코드 첫걸음" }),
        el("p", { text: "개발이 처음이어도 괜찮아요. Claude Code를 설치하고, 말로 시켜서 실제로 동작하는 앱을 만들 때까지 함께 갑니다." }),
        el("div", { class: "bar", role: "progressbar", "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100" }, [
          el("span", { style: "width:" + pct + "%" })
        ]),
        el("div", { class: "bar-label" }, [
          el("span", { text: "전체 진도 " + pct + "%" }),
          el("span", { text: "가이드 " + completedLessonCount() + "/" + LESSONS.length + " · 실습 " +
            SCENARIOS.filter(function (s) { return progress.scenarios[s.id]; }).length + "/" + SCENARIOS.length })
        ]),
        el("div", { class: "btn-row" }, [
          el("a", { class: "btn", href: "#/lesson/" + next.id, text: startLabel }),
          el("a", { class: "btn ghost", href: "#/practice", text: "💻 가상 터미널 실습" }),
          el("button", { class: "btn ghost", type: "button", text: "🖨 전체 인쇄", onclick: printAll })
        ])
      ]),
      el("h2", { class: "section-title", text: "📚 가이드" }),
      el("div", { class: "grid" }, LESSONS.map(function (lesson, i) {
        return el("a", { class: "card", href: "#/lesson/" + lesson.id }, [
          progress.lessons[lesson.id] ? el("span", { class: "done-badge", text: "✓ 완료" }) : null,
          el("div", { class: "num", text: lesson.order <= 9 ? (i + 1) + "장 · " + lesson.duration : lesson.duration }),
          el("h3", { text: lesson.title.replace(/^\d+\.\s*/, "") }),
          el("p", { text: lesson.summary })
        ]);
      })),
      el("h2", { class: "section-title", text: "💻 가상 터미널 실습" }),
      el("div", { class: "grid" }, SCENARIOS.map(function (s, i) {
        return el("a", { class: "card", href: "#/practice/" + s.id }, [
          progress.scenarios[s.id] ? el("span", { class: "done-badge", text: "✓ 완료" }) : null,
          el("div", { class: "num", text: "실습 " + (i + 1) + " · " + s.steps.length + "단계" }),
          el("h3", { text: s.title }),
          el("p", { text: s.description })
        ]);
      })),
      el("p", { class: "footer-note", text: "내용 최종 확인일: " + DATA.lastVerified + " · Claude Code는 자주 업데이트되므로 공식 문서(code.claude.com/docs)도 함께 확인하세요." })
    ]);
    main.innerHTML = "";
    main.appendChild(content);
  }

  // ── 레슨 ──────────────────────────────────────────────────
  function renderLesson(id) {
    var lesson = lessonById(id);
    if (!lesson) return renderNotFound();
    progress.last = id;
    saveProgress();

    var index = LESSONS.indexOf(lesson);
    var article = el("article", { class: "article", html: lesson.html });

    // 제목 바로 아래에 시간 정보 표시
    var h1 = article.querySelector("h1");
    if (h1) {
      var meta = el("div", { class: "meta" }, [
        el("span", { class: "chip", text: "⏱ " + lesson.duration }),
        el("span", { class: "chip", text: "최종 확인 " + lesson.lastVerified })
      ]);
      h1.insertAdjacentElement("afterend", meta);
      meta.insertAdjacentElement("afterend", printBar([
        el("button", { class: "small-btn", type: "button", text: "🖨 이 장 인쇄",
          onclick: function () { printNow("클로드 코드 첫걸음 - " + lesson.title); } }),
        el("button", { class: "small-btn", type: "button", text: "📚 전체 인쇄", onclick: printAll })
      ]));
    }

    enhanceArticle(article, lesson.id);

    var related = SCENARIOS.filter(function (s) { return s.lesson === lesson.id; });
    var footer = el("div", { class: "lesson-footer" }, [
      related.length ? el("a", { class: "practice-callout", href: "#/practice/" + related[0].id }, [
        el("span", { text: "💻", style: "font-size:24px" }),
        el("span", {}, [el("strong", { text: "가상 터미널로 연습하기: " }), related[0].title])
      ]) : null,
      doneToggle(lesson.id),
      el("nav", { class: "pager" }, [
        index > 0 ? el("a", { href: "#/lesson/" + LESSONS[index - 1].id }, [
          el("small", { text: "← 이전" }), LESSONS[index - 1].title
        ]) : null,
        index < LESSONS.length - 1 ? el("a", { class: "next", href: "#/lesson/" + LESSONS[index + 1].id }, [
          el("small", { text: "다음 →" }), LESSONS[index + 1].title
        ]) : null
      ])
    ]);

    main.innerHTML = "";
    main.appendChild(el("div", { class: "content" }, [article, footer]));
    window.scrollTo(0, 0);
  }

  function doneToggle(id) {
    var btn = el("button", { class: "done-toggle", type: "button" });
    function paint() {
      var on = !!progress.lessons[id];
      btn.classList.toggle("on", on);
      btn.textContent = on ? "✓ 이 장을 완료했어요" : "이 장을 완료로 표시하기";
    }
    btn.addEventListener("click", function () {
      if (progress.lessons[id]) delete progress.lessons[id];
      else { progress.lessons[id] = true; toast("잘했어요! 🎉"); }
      saveProgress();
      paint();
    });
    paint();
    return btn;
  }

  function enhanceArticle(article, lessonId) {
    // 표는 좁은 화면에서 가로로 스크롤되도록 감싼다
    Array.prototype.forEach.call(article.querySelectorAll("table"), function (table) {
      var wrap = el("div", { class: "table-wrap" });
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    // 코드 블록 복사 버튼
    Array.prototype.forEach.call(article.querySelectorAll("pre"), function (pre) {
      var btn = el("button", { class: "copy-btn", type: "button", text: "복사" });
      btn.addEventListener("click", function () {
        var code = pre.querySelector("code");
        copyText((code || pre).textContent.replace(/\n$/, "")).then(function () {
          btn.textContent = "복사됨";
          btn.classList.add("copied");
          setTimeout(function () { btn.textContent = "복사"; btn.classList.remove("copied"); }, 1500);
        });
      });
      pre.appendChild(btn);
    });

    // 외부 링크는 새 창으로
    Array.prototype.forEach.call(article.querySelectorAll("a[href^='http']"), function (a) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });

    // 체크리스트: 체크 상태를 레슨별로 저장
    var saved = progress.checks[lessonId] || [];
    Array.prototype.forEach.call(article.querySelectorAll("li > input[type='checkbox']"), function (box, i) {
      var li = box.parentNode;
      box.removeAttribute("disabled");
      box.checked = saved.indexOf(i) !== -1;
      li.classList.add("task");
      li.classList.toggle("checked", box.checked);
      var label = el("label");
      while (li.firstChild) label.appendChild(li.firstChild);
      li.appendChild(label);
      box.addEventListener("change", function () {
        var list = progress.checks[lessonId] || [];
        list = list.filter(function (n) { return n !== i; });
        if (box.checked) list.push(i);
        progress.checks[lessonId] = list;
        li.classList.toggle("checked", box.checked);
        saveProgress();
      });
    });
  }

  // ── 실습 목록 ──────────────────────────────────────────────
  function renderPracticeList() {
    main.innerHTML = "";
    main.appendChild(el("div", { class: "content" }, [
      el("div", { class: "article" }, [
        el("h1", { text: "💻 가상 터미널 실습" }),
        el("p", { text: "실제 Claude Code 화면을 흉내 낸 연습장입니다. 실제 명령이나 AI를 실행하지 않으니 마음껏 틀려도 괜찮아요. 화면 위의 목표를 보고 터미널에 직접 입력해 보세요." }),
        el("blockquote", {}, [el("p", { text: "💡 연습장의 Claude 답변은 미리 준비된 예시입니다. 실제 Claude Code의 답변과 화면은 조금 다를 수 있어요." })])
      ]),
      el("div", { class: "grid" }, SCENARIOS.map(function (s, i) {
        var lesson = lessonById(s.lesson);
        return el("a", { class: "card", href: "#/practice/" + s.id }, [
          progress.scenarios[s.id] ? el("span", { class: "done-badge", text: "✓ 완료" }) : null,
          el("div", { class: "num", text: "실습 " + (i + 1) + " · " + s.steps.length + "단계" }),
          el("h3", { text: s.title }),
          el("p", { text: s.description + (lesson ? " (관련: " + lesson.title + ")" : "") })
        ]);
      }))
    ]));
    window.scrollTo(0, 0);
  }

  // ── 가상 터미널 ────────────────────────────────────────────
  function renderPractice(id) {
    var scenario = scenarioById(id);
    if (!scenario) return renderNotFound();

    var stepIndex = 0;
    var wrongCount = 0;
    var mode = scenario.startMode || "shell";
    var shellPrompt = scenario.shell || "PS C:\\Users\\me\\my-first-project>";
    var lastEsc = 0;

    var stepLabel = el("div", { class: "step" });
    var goalText = el("p", { class: "goal" });
    var hintBox = el("div", { class: "hint", hidden: "" });
    var hintBtn = el("button", { class: "small-btn", type: "button", text: "💡 힌트 보기" });
    var resetBtn = el("button", { class: "small-btn", type: "button", text: "↺ 처음부터" });
    var goalBox = el("section", { class: "goal-box", "aria-live": "polite" }, [
      stepLabel, goalText, hintBox, el("div", { class: "goal-actions" }, [hintBtn, resetBtn])
    ]);

    var screen = el("div", { class: "terminal", role: "log", "aria-label": "가상 터미널" });
    var promptEl = el("span", { class: "prompt" });
    var input = el("input", {
      type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false",
      "aria-label": "터미널 입력", enterkeyhint: "send"
    });
    var inputRow = el("div", { class: "input-row" }, [promptEl, input]);
    screen.appendChild(inputRow);

    var keyShift = el("button", { type: "button", text: "Shift+Tab" });
    var keyEsc = el("button", { type: "button", text: "Esc" });
    var keySend = el("button", { type: "button", class: "send", text: "보내기 ⏎" });
    var keybar = el("div", { class: "keybar" }, [keyShift, keyEsc, keySend]);
    var completeArea = el("div");

    function printLine(raw) {
      var cls = "line";
      var text = raw;
      var m = /^(claude|dim|tool|ok|warn|ask|status|user):(.*)$/.exec(raw);
      if (m) { cls += " " + m[1]; text = m[2]; }
      screen.insertBefore(el("div", { class: cls, text: text || " " }), inputRow);
    }

    function paintPrompt() {
      promptEl.textContent = mode === "claude" ? "❯" : shellPrompt;
    }

    function paintGoal() {
      var step = scenario.steps[stepIndex];
      stepLabel.textContent = "단계 " + (stepIndex + 1) + " / " + scenario.steps.length;
      goalText.textContent = step.goal;
      hintBox.hidden = true;
      hintBox.textContent = step.hint;
      wrongCount = 0;
    }

    function scrollBottom() { screen.scrollTop = screen.scrollHeight; }

    function submit(inputValue) {
      if (stepIndex >= scenario.steps.length) return;
      var step = scenario.steps[stepIndex];
      if (inputValue.text !== undefined) {
        printLine("user:" + (mode === "claude" ? "❯ " : shellPrompt + " ") + inputValue.text);
      } else {
        printLine("dim:[" + (inputValue.key === "esc-esc" ? "Esc Esc" : "Shift+Tab") + "]");
      }

      if (matchStep(step.expect, inputValue)) {
        step.output.forEach(printLine);
        if (step.shell) shellPrompt = step.shell;
        if (step.mode) mode = step.mode;
        stepIndex += 1;
        paintPrompt();
        if (stepIndex < scenario.steps.length) paintGoal();
        else finish();
      } else {
        wrongCount += 1;
        printLine("warn:  ⚠ 이번 목표와 달라요. " + (wrongCount >= 2 ? "힌트: " + step.hint : "목표를 다시 읽고 입력해 보세요."));
        if (wrongCount >= 2) hintBox.hidden = false;
      }
      scrollBottom();
    }

    function finish() {
      progress.scenarios[scenario.id] = true;
      saveProgress();
      stepLabel.textContent = "완료!";
      goalText.textContent = "모든 단계를 마쳤어요. 이제 실제 Claude Code에서도 해 보세요.";
      hintBox.hidden = true;
      input.disabled = true;
      var idx = SCENARIOS.indexOf(scenario);
      var nextScenario = SCENARIOS[idx + 1];
      var lesson = lessonById(scenario.lesson);
      completeArea.innerHTML = "";
      completeArea.appendChild(el("div", { class: "complete-box" }, [
        el("h3", { text: "🎉 실습 완료: " + scenario.title }),
        el("div", { class: "btn-row" }, [
          nextScenario ? el("a", { class: "btn", href: "#/practice/" + nextScenario.id, text: "다음 실습 →" }) : null,
          lesson ? el("a", { class: "btn ghost", href: "#/lesson/" + lesson.id, text: "관련 가이드 보기" }) : null,
          el("button", { class: "btn ghost", type: "button", text: "다시 하기", onclick: function () { renderPractice(id); } })
        ])
      ]));
      toast("실습 완료! 🎉");
    }

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        var value = input.value;
        if (!value.trim()) return;
        input.value = "";
        submit({ text: value });
      } else if (event.key === "Tab" && event.shiftKey) {
        event.preventDefault();
        submit({ key: "shift+tab" });
      } else if (event.key === "Escape") {
        event.preventDefault();
        pressEsc();
      }
    });

    function pressEsc() {
      if (input.value) { input.value = ""; return; }
      var now = Date.now();
      if (now - lastEsc < 700) { lastEsc = 0; submit({ key: "esc-esc" }); }
      else { lastEsc = now; toast("Esc 한 번: 작업 멈추기 · 빈 입력창에서 두 번: 되돌리기 메뉴"); }
    }

    keyShift.addEventListener("click", function () { submit({ key: "shift+tab" }); input.focus(); });
    keyEsc.addEventListener("click", function () { pressEsc(); input.focus(); });
    keySend.addEventListener("click", function () {
      var value = input.value;
      if (!value.trim()) { input.focus(); return; }
      input.value = "";
      submit({ text: value });
      input.focus();
    });
    hintBtn.addEventListener("click", function () { hintBox.hidden = !hintBox.hidden; });
    resetBtn.addEventListener("click", function () { renderPractice(id); });
    screen.addEventListener("click", function () { if (!input.disabled) input.focus(); });

    main.innerHTML = "";
    main.appendChild(el("div", { class: "content" }, [
      el("div", { class: "article" }, [
        el("h1", { text: "💻 " + scenario.title }),
        el("p", { text: scenario.description })
      ]),
      goalBox, screen, keybar, completeArea
    ]));

    printLine("dim:가상 터미널 연습장 — 실제 명령은 실행되지 않습니다.");
    if (mode === "claude") {
      printLine("claude:✻ Claude Code");
      printLine("dim:  cwd: C:\\Users\\me\\my-first-project");
    }
    paintPrompt();
    paintGoal();
    window.scrollTo(0, 0);
    // 폰에서는 화면 키보드가 갑자기 올라오지 않도록 넓은 화면에서만 자동 포커스
    if (window.matchMedia && window.matchMedia("(min-width: 901px)").matches) input.focus();
  }

  // ── 인쇄 ──────────────────────────────────────────────────
  // Android 앱의 WebView는 window.print()를 지원하지 않아서, 앱이 넣어 주는
  // AndroidPrint.print()로 기기의 인쇄 화면(PDF 저장 포함)을 연다.
  var pendingPrintAll = false;

  function printBar(buttons) {
    return el("div", { class: "print-bar no-print" }, buttons);
  }

  function printNow(jobName) {
    // 접혀 있는 퀴즈 정답도 인쇄되도록 모두 펼친다
    Array.prototype.forEach.call(document.querySelectorAll("details"), function (d) { d.open = true; });
    if (window.AndroidPrint && typeof window.AndroidPrint.print === "function") {
      window.AndroidPrint.print(jobName);
    } else {
      window.print();
    }
  }

  function printAll() {
    if (location.hash === "#/print") {
      printNow("클로드 코드 첫걸음 - 전체");
      return;
    }
    pendingPrintAll = true;
    location.hash = "#/print";
  }

  function renderPrintAll() {
    var sections = LESSONS.map(function (lesson) {
      var article = el("article", { class: "article print-lesson", html: lesson.html });
      enhanceArticle(article, lesson.id);
      return article;
    });
    var cover = el("section", { class: "article print-cover" }, [
      el("h1", { text: "클로드 코드 첫걸음" }),
      el("p", { text: "개발 초보자를 위한 Claude Code 사용법 가이드" }),
      el("p", { class: "print-date", text: "내용 최종 확인일: " + DATA.lastVerified }),
      el("h2", { text: "차례" }),
      el("ol", { class: "print-toc" }, LESSONS.map(function (lesson) {
        return el("li", { text: lesson.title.replace(/^\d+\.\s*/, "") + " (" + lesson.duration + ")" });
      }))
    ]);
    main.innerHTML = "";
    main.appendChild(el("div", { class: "content" }, [
      printBar([
        el("button", { class: "btn", type: "button", text: "🖨 인쇄하기",
          onclick: function () { printNow("클로드 코드 첫걸음 - 전체"); } }),
        el("a", { class: "btn ghost", href: "#/", text: "← 홈으로" })
      ]),
      cover
    ].concat(sections)));
    window.scrollTo(0, 0);
    if (pendingPrintAll) {
      pendingPrintAll = false;
      // 화면이 다 그려진 뒤에 인쇄 창을 연다
      setTimeout(function () { printNow("클로드 코드 첫걸음 - 전체"); }, 300);
    }
  }

  function renderNotFound() {
    main.innerHTML = "";
    main.appendChild(el("div", { class: "content article" }, [
      el("h1", { text: "페이지를 찾을 수 없어요" }),
      el("p", {}, [el("a", { href: "#/", text: "홈으로 가기" })])
    ]));
  }

  // ── 라우팅 ────────────────────────────────────────────────
  function route() {
    document.body.classList.remove("nav-open");
    var hash = location.hash || "#/";
    var parts = hash.replace(/^#\/?/, "").split("/");
    if (!parts[0]) renderHome();
    else if (parts[0] === "lesson") renderLesson(decodeURIComponent(parts[1] || ""));
    else if (parts[0] === "practice" && parts[1]) renderPractice(decodeURIComponent(parts[1]));
    else if (parts[0] === "practice") renderPracticeList();
    else if (parts[0] === "print") renderPrintAll();
    else renderNotFound();
    renderNav();
    renderProgressPill();
  }

  window.addEventListener("hashchange", route);
  applyTheme();
  route();
})();
