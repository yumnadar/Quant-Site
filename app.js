const QUESTIONS = window.QUESTIONS || [];
const CONTENT = window.CONTENT || {};
const GROUPS = window.GROUPS || [];
const TOPICS = [...new Set(QUESTIONS.map(q => q.topic))].sort();
const $ = id => document.getElementById(id);
const norm = s => String(s).trim().toLowerCase();

// Topics you've reviewed, questions missed is remembered in browser's own storage

const KEYS = {
  reviewed: "topic-notes-reviewed",
  missed: "topic-notes-missed",
  collapsed: "topic-notes-collapsed",
  mode: "topic-notes-mode"
};

function loadSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key)) || []);
  } catch {
    return new Set();
  }
}

function saveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
  }
}

function loadValue(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function saveValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}

function buildTree() {
  const assigned = new Set();
  const tree = [];
  GROUPS.forEach(group => {
    const subs = [];
    group.topics.forEach(wanted => {
      TOPICS.filter(t => norm(t) === norm(wanted)).forEach(t => {
        if (!subs.includes(t)) {
          subs.push(t);
          assigned.add(t);
        }
      });
    });
    if (subs.length) tree.push({ name: group.name, topics: subs });
  });
  const leftovers = TOPICS.filter(t => !assigned.has(t)).sort();
  if (leftovers.length) tree.push({ name: "Other", topics: leftovers });
  return tree;
}

const TREE = buildTree();

function groupNameFor(topic) {
  const g = TREE.find(group => group.topics.includes(topic));
  return g ? g.name : "";
}

const state = {
  view: "sheet",     
  topic: null,       // which topic page is open
  question: null,    
  focus: null,       
  query: "",         // what's typed in the search box
  reviewed: loadSet(KEYS.reviewed),
  missed: loadSet(KEYS.missed),
  collapsed: loadSet(KEYS.collapsed),          
  tapMode: loadValue(KEYS.mode, "open")        
};

const topicColor = topic =>
  `hsl(${Math.round((TOPICS.indexOf(topic) * 360) / TOPICS.length)} 52% 52%)`;
const questionsFor = topic => QUESTIONS.filter(q => q.topic === topic);
const questionBy = number => QUESTIONS.find(q => q.number === number);
const contentFor = topic => CONTENT[topic] || { summary: "", notes: [], videos: [] };

function topicMatches(topic) {
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  if (topic.toLowerCase().includes(q)) return true;
  if (groupNameFor(topic).toLowerCase().includes(q)) return true;
  if (/^\d+$/.test(q) && questionsFor(topic).some(x => String(x.number).startsWith(q))) return true;
  return false;
}

function showSheet(question = null) {
  state.view = "sheet";
  state.question = question;
  state.topic = null;
  state.focus = null;
  render();
  $("page").focus();
}

function showTopic(topic, focus = null) {
  state.view = "topic";
  state.topic = topic;
  state.focus = focus;
  render();
  $("page").focus();
}

function toggleReviewed(topic) {
  state.reviewed.has(topic) ? state.reviewed.delete(topic) : state.reviewed.add(topic);
  saveSet(KEYS.reviewed, state.reviewed);
  render();
}

function toggleMissed(number) {
  state.missed.has(number) ? state.missed.delete(number) : state.missed.add(number);
  saveSet(KEYS.missed, state.missed);
  render();
}

function toggleGroup(name) {
  state.collapsed.has(name) ? state.collapsed.delete(name) : state.collapsed.add(name);
  saveSet(KEYS.collapsed, state.collapsed);
  render();
}

function setTapMode(mode) {
  state.tapMode = mode;
  saveValue(KEYS.mode, mode);
  render();
}

