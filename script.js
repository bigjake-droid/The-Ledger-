// script.js

document.addEventListener("DOMContentLoaded", () => {
  initSmoothScroll();
  initStartButton();
  initHeaderShadow();
});

/* Smooth section scrolling */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

/* Start case button */
function initStartButton() {
  const startBtn = document.getElementById("startCaseBtn");

  if (!startBtn) return;

  startBtn.addEventListener("click", () => {
    const caseName = prompt("Name this civil case:");

    if (!caseName || !caseName.trim()) return;

    const newCase = {
      id: Date.now(),
      name: caseName.trim(),
      type: "Civil",
      createdAt: new Date().toISOString(),
      timeline: [],
      evidence: [],
      damages: [],
      documents: []
    };

    const savedCases =
      JSON.parse(localStorage.getItem("ledger_cases")) || [];

    savedCases.push(newCase);

    localStorage.setItem("ledger_cases", JSON.stringify(savedCases));

    alert(`Case created: ${newCase.name}`);
  });
}

/* Header shadow on scroll */
function initHeaderShadow() {
  const header = document.querySelector(".site-header");

  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}
