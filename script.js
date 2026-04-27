// script.js - The Ledger

let cases = JSON.parse(localStorage.getItem("ledger_cases")) || [];
let activeCaseId = localStorage.getItem("ledger_active_case") || null;

/* ===== APP START ===== */

document.addEventListener("DOMContentLoaded", () => {
  bindButtons();
  bindTabs();
  renderCases();
  loadActiveCase();
});

/* ===== SCREEN FLOW ===== */

function showMission(type) {
  document.getElementById("startScreen")?.classList.add("hidden");
  document.getElementById("missionScreen")?.classList.remove("hidden");
  document.getElementById("ledgerApp")?.classList.add("hidden");

  localStorage.setItem("ledger_case_type", type);

  const missionTitle = document.getElementById("missionTitle");
  const missionText = document.getElementById("missionText");

  if (type === "business") {
    missionTitle.textContent = "Business Dispute";

    missionText.innerHTML = `
      The Ledger helps businesses organize civil disputes, customer conflicts,
      vendor issues, damages, communications, and documentation.
      <br><br>
      When records are scattered, pressure wins. When records are organized,
      the facts start carrying their own weight.
    `;
  } else {
    missionTitle.textContent = "Personal Civil Case";

    missionText.innerHTML = `
      The Ledger helps people organize personal civil disputes, damages,
      records, messages, timelines, and supporting evidence.
      <br><br>
      Your facts already matter. The Ledger helps keep them clean, structured,
      and ready.
    `;
  }
}

function enterLedgerApp() {
  document.getElementById("startScreen")?.classList.add("hidden");
  document.getElementById("missionScreen")?.classList.add("hidden");
  document.getElementById("ledgerApp")?.classList.remove("hidden");

  renderCases();
  loadActiveCase();
}

/* ===== STORAGE ===== */

function saveCases() {
  localStorage.setItem("ledger_cases", JSON.stringify(cases));
}

function saveActiveCaseId() {
  if (activeCaseId) {
    localStorage.setItem("ledger_active_case", activeCaseId);
  } else {
    localStorage.removeItem("ledger_active_case");
  }
}

/* ===== HELPERS ===== */

function getActiveCase() {
  return cases.find((c) => String(c.id) === String(activeCaseId));
}

function safeText(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}

function clearValue(id) {
  const el = document.getElementById(id);
  if (el) el.value = "";
}

function cleanFileName(name) {
  return String(name || "ledger_case")
    .trim()
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

/* ===== BUTTONS ===== */

function bindButtons() {
  document.getElementById("newCaseBtn")?.addEventListener("click", createNewCase);
  document.getElementById("deleteCaseBtn")?.addEventListener("click", deleteActiveCase);

  document.getElementById("exportCaseBtn")?.addEventListener("click", exportActiveCase);
  document.getElementById("importCaseBtn")?.addEventListener("click", () => {
    document.getElementById("importCaseFile")?.click();
  });
  document.getElementById("importCaseFile")?.addEventListener("change", importCaseFile);

  document.getElementById("addTimelineBtn")?.addEventListener("click", addTimelineEvent);
  document.getElementById("addEvidenceBtn")?.addEventListener("click", addEvidenceItem);
  document.getElementById("addDamageBtn")?.addEventListener("click", addDamageItem);
  document.getElementById("addDocumentBtn")?.addEventListener("click", addDocumentItem);

  document.getElementById("copySummaryBtn")?.addEventListener("click", copySummary);
  document.getElementById("caseSearch")?.addEventListener("input", renderCases);
}

/* ===== TABS ===== */

function bindTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(target)?.classList.add("active");

      buildSummary();
    });
  });
}

/* ===== CASES ===== */

function createNewCase() {
  const name = prompt("Name this civil case:");
  if (!name || !name.trim()) return;

  const newCase = {
    id: Date.now(),
    name: name.trim(),
    type: localStorage.getItem("ledger_case_type") || "personal",
    createdAt: new Date().toISOString(),
    timeline: [],
    evidence: [],
    damages: [],
    documents: []
  };

  cases.unshift(newCase);
  activeCaseId = newCase.id;

  saveCases();
  saveActiveCaseId();

  renderCases();
  loadActiveCase();
}

