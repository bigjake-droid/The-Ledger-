// ===== STORAGE =====
let cases = JSON.parse(localStorage.getItem("ledger_cases")) || [];
let activeCaseId = null;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  renderCases();
  setupTabs();
  bindButtons();
});

// ===== CASES =====
function renderCases() {
  const list = document.getElementById("caseList");
  list.innerHTML = "";

  cases.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c.name;
    li.className = "case-item";

    li.onclick = () => {
      activeCaseId = c.id;
      loadCase();
    };

    list.appendChild(li);
  });
}

function newCase() {
  const name = prompt("Case name?");
  if (!name) return;

  const newCase = {
    id: Date.now(),
    name,
    timeline: [],
    evidence: [],
    damages: [],
    documents: []
  };

  cases.push(newCase);
  save();
  renderCases();
}

function deleteCase() {
  if (!activeCaseId) return;

  cases = cases.filter(c => c.id !== activeCaseId);
  activeCaseId = null;

  save();
  renderCases();
  clearUI();
}

// ===== LOAD CASE =====
function getActiveCase() {
  return cases.find(c => c.id === activeCaseId);
}

function loadCase() {
  const c = getActiveCase();
  if (!c) return;

  document.getElementById("activeCaseTitle").textContent = c.name;

  renderList("timelineList", c.timeline);
  renderList("evidenceList", c.evidence);
  renderList("damagesList", c.damages);
  renderList("documentsList", c.documents);

  updateCounts();
  buildSummary();
}

// ===== LIST RENDER =====
function renderList(id, items) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";

  items.forEach(i => {
    const li = document.createElement("li");
    li.textContent = i.title || JSON.stringify(i);
    ul.appendChild(li);
  });
}

// ===== ADD ITEMS =====
function addTimeline() {
  const c = getActiveCase();
  if (!c) return;

  const item = {
    date: document.getElementById("timelineDate").value,
    title: document.getElementById("timelineTitle").value,
    notes: document.getElementById("timelineNotes").value
  };

  if (!item.title) return;

  c.timeline.push(item);
  save();
  loadCase();
}

function addEvidence() {
  const c = getActiveCase();
  if (!c) return;

  const item = {
    title: document.getElementById("evidenceTitle").value,
    type: document.getElementById("evidenceType").value,
    notes: document.getElementById("evidenceNotes").value
  };

  if (!item.title) return;

  c.evidence.push(item);
  save();
  loadCase();
}

function addDamage() {
  const c = getActiveCase();
  if (!c) return;

  const item = {
    title: document.getElementById("damageTitle").value,
    amount: document.getElementById("damageAmount").value,
    notes: document.getElementById("damageNotes").value
  };

  if (!item.title) return;

  c.damages.push(item);
  save();
  loadCase();
}

function addDocument() {
  const c = getActiveCase();
  if (!c) return;

  const item = {
    title: document.getElementById("documentTitle").value,
    category: document.getElementById("documentCategory").value,
    notes: document.getElementById("documentNotes").value
  };

  if (!item.title) return;

  c.documents.push(item);
  save();
  loadCase();
}

// ===== COUNTS =====
function updateCounts() {
  const c = getActiveCase();
  if (!c) return;

  document.getElementById("timelineCount").textContent = c.timeline.length;
  document.getElementById("evidenceCount").textContent = c.evidence.length;
  document.getElementById("damagesCount").textContent = c.damages.length;
  document.getElementById("docsCount").textContent = c.documents.length;
}

// ===== SUMMARY =====
function buildSummary() {
  const c = getActiveCase();
  if (!c) return;

  let summary = `CASE: ${c.name}\n\n`;

  summary += "TIMELINE:\n";
  c.timeline.forEach(t => {
    summary += `- ${t.date} | ${t.title}\n`;
  });

  summary += "\nEVIDENCE:\n";
  c.evidence.forEach(e => {
    summary += `- ${e.title} (${e.type})\n`;
  });

  summary += "\nDAMAGES:\n";
  c.damages.forEach(d => {
    summary += `- ${d.title}: $${d.amount}\n`;
  });

  document.getElementById("caseSummary").value = summary;
}

// ===== TABS =====
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    };
  });
}

// ===== BUTTONS =====
function bindButtons() {
  document.getElementById("newCaseBtn").onclick = newCase;
  document.getElementById("deleteCaseBtn").onclick = deleteCase;

  document.getElementById("addTimelineBtn").onclick = addTimeline;
  document.getElementById("addEvidenceBtn").onclick = addEvidence;
  document.getElementById("addDamageBtn").onclick = addDamage;
  document.getElementById("addDocumentBtn").onclick = addDocument;

  document.getElementById("copySummaryBtn").onclick = () => {
    const txt = document.getElementById("caseSummary");
    txt.select();
    document.execCommand("copy");
  };
}

// ===== UTILS =====
function clearUI() {
  document.getElementById("activeCaseTitle").textContent = "No Case Selected";

  ["timelineList","evidenceList","damagesList","documentsList"]
    .forEach(id => document.getElementById(id).innerHTML = "");

  ["timelineCount","evidenceCount","damagesCount","docsCount"]
    .forEach(id => document.getElementById(id).textContent = "0");

  document.getElementById("caseSummary").value = "";
}

function save() {
  localStorage.setItem("ledger_cases", JSON.stringify(cases));
}
