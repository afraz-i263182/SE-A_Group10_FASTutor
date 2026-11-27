/* ==========================================================================
   FASTutor — About & How It Works page behaviours
   Loaded after js/script.js (which handles the header and mobile menu).
   ========================================================================== */

(() => {
  "use strict";

  /**
   * Accessible tabs: click, ArrowLeft/ArrowRight, Home and End.
   * Each tab's aria-controls points at a panel that is shown/hidden with [hidden].
   */
  function initTabs(tablist) {
    if (!tablist) return null;
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return null;

    function select(tab, { focus = false } = {}) {
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
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (event) => {
        let next = null;
        if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
        else if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
        else if (event.key === "Home") next = tabs[0];
        else if (event.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          event.preventDefault();
          select(next, { focus: true });
        }
      });
    });

    return { tabs, select };
  }

  const roleTabs = initTabs(document.querySelector('.seg[role="tablist"]'));
  const formatTabs = initTabs(document.querySelector('.format-tabs[role="tablist"]'));

  /**
   * Deep links: about.html#tab-tutors and about.html#tab-group open that tab.
   * The tab buttons carry those ids, so the browser scrolls to them natively.
   */
  function applyHash() {
    const id = window.location.hash.slice(1);
    if (!id) return;
    [roleTabs, formatTabs].forEach((group) => {
      const match = group && group.tabs.find((t) => t.id === id);
      if (match) group.select(match);
    });
  }
  applyHash();
  window.addEventListener("hashchange", applyHash);

  /**
   * Draw the verification ticks once, when the card first scrolls into view.
   * Without IntersectionObserver the card is simply shown complete.
   */
  const verifyCard = document.getElementById("verify-card");
  if (verifyCard) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              verifyCard.classList.add("is-in");
              obs.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(verifyCard);
    } else {
      verifyCard.classList.add("is-in");
    }
  }
})();