function deleteActiveCase() {
  const activeCase = getActiveCase();

  if (!activeCase) {
    alert("No case selected.");
    return;
  }

  const confirmed = confirm(`Delete "${activeCase.name}"? This cannot be undone.`);
  if (!confirmed) return;

  cases = cases.filter((c) => String(c.id) !== String(activeCaseId));
  activeCaseId = cases.length ? cases[0].id : null;

  saveCases();
  saveActiveCaseId();

  renderCases();
  loadActiveCase();
}

function renderCases() {
  const list = document.getElementById("caseList");
  const searchValue = document.getElementById("caseSearch")?.value.toLowerCase() || "";

  if (!list) return;

  list.innerHTML = "";

  const filteredCases = cases.filter((c) =>
    c.name.toLowerCase().includes(searchValue)
  );

  if (!filteredCases.length) {
    list.innerHTML = `<li class="empty-state">No cases found.</li>`;
    return;
  }

  filteredCases.forEach((c) => {
    const li = document.createElement("li");

    li.className =
      String(c.id) === String(activeCaseId)
        ? "case-item active"
        : "case-item";

    li.innerHTML = `
      <strong>${safeText(c.name)}</strong>
      <span>${new Date(c.createdAt).toLocaleDateString()}</span>
    `;

    li.addEventListener("click", () => {
      activeCaseId = c.id;
      saveActiveCaseId();
      renderCases();
      loadActiveCase();
    });

    list.appendChild(li);
  });
}

function loadActiveCase() {
  if (!activeCaseId && cases.length) {
    activeCaseId = cases[0].id;
    saveActiveCaseId();
  }

  const activeCase = getActiveCase();
  const title = document.getElementById("activeCaseTitle");

  if (!activeCase) {
    if (title) title.textContent = "No Case Selected";
    clearAllLists();
    updateCounts(null);
    buildSummary();
    return;
  }

  if (title) title.textContent = activeCase.name;

  renderActiveCaseData();
}

/* ===== IMPORT / EXPORT ===== */