// sidebar 
function renderSidebar() {
  $("sheet-link").setAttribute("aria-current", String(state.view === "sheet"));
  $("missed-tally").textContent = state.missed.size ? `${state.missed.size} missed` : "";
  const list = $("topic-list");
  list.innerHTML = "";
  const searching = state.query.trim().length > 0;
  let shownTopics = 0;
  TREE.forEach(group => {
    const hits = group.topics.filter(topicMatches);
    if (searching && !hits.length) return; 
    const subs = searching ? hits : group.topics;
    shownTopics += subs.length;
    const open = searching || !state.collapsed.has(group.name);
    const count = group.topics.reduce((n, t) => n + questionsFor(t).length, 0);
    const li = document.createElement("li");
    li.className = "group";
    const header = document.createElement("button");
    header.type = "button";
    header.className = "group-head";
    header.setAttribute("aria-expanded", String(open));
    header.innerHTML = `
      <span class="caret" aria-hidden="true">&#9656;</span>
      <span class="group-name">${highlight(group.name)}</span>
      <span class="tally">${count}</span>`;
    header.addEventListener("click", () => toggleGroup(group.name));
    li.appendChild(header);
    const sublist = document.createElement("ul");
    sublist.className = "sublist";
    sublist.hidden = !open;
    subs.forEach(topic => {
      const subLi = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "topic-button";
      button.setAttribute(
        "aria-current",
        String(state.view === "topic" && topic === state.topic)
      );
      button.innerHTML = `
        <span class="swatch" style="background:${topicColor(topic)}"></span>
        <span class="topic-name">${highlight(topic)}</span>
        ${state.reviewed.has(topic) ? '<span class="done-tick" aria-label="reviewed">&#10003;</span>' : ""}
        <span class="tally">${questionsFor(topic).length}</span>`;
      button.addEventListener("click", () => showTopic(topic));
      subLi.appendChild(button);
      sublist.appendChild(subLi);
    });
    li.appendChild(sublist);
    list.appendChild(li);
  });
  if (searching && shownTopics === 0) {
    list.innerHTML = `<li><p class="no-hits">No topic, category, or question matches "${escapeHtml(state.query)}".</p></li>`;
  }
  $("search-status").textContent = state.query
    ? `${shownTopics} of ${TOPICS.length} topics`
    : "";
  const done = TOPICS.filter(t => state.reviewed.has(t)).length;
  $("progress-label").textContent = `${done} of ${TOPICS.length} reviewed`;
  $("progress-fill").style.width = `${TOPICS.length ? (done / TOPICS.length) * 100 : 0}%`;
}

function highlight(text) {
  const query = state.query.trim();
  if (!query) return escapeHtml(text);
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, at)) +
    "<mark>" +
    escapeHtml(text.slice(at, at + query.length)) +
    "</mark>" +
    escapeHtml(text.slice(at + query.length))
  );
}

function renderSheet() {
  const opening = state.tapMode === "open";
  $("page").innerHTML = `
    <header class="page-head">
      <p class="eyebrow">${QUESTIONS.length} questions &middot; ${TOPICS.length} topics</p>
      <h1>Which one did you miss?</h1>
      <p class="summary">Every question on the test, grouped by what it's testing.
        Tap one to ${opening ? "jump to its resources" : "mark it missed"} — and a
        study list builds itself from whatever you mark.</p>
    </header>
    <section class="block">
      <div class="sheet-toolbar">
        <span class="toolbar-label">Tapping a number</span>
        <div class="segmented" role="group" aria-label="What tapping a question does">
          <button type="button" class="seg ${opening ? "on" : ""}" data-mode="open" aria-pressed="${opening}">Opens resources</button>
          <button type="button" class="seg ${opening ? "" : "on"}" data-mode="mark" aria-pressed="${!opening}">Marks missed</button>
        </div>
      </div>
      <div id="grid" class="grid" role="group" aria-label="Question numbers"></div>
      <p class="sheet-hint">${opening
        ? "Tip: switch to <b>Marks missed</b> to record a whole test quickly."
        : "Tip: switch to <b>Opens resources</b> to jump straight to a topic page."}</p>
    </section>
    ${studyListHtml()}`;

  const grid = $("grid");
  QUESTIONS.forEach(q => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.textContent = q.number;
    tile.style.setProperty("--topic-color", topicColor(q.topic));
    tile.classList.toggle("marked", state.missed.has(q.number));
    tile.setAttribute(
      "aria-label",
      `Question ${q.number}, ${q.topic}. ${opening ? "Opens its resources." : "Marks it missed."}`
    );
    tile.addEventListener("click", () => {
      if (state.tapMode === "mark") toggleMissed(q.number);
      else showTopic(q.topic, q.number);
    });
    grid.appendChild(tile);
  });
  // toolbar + study list wiring
  $("page").querySelectorAll("[data-mode]").forEach(btn =>
    btn.addEventListener("click", () => setTapMode(btn.dataset.mode))
  );
  wireStudyList();
}

