/* ==========================================================================
   FASTutor — Student Tools Modular JavaScript
   Supports: pages/dashboard.html, pages/mock-exams.html, pages/exam-rush.html
   Vanilla JS only, modular IIFEs per section, full localStorage persistence.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     SHARED UTILITIES: LocalStorage Helpers, Toasts & Modals
     ------------------------------------------------------------------------ */
  const Storage = {
    get(key, defaultValue) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn('FASTutor storage read error for key:', key, e);
        return defaultValue;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('FASTutor storage write error for key:', key, e);
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('FASTutor storage remove error for key:', key, e);
      }
    }
  };

  /** Show toast notification for ~2.6 seconds */
  function showToast(message, type = 'teal') {
    let container = document.getElementById('st-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'st-toast-container';
      container.className = 'st-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `st-toast ${type === 'amber' ? 'st-toast--amber' : 'st-toast--teal'}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 2600);
  }

  /** Modal Dialog Controller */
  const Dialog = {
    activeTrigger: null,
    open(modalId, triggerElement = null) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      this.activeTrigger = triggerElement || document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';

      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();

      const handleKey = (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
          Dialog.close(modalId);
          document.removeEventListener('keydown', handleKey);
        }
      };
      document.addEventListener('keydown', handleKey);
    },
    close(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      modal.hidden = true;
      document.body.style.overflow = '';
      if (this.activeTrigger && typeof this.activeTrigger.focus === 'function') {
        this.activeTrigger.focus();
        this.activeTrigger = null;
      }
    }
  };

  // Ensure modal backdrop and close button clicks close dialogs
  document.addEventListener('click', (e) => {
    const backdrop = e.target.closest('.st-modal-backdrop');
    if (backdrop && e.target === backdrop) {
      Dialog.close(backdrop.id);
    }
    const closeBtn = e.target.closest('[data-modal-close]');
    if (closeBtn) {
      const modal = closeBtn.closest('.st-modal-backdrop');
      if (modal) Dialog.close(modal.id);
    }
  });

  // Mobile navigation drawer toggle fallback (works alongside script.js)
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileIcon = document.getElementById('mobile-menu-icon');
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = !mobileDrawer.hidden;
      mobileDrawer.hidden = isOpen;
      mobileToggle.setAttribute('aria-expanded', String(!isOpen));
      if (mobileIcon) mobileIcon.textContent = !isOpen ? 'close' : 'menu';
    });
  }

  /* ========================================================================
     PAGE 1: STUDENT DASHBOARD (pages/dashboard.html)
     ======================================================================== */
  (() => {
    const page = document.getElementById('page-dashboard');
    if (!page) return;

    // Keys
    const KEY_SESSIONS = 'fastutor_upcoming_sessions';
    const KEY_SAVED = 'fastutor_saved_tutors';
    const KEY_RATINGS = 'fastutor_ratings';
    const KEY_BOOKINGS = 'fastutor_bookings';

    // Seed Data
    const initialSessions = [
      {
        id: 'sess-1',
        course: 'Calculus II',
        tutor: "Batch '22 senior",
        time: 'Tomorrow 6:00 PM',
        mode: 'Online',
        status: 'Confirmed',
        statusType: 'confirmed',
        initials: 'C2',
        canJoin: true
      },
      {
        id: 'sess-2',
        course: 'PF (CS1002)',
        tutor: "Batch '21 senior",
        time: 'Saturday 4:00 PM',
        mode: 'In-person',
        status: 'Pending',
        statusType: 'pending',
        initials: 'PF',
        canJoin: false
      },
      {
        id: 'sess-3',
        course: 'DSA Revision (Group)',
        tutor: 'Exam Rush host',
        time: 'Sunday 9:00 PM',
        mode: 'Online',
        status: 'Confirmed',
        statusType: 'confirmed',
        initials: 'DS',
        canJoin: true
      }
    ];

    const initialSavedTutors = [
      {
        id: 'tutor-ali',
        name: 'Ali R.',
        initials: 'AR',
        rating: '4.9',
        course: 'DSA',
        rate: 850
      },
      {
        id: 'tutor-sara',
        name: 'Sara K.',
        initials: 'SK',
        rating: '4.7',
        course: 'PF',
        rate: 750
      },
      {
        id: 'tutor-hamza',
        name: 'Hamza M.',
        initials: 'HM',
        rating: '5.0',
        course: 'OOP',
        rate: 800
      }
    ];

    // State initialization
    function getSessions() {
      let sessions = Storage.get(KEY_SESSIONS, null);
      if (!sessions) {
        sessions = [...initialSessions];
        Storage.set(KEY_SESSIONS, sessions);
      }
      // Merge with any new Exam Rush bookings
      const bookings = Storage.get(KEY_BOOKINGS, []);
      bookings.forEach(b => {
        if (!sessions.some(s => s.id === b.id)) {
          sessions.unshift({
            id: b.id,
            course: b.course,
            tutor: b.tutor || 'Exam Rush Mentor',
            time: b.time || 'Tonight 9:00 PM',
            mode: b.mode || 'Online',
            status: 'Confirmed',
            statusType: 'confirmed',
            initials: b.course.slice(0, 2).toUpperCase(),
            canJoin: true
          });
        }
      });
      return sessions;
    }

    function getSavedTutors() {
      let saved = Storage.get(KEY_SAVED, null);
      if (!saved) {
        saved = [...initialSavedTutors];
        Storage.set(KEY_SAVED, saved);
      }
      return saved;
    }

    function updateStats() {
      const sessions = getSessions();
      const saved = getSavedTutors();

      const statUpcoming = document.getElementById('stat-upcoming');
      const statSaved = document.getElementById('stat-saved');
      const statHours = document.getElementById('stat-hours');

      if (statUpcoming) statUpcoming.textContent = sessions.length;
      if (statSaved) statSaved.textContent = saved.length;

      // Completed sessions is 12 + rated sessions count
      const ratings = Storage.get(KEY_RATINGS, {});
      const completedCount = 12 + Object.keys(ratings).length;
      const hoursCount = Math.round(completedCount * 1.5 + sessions.length * 1.0);
      if (statHours) statHours.textContent = `${hoursCount} hrs`;
    }

    // 1.2.1 Render Upcoming Sessions
    function renderSessions() {
      const listEl = document.getElementById('upcoming-sessions-list');
      const emptyEl = document.getElementById('upcoming-empty-state');
      if (!listEl) return;

      const sessions = getSessions();
      listEl.innerHTML = '';

      if (sessions.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        updateStats();
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      sessions.forEach(sess => {
        const row = document.createElement('div');
        row.className = 'st-session-row';
        row.id = `row-${sess.id}`;

        const isTeal = sess.statusType === 'confirmed';
        const badgeClass = isTeal ? 'st-badge st-badge--confirmed' : 'st-badge st-badge--pending';

        row.innerHTML = `
          <div class="st-session-avatar">${sess.initials}</div>
          <div class="st-session-info">
            <h3>${sess.course}</h3>
            <div class="st-session-meta">
              <span>${sess.tutor}</span>
              <span>${sess.time}</span>
              <span>${sess.mode}</span>
            </div>
          </div>
          <div>
            <span class="${badgeClass}">${sess.status}</span>
          </div>
          <div class="st-session-actions">
            ${sess.canJoin ? `<button class="btn btn-secondary btn-sm" data-action="join" data-id="${sess.id}">Join</button>` : ''}
            <button class="btn btn-ghost-nav btn-sm" data-action="reschedule" data-id="${sess.id}">Reschedule</button>
            <button class="btn btn-ghost-nav btn-sm" data-action="cancel" data-id="${sess.id}">Cancel</button>
          </div>
        `;
        listEl.appendChild(row);
      });

      updateStats();
    }

    // Session Actions Event Delegation
    const sessionListEl = document.getElementById('upcoming-sessions-list');
    if (sessionListEl) {
      sessionListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const sessions = getSessions();
        const session = sessions.find(s => s.id === id);

        if (action === 'cancel') {
          const confirmed = window.confirm(`Are you sure you want to cancel your session for ${session ? session.course : 'this course'}?`);
          if (confirmed) {
            const updated = sessions.filter(s => s.id !== id);
            Storage.set(KEY_SESSIONS, updated);
            // Also clean from bookings if originated there
            const bookings = Storage.get(KEY_BOOKINGS, []);
            const updatedBookings = bookings.filter(b => b.id !== id);
            Storage.set(KEY_BOOKINGS, updatedBookings);
            renderSessions();
            showToast('Session cancelled successfully.', 'amber');
          }
        } else if (action === 'join') {
          showToast(`Opening virtual classroom for ${session ? session.course : 'session'}...`);
        } else if (action === 'reschedule') {
          showToast(`Reschedule request sent to senior tutor for ${session ? session.course : 'session'}.`);
        }
      });
    }

    // 1.2.2 Rate Completed Sessions
    const ratingState = {
      coal: 0,
      oop: 0
    };

    function initRatings() {
      const savedRatings = Storage.get(KEY_RATINGS, {});

      ['coal', 'oop'].forEach(courseId => {
        const card = document.getElementById(`rate-card-${courseId}`);
        if (!card) return;

        if (savedRatings[courseId]) {
          renderRatedState(card, savedRatings[courseId]);
        } else {
          setupRatingCard(card, courseId);
        }
      });
    }

    function setupRatingCard(card, courseId) {
      const starBtns = card.querySelectorAll('.st-star-btn');
      const submitBtn = card.querySelector('.st-submit-rating');
      const textarea = card.querySelector('.st-review-textarea');

      starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const rating = parseInt(btn.dataset.rating, 10);
          ratingState[courseId] = rating;
          starBtns.forEach(s => {
            const val = parseInt(s.dataset.rating, 10);
            const active = val <= rating;
            s.classList.toggle('is-active', active);
            s.setAttribute('aria-pressed', String(active));
          });
        });
      });

      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const chosenRating = ratingState[courseId];
          if (!chosenRating || chosenRating < 1) {
            // Show Missing Rating Alert Modal
            Dialog.open('st-missing-rating-modal', submitBtn);
            return;
          }

          const reviewText = (textarea?.value || '').trim();
          const ratingData = {
            stars: chosenRating,
            review: reviewText,
            timestamp: new Date().toLocaleDateString()
          };

          const allRatings = Storage.get(KEY_RATINGS, {});
          allRatings[courseId] = ratingData;
          Storage.set(KEY_RATINGS, allRatings);

          renderRatedState(card, ratingData);
          showToast('✓ THANK YOU! Your rating was submitted.');
          updateStats();
        });
      }
    }

    function renderRatedState(card, ratingData) {
      const formContainer = card.querySelector('.st-rate-form-container');
      if (!formContainer) return;

      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<span class="material-symbols-outlined" aria-hidden="true">${i <= ratingData.stars ? 'star' : 'star_border'}</span>`;
      }

      formContainer.innerHTML = `
        <div class="st-rated-success">
          <div class="st-rated-stars" aria-label="${ratingData.stars} out of 5 stars">${starsHtml}</div>
          <span class="st-rated-success-text">Thank you! Your rating helps other students.</span>
          ${ratingData.review ? `<p class="st-rated-review">"${ratingData.review}"</p>` : ''}
        </div>
      `;
    }

    // 1.2.3 Saved Tutors
    function renderSavedTutors() {
      const grid = document.getElementById('saved-tutors-grid');
      const emptyEl = document.getElementById('saved-tutors-empty');
      if (!grid) return;

      const saved = getSavedTutors();
      grid.innerHTML = '';

      if (saved.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        updateStats();
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      saved.forEach(tutor => {
        const card = document.createElement('div');
        card.className = 'st-tutor-card';
        card.id = `tutor-${tutor.id}`;
        card.innerHTML = `
          <div class="st-tutor-card-head">
            <div class="st-tutor-avatar">${tutor.initials || tutor.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <div class="st-tutor-name">${tutor.name}</div>
              <div class="st-tutor-rating">
                <span class="material-symbols-outlined" aria-hidden="true">star</span>
                <span>${tutor.rating}</span>
              </div>
            </div>
          </div>
          <div class="st-tutor-details">
            <span class="st-tutor-course">${tutor.course}</span>
            <span class="st-tutor-price">PKR ${tutor.rate}/hr</span>
          </div>
          <div class="st-tutor-actions">
            <a class="btn btn-primary btn-sm" href="../index.html#best-tutors">Book</a>
            <button class="btn btn-ghost-nav btn-sm" data-action="remove-saved" data-id="${tutor.id}">Remove</button>
          </div>
        `;
        grid.appendChild(card);
      });

      updateStats();
    }

    const savedGridEl = document.getElementById('saved-tutors-grid');
    if (savedGridEl) {
      savedGridEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action="remove-saved"]');
        if (!btn) return;
        const id = btn.dataset.id;
        const saved = getSavedTutors();
        const updated = saved.filter(t => t.id !== id);
        Storage.set(KEY_SAVED, updated);
        renderSavedTutors();
        showToast('Removed from saved tutors.');
      });
    }

    // Reset Demo Data Button
    const resetBtn = document.getElementById('reset-dashboard-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Storage.remove(KEY_SESSIONS);
        Storage.remove(KEY_SAVED);
        Storage.remove(KEY_RATINGS);
        Storage.remove(KEY_BOOKINGS);
        renderSessions();
        initRatings();
        renderSavedTutors();
        showToast('Demo data reset to initial values.');
      });
    }

    // Initial render
    renderSessions();
    initRatings();
    renderSavedTutors();
    updateStats();
  })();

  /* ========================================================================
     PAGE 2: PRACTICE & MOCK EXAMS (pages/mock-exams.html)
     ======================================================================== */
  (() => {
    const page = document.getElementById('page-mock');
    if (!page) return;

    const KEY_ATTEMPTS = 'fastutor_mock_attempts';

    // Mock Exams Data
    const mockExams = [
      {
        id: 'pf-q1',
        title: 'PF: Quiz 1 Mock',
        course: 'PF (CS1002)',
        category: 'Quiz',
        difficulty: 'Easy',
        badgeClass: 'st-badge--easy',
        questions: 15,
        duration: 20,
        sortDuration: 20,
        sortDifficulty: 1
      },
      {
        id: 'pf-s1',
        title: 'PF: Sessional 1 Mock',
        course: 'PF (CS1002)',
        category: 'Sessional 1',
        difficulty: 'Medium',
        badgeClass: 'st-badge--medium',
        questions: 30,
        duration: 60,
        sortDuration: 60,
        sortDifficulty: 2
      },
      {
        id: 'dsa-s2',
        title: 'DSA: Sessional 2 Mock',
        course: 'DSA',
        category: 'Sessional 2',
        difficulty: 'Medium',
        badgeClass: 'st-badge--medium',
        questions: 25,
        duration: 60,
        sortDuration: 60,
        sortDifficulty: 2
      },
      {
        id: 'calc2-final',
        title: 'Calculus II: Final Mock',
        course: 'Calculus II',
        category: 'Final',
        difficulty: 'Hard',
        badgeClass: 'st-badge--hard',
        questions: 40,
        duration: 90,
        sortDuration: 90,
        sortDifficulty: 3
      },
      {
        id: 'coal-q2',
        title: 'COAL: Quiz 2 Mock',
        course: 'COAL',
        category: 'Quiz',
        difficulty: 'Easy',
        badgeClass: 'st-badge--easy',
        questions: 15,
        duration: 20,
        sortDuration: 20,
        sortDifficulty: 1
      },
      {
        id: 'oop-final',
        title: 'OOP: Final Mock',
        course: 'OOP',
        category: 'Final',
        difficulty: 'Hard',
        badgeClass: 'st-badge--hard',
        questions: 40,
        duration: 90,
        sortDuration: 90,
        sortDifficulty: 3
      }
    ];

    // C++ Sample 5 Questions
    const examQuestions = [
      {
        id: 1,
        topic: 'Loops',
        text: 'Output of for(int i=0;i<3;i++) cout<<i;',
        options: ['012', '123', '0123', 'Compile error'],
        answer: 0
      },
      {
        id: 2,
        topic: 'Basics',
        text: 'int x = 5; x++; cout << x;',
        options: ['5', '6', '7', 'Error'],
        answer: 1
      },
      {
        id: 3,
        topic: 'Loops',
        text: 'Which loop always runs its body at least once?',
        options: ['for', 'while', 'do-while', 'None of these'],
        answer: 2
      },
      {
        id: 4,
        topic: 'Arrays',
        text: 'int a[3] = {1,2,3}; cout << a[2];',
        options: ['1', '2', '3', 'Out of range'],
        answer: 2
      },
      {
        id: 5,
        topic: 'Operators',
        text: 'Which operator gives the remainder of a division?',
        options: ['/', '%', '*', '&'],
        answer: 1
      }
    ];

    // Seed attempts if not present
    function getAttempts() {
      let attempts = Storage.get(KEY_ATTEMPTS, null);
      if (!attempts) {
        // Seed 8 attempts, 72% average, 90% best
        attempts = [
          { exam: 'PF: Quiz 1 Mock', score: 5, total: 5, percent: 90, date: 'Nov 20, 2026' },
          { exam: 'PF: Sessional 1 Mock', score: 4, total: 5, percent: 80, date: 'Nov 18, 2026' },
          { exam: 'DSA: Sessional 2 Mock', score: 3, total: 5, percent: 60, date: 'Nov 16, 2026' },
          { exam: 'Calculus II: Final Mock', score: 4, total: 5, percent: 80, date: 'Nov 14, 2026' },
          { exam: 'COAL: Quiz 2 Mock', score: 3, total: 5, percent: 60, date: 'Nov 12, 2026' },
          { exam: 'OOP: Final Mock', score: 4, total: 5, percent: 75, date: 'Nov 10, 2026' },
          { exam: 'PF: Quiz 1 Mock', score: 4, total: 5, percent: 70, date: 'Nov 08, 2026' },
          { exam: 'DSA: Sessional 2 Mock', score: 3, total: 5, percent: 61, date: 'Nov 05, 2026' }
        ];
        Storage.set(KEY_ATTEMPTS, attempts);
      }
      return attempts;
    }

    // 2.1 Calculate Progress
    function renderProgress() {
      const attempts = getAttempts();
      const countEl = document.getElementById('stat-attempts-count');
      const avgEl = document.getElementById('stat-avg-score');
      const bestEl = document.getElementById('stat-best-score');
      const barEl = document.getElementById('stat-avg-bar');
      const percentEl = document.getElementById('stat-avg-percent');

      const count = attempts.length;
      let avg = 0;
      let best = 0;

      if (count > 0) {
        const sum = attempts.reduce((acc, a) => acc + a.percent, 0);
        avg = Math.round(sum / count);
        best = Math.max(...attempts.map(a => a.percent));
      }

      if (countEl) countEl.textContent = count;
      if (avgEl) avgEl.textContent = `${avg}%`;
      if (bestEl) bestEl.textContent = `${best}%`;
      if (barEl) barEl.style.width = `${avg}%`;
      if (percentEl) percentEl.textContent = `${avg}%`;
    }

    // 2.2 Filter, Search & Sort Mock Exams
    const filterState = {
      search: '',
      course: 'all',
      category: 'all',
      sort: 'default'
    };

    function renderMockExams() {
      const grid = document.getElementById('mock-exam-grid');
      const emptyEl = document.getElementById('mock-empty-state');
      if (!grid) return;

      const q = filterState.search.trim().toLowerCase();
      let filtered = mockExams.filter(exam => {
        const matchesSearch = !q || exam.title.toLowerCase().includes(q) || exam.course.toLowerCase().includes(q);
        const matchesCourse = filterState.course === 'all' || exam.course === filterState.course;
        const matchesCategory = filterState.category === 'all' || exam.category === filterState.category;
        return matchesSearch && matchesCourse && matchesCategory;
      });

      if (filterState.sort === 'shortest') {
        filtered.sort((a, b) => a.sortDuration - b.sortDuration);
      } else if (filterState.sort === 'hardest') {
        filtered.sort((a, b) => b.sortDifficulty - a.sortDifficulty);
      }

      grid.innerHTML = '';

      if (filtered.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      filtered.forEach(exam => {
        const card = document.createElement('div');
        card.className = 'st-exam-card';
        card.innerHTML = `
          <div class="st-exam-card-top">
            <span class="st-badge ${exam.badgeClass}">${exam.difficulty}</span>
          </div>
          <h3 class="st-exam-title">${exam.title}</h3>
          <div class="st-exam-meta">
            <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
            <span>${exam.questions} questions · ${exam.duration} min</span>
          </div>
          <div class="st-exam-actions">
            <button class="btn btn-primary btn-sm" data-action="start-exam" data-id="${exam.id}" data-title="${exam.title}">Start Exam</button>
            <button class="btn btn-ghost-nav btn-sm" data-action="preview-exam" data-title="${exam.title}">Preview</button>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    // Filter controls listeners
    const searchInput = document.getElementById('mock-search');
    const courseSelect = document.getElementById('mock-course-filter');
    const sortSelect = document.getElementById('mock-sort');
    const chips = document.querySelectorAll('[data-mock-chip]');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterState.search = e.target.value;
        renderMockExams();
      });
    }

    if (courseSelect) {
      courseSelect.addEventListener('change', (e) => {
        filterState.course = e.target.value;
        renderMockExams();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        filterState.sort = e.target.value;
        renderMockExams();
      });
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        filterState.category = chip.dataset.mockChip;
        renderMockExams();
      });
    });

    // 2.3 Past Papers Library & Recent Attempts
    function renderRecentAttempts() {
      const container = document.getElementById('recent-attempts-list');
      const emptyEl = document.getElementById('attempts-empty');
      if (!container) return;

      const attempts = getAttempts();
      container.innerHTML = '';

      if (attempts.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      // Show latest 4 attempts
      attempts.slice(0, 4).forEach(att => {
        const item = document.createElement('div');
        item.className = 'st-attempt-item';
        item.innerHTML = `
          <div class="st-attempt-header">
            <span>${att.exam}</span>
            <b>${att.percent}%</b>
          </div>
          <div class="st-bar-track">
            <div class="st-bar-fill" style="width: ${att.percent}%"></div>
          </div>
        `;
        container.appendChild(item);
      });
    }

    // Past Papers download actions
    const pastTable = document.getElementById('past-papers-table');
    if (pastTable) {
      pastTable.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-download-paper]');
        if (btn) {
          showToast(`Downloading ${btn.dataset.downloadPaper}...`);
        }
      });
    }

    // 2.4 Exam Dialog Controller
    let activeExamTitle = 'PF: Quiz 1 Mock';
    let currentQIndex = 0;
    let userAnswers = {};
    let flaggedQuestions = {};
    let timerInterval = null;
    let secondsLeft = 600; // 10 minutes

    function startExam(title) {
      activeExamTitle = title;
      currentQIndex = 0;
      userAnswers = {};
      flaggedQuestions = {};
      secondsLeft = 600;

      const titleEl = document.getElementById('exam-dialog-title');
      if (titleEl) titleEl.textContent = activeExamTitle;

      // Switch to quiz view, hide result view
      const quizView = document.getElementById('exam-quiz-view');
      const resultView = document.getElementById('exam-result-view');
      if (quizView) quizView.hidden = false;
      if (resultView) resultView.hidden = true;

      renderQuestion(0);
      startTimer();
      Dialog.open('st-exam-modal');
    }

    function startTimer() {
      clearInterval(timerInterval);
      const timerEl = document.getElementById('exam-timer');
      const updateDisplay = () => {
        const m = Math.floor(secondsLeft / 60);
        const s = secondsLeft % 60;
        if (timerEl) {
          timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      };
      updateDisplay();

      timerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(timerInterval);
          submitExam(true);
        } else {
          updateDisplay();
        }
      }, 1000);
    }

    function renderQuestion(index) {
      currentQIndex = index;
      const q = examQuestions[index];
      if (!q) return;

      const qCountEl = document.getElementById('exam-q-count');
      const progressEl = document.getElementById('exam-progress-bar');
      const legendTopic = document.getElementById('exam-legend-topic');
      const legendText = document.getElementById('exam-legend-text');
      const optionsBox = document.getElementById('exam-options-box');
      const flagBtn = document.getElementById('exam-flag-btn');

      if (qCountEl) qCountEl.textContent = `Question ${index + 1} of ${examQuestions.length}`;
      if (progressEl) progressEl.style.width = `${((index + 1) / examQuestions.length) * 100}%`;
      if (legendTopic) legendTopic.textContent = `[${q.topic}]`;
      if (legendText) legendText.textContent = q.text;

      if (optionsBox) {
        optionsBox.innerHTML = '';
        q.options.forEach((opt, optIndex) => {
          const isSelected = userAnswers[index] === optIndex;
          const label = document.createElement('label');
          label.className = `st-option-label ${isSelected ? 'is-selected' : ''}`;
          label.innerHTML = `
            <input class="st-option-radio" type="radio" name="mock_question" value="${optIndex}" ${isSelected ? 'checked' : ''}>
            <span>${opt}</span>
          `;
          label.addEventListener('change', () => {
            userAnswers[index] = optIndex;
            renderQuestion(index);
          });
          optionsBox.appendChild(label);
        });
      }

      // Update flag button label
      if (flagBtn) {
        const isFlagged = Boolean(flaggedQuestions[index]);
        flagBtn.innerHTML = `
          <span class="material-symbols-outlined" aria-hidden="true">${isFlagged ? 'flag' : 'outlined_flag'}</span>
          <span>${isFlagged ? 'Unflag' : 'Flag'}</span>
        `;
      }

      // Prev / Next button states
      const prevBtn = document.getElementById('exam-prev-btn');
      const nextBtn = document.getElementById('exam-next-btn');
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === examQuestions.length - 1;

      renderPalette();
    }

    function renderPalette() {
      const palette = document.getElementById('exam-palette-grid');
      if (!palette) return;
      palette.innerHTML = '';

      examQuestions.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'st-palette-btn';
        btn.textContent = String(i + 1);
        btn.setAttribute('aria-label', `Jump to question ${i + 1}`);

        if (i === currentQIndex) btn.classList.add('is-current');
        if (userAnswers[i] !== undefined) btn.classList.add('is-answered');
        if (flaggedQuestions[i]) btn.classList.add('is-flagged');

        btn.addEventListener('click', () => {
          renderQuestion(i);
        });
        palette.appendChild(btn);
      });
    }

    function submitExam(force = false) {
      if (!force) {
        const answeredCount = Object.keys(userAnswers).length;
        if (answeredCount < examQuestions.length) {
          const unanswered = examQuestions.length - answeredCount;
          const confirmSubmit = window.confirm(`You have ${unanswered} unanswered question(s). Submit exam anyway?`);
          if (!confirmSubmit) return;
        }
      }

      clearInterval(timerInterval);

      // Score Calculation
      let correctCount = 0;
      const topicStats = {};

      examQuestions.forEach((q, i) => {
        if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, correct: 0 };
        topicStats[q.topic].total++;
        if (userAnswers[i] === q.answer) {
          correctCount++;
          topicStats[q.topic].correct++;
        }
      });

      const total = examQuestions.length;
      const percent = Math.round((correctCount / total) * 100);

      // Save attempt to localStorage
      const attempts = getAttempts();
      const newAttempt = {
        exam: activeExamTitle,
        score: correctCount,
        total: total,
        percent: percent,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      attempts.unshift(newAttempt);
      Storage.set(KEY_ATTEMPTS, attempts);

      // Render Result View
      const quizView = document.getElementById('exam-quiz-view');
      const resultView = document.getElementById('exam-result-view');
      if (quizView) quizView.hidden = true;
      if (resultView) resultView.hidden = false;

      const scoreBadge = document.getElementById('exam-result-score');
      const titleEl = document.getElementById('exam-result-title');
      const descEl = document.getElementById('exam-result-desc');
      const topicBars = document.getElementById('exam-topic-breakdown');

      if (scoreBadge) scoreBadge.textContent = `${correctCount}/${total}`;

      if (percent >= 80) {
        if (titleEl) titleEl.textContent = 'Great job!';
        if (descEl) descEl.textContent = 'Strong grasp of the core concepts. You are in great shape for the exam.';
      } else if (percent >= 50) {
        if (titleEl) titleEl.textContent = 'Good effort. Review the weak topics.';
        if (descEl) descEl.textContent = 'You have a solid foundation, but brush up on tricky edge cases.';
      } else {
        if (titleEl) titleEl.textContent = 'Keep practising. A tutor can help.';
        if (descEl) descEl.textContent = 'Identify shaky topics and book a senior mentor to master them before exam day.';
      }

      if (topicBars) {
        topicBars.innerHTML = '';
        Object.keys(topicStats).forEach(topic => {
          const st = topicStats[topic];
          const tPercent = Math.round((st.correct / st.total) * 100);
          const barItem = document.createElement('div');
          barItem.innerHTML = `
            <div class="st-bar-label">
              <span>${topic} (${st.correct}/${st.total})</span>
              <span>${tPercent}%</span>
            </div>
            <div class="st-bar-track">
              <div class="st-bar-fill" style="width: ${tPercent}%"></div>
            </div>
          `;
          topicBars.appendChild(barItem);
        });
      }

      renderProgress();
      renderRecentAttempts();
    }

    // Attach exam control event listeners
    const prevBtn = document.getElementById('exam-prev-btn');
    const nextBtn = document.getElementById('exam-next-btn');
    const flagBtn = document.getElementById('exam-flag-btn');
    const submitBtn = document.getElementById('exam-submit-btn');
    const retakeBtn = document.getElementById('exam-retake-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => { if (currentQIndex > 0) renderQuestion(currentQIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (currentQIndex < examQuestions.length - 1) renderQuestion(currentQIndex + 1); });
    if (flagBtn) flagBtn.addEventListener('click', () => {
      flaggedQuestions[currentQIndex] = !flaggedQuestions[currentQIndex];
      renderQuestion(currentQIndex);
    });
    if (submitBtn) submitBtn.addEventListener('click', () => submitExam(false));
    if (retakeBtn) retakeBtn.addEventListener('click', () => startExam(activeExamTitle));

    // Delegation on mock grid
    const examGridEl = document.getElementById('mock-exam-grid');
    if (examGridEl) {
      examGridEl.addEventListener('click', (e) => {
        const startBtn = e.target.closest('button[data-action="start-exam"]');
        if (startBtn) {
          startExam(startBtn.dataset.title);
          return;
        }
        const previewBtn = e.target.closest('button[data-action="preview-exam"]');
        if (previewBtn) {
          showToast(`Mock preview for ${previewBtn.dataset.title}: includes syllabus breakdown and past grading rubrics.`);
        }
      });
    }

    // Initial render
    renderProgress();
    renderMockExams();
    renderRecentAttempts();
  })();

  /* ========================================================================
     PAGE 3: EXAM RUSH (pages/exam-rush.html)
     ======================================================================== */
  (() => {
    const page = document.getElementById('page-rush');
    if (!page) return;

    const KEY_SAVED = 'fastutor_saved_tutors';
    const KEY_BOOKINGS = 'fastutor_bookings';
    const KEY_UPCOMING = 'fastutor_upcoming_sessions';

    // 3.1 Live Countdown Timer
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
      const targetStr = countdownEl.dataset.target || '2026-12-07T20:00:00+05:00';
      const targetTime = new Date(targetStr).getTime();

      function updateCountdown() {
        const now = new Date().getTime();
        const diff = Math.max(0, targetTime - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        const dEl = document.getElementById('cd-days');
        const hEl = document.getElementById('cd-hours');
        const mEl = document.getElementById('cd-mins');
        const sEl = document.getElementById('cd-secs');

        if (dEl) dEl.textContent = String(days).padStart(2, '0');
        if (hEl) hEl.textContent = String(hours).padStart(2, '0');
        if (mEl) mEl.textContent = String(mins).padStart(2, '0');
        if (sEl) sEl.textContent = String(secs).padStart(2, '0');
      }

      updateCountdown();
      setInterval(updateCountdown, 1000);
    }

    // 3.3 Standby Slots Data
    const standbySlots = [
      {
        id: 'slot-ali',
        tutor: 'Ali R.',
        initials: 'AR',
        rating: '4.9',
        course: 'DSA',
        exam: 'Final',
        time: 'Tonight 8:00 PM',
        sortTime: 2000,
        rate: 850,
        mode: 'Online',
        taken: false
      },
      {
        id: 'slot-sara',
        tutor: 'Sara K.',
        initials: 'SK',
        rating: '4.7',
        course: 'PF (CS1002)',
        exam: 'Sessional 1',
        time: 'Tonight 9:30 PM',
        sortTime: 2130,
        rate: 750,
        mode: 'Online',
        taken: false
      },
      {
        id: 'slot-hamza',
        tutor: 'Hamza M.',
        initials: 'HM',
        rating: '5.0',
        course: 'OOP',
        exam: 'Sessional 2',
        time: 'Tonight 11:00 PM',
        sortTime: 2300,
        rate: 800,
        mode: 'In-person',
        taken: false
      },
      {
        id: 'slot-zara',
        tutor: 'Zara A.',
        initials: 'ZA',
        rating: '4.8',
        course: 'Calculus II',
        exam: 'Final',
        time: 'Tonight 8:00 PM',
        sortTime: 2000,
        rate: 800,
        mode: 'Online',
        taken: true // Taken slot
      }
    ];

    // 3.4 Group Revision Sessions Data
    const groupSessions = [
      {
        id: 'group-dsa',
        title: 'DSA: Final Revision',
        host: 'Ali R.',
        time: 'Sun 9:00 PM',
        sortTime: 2100,
        course: 'DSA',
        exam: 'Final',
        mode: 'Online',
        seatsTaken: 3,
        totalSeats: 5,
        feeRange: 'PKR 250 to 350 per student',
        seatPrice: 300
      },
      {
        id: 'group-pf',
        title: 'PF: Sessional 1 Past Papers',
        host: 'Sara K.',
        time: 'Mon 8:00 PM',
        sortTime: 2000,
        course: 'PF (CS1002)',
        exam: 'Sessional 1',
        mode: 'Online',
        seatsTaken: 2,
        totalSeats: 5,
        feeRange: 'PKR 250 to 350 per student',
        seatPrice: 300
      },
      {
        id: 'group-calc2',
        title: 'Calculus II: Last Night Q&A',
        host: 'Zara A.',
        time: 'Mon 10:00 PM',
        sortTime: 2200,
        course: 'Calculus II',
        exam: 'Final',
        mode: 'Online',
        seatsTaken: 5,
        totalSeats: 5,
        feeRange: 'PKR 250 to 350 per student',
        seatPrice: 300
      }
    ];

    // Filter and Tab State
    const rushState = {
      activeTab: 'slots', // 'slots' or 'groups'
      exam: 'all',
      course: 'all',
      mode: 'any',
      sort: 'earliest'
    };

    // 3.2 Tabs Controller
    const tabSlotsBtn = document.getElementById('tab-btn-slots');
    const tabGroupsBtn = document.getElementById('tab-btn-groups');
    const panelSlots = document.getElementById('tab-panel-slots');
    const panelGroups = document.getElementById('tab-panel-groups');

    function switchTab(tab) {
      rushState.activeTab = tab;
      if (tab === 'slots') {
        tabSlotsBtn?.classList.add('is-active');
        tabSlotsBtn?.setAttribute('aria-selected', 'true');
        tabGroupsBtn?.classList.remove('is-active');
        tabGroupsBtn?.setAttribute('aria-selected', 'false');
        if (panelSlots) panelSlots.hidden = false;
        if (panelGroups) panelGroups.hidden = true;
      } else {
        tabGroupsBtn?.classList.add('is-active');
        tabGroupsBtn?.setAttribute('aria-selected', 'true');
        tabSlotsBtn?.classList.remove('is-active');
        tabSlotsBtn?.setAttribute('aria-selected', 'false');
        if (panelGroups) panelGroups.hidden = false;
        if (panelSlots) panelSlots.hidden = true;
      }
      applyFilters();
    }

    if (tabSlotsBtn) tabSlotsBtn.addEventListener('click', () => switchTab('slots'));
    if (tabGroupsBtn) tabGroupsBtn.addEventListener('click', () => switchTab('groups'));

    // Hero action buttons switch tabs
    const heroBtnSlots = document.getElementById('hero-btn-slots');
    const heroBtnGroups = document.getElementById('hero-btn-groups');
    if (heroBtnSlots) heroBtnSlots.addEventListener('click', () => switchTab('slots'));
    if (heroBtnGroups) heroBtnGroups.addEventListener('click', () => switchTab('groups'));

    // Filter controls
    const examFilterSelect = document.getElementById('rush-exam-filter');
    const courseFilterSelect = document.getElementById('rush-course-filter');
    const sortFilterSelect = document.getElementById('rush-sort-filter');
    const modeChips = document.querySelectorAll('[data-rush-mode]');

    if (examFilterSelect) {
      examFilterSelect.addEventListener('change', (e) => {
        rushState.exam = e.target.value;
        applyFilters();
      });
    }

    if (courseFilterSelect) {
      courseFilterSelect.addEventListener('change', (e) => {
        rushState.course = e.target.value;
        applyFilters();
      });
    }

    if (sortFilterSelect) {
      sortFilterSelect.addEventListener('change', (e) => {
        rushState.sort = e.target.value;
        applyFilters();
      });
    }

    modeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        modeChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        rushState.mode = chip.dataset.rushMode;
        applyFilters();
      });
    });

    // 3.3 Render Slots
    function renderSlots() {
      const grid = document.getElementById('standby-slots-grid');
      const emptyEl = document.getElementById('slots-empty-state');
      if (!grid) return;

      const bookings = Storage.get(KEY_BOOKINGS, []);
      const savedTutors = Storage.get(KEY_SAVED, []);

      let filtered = standbySlots.filter(s => {
        const matchesExam = rushState.exam === 'all' || s.exam === rushState.exam;
        const matchesCourse = rushState.course === 'all' || s.course === rushState.course;
        const matchesMode = rushState.mode === 'any' || s.mode.toLowerCase() === rushState.mode.toLowerCase();
        return matchesExam && matchesCourse && matchesMode;
      });

      if (rushState.sort === 'earliest') {
        filtered.sort((a, b) => a.sortTime - b.sortTime);
      } else if (rushState.sort === 'price-asc') {
        filtered.sort((a, b) => a.rate - b.rate);
      } else if (rushState.sort === 'price-desc') {
        filtered.sort((a, b) => b.rate - a.rate);
      }

      grid.innerHTML = '';

      if (filtered.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      filtered.forEach(slot => {
        const isBooked = bookings.some(b => b.id === slot.id);
        const isUnavailable = slot.taken || isBooked;
        const isSaved = savedTutors.some(t => t.name === slot.tutor);

        const card = document.createElement('div');
        card.className = `st-slot-card ${isUnavailable ? 'is-taken' : ''}`;
        card.id = `slot-${slot.id}`;

        card.innerHTML = `
          <div class="st-slot-top">
            <div class="st-slot-tutor">
              <div class="st-avatar-badge">${slot.initials}</div>
              <div>
                <b class="st-user-name">${slot.tutor}</b>
                <div class="st-tutor-rating">
                  <span class="material-symbols-outlined" aria-hidden="true">star</span>
                  <span>${slot.rating}</span>
                </div>
              </div>
            </div>
            <button class="st-save-btn ${isSaved ? 'is-saved' : ''}" data-action="save-slot" data-id="${slot.id}" data-tutor="${slot.tutor}" data-rate="${slot.rate}" data-course="${slot.course}" data-rating="${slot.rating}" aria-label="${isSaved ? 'Remove from saved' : 'Save tutor'}">
              <span class="material-symbols-outlined" aria-hidden="true">${isSaved ? 'favorite' : 'favorite_border'}</span>
            </button>
          </div>
          <div class="st-slot-course">${slot.course}</div>
          <div class="st-slot-time">
            <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
            <span>${slot.time}</span>
          </div>
          <div>
            <span class="st-slot-mode">${slot.mode}</span>
          </div>
          <div class="st-slot-foot">
            <span class="st-slot-price">PKR ${slot.rate}/hr</span>
            ${isBooked ? `
              <button class="btn btn-secondary btn-sm" disabled>Booked</button>
            ` : slot.taken ? `
              <button class="btn btn-ghost-nav btn-sm" disabled>Unavailable</button>
            ` : `
              <button class="btn btn-amber btn-sm" data-action="book-slot" data-id="${slot.id}">Book Now</button>
            `}
          </div>
        `;
        grid.appendChild(card);
      });
    }

    // 3.4 Render Groups
    function renderGroups() {
      const grid = document.getElementById('group-sessions-grid');
      const emptyEl = document.getElementById('groups-empty-state');
      if (!grid) return;

      const bookings = Storage.get(KEY_BOOKINGS, []);

      let filtered = groupSessions.filter(g => {
        const matchesExam = rushState.exam === 'all' || g.exam === rushState.exam;
        const matchesCourse = rushState.course === 'all' || g.course === rushState.course;
        const matchesMode = rushState.mode === 'any' || g.mode.toLowerCase().includes(rushState.mode.toLowerCase());
        return matchesExam && matchesCourse && matchesMode;
      });

      if (rushState.sort === 'earliest') {
        filtered.sort((a, b) => a.sortTime - b.sortTime);
      } else if (rushState.sort === 'price-asc') {
        filtered.sort((a, b) => a.seatPrice - b.seatPrice);
      } else if (rushState.sort === 'price-desc') {
        filtered.sort((a, b) => b.seatPrice - a.seatPrice);
      }

      grid.innerHTML = '';

      if (filtered.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      filtered.forEach(g => {
        const isJoined = bookings.some(b => b.id === g.id);
        const currentTaken = Math.min(g.totalSeats, g.seatsTaken + (isJoined ? 1 : 0));
        const isFull = currentTaken >= g.totalSeats;

        let seatDotsHtml = '';
        for (let i = 1; i <= g.totalSeats; i++) {
          const taken = i <= currentTaken;
          seatDotsHtml += `<span class="st-seat-dot ${taken ? 'is-taken' : ''}" aria-hidden="true"></span>`;
        }

        const card = document.createElement('div');
        card.className = `st-group-card ${isFull && !isJoined ? 'is-full' : ''}`;
        card.id = `group-${g.id}`;

        card.innerHTML = `
          <h3 class="st-group-title">${g.title}</h3>
          <div class="st-group-host">Host: <b>${g.host}</b> · ${g.time} (${g.mode})</div>
          <div class="st-seats-box">
            <div class="st-seats-top">
              <span>Reserved Seats</span>
              <b>${currentTaken}/${g.totalSeats} joined</b>
            </div>
            <div class="st-seat-dots" aria-label="${currentTaken} of ${g.totalSeats} seats filled">
              ${seatDotsHtml}
            </div>
          </div>
          <div class="st-group-price-row">
            <span class="st-group-fee-text">${g.feeRange}</span>
            ${isJoined ? `
              <button class="btn btn-secondary btn-sm" disabled>Joined</button>
            ` : isFull ? `
              <button class="btn btn-ghost-nav btn-sm" disabled>Full</button>
            ` : `
              <button class="btn btn-amber btn-sm" data-action="join-group" data-id="${g.id}">Join Group</button>
            `}
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function applyFilters() {
      if (rushState.activeTab === 'slots') {
        renderSlots();
      } else {
        renderGroups();
      }
    }

    // 3.4.1 Interactive Group Fee Splitter
    const tutorRateInput = document.getElementById('splitter-tutor-rate');
    const groupSizeSelect = document.getElementById('splitter-group-size');
    const perStudentEl = document.getElementById('splitter-per-student');
    const totalSavingEl = document.getElementById('splitter-saving');

    function updateFeeSplitter() {
      if (!tutorRateInput || !groupSizeSelect || !perStudentEl || !totalSavingEl) return;
      const rate = Math.max(100, parseInt(tutorRateInput.value, 10) || 800);
      const size = Math.max(2, parseInt(groupSizeSelect.value, 10) || 3);

      const perStudent = Math.round(rate / size);
      const saving = rate - perStudent;

      perStudentEl.textContent = `PKR ${perStudent}`;
      totalSavingEl.textContent = `Save PKR ${saving} vs 1-on-1`;
    }

    if (tutorRateInput) tutorRateInput.addEventListener('input', updateFeeSplitter);
    if (groupSizeSelect) groupSizeSelect.addEventListener('change', updateFeeSplitter);
    updateFeeSplitter();

    // 3.4.2 Request a Group Button
    const reqGroupBtn = document.getElementById('btn-request-group');
    if (reqGroupBtn) {
      reqGroupBtn.addEventListener('click', () => {
        showToast('Request submitted! We will notify you when a tutor opens this group.');
      });
    }

    // 3.5 Booking Dialog & Validation
    let activeBookingTarget = null;
    let promoDiscountApplied = false;

    function openBookingDialog(target) {
      activeBookingTarget = target;
      promoDiscountApplied = false;

      const titleEl = document.getElementById('booking-dialog-title');
      const feeEl = document.getElementById('booking-base-fee');
      const discountRow = document.getElementById('booking-discount-row');
      const totalEl = document.getElementById('booking-total-fee');
      const emailInput = document.getElementById('booking-email');
      const topicsInput = document.getElementById('booking-topics');
      const promoInput = document.getElementById('booking-promo');
      const emailError = document.getElementById('booking-email-error');
      const promoError = document.getElementById('booking-promo-error');

      if (titleEl) titleEl.textContent = `Reserve Seat: ${target.name}`;
      if (emailError) emailError.textContent = '';
      if (promoError) promoError.textContent = '';
      if (emailInput) {
        emailInput.value = '';
        emailInput.classList.remove('is-invalid');
      }
      if (topicsInput) topicsInput.value = '';
      if (promoInput) promoInput.value = '';
      if (discountRow) discountRow.hidden = true;

      if (feeEl) feeEl.textContent = `PKR ${target.baseFee}`;
      if (totalEl) totalEl.textContent = `PKR ${target.baseFee}`;

      // Show form view, hide confirmation popup view
      const formView = document.getElementById('booking-form-view');
      const confirmView = document.getElementById('booking-confirmation-view');
      if (formView) formView.hidden = false;
      if (confirmView) confirmView.hidden = true;

      Dialog.open('st-booking-modal');
    }

    function updateBookingTotal() {
      if (!activeBookingTarget) return;
      const feeEl = document.getElementById('booking-base-fee');
      const discountRow = document.getElementById('booking-discount-row');
      const discountAmountEl = document.getElementById('booking-discount-amount');
      const totalEl = document.getElementById('booking-total-fee');

      const base = activeBookingTarget.baseFee;
      if (promoDiscountApplied) {
        const discount = Math.round(base * 0.1);
        const finalTotal = base - discount;
        if (discountRow) discountRow.hidden = false;
        if (discountAmountEl) discountAmountEl.textContent = `- PKR ${discount}`;
        if (totalEl) totalEl.textContent = `PKR ${finalTotal}`;
      } else {
        if (discountRow) discountRow.hidden = true;
        if (totalEl) totalEl.textContent = `PKR ${base}`;
      }
    }

    // Apply Promo Button Listener
    const applyPromoBtn = document.getElementById('booking-apply-promo');
    if (applyPromoBtn) {
      applyPromoBtn.addEventListener('click', () => {
        const promoInput = document.getElementById('booking-promo');
        const promoError = document.getElementById('booking-promo-error');
        const code = (promoInput?.value || '').trim().toUpperCase();

        if (code === 'RUSH10') {
          promoDiscountApplied = true;
          if (promoError) promoError.textContent = '';
          showToast('Promo code RUSH10 applied: 10% discount!');
          updateBookingTotal();
        } else {
          promoDiscountApplied = false;
          if (promoError) promoError.textContent = '❌ INVALID CODE — Code not recognized. Try RUSH10 for 10% off!';
          updateBookingTotal();
        }
      });
    }

    // Submit Booking Form
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('booking-email');
        const emailError = document.getElementById('booking-email-error');
        const promoInput = document.getElementById('booking-promo');
        const promoError = document.getElementById('booking-promo-error');

        const email = (emailInput?.value || '').trim();
        const promoCode = (promoInput?.value || '').trim().toUpperCase();

        // FAST Email Validation: name@campus.nu.edu.pk
        const fastEmailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?nu\.edu\.pk$/i;
        if (!email || !fastEmailRegex.test(email)) {
          if (emailError) emailError.textContent = '❌ INVALID EMAIL — Please use your FAST email, e.g. i261234@isb.nu.edu.pk';
          if (emailInput) emailInput.classList.add('is-invalid');
          return;
        } else {
          if (emailError) emailError.textContent = '';
          if (emailInput) emailInput.classList.remove('is-invalid');
        }

        // Validate promo if entered but not valid
        if (promoCode && promoCode !== 'RUSH10') {
          if (promoError) promoError.textContent = '❌ INVALID CODE — Code not recognized. Try RUSH10 for 10% off!';
          return;
        }

        // Valid booking: Save to localStorage
        const bookings = Storage.get(KEY_BOOKINGS, []);
        const base = activeBookingTarget.baseFee;
        const finalFee = promoDiscountApplied ? Math.round(base * 0.9) : base;

        const newBooking = {
          id: activeBookingTarget.id,
          name: activeBookingTarget.name,
          course: activeBookingTarget.course,
          time: activeBookingTarget.time,
          mode: activeBookingTarget.mode,
          tutor: activeBookingTarget.tutor,
          fee: base,
          finalFee: finalFee,
          promoApplied: promoDiscountApplied,
          email: email
        };

        bookings.push(newBooking);
        Storage.set(KEY_BOOKINGS, bookings);

        // Also add to Upcoming Sessions on Dashboard
        const upcoming = Storage.get(KEY_UPCOMING, []);
        if (!upcoming.some(u => u.id === newBooking.id)) {
          upcoming.unshift({
            id: newBooking.id,
            course: newBooking.course,
            tutor: newBooking.tutor || 'Exam Rush Senior',
            time: newBooking.time,
            mode: newBooking.mode,
            status: 'Confirmed',
            statusType: 'confirmed',
            initials: newBooking.course.slice(0, 2).toUpperCase(),
            canJoin: true
          });
          Storage.set(KEY_UPCOMING, upcoming);
        }

        // Render Confirmation Popup inside modal
        const formView = document.getElementById('booking-form-view');
        const confirmView = document.getElementById('booking-confirmation-view');
        if (formView) formView.hidden = true;
        if (confirmView) {
          confirmView.hidden = false;
          confirmView.innerHTML = `
            <div class="st-confirmation-popup">
              <span class="st-confirm-badge">✓ SEAT RESERVED!</span>
              <div class="st-confirm-details">
                <div class="st-confirm-row"><span>Session / Group:</span><b>${newBooking.name}</b></div>
                <div class="st-confirm-row"><span>Time & Mode:</span><b>${newBooking.time} · ${newBooking.mode}</b></div>
                <div class="st-confirm-row"><span>Base Fee:</span><b>PKR ${newBooking.fee}</b></div>
                ${newBooking.promoApplied ? `<div class="st-confirm-row st-teal-text"><span>Promo:</span><b>Promo RUSH10 Applied (-10%)</b></div>` : ''}
                <div class="st-confirm-row st-price-line--total"><span>Final Total:</span><b>PKR ${newBooking.finalFee}</b></div>
              </div>
              <div class="st-confirm-actions">
                <button class="btn btn-secondary btn-md" id="btn-stay-rush">[ Stay on Exam Rush ]</button>
                <a class="btn btn-primary btn-md" href="./dashboard.html">[ View Dashboard → ]</a>
              </div>
            </div>
          `;

          const stayBtn = document.getElementById('btn-stay-rush');
          if (stayBtn) {
            stayBtn.addEventListener('click', () => {
              Dialog.close('st-booking-modal');
              applyFilters();
            });
          }
        }

        applyFilters();
      });
    }

    // Grid event delegations
    const slotsGridEl = document.getElementById('standby-slots-grid');
    if (slotsGridEl) {
      slotsGridEl.addEventListener('click', (e) => {
        // Book Slot
        const bookBtn = e.target.closest('button[data-action="book-slot"]');
        if (bookBtn) {
          const slot = standbySlots.find(s => s.id === bookBtn.dataset.id);
          if (slot) {
            openBookingDialog({
              id: slot.id,
              name: `${slot.tutor} (${slot.course})`,
              course: slot.course,
              tutor: slot.tutor,
              time: slot.time,
              mode: slot.mode,
              baseFee: slot.rate
            });
          }
          return;
        }

        // Save Tutor Heart
        const saveBtn = e.target.closest('button[data-action="save-slot"]');
        if (saveBtn) {
          const tutorId = saveBtn.dataset.id;
          const tutorName = saveBtn.dataset.tutor;
          const tutorCourse = saveBtn.dataset.course;
          const tutorRate = parseInt(saveBtn.dataset.rate, 10);
          const tutorRating = saveBtn.dataset.rating;

          const saved = Storage.get(KEY_SAVED, []);
          const existingIndex = saved.findIndex(t => t.name === tutorName);

          if (existingIndex > -1) {
            saved.splice(existingIndex, 1);
            Storage.set(KEY_SAVED, saved);
            showToast('Removed from saved tutors.');
          } else {
            saved.push({
              id: `saved-${tutorId}`,
              name: tutorName,
              initials: tutorName.slice(0, 2).toUpperCase(),
              rating: tutorRating,
              course: tutorCourse,
              rate: tutorRate
            });
            Storage.set(KEY_SAVED, saved);
            showToast('💙 SAVED! Tutor added to your FASTutor shortlist.');
          }
          renderSlots();
        }
      });
    }

    const groupsGridEl = document.getElementById('group-sessions-grid');
    if (groupsGridEl) {
      groupsGridEl.addEventListener('click', (e) => {
        const joinBtn = e.target.closest('button[data-action="join-group"]');
        if (joinBtn) {
          const group = groupSessions.find(g => g.id === joinBtn.dataset.id);
          if (group) {
            openBookingDialog({
              id: group.id,
              name: group.title,
              course: group.course,
              tutor: group.host,
              time: group.time,
              mode: group.mode,
              baseFee: group.seatPrice
            });
          }
        }
      });
    }

    // Initial render
    applyFilters();
  })();

})();
