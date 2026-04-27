/* script.js */

const apps = [
  {
    id: "caseforge",
    title: "CaseForge",
    field: "Criminal Law",
    tagline: "Built for defense. Engineered for justice.",
    url: "#caseforge"
  },
  {
    id: "medforge",
    title: "MedForge",
    field: "Medical Law",
    tagline: "Protecting care. Defending life.",
    url: "#medforge"
  },
  {
    id: "ledger",
    title: "The Ledger",
    field: "Civil Law",
    tagline: "Record. Resolve. Restore order.",
    url: "#ledger"
  },
  {
    id: "xhr",
    title: "X-HR",
    field: "Labor Law",
    tagline: "Balancing rights. Building workplaces.",
    url: "#xhr"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  setActivePanelEffects();
  addPanelClickHandlers();
  addKeyboardSupport();
});

/* Hover / focus glow */
function setActivePanelEffects() {
  const panels = document.querySelectorAll(".panel");

  panels.forEach((panel) => {
    panel.addEventListener("mouseenter", () => {
      panels.forEach((p) => p.classList.remove("active"));
      panel.classList.add("active");
    });

    panel.addEventListener("mouseleave", () => {
      panel.classList.remove("active");
    });
  });
}

/* Click panels */
function addPanelClickHandlers() {
  const panels = document.querySelectorAll(".panel");

  panels.forEach((panel, index) => {
    panel.setAttribute("tabindex", "0");
    panel.setAttribute("role", "button");
    panel.setAttribute("aria-label", `Open ${apps[index].title}`);

    panel.addEventListener("click", () => {
      openApp(apps[index]);
    });
  });
}

/* Enter key support */
function addKeyboardSupport() {
  const panels = document.querySelectorAll(".panel");

  panels.forEach((panel, index) => {
    panel.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openApp(apps[index]);
      }
    });
  });
}

/* Temporary launch behavior */
function openApp(app) {
  console.log(`Opening ${app.title}`);

  const message = `${app.title}\n${app.field}\n\n${app.tagline}`;

  alert(message);

  // Later, replace alert with:
  // window.location.href = app.url;
}
