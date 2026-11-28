/* ==========================================================================
   FASTutor — Study Resources Library
   Course -> topic -> type filtering, search, pagination, preview,
   report and upload dialogs. Sample data only; reports are remembered in
   localStorage, uploads live in memory until a backend exists.
   ========================================================================== */

(function () {
  'use strict';

  const { h, icon, debounce, store, toast, Modal, renderPagination } = window.FASTutor;

  const PAGE_SIZE = 4;
  const REPORTED_KEY = 'fastutor.reportedResources';
  const MAX_FILE_BYTES = 15 * 1024 * 1024;
  const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];

  const COURSES = [
    ['CS-1002', 'CS-1002 PF'],
    ['MT-1003', 'MT-1003 Calculus'],
    ['NS-1001', 'NS-1001 Applied Physics'],
    ['CS-2001', 'CS-2001 DSA'],
    ['CS-2002', 'CS-2002 OOP'],
  ];

  const TOPICS = {
    'CS-1002': ['Loops', 'Arrays', 'Functions'],
    'MT-1003': ['Limits', 'Integration', 'Derivatives'],
    'NS-1001': ['Kinematics', 'Dynamics', 'Waves'],
    'CS-2001': ['Linked Lists', 'Trees', 'Sorting'],
    'CS-2002': ['Classes', 'Inheritance', 'Polymorphism'],
  };

  // [key, filter label, item label]
  const TYPES = [
    ['notes', 'Notes', 'Notes'],
    ['cheat', 'Cheat sheets', 'Cheat sheet'],
    ['practice', 'Practice problems', 'Practice problems'],
  ];
  const typeLabel = (key) => TYPES.find((t) => t[0] === key)[2];

  const resources = [
    { id: 'r1', title: 'Integration Notes', course: 'MT-1003', topic: 'Integration', type: 'notes', uploader: 'Ayesha Noor', rating: 4.2, count: 18, ext: 'pdf' },
    { id: 'r2', title: 'Limits Cheat Sheet', course: 'MT-1003', topic: 'Limits', type: 'cheat', uploader: 'Hamza Tariq', rating: 4.9, count: 31, ext: 'pdf' },
    { id: 'r3', title: 'Practice Problems Set 3', course: 'MT-1003', topic: 'Integration', type: 'practice', uploader: 'Ahmed Khan', rating: 3.8, count: 9, ext: 'doc' },
    { id: 'r4', title: 'Substitution Method Notes', course: 'MT-1003', topic: 'Integration', type: 'notes', uploader: 'Mahnoor Fatima', rating: 4.6, count: 22, ext: 'pdf' },
    { id: 'r5', title: 'Limits Practice Set 1', course: 'MT-1003', topic: 'Limits', type: 'practice', uploader: 'Ayesha Noor', rating: 4.4, count: 12, ext: 'doc' },
    { id: 'r6', title: 'Definite Integrals Cheat Sheet', course: 'MT-1003', topic: 'Integration', type: 'cheat', uploader: 'Hamza Tariq', rating: 4.7, count: 16, ext: 'pdf' },
    { id: 'r7', title: 'Limits & Continuity Notes', course: 'MT-1003', topic: 'Limits', type: 'notes', uploader: 'Ahmed Khan', rating: 4.1, count: 11, ext: 'pdf' },
    { id: 'r8', title: 'Area Under Curves Problems', course: 'MT-1003', topic: 'Integration', type: 'practice', uploader: 'Mahnoor Fatima', rating: 4.3, count: 8, ext: 'doc' },
    { id: 'r9', title: 'Epsilon-Delta Quick Guide', course: 'MT-1003', topic: 'Limits', type: 'cheat', uploader: 'Ayesha Noor', rating: 4.8, count: 27, ext: 'pdf' },
    { id: 'r10', title: 'Derivatives Quick Notes', course: 'MT-1003', topic: 'Derivatives', type: 'notes', uploader: 'Mahnoor Fatima', rating: 4.5, count: 14, ext: 'pdf' },
    { id: 'r11', title: 'Chain Rule Cheat Sheet', course: 'MT-1003', topic: 'Derivatives', type: 'cheat', uploader: 'Hamza Tariq', rating: 4.6, count: 19, ext: 'pdf' },

    { id: 'r12', title: 'Nested Loops Patterns', course: 'CS-1002', topic: 'Loops', type: 'notes', uploader: 'Ahmed Khan', rating: 4.7, count: 26, ext: 'pdf' },
    { id: 'r13', title: '1D & 2D Arrays Cheat Sheet', course: 'CS-1002', topic: 'Arrays', type: 'cheat', uploader: 'Hamza Tariq', rating: 4.8, count: 33, ext: 'pdf' },
    { id: 'r14', title: 'Functions Practice Set', course: 'CS-1002', topic: 'Functions', type: 'practice', uploader: 'Ayesha Noor', rating: 4.2, count: 10, ext: 'doc' },
    { id: 'r15', title: 'Loop Tracing Problems', course: 'CS-1002', topic: 'Loops', type: 'practice', uploader: 'Mahnoor Fatima', rating: 4.5, count: 15, ext: 'doc' },

    { id: 'r16', title: 'Kinematics Formula Sheet', course: 'NS-1001', topic: 'Kinematics', type: 'cheat', uploader: 'Ahmed Khan', rating: 4.8, count: 21, ext: 'pdf' },
    { id: 'r17', title: 'Newton\'s Laws Notes', course: 'NS-1001', topic: 'Dynamics', type: 'notes', uploader: 'Mahnoor Fatima', rating: 4.4, count: 13, ext: 'pdf' },
    { id: 'r18', title: 'Waves Practice Problems', course: 'NS-1001', topic: 'Waves', type: 'practice', uploader: 'Hamza Tariq', rating: 4.0, count: 7, ext: 'doc' },

    { id: 'r19', title: 'Linked Lists Notes', course: 'CS-2001', topic: 'Linked Lists', type: 'notes', uploader: 'Hamza Tariq', rating: 4.6, count: 17, ext: 'pdf' },
    { id: 'r20', title: 'Sorting Algorithms Cheat Sheet', course: 'CS-2001', topic: 'Sorting', type: 'cheat', uploader: 'Ayesha Noor', rating: 4.9, count: 29, ext: 'pdf' },
    { id: 'r21', title: 'Binary Trees Practice Set', course: 'CS-2001', topic: 'Trees', type: 'practice', uploader: 'Ahmed Khan', rating: 4.3, count: 9, ext: 'doc' },

    { id: 'r22', title: 'Classes & Objects Notes', course: 'CS-2002', topic: 'Classes', type: 'notes', uploader: 'Mahnoor Fatima', rating: 4.7, count: 24, ext: 'pdf' },
    { id: 'r23', title: 'Inheritance Cheat Sheet', course: 'CS-2002', topic: 'Inheritance', type: 'cheat', uploader: 'Hamza Tariq', rating: 4.5, count: 12, ext: 'pdf' },
    { id: 'r24', title: 'Polymorphism Output Questions', course: 'CS-2002', topic: 'Polymorphism', type: 'practice', uploader: 'Mahnoor Fatima', rating: 4.6, count: 18, ext: 'doc' },
  ];

  const reported = new Set(store.get(REPORTED_KEY, []));

  const state = {
    course: 'MT-1003',
    topics: new Set(['Limits', 'Integration']), // opening view matches the wireframe
    types: new Set(TYPES.map((t) => t[0])),
    query: '',
    page: 1,
  };

  const $ = (selector) => document.querySelector(selector);
  const courseLabel = (code) => COURSES.find((c) => c[0] === code)[1];
  const find = (id) => resources.find((r) => r.id === id);

  /* ---------- Sidebar ---------- */

  function renderFilters() {
    const courseBox = $('#courseOptions');
    courseBox.replaceChildren(
      ...COURSES.map(([code, label]) =>
        h('label', { class: 'filter-option' },
          h('input', { type: 'radio', name: 'course', value: code, checked: state.course === code }),
          label))
    );

    const topicBox = $('#topicOptions');
    topicBox.replaceChildren(
      ...TOPICS[state.course].map((topic) =>
        h('label', { class: 'filter-option' },
          h('input', { type: 'checkbox', name: 'topic', value: topic, checked: state.topics.has(topic) }),
          topic))
    );

    const typeBox = $('#typeOptions');
    typeBox.replaceChildren(
      ...TYPES.map(([key, label]) =>
        h('label', { class: 'filter-option' },
          h('input', { type: 'checkbox', name: 'type', value: key, checked: state.types.has(key) }),
          label))
    );
  }

  $('#filterForm').addEventListener('change', (e) => {
    const input = e.target;
    if (input.name === 'course') {
      state.course = input.value;
      state.topics = new Set(TOPICS[state.course]);
      renderFilters();
    } else if (input.name === 'topic') {
      input.checked ? state.topics.add(input.value) : state.topics.delete(input.value);
    } else if (input.name === 'type') {
      input.checked ? state.types.add(input.value) : state.types.delete(input.value);
    }
    state.page = 1;
    render();
  });

  /* ---------- List ---------- */

  function visibleResources() {
    const q = state.query.trim().toLowerCase();
    return resources.filter((r) => {
      if (r.course !== state.course) return false;
      if (!state.topics.has(r.topic)) return false;
      if (!state.types.has(r.type)) return false;
      if (q && ![r.title, r.topic, r.uploader, typeLabel(r.type)].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function badge(ext) {
    const kind = ext === 'pdf' ? 'pdf' : ext.startsWith('doc') ? 'doc' : 'ppt';
    return h('div', { class: 'file-badge file-badge--' + kind, 'aria-hidden': 'true' }, kind.toUpperCase());
  }

  function resourceCard(r) {
    const isReported = reported.has(r.id);
    return h('article', { class: 'resource-card panel', 'aria-label': r.title },
      badge(r.ext),
      h('div', { class: 'resource-main' },
        h('h3', { class: 'resource-title' }, r.title),
        h('p', { class: 'resource-sub' }, typeLabel(r.type) + ' \u2022 ' + r.topic),
        h('p', { class: 'resource-uploader' },
          'Uploaded by ', h('strong', null, r.uploader),
          h('span', { class: 'meta-dot', 'aria-hidden': 'true' }, '\u2022'),
          icon('star', 'star-icon star-icon--sm'),
          r.count ? r.rating.toFixed(1) + ' (' + r.count + ')' : 'New')),
      h('div', { class: 'resource-actions' },
        h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onClick: (e) => openPreview(r.id, e.currentTarget) }, icon('visibility'), 'Preview'),
        h('button', { type: 'button', class: 'btn btn-primary btn-sm', onClick: () => download(r) }, icon('download'), 'Download'),
        h('button', {
          type: 'button',
          class: 'btn btn-danger-soft btn-sm',
          disabled: isReported,
          onClick: (e) => openReport(r.id, e.currentTarget),
        }, icon('flag'), isReported ? 'Reported' : 'Report')));
  }

  function renderCrumbs() {
    const all = TOPICS[state.course];
    const chosen = all.filter((t) => state.topics.has(t));
    let tail;
    if (chosen.length === all.length) tail = 'All topics';
    else if (chosen.length === 0) tail = 'No topic selected';
    else if (chosen.length <= 2) tail = chosen.join(', ');
    else tail = chosen.length + ' topics';

    const crumbs = $('#crumbs');
    crumbs.replaceChildren(
      h('button', { type: 'button', onClick: resetAll }, 'Courses'),
      h('span', { 'aria-hidden': 'true' }, '\u203A'),
      h('span', null, courseLabel(state.course)),
      h('span', { 'aria-hidden': 'true' }, '\u203A'),
      h('strong', { 'aria-current': 'page' }, tail));
  }

  function render() {
    const list = visibleResources();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    renderCrumbs();
    const root = $('#resourceList');
    root.replaceChildren();
    if (slice.length) {
      slice.forEach((r) => root.append(resourceCard(r)));
    } else {
      root.append(
        h('div', { class: 'panel empty-state' },
          icon('search_off'),
          h('h3', null, 'No resources found'),
          h('p', null, 'Try ticking more topics or types, or clear your search.'),
          h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onClick: resetAll }, 'Reset filters')));
    }

    $('#resultsStatus').textContent = list.length + (list.length === 1 ? ' resource found' : ' resources found');
    const nav = $('#pagination');
    nav.hidden = !slice.length;
    renderPagination(nav, state.page, pages, (page) => {
      state.page = page;
      render();
      $('#crumbs').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function resetAll() {
    state.course = 'MT-1003';
    state.topics = new Set(['Limits', 'Integration']);
    state.types = new Set(TYPES.map((t) => t[0]));
    state.query = '';
    state.page = 1;
    $('#resourceSearch').value = '';
    renderFilters();
    render();
  }

  const onSearch = debounce((value) => {
    state.query = value;
    state.page = 1;
    render();
  }, 200);
  $('#resourceSearch').addEventListener('input', (e) => onSearch(e.target.value));

  /* ---------- Download ---------- */

  function download(r) {
    toast('Downloading \u201C' + r.title + '.' + r.ext + '\u201D\u2026');
  }

  /* ---------- Preview modal ---------- */

  let currentId = null;

  function openPreview(id, opener) {
    const r = find(id);
    currentId = id;
    const filled = Math.round(r.rating);
    $('#previewTitle').textContent = r.title;
    const by = $('#previewBy');
    by.replaceChildren(
      'By ' + r.uploader + ' \u2022 ',
      h('span', { class: 'stars', 'aria-label': 'Rated ' + r.rating.toFixed(1) + ' out of 5' },
        '\u2605'.repeat(filled) + '\u2606'.repeat(5 - filled)));
    const reportBtn = $('#previewReport');
    reportBtn.disabled = reported.has(id);
    Modal.open('previewModal', opener);
  }

  $('#previewDownload').addEventListener('click', () => download(find(currentId)));
  $('#previewReport').addEventListener('click', () => {
    const id = currentId;
    Modal.close('previewModal');
    openReport(id, document.activeElement);
  });

  /* ---------- Report modal ---------- */

  const reportForm = $('#reportForm');
  let reportId = null;

  function openReport(id, opener) {
    reportId = id;
    Modal.open('reportModal', opener);
  }

  $('#reportModal').addEventListener('modalclose', () => {
    reportForm.reset();
    reportForm.querySelectorAll('.form-error').forEach((n) => n.remove());
  });

  reportForm.addEventListener('submit', (event) => {
    event.preventDefault();
    reportForm.querySelectorAll('.form-error').forEach((n) => n.remove());
    const reason = reportForm.elements.reason.value;
    const details = reportForm.elements.details.value.trim();

    let message = '';
    let target = null;
    if (!reason) {
      message = 'Please choose a reason.';
      target = reportForm.querySelector('.reason-list');
    } else if (reason === 'other' && details.length < 10) {
      message = 'Please describe the problem in a few words.';
      target = reportForm.elements.details.closest('.form-group');
    }
    if (message) {
      target.append(h('p', { class: 'form-error', role: 'alert' }, message));
      return;
    }

    reported.add(reportId);
    store.set(REPORTED_KEY, Array.from(reported));
    Modal.close('reportModal');
    toast('Report submitted. Our moderators will review this resource.');
    render();
  });

  /* ---------- Upload modal ---------- */

  const uploadForm = $('#uploadForm');
  const courseSelect = $('#uCourse');

  courseSelect.replaceChildren(...COURSES.map(([code, label]) => h('option', { value: code }, label)));

  function refreshSuggestions() {
    $('#topicSuggestions').replaceChildren(...TOPICS[courseSelect.value].map((t) => h('option', { value: t })));
  }
  courseSelect.addEventListener('change', refreshSuggestions);

  function setError(input, message) {
    const group = input.closest('.form-group');
    const old = group.querySelector('.form-error');
    if (old) old.remove();
    input.classList.toggle('is-invalid', Boolean(message));
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      group.append(h('p', { class: 'form-error', role: 'alert' }, message));
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  $('#uploadBtn').addEventListener('click', (e) => {
    refreshSuggestions();
    Modal.open('uploadModal', e.currentTarget);
  });

  $('#uploadModal').addEventListener('modalclose', () => {
    uploadForm.reset();
    uploadForm.querySelectorAll('.form-control').forEach((el) => setError(el, ''));
  });

  uploadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const f = uploadForm.elements;
    const file = f.file.files[0];
    let firstBad = null;
    const check = (input, message) => {
      setError(input, message);
      if (message && !firstBad) firstBad = input;
    };

    check(f.title, f.title.value.trim().length < 4 ? 'Enter a title of at least 4 characters.' : '');
    check(f.topic, f.topic.value.trim() ? '' : 'Add the topic this resource covers.');

    const ext = file ? file.name.split('.').pop().toLowerCase() : '';
    let fileMsg = '';
    if (!file) fileMsg = 'Choose a file to upload.';
    else if (!ALLOWED_EXT.includes(ext)) fileMsg = 'Only PDF, Word or PowerPoint files are allowed.';
    else if (file.size > MAX_FILE_BYTES) fileMsg = 'That file is larger than 15 MB.';
    check(f.file, fileMsg);

    if (firstBad) {
      firstBad.focus();
      return;
    }

    // Reuse an existing topic (case-insensitive) or create a new one for the course
    const course = f.course.value;
    const typed = f.topic.value.trim();
    const topic = TOPICS[course].find((t) => t.toLowerCase() === typed.toLowerCase()) || typed;
    if (!TOPICS[course].includes(topic)) TOPICS[course].push(topic);

    const resource = {
      id: 'u' + Date.now(),
      title: f.title.value.trim(),
      course,
      topic,
      type: f.type.value,
      uploader: 'You',
      rating: 0,
      count: 0,
      ext,
    };
    resources.unshift(resource);

    // Jump to the new upload so the tutor can see it
    state.course = course;
    state.topics = new Set(TOPICS[course]);
    state.types = new Set(TYPES.map((t) => t[0]));
    state.query = '';
    state.page = 1;
    $('#resourceSearch').value = '';

    Modal.close('uploadModal');
    renderFilters();
    render();
    toast('Resource uploaded. Students can now find \u201C' + resource.title + '\u201D.');
  });

  renderFilters();
  render();
})();