function exportActiveCase() {
  const activeCase = getActiveCase();

  if (!activeCase) {
    alert("No case selected.");
    return;
  }

  const exportData = {
    app: "The Ledger",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    case: activeCase
  };

  const data = JSON.stringify(exportData, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${cleanFileName(activeCase.name)}_ledger_case.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function importCaseFile(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);

      const importedCase = parsed.case || parsed;

      if (!importedCase || !importedCase.name) {
        alert("Invalid Ledger case file.");
        return;
      }

      const restoredCase = {
        id: Date.now(),
        name: importedCase.name,
        type: importedCase.type || "imported",
        createdAt: importedCase.createdAt || new Date().toISOString(),
        importedAt: new Date().toISOString(),
        timeline: Array.isArray(importedCase.timeline) ? importedCase.timeline : [],
        evidence: Array.isArray(importedCase.evidence) ? importedCase.evidence : [],
        damages: Array.isArray(importedCase.damages) ? importedCase.damages : [],
        documents: Array.isArray(importedCase.documents) ? importedCase.documents : []
      };

      cases.unshift(restoredCase);
      activeCaseId = restoredCase.id;

      saveCases();
      saveActiveCaseId();

      renderCases();
      loadActiveCase();

      alert("Case imported successfully.");
    } catch (error) {
      alert("Could not import this file.");
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

/* ===== ADD DATA ===== */

function addTimelineEvent() {
  const activeCase = getActiveCase();
  if (!activeCase) return alert("Create or select a case first.");

  const date = document.getElementById("timelineDate")?.value || "";
  const title = document.getElementById("timelineTitle")?.value.trim() || "";
  const notes = document.getElementById("timelineNotes")?.value.trim() || "";

  if (!title) return alert("Timeline event needs a title.");

  activeCase.timeline.push({
    id: Date.now(),
    date,
    title,
    notes
  });

  clearValue("timelineDate");
  clearValue("timelineTitle");
  clearValue("timelineNotes");

  saveCases();
  renderActiveCaseData();
}

function addEvidenceItem() {
  const activeCase = getActiveCase();
  if (!activeCase) return alert("Create or select a case first.");

  const title = document.getElementById("evidenceTitle")?.value.trim() || "";
  const type = document.getElementById("evidenceType")?.value.trim() || "";
  const notes = document.getElementById("evidenceNotes")?.value.trim() || "";

  if (!title) return alert("Evidence item needs a title.");

  activeCase.evidence.push({
    id: Date.now(),
    title,
    type,
    notes
  });

  clearValue("evidenceTitle");
  clearValue("evidenceType");
  clearValue("evidenceNotes");

  saveCases();
  renderActiveCaseData();
}

function addDamageItem() {
  const activeCase = getActiveCase();
  if (!activeCase) return alert("Create or select a case first.");

  const title = document.getElementById("damageTitle")?.value.trim() || "";
  const amount = document.getElementById("damageAmount")?.value || "";
  const notes = document.getElementById("damageNotes")?.value.trim() || "";

  if (!title) return alert("Damage item needs a title.");

  activeCase.damages.push({
    id: Date.now(),
    title,
    amount,
    notes
  });

  clearValue("damageTitle");
  clearValue("damageAmount");
  clearValue("damageNotes");

  saveCases();
  renderActiveCaseData();
}

function addDocumentItem() {
  const activeCase = getActiveCase();
  if (!activeCase) return alert("Create or select a case first.");

  const title = document.getElementById("documentTitle")?.value.trim() || "";
  const category = document.getElementById("documentCategory")?.value.trim() || "";
  const notes = document.getElementById("documentNotes")?.value.trim() || "";

  if (!title) return alert("Document needs a title.");

  activeCase.documents.push({
    id: Date.now(),
    title,
    category,
    notes
  });

  clearValue("documentTitle");
  clearValue("documentCategory");
  clearValue("documentNotes");

  saveCases();
  renderActiveCaseData();
}

/* ===== RENDER DATA ===== */

function renderActiveCaseData() {
  const activeCase = getActiveCase();

  if (!activeCase) {
    clearAllLists();
    updateCounts(null);
    buildSummary();
    return;
  }

  renderTimeline(activeCase.timeline);
  renderEvidence(activeCase.evidence);
  renderDamages(activeCase.damages);
  renderDocuments(activeCase.documents);

  updateCounts(activeCase);
  buildSummary();
}

function renderTimeline(items) {
  const list = document.getElementById("timelineList");
  if (!list) return;

  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<li class="empty-state">No timeline events yet.</li>`;
    return;
  }

  items
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .forEach((item) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <strong>${safeText(item.title)}</strong>
        <span>${safeText(item.date || "No date")}</span>
        <p>${safeText(item.notes)}</p>
        <button class="delete-item-btn" onclick="deleteItem('timeline', ${item.id})">Delete</button>
      `;

      list.appendChild(li);
    });
}

function renderEvidence(items) {
  const list = document.getElementById("evidenceList");
  if (!list) return;

  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<li class="empty-state">No evidence added yet.</li>`;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${safeText(item.title)}</strong>
      <span>${safeText(item.type || "Uncategorized")}</span>
      <p>${safeText(item.notes)}</p>
      <button class="delete-item-btn" onclick="deleteItem('evidence', ${item.id})">Delete</button>
    `;

    list.appendChild(li);
  });
}

function renderDamages(items) {
  const list = document.getElementById("damagesList");
  if (!list) return;

  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<li class="empty-state">No damages added yet.</li>`;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${safeText(item.title)}</strong>
      <span>$${safeText(item.amount || "0")}</span>
      <p>${safeText(item.notes)}</p>
      <button class="delete-item-btn" onclick="deleteItem('damages', ${item.id})">Delete</button>
    `;

    list.appendChild(li);
  });
}

function renderDocuments(items) {
  const list = document.getElementById("documentsList");
  if (!list) return;

  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<li class="empty-state">No documents added yet.</li>`;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${safeText(item.title)}</strong>
      <span>${safeText(item.category || "General")}</span>
      <p>${safeText(item.notes)}</p>
      <button class="delete-item-btn" onclick="deleteItem('documents', ${item.id})">Delete</button>
    `;

    list.appendChild(li);
  });
}

