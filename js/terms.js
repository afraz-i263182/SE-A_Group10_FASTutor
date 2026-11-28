(() => {
  const tabs = Array.from(document.querySelectorAll('[data-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-panel]'));
  function activate(tabName, focusTab = false) {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === tabName;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('tabindex', active ? '0' : '-1');
      if (active && focusTab) tab.focus();
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === tabName;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      activate(tabs[next].dataset.tab, true);
    });
  });
  const requestedTab = new URLSearchParams(window.location.search).get('tab');
  const initialTab = tabs.some((tab) => tab.dataset.tab === requestedTab)
    ? requestedTab
    : tabs[0]?.dataset.tab;
  if (initialTab) activate(initialTab);
})();