function studyListHtml() {
  const missed = QUESTIONS.filter(q => state.missed.has(q.number));
  if (!missed.length) return "";
  const topics = [...new Set(missed.map(q => q.topic))].sort(
    (a, b) =>
      missed.filter(q => q.topic === b).length - missed.filter(q => q.topic === a).length

  );
  return `
    <section class="block study">
      <h2>Your study list</h2>
      <p class="selection-line">${missed.length} question${missed.length === 1 ? "" : "s"}
        missed across ${topics.length} topic${topics.length === 1 ? "" : "s"}. Worst first.</p>
      <ul class="study-list">
        ${topics
          .map(topic => {
            const numbers = missed.filter(q => q.topic === topic).map(q => q.number);
            return `
              <li>
                <button type="button" class="study-row" data-topic="${escapeHtml(topic)}">
                  <span class="swatch" style="background:${topicColor(topic)}"></span>
                  <span class="study-name">${escapeHtml(topic)}</span>
                  <span class="tally">${numbers.map(n => "Q" + n).join(" ")}</span>
                  <span class="go">&rarr;</span>
                </button>
              </li>`;
          })
          .join("")}
      </ul>
      <button type="button" class="link-button" id="clear-missed">Clear all marks</button>
    </section>`;
}

function wireStudyList() {
  $("page")
    .querySelectorAll("[data-topic]")
    .forEach(button =>
      button.addEventListener("click", () => showTopic(button.dataset.topic))
    );
  const clear = $("clear-missed");
  if (clear)
    clear.addEventListener("click", () => {
      state.missed.clear();
      saveSet(KEYS.missed, state.missed);
      render();
    });
}