function clearAllLists() {
  ["timelineList", "evidenceList", "damagesList", "documentsList"].forEach((id) => {
    const list = document.getElementById(id);
    if (list) list.innerHTML = "";
  });
}

/* ===== DELETE ITEMS ===== */

function deleteItem(section, itemId) {
  const activeCase = getActiveCase();
  if (!activeCase) return;

  activeCase[section] = activeCase[section].filter((item) => item.id !== itemId);

  saveCases();
  renderActiveCaseData();
}

/* ===== COUNTS ===== */

function updateCounts(activeCase) {
  document.getElementById("timelineCount").textContent =
    activeCase ? activeCase.timeline.length : 0;

  document.getElementById("evidenceCount").textContent =
    activeCase ? activeCase.evidence.length : 0;

  document.getElementById("damagesCount").textContent =
    activeCase ? activeCase.damages.length : 0;

  document.getElementById("docsCount").textContent =
    activeCase ? activeCase.documents.length : 0;
}

/* ===== SUMMARY ===== */

function buildSummary() {
  const activeCase = getActiveCase();
  const summaryBox = document.getElementById("caseSummary");

  if (!summaryBox) return;

  if (!activeCase) {
    summaryBox.value = "";
    return;
  }

  let summary = "";

  summary += `THE LEDGER CASE SUMMARY\n`;
  summary += `=======================\n\n`;
  summary += `CASE NAME: ${activeCase.name}\n`;
  summary += `CASE TYPE: ${activeCase.type || "Civil"}\n`;
  summary += `CREATED: ${new Date(activeCase.createdAt).toLocaleString()}\n`;
  if (activeCase.importedAt) {
    summary += `IMPORTED: ${new Date(activeCase.importedAt).toLocaleString()}\n`;
  }

  summary += `\nTIMELINE\n`;
  summary += `--------\n`;
  if (activeCase.timeline.length) {
    activeCase.timeline.forEach((item, index) => {
      summary += `${index + 1}. ${item.date || "No date"} | ${item.title}\n`;
      if (item.notes) summary += `   Notes: ${item.notes}\n`;
    });
  } else {
    summary += `No timeline events added.\n`;
  }

  summary += `\nEVIDENCE\n`;
  summary += `--------\n`;
  if (activeCase.evidence.length) {
    activeCase.evidence.forEach((item, index) => {
      summary += `${index + 1}. ${item.title}`;
      if (item.type) summary += ` (${item.type})`;
      summary += `\n`;
      if (item.notes) summary += `   Notes: ${item.notes}\n`;
    });
  } else {
    summary += `No evidence added.\n`;
  }

  summary += `\nDAMAGES\n`;
  summary += `-------\n`;
  if (activeCase.damages.length) {
    let total = 0;

    activeCase.damages.forEach((item, index) => {
      const amount = Number(item.amount || 0);
      total += amount;

      summary += `${index + 1}. ${item.title}: $${amount.toFixed(2)}\n`;
      if (item.notes) summary += `   Notes: ${item.notes}\n`;
    });

    summary += `\nTOTAL LISTED DAMAGES: $${total.toFixed(2)}\n`;
  } else {
    summary += `No damages added.\n`;
  }

  summary += `\nDOCUMENTS\n`;
  summary += `---------\n`;
  if (activeCase.documents.length) {
    activeCase.documents.forEach((item, index) => {
      summary += `${index + 1}. ${item.title}`;
      if (item.category) summary += ` (${item.category})`;
      summary += `\n`;
      if (item.notes) summary += `   Notes: ${item.notes}\n`;
    });
  } else {
    summary += `No documents added.\n`;
  }

  summaryBox.value = summary;
}

function copySummary() {
  const summaryBox = document.getElementById("caseSummary");

  if (!summaryBox || !summaryBox.value.trim()) {
    alert("No summary to copy.");
    return;
  }

  summaryBox.select();
  summaryBox.setSelectionRange(0, 99999);

  navigator.clipboard
    .writeText(summaryBox.value)
    .then(() => alert("Case summary copied."))
    .catch(() => {
      document.execCommand("copy");
      alert("Case summary copied.");
    });
    }
