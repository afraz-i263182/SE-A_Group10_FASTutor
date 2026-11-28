/* ==========================================================================
   FASTutor — Tutor Dashboard
   Session requests (accept / decline), availability editor, profile
   completion, reviews, sidebar scroll-spy. Availability and profile steps
   persist in localStorage; requests are sample data kept in memory.
   ========================================================================== */

(function () {
  'use strict';

  const { h, icon, store, toast, Modal } = window.FASTutor;

  const KEYS = { availability: 'fastutor.availability', profile: 'fastutor.profileSteps' };
  const $ = (selector) => document.querySelector(selector);

  /* ---------- Session requests ---------- */

  const requests = [
    { id: 'q1', name: 'Ahmad F.', initials: 'AF', color: 'navy', course: 'CS-1002 PF', when: 'Fri, 3:00 PM', detail: 'In person, Islamabad', short: 'Fri 3 PM PF', status: 'pending' },
    { id: 'q2', name: 'Sana M.', initials: 'SM', color: 'teal', course: 'MT-1003 Calculus', when: 'Sat, 10:00 AM', detail: 'Online', short: 'Sat 10 AM Calculus', status: 'pending' },
    { id: 'q3', name: 'Bilal H.', initials: 'BH', color: 'amber', course: 'NS-1001 Applied Physics', when: 'Sun, 2:00 PM', detail: 'Group of 3, in person', short: 'Sun 2 PM Physics', status: 'pending' },
  ];

  let decliningId = null;

  function requestRow(r) {
    return h('div', { class: 'request-row', 'data-id': r.id },
      h('span', { class: 'avatar-initials avatar-initials--md avatar-initials--' + r.color, 'aria-hidden': 'true' }, r.initials),
      h('div', { class: 'request-body' },
        h('h3', { class: 'request-name' }, r.name + ' \u2022 ' + r.course),
        h('span', { class: 'request-meta' }, r.when),
        h('span', { class: 'request-meta' }, r.detail)),
      h('div', { class: 'request-actions' },
        h('button', {
          type: 'button',
          class: 'btn btn-teal btn-xs',
          'aria-label': 'Accept request from ' + r.name,
          onClick: () => accept(r.id),
        }, 'Accept'),
        h('button', {
          type: 'button',
          class: 'btn btn-danger-soft btn-xs',
          'aria-label': 'Decline request from ' + r.name,
          onClick: (e) => openDecline(r.id, e.currentTarget),
        }, 'Decline')));
  }

  function renderRequests() {
    const pending = requests.filter((r) => r.status === 'pending');
    const list = $('#requestList');
    list.replaceChildren();

    if (pending.length) {
      pending.forEach((r) => list.append(requestRow(r)));
    } else {
      list.append(h('p', { class: 'request-empty' }, icon('task_alt'), 'You\u2019re all caught up. New requests will appear here.'));
    }

    $('#requestsCount').textContent = String(pending.length);
    $('#requestsCount').hidden = pending.length === 0;
    $('#requestsSummary').textContent = pending.length === 0
      ? 'You\u2019re all caught up. No new session requests.'
      : 'You have ' + pending.length + ' new session request' + (pending.length === 1 ? '' : 's') + ' waiting.';

    renderUpcoming();
  }

  function renderUpcoming() {
    const line = $('#upcomingLine');
    const active = requests.filter((r) => r.status !== 'declined');
    line.replaceChildren(h('strong', null, 'Upcoming:'), ' ');
    if (!active.length) {
      line.append('nothing else booked yet.');
      return;
    }
    active.forEach((r, i) => {
      if (i) line.append(' \u2022 ');
      line.append(h('span', { class: 'upcoming-item' + (r.status === 'accepted' ? ' is-confirmed' : '') }, r.short));
    });
  }

  function accept(id) {
    const r = requests.find((x) => x.id === id);
    const row = document.querySelector('.request-row[data-id="' + id + '"]');
    if (row) row.classList.add('is-leaving');
    setTimeout(() => {
      r.status = 'accepted';
      renderRequests();
      toast('Accepted ' + r.name + '\u2019s ' + r.course.split(' ')[0] + ' session. They\u2019ve been notified.');
    }, 200);
  }

  function openDecline(id, opener) {
    const r = requests.find((x) => x.id === id);
    decliningId = id;
    $('#declineSummary').replaceChildren(h('strong', null, r.name + ' \u2022 ' + r.course), ' \u2014 ' + r.when + ', ' + r.detail.toLowerCase());
    Modal.open('declineModal', opener);
  }

  $('#declineForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const r = requests.find((x) => x.id === decliningId);
    if (!r) return;
    r.status = 'declined';
    Modal.close('declineModal');
    $('#declineForm').reset();
    renderRequests();
    toast('Request from ' + r.name + ' declined.', 'info');
  });

  /* ---------- Availability editor ---------- */

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const SLOTS = ['9-12', '12-3', '3-6', '6-9'];

  const DEFAULT_AVAILABILITY = [
    [1, 0, 1, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 1, 0],
    [1, 1, 0, 0, 1, 0, 0],
    [0, 0, 1, 1, 0, 1, 1],
  ];

  function loadAvailability() {
    const saved = store.get(KEYS.availability, null);
    const valid = Array.isArray(saved) && saved.length === SLOTS.length && saved.every((row) => Array.isArray(row) && row.length === DAYS.length);
    return (valid ? saved : DEFAULT_AVAILABILITY).map((row) => row.map(Number));
  }

  let availability = loadAvailability();
  let savedSnapshot = JSON.stringify(availability);

  function renderAvailability() {
    const grid = $('#availGrid');
    grid.replaceChildren(h('span', { 'aria-hidden': 'true' }));
    DAY_LETTERS.forEach((letter, d) =>
      grid.append(h('span', { class: 'avail-day', title: DAYS[d], 'aria-hidden': 'true' }, letter)));

    SLOTS.forEach((slot, s) => {
      grid.append(h('span', { class: 'avail-slot' }, slot));
      DAYS.forEach((day, d) => {
        grid.append(h('button', {
          type: 'button',
          class: 'avail-cell',
          'aria-pressed': availability[s][d] ? 'true' : 'false',
          'aria-label': day + ', ' + slot,
          onClick: (e) => {
            availability[s][d] = availability[s][d] ? 0 : 1;
            e.currentTarget.setAttribute('aria-pressed', availability[s][d] ? 'true' : 'false');
            updateDirty();
          },
        }));
      });
    });
    updateDirty();
  }

  function isDirty() {
    return JSON.stringify(availability) !== savedSnapshot;
  }

  function updateDirty() {
    $('#availHint').hidden = !isDirty();
  }

  $('#saveAvailBtn').addEventListener('click', () => {
    if (!isDirty()) {
      toast('Your availability is already up to date.', 'info');
      return;
    }
    store.set(KEYS.availability, availability);
    savedSnapshot = JSON.stringify(availability);
    updateDirty();
    toast('Availability saved. Students will see your new slots.');
  });

  window.addEventListener('beforeunload', (event) => {
    if (isDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  /* ---------- Profile completion ---------- */

  const BASE_PERCENT = 70;
  let doneSteps = new Set(store.get(KEYS.profile, []));

  function renderProfile() {
    const percent = Math.min(100, BASE_PERCENT + doneSteps.size * 10);
    $('#profilePercent').textContent = percent + '%';
    $('#profileFill').style.width = percent + '%';
    $('#profileTrack').setAttribute('aria-valuenow', String(percent));
    const complete = percent >= 100;
    $('#completeProfileBtn').hidden = complete;
    $('#profileDone').hidden = !complete;
  }

  $('#completeProfileBtn').addEventListener('click', (e) => {
    document.querySelectorAll('#profileForm input[name="step"]').forEach((input) => {
      input.checked = doneSteps.has(input.value);
      input.disabled = doneSteps.has(input.value);
    });
    Modal.open('profileModal', e.currentTarget);
  });

  $('#profileForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const before = doneSteps.size;
    document.querySelectorAll('#profileForm input[name="step"]:checked').forEach((input) => doneSteps.add(input.value));
    store.set(KEYS.profile, Array.from(doneSteps));
    Modal.close('profileModal');
    renderProfile();
    if (doneSteps.size > before) {
      toast(doneSteps.size === 3 ? 'Profile complete. Nice work!' : 'Profile updated.');
    }
  });

  /* ---------- Reviews ---------- */

  const reviews = [
    { stars: 5, text: 'Very clear explanations, trees finally made sense.', author: 'Ahmad, BS SE' },
    { stars: 4, text: 'Helpful past-paper examples.', author: 'Sana, BS CS' },
    { stars: 5, text: 'Explained integration by parts better than the lecture did.', author: 'Bilal, BS EE' },
    { stars: 5, text: 'Patient and well prepared. Booked again for finals.', author: 'Hamza, BS SE' },
    { stars: 4, text: 'Great pace. A few more practice problems would be perfect.', author: 'Zainab, BS CS' },
  ];
  const VISIBLE_REVIEWS = 2;
  let showAllReviews = false;

  function renderReviews() {
    const list = $('#reviewList');
    list.replaceChildren(
      ...reviews.slice(0, showAllReviews ? reviews.length : VISIBLE_REVIEWS).map((r) =>
        h('div', { class: 'review-row' },
          h('span', { class: 'stars', 'aria-label': r.stars + ' out of 5 stars' }, '\u2605'.repeat(r.stars) + '\u2606'.repeat(5 - r.stars)),
          h('span', null, '\u201C' + r.text + '\u201D'),
          h('span', { class: 'review-author' }, '\u2013 ' + r.author)))
    );
    const toggle = $('#seeAllReviews');
    toggle.textContent = showAllReviews ? 'Show fewer reviews' : 'See all reviews';
    toggle.setAttribute('aria-expanded', String(showAllReviews));
  }

  $('#seeAllReviews').addEventListener('click', () => {
    showAllReviews = !showAllReviews;
    renderReviews();
  });

  /* ---------- Sidebar navigation & scroll-spy ---------- */

  const navButtons = Array.from(document.querySelectorAll('#sideNav [data-target]'));
  const sectionIds = navButtons.map((b) => b.dataset.target);

  function setActive(id) {
    navButtons.forEach((b) => {
      const on = b.dataset.target === id;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.target;
      const target = document.getElementById(id);
      if (id === 'overview') window.scrollTo({ top: 0, behavior: 'smooth' });
      else if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(id);
    });
  });

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = sectionIds[0];
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      });
      setActive(atBottom ? sectionIds[sectionIds.length - 1] : current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  $('#settingsBtn').addEventListener('click', () => toast('Settings are coming soon.', 'info'));

  /* ---------- Init ---------- */

  renderRequests();
  renderAvailability();
  renderProfile();
  renderReviews();
})();