function renderTopic() {
  const topic = state.topic;
  const info = contentFor(topic);
  const questions = questionsFor(topic);
  const reviewed = state.reviewed.has(topic);
  const focus = state.focus !== null ? questionBy(state.focus) : null;
  const parent = groupNameFor(topic);
  $("page").innerHTML = `
    <header class="page-head">
      <button type="button" class="back" id="back-to-sheet">&larr; Answer sheet</button>
      <p class="eyebrow">
        <span class="swatch" style="background:${topicColor(topic)}"></span>
        ${parent ? escapeHtml(parent) + " &middot; " : ""}${questions.length} question${questions.length === 1 ? "" : "s"} on the test
      </p>
      <h1>${escapeHtml(topic)}</h1>
      ${info.summary
        ? `<p class="summary">${escapeHtml(info.summary)}</p>`
        : `<p class="summary placeholder">No summary yet. Add one in <code>content.js</code> under <code>${escapeHtml(topic)}</code>.</p>`}
      ${info.source && info.source.url
        ? `<p class="summary-source">Source: <a href="${escapeHtml(info.source.url)}" target="_blank" rel="noopener">${escapeHtml(info.source.name || "source")}</a></p>`
        : ""}
      <div class="page-actions">
        <button type="button" class="tick-button" id="tick" aria-pressed="${reviewed}">
          ${reviewed ? "&#10003; Reviewed" : "Mark as reviewed"}
        </button>
      </div>
    </header>
    ${focus
      ? `<div class="focus-bar">
           <span class="focus-q">From Q${focus.number}</span>
           <button type="button" class="tick-button small" id="focus-miss" aria-pressed="${state.missed.has(focus.number)}">
             ${state.missed.has(focus.number) ? "&#10003; Marked missed" : "Mark Q" + focus.number + " missed"}
           </button>
         </div>`
      : ""}
    <section class="block">
      <h2>Practice links</h2>
      ${sourcesHtml(mergeSources(questions))}
    </section>
    <section class="block">
      <h2>Notes</h2>
      ${info.notes && info.notes.length
        ? info.notes.map(p => `<p>${escapeHtml(p)}</p>`).join("")
        : placeholder("notes", topic, "add paragraphs to the notes list")}
    </section>
    <section class="block">
      <h2>Videos</h2>
      ${info.videos && info.videos.length
        ? `<ul class="video-list">${info.videos
            .map(
              v => `<li><a href="${escapeHtml(v.url)}" target="_blank" rel="noopener"><span class="play">&#9654;</span><span>${escapeHtml(v.title)}</span></a></li>`
            )
            .join("")}</ul>`
        : placeholder("videos", topic, "add { title, url } entries to the videos list")}
    </section>
    <section class="block">
      <h2>Questions this covers</h2>
      <p class="selection-line">Tap a number to mark it missed (or clear it).</p>
      <div class="q-numbers">
        ${questions
          .map(
            q => `<button type="button" class="q-pill ${state.missed.has(q.number) ? "missed" : ""} ${focus && q.number === focus.number ? "current" : ""}"
              data-miss="${q.number}">Q${q.number}</button>`
          )
          .join("")}
      </div>
    </section>`;
  $("tick").addEventListener("click", () => toggleReviewed(topic));
  $("back-to-sheet").addEventListener("click", () => showSheet());
  const focusMiss = $("focus-miss");
  if (focusMiss) focusMiss.addEventListener("click", () => toggleMissed(focus.number));
  $("page")
    .querySelectorAll("[data-miss]")
    .forEach(pill =>
      pill.addEventListener("click", () => toggleMissed(Number(pill.dataset.miss)))
    );
}

function placeholder(what, topic, how) {
  return `<p class="placeholder">No ${what} yet. Open <code>content.js</code>, find
    <code>${escapeHtml(topic)}</code>, and ${how}.</p>`;
}

function sourcesHtml(sources) {
  if (!sources.length) return `<p class="placeholder">No practice links for this topic.</p>`;
  return sources
    .map(
      source => `
      <div class="source">
        <h3>${escapeHtml(source.name)}</h3>
        <div class="links">
          ${source.links
            .map(
              link => `<a class="chip" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

function mergeSources(questions) {
  const bySource = new Map();
  questions.forEach(q =>
    (q.sources || []).forEach(source => {
      if (!bySource.has(source.name)) bySource.set(source.name, new Map());
      const links = bySource.get(source.name);
      source.links.forEach(link => links.set(link.url, link));
    })
  );
  return [...bySource].map(([name, links]) => ({ name, links: [...links.values()] }));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function render() {
  renderSidebar();
  state.view === "topic" ? renderTopic() : renderSheet();
}

$("stat-topics").textContent = TOPICS.length;
$("stat-questions").textContent = QUESTIONS.length;
$("sheet-link").addEventListener("click", () => showSheet());
$("search").addEventListener("input", event => {
  state.query = event.target.value;
  renderSidebar();
});

$("search").addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  const q = state.query.trim();
  if (/^\d+$/.test(q)) {
    const hit = questionBy(Number(q));
    if (hit) {
      showTopic(hit.topic, hit.number);
      return;
    }
  }
  const first = TOPICS.filter(topicMatches)[0];
  if (first) showTopic(first);
});
$("reset-progress").addEventListener("click", () => {
  state.reviewed.clear();
  saveSet(KEYS.reviewed, state.reviewed);
  render();
});
render();
