/* ==========================================================================
   FASTutor — Help Center behaviours
   Loaded after js/script.js, which already handles the header, the mobile menu
   and the FAQ accordion (.faq-item / .faq-toggle / .faq-content).
   This file adds: FAQ category tabs, help search, and the contact form.
   ========================================================================== */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     1. FAQ category tabs (click, ArrowLeft/ArrowRight, Home, End)
     ------------------------------------------------------------------------ */
  const faqBox = document.getElementById("faq-box");
  const tablist = faqBox ? faqBox.querySelector('[role="tablist"]') : null;
  const tabs = tablist ? Array.from(tablist.querySelectorAll('[role="tab"]')) : [];
  const panels = faqBox ? Array.from(faqBox.querySelectorAll(".faq-panel")) : [];

  function selectTab(tab, { focus = false } = {}) {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !active;
    });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      let next = null;
      if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
      else if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
      else if (event.key === "Home") next = tabs[0];
      else if (event.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        event.preventDefault();
        selectTab(next, { focus: true });
      }
    });
  });

  // Deep links: help-center.html#tab-groups or #tab-exam-rush open that category.
  function applyHash() {
    const match = tabs.find((t) => t.id === window.location.hash.slice(1));
    if (match) selectTab(match);
  }
  applyHash();
  window.addEventListener("hashchange", applyHash);

  /* ------------------------------------------------------------------------
     2. Search across FAQs and safety topics
     ------------------------------------------------------------------------ */
  const form = document.getElementById("help-search-form");
  const input = document.getElementById("help-search-input");
  const status = document.getElementById("help-status");
  const safetySection = document.getElementById("safety");
  const faqSection = document.getElementById("faq");
  const tiles = Array.from(document.querySelectorAll(".safety-tile"));
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));

  const normalise = (text) => text.toLowerCase().replace(/[^a-z0-9@.\s]+/g, " ").replace(/\s+/g, " ").trim();

  // Pre-compute searchable text: visible words plus the hidden data-keywords synonyms.
  [...tiles, ...faqItems].forEach((el) => {
    el.dataset.search = normalise(`${el.textContent} ${el.dataset.keywords || ""}`);
  });

  function setStatus(message, withContactLink = false) {
    status.textContent = message;
    if (withContactLink) {
      const link = document.createElement("a");
      link.href = "#contact";
      link.textContent = "Contact support";
      status.append(" ", link, ".");
    }
  }

  function resetSearch() {
    faqBox.classList.remove("is-searching");
    tiles.forEach((tile) => (tile.hidden = false));
    faqItems.forEach((item) => (item.hidden = false));
    safetySection.hidden = false;
    faqSection.hidden = false;
    // Back to the single active category
    const active = tabs.find((t) => t.classList.contains("is-active")) || tabs[0];
    selectTab(active);
    setStatus("");
  }

  function runSearch(rawQuery) {
    const query = normalise(rawQuery);
    if (!query) {
      resetSearch();
      return 0;
    }
    const terms = query.split(" ");
    const matches = (el) => terms.every((term) => el.dataset.search.includes(term));

    let tileCount = 0;
    tiles.forEach((tile) => {
      const ok = matches(tile);
      tile.hidden = !ok;
      if (ok) tileCount += 1;
    });

    let faqCount = 0;
    let lastMatch = null;
    faqItems.forEach((item) => {
      const ok = matches(item);
      item.hidden = !ok;
      if (ok) {
        faqCount += 1;
        lastMatch = item;
      }
    });

    // List every category together while searching; hide categories with no match.
    faqBox.classList.add("is-searching");
    panels.forEach((panel) => {
      panel.hidden = !panel.querySelector(".faq-item:not([hidden])");
    });

    safetySection.hidden = tileCount === 0;
    faqSection.hidden = faqCount === 0;

    // With a single answer, open it so the person can read it straight away.
    if (faqCount === 1 && lastMatch) {
      faqItems.forEach((item) => {
        const open = item === lastMatch;
        item.classList.toggle("is-open", open);
        const toggle = item.querySelector(".faq-toggle");
        const content = item.querySelector(".faq-content");
        if (toggle) toggle.setAttribute("aria-expanded", String(open));
        if (content) content.hidden = !open;
      });
    }

    const total = tileCount + faqCount;
    if (total === 0) {
      setStatus(`No results for \u201C${rawQuery.trim()}\u201D. Try another word, or`, true);
    } else {
      setStatus(`${total} result${total === 1 ? "" : "s"} for \u201C${rawQuery.trim()}\u201D`);
    }
    return total;
  }

  if (form && input && faqBox) {
    input.addEventListener("input", () => runSearch(input.value));

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && input.value) {
        input.value = "";
        runSearch("");
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const total = runSearch(input.value);
      if (total > 0) {
        const target = safetySection.hidden ? faqSection : safetySection;
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      }
    });

    document.querySelectorAll(".help-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        input.value = chip.dataset.query || chip.textContent;
        form.requestSubmit();
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. Contact form (front-end validation only — no backend yet)
     ------------------------------------------------------------------------ */
  const contactForm = document.getElementById("contact-form");
  const feedback = document.getElementById("contact-feedback");

  const rules = {
    name: (v) => (v.trim().length >= 2 ? "" : "Please enter your full name."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address."),
    message: (v) => (v.trim().length >= 10 ? "" : "Please write at least 10 characters so we can help."),
  };

  function showError(field, message) {
    const control = contactForm.elements[field];
    const error = document.getElementById(`contact-${field}-error`);
    control.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message;
    error.hidden = !message;
  }

  if (contactForm && feedback) {
    // Clear an error as soon as the person starts fixing it.
    Object.keys(rules).forEach((field) => {
      contactForm.elements[field].addEventListener("input", () => {
        if (contactForm.elements[field].getAttribute("aria-invalid") === "true") {
          showError(field, rules[field](contactForm.elements[field].value));
        }
      });
    });

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      feedback.hidden = true;

      let firstInvalid = null;
      Object.keys(rules).forEach((field) => {
        const message = rules[field](contactForm.elements[field].value);
        showError(field, message);
        if (message && !firstInvalid) firstInvalid = contactForm.elements[field];
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const firstName = contactForm.elements.name.value.trim().split(/\s+/)[0];
      feedback.textContent = `Thanks, ${firstName}. Your message has been sent to the FASTutor support team.`;
      feedback.hidden = false;
      contactForm.reset();
    });
  }
})();
