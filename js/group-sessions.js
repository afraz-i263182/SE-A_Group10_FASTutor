/* ==========================================================================
   FASTutor — Group Sessions & Workshops
   Filtering, sorting, pagination, join / waitlist, host-a-session form.
   Data is local sample data; joined, waitlist and hosted sessions persist
   in localStorage until a backend exists.
   ========================================================================== */

(function () {
  'use strict';

  const { h, icon, initials, debounce, formatPKR, store, toast, Modal, renderPagination } = window.FASTutor;

  const PAGE_SIZE = 4;
  const KEYS = { joined: 'fastutor.joined', waitlist: 'fastutor.waitlist', hosted: 'fastutor.hosted' };

  const COURSES = {
    'MT-1003': 'MT-1003 Calculus',
    'CS-1002': 'CS-1002 PF',
    'NS-1001': 'NS-1001 Applied Physics',
    'CS-2002': 'CS-2002 OOP',
  };
  const TYPE_LABEL = { workshop: 'Workshop', revision: 'Group revision' };

  /* ---------- Sample data ---------- */

  const BASE_SESSIONS = [
    { id: 's1', title: 'Integration Crash Course', course: 'MT-1003', type: 'workshop', host: 'Ayesha Noor', color: 'teal', rating: 4.9, date: '2026-11-28', time: '16:00', duration: 90, mode: 'online', location: '', capacity: 15, taken: 8, price: 300, description: 'Limits recap, integration by parts and substitution, plus 10 past-paper questions solved step by step.' },
    { id: 's2', title: 'PF Arrays Revision', course: 'CS-1002', type: 'revision', host: 'Hamza Tariq', color: 'navy', rating: 4.7, date: '2026-11-29', time: '11:00', duration: 120, mode: 'campus', location: 'Library, Room 2', capacity: 15, taken: 15, price: 250, description: '1D and 2D arrays, traversal patterns and common exam traps, with timed practice questions.' },
    { id: 's3', title: 'Physics Problem Solving', course: 'NS-1001', type: 'workshop', host: 'Ahmed Khan', color: 'amber', rating: 4.8, date: '2026-11-30', time: '18:00', duration: 90, mode: 'online', location: '', capacity: 12, taken: 5, price: 200, description: 'Kinematics and Newton\'s laws: a repeatable method for tackling numerical problems under time pressure.' },
    { id: 's4', title: 'OOP Final Revision', course: 'CS-2002', type: 'revision', host: 'Mahnoor Fatima', color: 'amber', rating: 5.0, date: '2026-12-01', time: '20:00', duration: 120, mode: 'online', location: '', capacity: 20, taken: 10, price: 350, description: 'Classes, inheritance, polymorphism and a full mock paper reviewed question by question.' },
    { id: 's5', title: 'Limits & Continuity Clinic', course: 'MT-1003', type: 'revision', host: 'Hamza Tariq', color: 'navy', rating: 4.7, date: '2026-12-02', time: '19:00', duration: 75, mode: 'online', location: '', capacity: 15, taken: 6, price: 250, description: 'Epsilon-delta intuition, one-sided limits and continuity checks with worked examples.' },
    { id: 's6', title: 'Loops & Nested Loops Lab', course: 'CS-1002', type: 'workshop', host: 'Ahmed Khan', color: 'amber', rating: 4.8, date: '2026-12-02', time: '15:00', duration: 90, mode: 'campus', location: 'CS Lab 3', capacity: 12, taken: 9, price: 200, description: 'Hands-on pattern printing and nested loop tracing, built up from simple to exam-level.' },
    { id: 's7', title: 'Kinematics Crash Hour', course: 'NS-1001', type: 'revision', host: 'Mahnoor Fatima', color: 'amber', rating: 5.0, date: '2026-12-03', time: '21:00', duration: 60, mode: 'online', location: '', capacity: 10, taken: 4, price: 150, description: 'Fast revision of motion graphs, equations of motion and projectile problems.' },
    { id: 's8', title: 'Inheritance & Polymorphism', course: 'CS-2002', type: 'workshop', host: 'Hamza Tariq', color: 'navy', rating: 4.7, date: '2026-12-04', time: '17:00', duration: 90, mode: 'campus', location: 'Seminar Room 5', capacity: 16, taken: 12, price: 300, description: 'Virtual functions, abstract classes and the output-prediction questions that keep showing up.' },
    { id: 's9', title: 'Derivatives Drill Night', course: 'MT-1003', type: 'revision', host: 'Ayesha Noor', color: 'teal', rating: 4.9, date: '2026-12-05', time: '20:00', duration: 90, mode: 'online', location: '', capacity: 20, taken: 3, price: 250, description: 'Product, quotient and chain rule drills, followed by implicit differentiation practice.' },
    { id: 's10', title: '2D Arrays Workshop', course: 'CS-1002', type: 'workshop', host: 'Ahmed Khan', color: 'amber', rating: 4.8, date: '2026-12-06', time: '14:00', duration: 90, mode: 'campus', location: 'Library, Room 1', capacity: 12, taken: 7, price: 200, description: 'Matrix traversal, row and column sums, diagonals and transposes, written from scratch.' },
    { id: 's11', title: 'Waves & Optics Revision', course: 'NS-1001', type: 'revision', host: 'Hamza Tariq', color: 'navy', rating: 4.7, date: '2026-12-07', time: '19:30', duration: 90, mode: 'online', location: '', capacity: 15, taken: 11, price: 200, description: 'Wave equations, superposition, reflection and refraction with past-paper numericals.' },
    { id: 's12', title: 'OOP Mid-Prep Q&A', course: 'CS-2002', type: 'revision', host: 'Mahnoor Fatima', color: 'amber', rating: 5.0, date: '2026-12-08', time: '21:00', duration: 60, mode: 'online', location: '', capacity: 25, taken: 2, price: 400, description: 'Open question-and-answer hour: bring your doubts, get them solved live.' },
  ];

  const sessions = BASE_SESSIONS.concat(store.get(KEYS.hosted, []));
  const joined = new Set(store.get(KEYS.joined, []));
  const waitlist = new Set(store.get(KEYS.waitlist, []));

  const state = {
    query: '',
    courses: new Set(Object.keys(COURSES)),
    type: 'all',
    modes: new Set(['online', 'campus']),
    maxPrice: 400,
    joinedOnly: false,
    sort: 'soonest',
    page: 1,
  };

  /* ---------- Helpers ---------- */

  const $ = (selector) => document.querySelector(selector);

  function startOf(session) {
    const [y, m, d] = session.date.split('-').map(Number);
    const [hh, mm] = session.time.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm);
  }

  function parts(session) {
    const date = startOf(session);
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayMonth: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  }

  const takenSeats = (s) => s.taken + (joined.has(s.id) ? 1 : 0);
  const seatsLeft = (s) => Math.max(0, s.capacity - takenSeats(s));
  const modeText = (s) => (s.mode === 'online' ? 'Online (Google Meet)' : s.location || 'On campus');
  const find = (id) => sessions.find((s) => s.id === id);

  function persist() {
    store.set(KEYS.joined, Array.from(joined));
    store.set(KEYS.waitlist, Array.from(waitlist));
  }

  /* ---------- Filtering, sorting ---------- */

  function visibleSessions() {
    const q = state.query.trim().toLowerCase();
    const list = sessions.filter((s) => {
      if (!state.courses.has(s.course)) return false;
      if (state.type !== 'all' && s.type !== state.type) return false;
      if (!state.modes.has(s.mode)) return false;
      if (s.price > state.maxPrice) return false;
      if (state.joinedOnly && !joined.has(s.id)) return false;
      if (q) {
        const haystack = [s.title, s.course, COURSES[s.course], s.host, s.topic || '', TYPE_LABEL[s.type]].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorters = {
      soonest: (a, b) => startOf(a) - startOf(b),
      'price-asc': (a, b) => a.price - b.price || startOf(a) - startOf(b),
      'price-desc': (a, b) => b.price - a.price || startOf(a) - startOf(b),
      seats: (a, b) => seatsLeft(b) - seatsLeft(a) || startOf(a) - startOf(b),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0) || startOf(a) - startOf(b),
    };
    return list.sort(sorters[state.sort]);
  }

  /* ---------- Rendering ---------- */

  function hostAvatar(s) {
    return h('span', { class: 'avatar-initials avatar-initials--' + s.color, 'aria-hidden': 'true' }, initials(s.host));
  }

  function ratingNode(s) {
    return s.rating
      ? [icon('star', 'star-icon star-icon--sm'), h('span', null, s.rating.toFixed(1))]
      : [h('span', null, 'New host')];
  }

  function primaryAction(s) {
    const full = seatsLeft(s) === 0;
    if (joined.has(s.id)) {
      return h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onClick: (e) => openDetails(s.id, e.currentTarget) }, icon('check'), 'Joined');
    }
    if (full) {
      const waiting = waitlist.has(s.id);
      return h('button', {
        type: 'button',
        class: 'btn btn-secondary btn-sm',
        onClick: () => toggleWaitlist(s.id),
      }, waiting ? 'On waitlist' : 'Join waitlist');
    }
    return h('button', { type: 'button', class: 'btn btn-teal btn-sm', onClick: (e) => openDetails(s.id, e.currentTarget) }, 'Join session');
  }

  function sessionCard(s) {
    const taken = takenSeats(s);
    const full = seatsLeft(s) === 0;
    const pct = Math.min(100, Math.round((taken / s.capacity) * 100));
    const p = parts(s);

    return h('article', { class: 'session-card panel', 'aria-label': s.title },
      h('div', { class: 'date-tile' },
        h('span', { class: 'date-tile-day' }, p.day),
        h('span', { class: 'date-tile-month' }, p.month)),

      h('div', { class: 'session-info' },
        h('h3', { class: 'session-title' }, s.title),
        h('div', { class: 'session-tags' },
          h('span', { class: 'grade-chip grade-chip--slate code-chip' }, s.course),
          h('span', { class: 'grade-chip grade-chip--emerald' }, TYPE_LABEL[s.type])),
        h('div', { class: 'meta-row' },
          hostAvatar(s),
          h('span', null, 'Host: ', h('strong', null, s.host)),
          h('span', { class: 'meta-dot', 'aria-hidden': 'true' }, '\u2022'),
          ratingNode(s)),
        h('div', { class: 'meta-row' },
          icon('schedule'),
          h('span', null, p.weekday + ', ' + p.time),
          h('span', { class: 'meta-dot', 'aria-hidden': 'true' }, '\u2022'),
          icon(s.mode === 'online' ? 'videocam' : 'location_on'),
          h('span', null, modeText(s)))),

      h('div', { class: 'session-aside' },
        h('div', { class: 'seat-block' },
          h('div', { class: 'seat-line' },
            h('span', null, h('strong', null, taken + '/' + s.capacity), ' seats'),
            full && h('span', { class: 'status-pill status-pill--full' }, 'Full')),
          h('div', {
            class: 'seat-bar', role: 'progressbar', 'aria-label': 'Seats filled',
            'aria-valuemin': '0', 'aria-valuemax': String(s.capacity), 'aria-valuenow': String(taken),
          }, h('span', { class: 'seat-bar-fill' + (full ? ' is-full' : ''), style: 'width:' + pct + '%' }))),
        h('div', { class: 'session-price' }, formatPKR(s.price)),
        h('div', { class: 'session-actions' },
          h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onClick: (e) => openDetails(s.id, e.currentTarget) }, 'View details'),
          primaryAction(s))));
  }

  function render() {
    const list = visibleSessions();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    const root = $('#sessionList');
    root.replaceChildren();

    if (!slice.length) {
      root.append(emptyState());
    } else {
      slice.forEach((s) => root.append(sessionCard(s)));
    }

    $('#resultsStatus').textContent = list.length + (list.length === 1 ? ' session found' : ' sessions found');
    const nav = $('#pagination');
    nav.hidden = !slice.length;
    renderPagination(nav, state.page, pages, (page) => {
      state.page = page;
      render();
      $('#listTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function emptyState() {
    const onlyJoined = state.joinedOnly;
    return h('div', { class: 'panel empty-state' },
      icon('event_busy'),
      h('h3', null, onlyJoined ? 'You haven\u2019t joined any sessions yet' : 'No sessions match your filters'),
      h('p', null, onlyJoined
        ? 'Join a session and it will show up here.'
        : 'Try a different course, raise the maximum price, or clear your search.'),
      h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onClick: resetFilters }, 'Clear filters'));
  }

  function resetFilters() {
    state.query = '';
    state.courses = new Set(Object.keys(COURSES));
    state.type = 'all';
    state.modes = new Set(['online', 'campus']);
    state.maxPrice = 400;
    state.joinedOnly = false;
    state.page = 1;
    $('#sessionSearch').value = '';
    document.querySelectorAll('input[name="course"], input[name="mode"]').forEach((i) => { i.checked = true; });
    document.querySelector('input[name="type"][value="all"]').checked = true;
    $('#priceRange').value = 400;
    $('#priceLabel').textContent = 'Up to PKR 400';
    $('#joinedOnly').checked = false;
    render();
  }

  /* ---------- Details modal ---------- */

  let currentId = null;

  function openDetails(id, opener) {
    const s = find(id);
    if (!s) return;
    currentId = id;
    const p = parts(s);
    const taken = takenSeats(s);
    const left = seatsLeft(s);

    $('#detailsTitle').textContent = s.title;
    $('#dHost').textContent = s.host;
    $('#dRating').textContent = s.rating ? s.rating.toFixed(1) : 'New';
    $('#dWhen').textContent = p.weekday + ' ' + p.dayMonth + ', ' + p.time + ' \u2022 ' + s.duration + ' min';
    $('#dModeIcon').textContent = s.mode === 'online' ? 'videocam' : 'location_on';
    $('#dMode').textContent = s.mode === 'online' ? 'Online (Google Meet link sent after joining)' : (s.location || 'On campus') + ' (venue confirmed after joining)';
    $('#dDesc').textContent = s.description || 'No description provided.';
    $('#dPrice').textContent = formatPKR(s.price);
    $('#dSeats').textContent = left === 0 ? 'Session is full' : left + (left === 1 ? ' seat left' : ' seats left');

    const pool = [['DA', 'navy'], ['AL', 'teal'], ['US', 'amber']];
    const stack = $('#dAvatars');
    stack.replaceChildren();
    pool.slice(0, Math.min(3, taken)).forEach(([text, color]) =>
      stack.append(h('span', { class: 'avatar-initials avatar-initials--' + color }, text)));
    if (taken > 3) stack.append(h('span', { class: 'avatar-initials avatar-initials--navy' }, '+' + (taken - 3)));

    const action = $('#dAction');
    action.className = 'btn btn-md';
    if (joined.has(id)) {
      action.textContent = 'Leave session';
      action.classList.add('btn-danger-soft');
    } else if (left === 0) {
      action.textContent = waitlist.has(id) ? 'Leave waitlist' : 'Join waitlist';
      action.classList.add('btn-secondary');
    } else {
      action.textContent = 'Join now';
      action.classList.add('btn-teal');
    }
    Modal.open('detailsModal', opener);
  }

  function toggleWaitlist(id) {
    const s = find(id);
    if (waitlist.has(id)) {
      waitlist.delete(id);
      toast('Removed from the waitlist for \u201C' + s.title + '\u201D.', 'info');
    } else {
      waitlist.add(id);
      toast('You\u2019re on the waitlist. We\u2019ll notify you if a seat opens up.');
    }
    persist();
    render();
  }

  $('#dAction').addEventListener('click', () => {
    const s = find(currentId);
    if (!s) return;
    if (joined.has(s.id)) {
      joined.delete(s.id);
      toast('You left \u201C' + s.title + '\u201D.', 'info');
    } else if (seatsLeft(s) === 0) {
      Modal.close('detailsModal');
      toggleWaitlist(s.id);
      return;
    } else {
      joined.add(s.id);
      waitlist.delete(s.id);
      toast(s.mode === 'online'
        ? 'You\u2019re in! The Google Meet link will be sent to your email.'
        : 'Seat reserved. See you at ' + (s.location || 'the venue') + '.');
    }
    persist();
    Modal.close('detailsModal');
    render();
  });

  $('#dProfile').addEventListener('click', () => toast('Tutor profiles open from the Find Tutors page.', 'info'));

  /* ---------- Host a session ---------- */

  const hostForm = $('#hostForm');

  function setError(input, message) {
    const group = input.closest('.form-group');
    let node = group.querySelector('.form-error');
    if (!message) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      if (node) node.remove();
      return;
    }
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    if (!node) {
      node = h('p', { class: 'form-error', role: 'alert' });
      group.append(node);
    }
    node.textContent = message;
  }

  function todayISO() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function validateHost() {
    const f = hostForm.elements;
    let firstBad = null;
    const check = (input, message) => {
      setError(input, message);
      if (message && !firstBad) firstBad = input;
    };

    check(f.title, f.title.value.trim().length < 5 ? 'Enter a title of at least 5 characters.' : '');
    check(f.topic, f.topic.value.trim() ? '' : 'Add the topic you will cover.');

    let dateMsg = '';
    if (!f.date.value) dateMsg = 'Choose a date.';
    else if (f.date.value < todayISO()) dateMsg = 'The date can\u2019t be in the past.';
    check(f.date, dateMsg);

    let timeMsg = '';
    if (!f.time.value) timeMsg = 'Choose a start time.';
    else if (f.date.value && new Date(f.date.value + 'T' + f.time.value) < new Date()) timeMsg = 'Pick a time that hasn\u2019t passed.';
    check(f.time, timeMsg);

    const seats = Number(f.seats.value);
    check(f.seats, Number.isInteger(seats) && seats >= 2 && seats <= 50 ? '' : 'Seats must be between 2 and 50.');
    const price = Number(f.price.value);
    check(f.price, f.price.value !== '' && price >= 0 && price <= 2000 ? '' : 'Price must be between 0 and 2000.');

    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  $('#hostBtn').addEventListener('click', (e) => {
    hostForm.elements.date.min = todayISO();
    Modal.open('hostModal', e.currentTarget);
  });

  $('#hostModal').addEventListener('modalclose', () => {
    hostForm.reset();
    Array.from(hostForm.elements).forEach((el) => el.classList && el.classList.contains('form-control') && setError(el, ''));
  });

  hostForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateHost()) return;
    const f = hostForm.elements;
    const session = {
      id: 'h' + Date.now(),
      title: f.title.value.trim(),
      course: f.course.value,
      topic: f.topic.value.trim(),
      type: 'workshop',
      host: 'You',
      color: 'teal',
      rating: null,
      date: f.date.value,
      time: f.time.value,
      duration: 90,
      mode: f.mode.value,
      location: f.mode.value === 'campus' ? 'On campus venue' : '',
      capacity: Number(f.seats.value),
      taken: 0,
      price: Number(f.price.value),
      description: f.description.value.trim(),
    };
    sessions.push(session);
    store.set(KEYS.hosted, sessions.filter((s) => s.id.startsWith('h')));
    Modal.close('hostModal');
    resetFilters();
    toast('Session published. Students can now join \u201C' + session.title + '\u201D.');
  });

  /* ---------- Filter wiring ---------- */

  const onSearch = debounce((value) => {
    state.query = value;
    state.page = 1;
    render();
  }, 200);

  $('#sessionSearch').addEventListener('input', (e) => onSearch(e.target.value));

  $('#filterForm').addEventListener('change', (e) => {
    const input = e.target;
    if (input.name === 'course') {
      input.checked ? state.courses.add(input.value) : state.courses.delete(input.value);
    } else if (input.name === 'mode') {
      input.checked ? state.modes.add(input.value) : state.modes.delete(input.value);
    } else if (input.name === 'type') {
      state.type = input.value;
    } else if (input.id === 'joinedOnly') {
      state.joinedOnly = input.checked;
    }
    state.page = 1;
    render();
  });

  $('#priceRange').addEventListener('input', (e) => {
    state.maxPrice = Number(e.target.value);
    $('#priceLabel').textContent = 'Up to PKR ' + state.maxPrice;
    state.page = 1;
    render();
  });

  $('#sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.page = 1;
    render();
  });

  /* ---------- Banner actions ---------- */

  $('#joinGroupBtn').addEventListener('click', () => {
    state.sort = 'soonest';
    $('#sortSelect').value = 'soonest';
    render();
    $('#listTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const firstOpen = $('#sessionList .btn-teal');
    if (firstOpen) setTimeout(() => firstOpen.focus({ preventScroll: true }), 400);
  });

  $('#standbyBtn').addEventListener('click', () => toast('Standby tutors are listed under Find Tutors.', 'info'));

  render();
})();
