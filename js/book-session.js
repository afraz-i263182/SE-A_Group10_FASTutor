/* ==========================================================================
   FASTutor — Book a Session Controller
   Pure Vanilla JS: Tutor catalog, live search/subject filter, date & time
   validation, live fee calculation (with promo code FAST10), confirmation
   popup modal, mobile menu, and localStorage persistence.
   ========================================================================== */

(() => {
  "use strict";

  const BOOKINGS_KEY = "fastutor_booked_sessions";
  const SESSION_KEY = "fastutor_session";

  const TUTORS = [
    {
      id: "tutor-ahmed",
      name: "Ahmed Khan",
      initials: "AK",
      batch: "Batch '21 • BS(CS)",
      campus: "Islamabad",
      rating: 4.9,
      reviews: 48,
      hourlyFee: 850,
      highlight: "Grade A+ in DSA",
      bio: "Teaching Assistant for CS-2001. Focused on recursive trees, graphs, dynamic programming, and sessional past papers.",
      courses: [
        { subject: "Data Structures", label: "CS-2001 Data Structures & Algorithms" },
        { subject: "PF", label: "CS-1002 Programming Fundamentals" },
      ],
    },
    {
      id: "tutor-hamza",
      name: "Hamza Tariq",
      initials: "HT",
      batch: "Batch '23 • BS(SE)",
      campus: "Islamabad",
      rating: 4.7,
      reviews: 34,
      hourlyFee: 750,
      highlight: "Grade A in PF",
      bio: "Breaks down C++ loops, functions, pointers, and dynamic arrays with live trace tables for lab evaluations.",
      courses: [
        { subject: "PF", label: "CS-1002 Programming Fundamentals" },
        { subject: "OOP", label: "CS-2002 Object-Oriented Programming" },
      ],
    },
    {
      id: "tutor-ayesha",
      name: "Ayesha Noor",
      initials: "AN",
      batch: "Batch '22 • BS(CS)",
      campus: "Lahore",
      rating: 4.9,
      reviews: 57,
      hourlyFee: 850,
      highlight: "Grade A+ in DSA & OS",
      bio: "Dean's List mentor covering Data Structures, Operating Systems scheduling/threads, and Calculus problem sets.",
      courses: [
        { subject: "Data Structures", label: "CS-2001 Data Structures & Algorithms" },
        { subject: "Operating Systems", label: "CS-3004 Operating Systems" },
        { subject: "Calculus", label: "MT-1003 Calculus & Analytical Geometry" },
      ],
    },
    {
      id: "tutor-mahnoor",
      name: "Mahnoor Fatima",
      initials: "MF",
      batch: "Batch '23 • BS(AI)",
      campus: "Karachi",
      rating: 5.0,
      reviews: 42,
      hourlyFee: 800,
      highlight: "Grade A+ in OOP",
      bio: "Specializes in inheritance, polymorphism, UML design, and 8086 assembly routines for COAL midterms.",
      courses: [
        { subject: "OOP", label: "CS-2002 Object-Oriented Programming" },
        { subject: "COAL", label: "EE-2003 Computer Org. & Assembly (COAL)" },
      ],
    },
    {
      id: "tutor-bilal",
      name: "Bilal Siddiqui",
      initials: "BS",
      batch: "Batch '22 • BS(DS)",
      campus: "Lahore",
      rating: 4.8,
      reviews: 39,
      hourlyFee: 700,
      highlight: "Grade A in Calculus",
      bio: "Step-by-step coaching for multivariable limits, integration techniques, SQL normalization, and complex joins.",
      courses: [
        { subject: "Calculus", label: "MT-1003 Calculus & Analytical Geometry" },
        { subject: "Database Systems", label: "CS-2005 Database Systems" },
      ],
    },
    {
      id: "tutor-usman",
      name: "Usman Qureshi",
      initials: "UQ",
      batch: "Batch '21 • BS(CS)",
      campus: "Karachi",
      rating: 4.8,
      reviews: 61,
      hourlyFee: 900,
      highlight: "Grade A in OS & DB",
      bio: "Systems & database mentor helping seniors and juniors master POSIX synchronization, deadlocks, and transactions.",
      courses: [
        { subject: "Operating Systems", label: "CS-3004 Operating Systems" },
        { subject: "Database Systems", label: "CS-2005 Database Systems" },
        { subject: "Data Structures", label: "CS-2001 Data Structures & Algorithms" },
      ],
    },
  ];

  document.addEventListener("DOMContentLoaded", () => {
    /* ----------------------------------------------------------------------
       1. Header Scroll, Mobile Menu & Logged-in Session Navbar Sync
       ---------------------------------------------------------------------- */
    const siteHeader = document.getElementById("site-header");
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const mobileMenuIcon = document.getElementById("mobile-menu-icon");
    const mobileNavDrawer = document.getElementById("mobile-nav-drawer");

    const updateHeaderScroll = () => {
      if (!siteHeader) return;
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
    };

    window.addEventListener("scroll", updateHeaderScroll, { passive: true });
    updateHeaderScroll();

    const setMobileMenuOpen = (isOpen) => {
      if (!mobileMenuToggle || !mobileNavDrawer || !mobileMenuIcon) return;
      mobileNavDrawer.hidden = !isOpen;
      mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
      mobileMenuIcon.textContent = isOpen ? "close" : "menu";
    };

    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", () => {
        setMobileMenuOpen(mobileNavDrawer.hidden);
      });
    }

    if (mobileNavDrawer) {
      mobileNavDrawer.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMobileMenuOpen(false));
      });
    }

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024 && mobileNavDrawer && !mobileNavDrawer.hidden) {
        setMobileMenuOpen(false);
      }
    });

    // Navbar session persistence (compatible with js/auth.js)
    const navGuestActions = document.getElementById("nav-guest-actions");
    const navUserActions = document.getElementById("nav-user-actions");
    const navUserAvatar = document.getElementById("nav-user-avatar");
    const navUserName = document.getElementById("nav-user-name");
    const navUserRole = document.getElementById("nav-user-role");
    const navLogoutBtn = document.getElementById("nav-logout-btn");

    const mobileGuestActions = document.getElementById("mobile-guest-actions");
    const mobileUserActions = document.getElementById("mobile-user-actions");
    const mobileUserName = document.getElementById("mobile-user-name");
    const mobileUserRole = document.getElementById("mobile-user-role");
    const mobileLogoutBtn = document.getElementById("mobile-logout-btn");

    const readAuthSession = () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    };

    const getInitials = (name) => {
      const parts = String(name || "F").trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    };

    const renderAuthNav = () => {
      const session = readAuthSession();
      const isLoggedIn = Boolean(session && session.name);

      if (navGuestActions) navGuestActions.hidden = isLoggedIn;
      if (navUserActions) navUserActions.hidden = !isLoggedIn;
      if (mobileGuestActions) mobileGuestActions.hidden = isLoggedIn;
      if (mobileUserActions) mobileUserActions.hidden = !isLoggedIn;

      if (!isLoggedIn) return;
      const roleLabel = session.role === "tutor" ? "Tutor" : "Student";
      const initials = getInitials(session.name);

      if (navUserAvatar) navUserAvatar.textContent = initials;
      if (navUserName) navUserName.textContent = session.name;
      if (navUserRole) navUserRole.textContent = roleLabel;
      if (mobileUserName) mobileUserName.textContent = session.name;
      if (mobileUserRole) {
        mobileUserRole.textContent =
          (session.role === "tutor" ? "Verified Senior Tutor" : "Verified FAST Student") +
          (session.campus ? ` • ${session.campus}` : "");
      }
    };

    const handleLogout = () => {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (err) {
        // Ignore storage errors
      }
      renderAuthNav();
      setMobileMenuOpen(false);
    };

    if (navLogoutBtn) navLogoutBtn.addEventListener("click", handleLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);
    renderAuthNav();

    /* ----------------------------------------------------------------------
       2. Tutor Directory Rendering, Search Bar & Subject Filter
       ---------------------------------------------------------------------- */
    const tutorGrid = document.getElementById("tutor-grid");
    const tutorSearch = document.getElementById("tutor-search");
    const subjectFilter = document.getElementById("subject-filter");
    const subjectPills = Array.from(document.querySelectorAll("[data-subject-pill]"));
    const tutorCountBadge = document.getElementById("tutor-count-badge");
    const emptyTutorsState = document.getElementById("empty-tutors-state");
    const emptyTutorsMessage = document.getElementById("empty-tutors-message");
    const resetFiltersBtn = document.getElementById("reset-filters-btn");

    const bookingTutorSelect = document.getElementById("booking-tutor");
    const bookingCourseSelect = document.getElementById("booking-course");
    const selectedRatePill = document.getElementById("selected-rate-pill");

    let selectedTutorId = TUTORS[0].id;
    const filterState = {
      query: "",
      subject: "all",
    };

    const escapeHtml = (str) => {
      const div = document.createElement("div");
      div.textContent = String(str);
      return div.innerHTML;
    };

    const getTutorById = (id) => TUTORS.find((t) => t.id === id) || TUTORS[0];

    const syncSubjectControls = (subject) => {
      if (subjectFilter) subjectFilter.value = subject;
      subjectPills.forEach((pill) => {
        pill.classList.toggle("is-active", pill.dataset.subjectPill === subject);
      });
    };

    const renderTutorDirectory = () => {
      const q = filterState.query.trim().toLowerCase();
      const subj = filterState.subject;

      const filtered = TUTORS.filter((tutor) => {
        const matchesSubject =
          subj === "all" || tutor.courses.some((c) => c.subject === subj);
        const searchBlob = [
          tutor.name,
          tutor.campus,
          tutor.batch,
          tutor.highlight,
          tutor.bio,
          ...tutor.courses.map((c) => `${c.subject} ${c.label}`),
        ]
          .join(" ")
          .toLowerCase();
        const matchesQuery = !q || searchBlob.includes(q);
        return matchesSubject && matchesQuery;
      });

      if (tutorCountBadge) {
        tutorCountBadge.textContent = `${filtered.length} Tutor${filtered.length === 1 ? "" : "s"} Available`;
      }

      if (emptyTutorsState) {
        emptyTutorsState.hidden = filtered.length > 0;
        if (filtered.length === 0 && emptyTutorsMessage) {
          const descParts = [];
          if (q) descParts.push(`"${filterState.query.trim()}"`);
          if (subj !== "all") descParts.push(`subject ${subj}`);
          emptyTutorsMessage.textContent = descParts.length
            ? `No senior tutors matched ${descParts.join(" in ")}. Try clearing your search or selecting All Subjects.`
            : "No senior tutors matched your current filter.";
        }
      }

      if (!tutorGrid) return;
      tutorGrid.innerHTML = filtered
        .map((tutor) => {
          const isSelected = tutor.id === selectedTutorId;
          const courseChips = tutor.courses
            .map((c) => `<span class="grade-chip grade-chip--slate grade-chip--sm">${escapeHtml(c.subject)}</span>`)
            .join("");

          return `
            <article class="tutor-card book-tutor-card${isSelected ? " is-selected" : ""}">
              <div class="tutor-card-body">
                <div class="tutor-top-row">
                  <div class="tutor-initials-box" aria-hidden="true">${escapeHtml(tutor.initials)}</div>
                  <span class="rating-pill rating-pill--sm">
                    <span class="material-symbols-outlined star-icon star-icon--sm" aria-hidden="true">star</span>
                    <span>${tutor.rating.toFixed(1)}</span>
                    <span class="rating-count">(${tutor.reviews})</span>
                  </span>
                </div>

                <div>
                  <div class="tutor-name-row">
                    <h3 class="tutor-name">${escapeHtml(tutor.name)}</h3>
                    <span class="material-symbols-outlined verified-seal" title="Flex Verified Senior">verified</span>
                  </div>
                  <span class="tutor-meta">${escapeHtml(tutor.batch)} • ${escapeHtml(tutor.campus)}</span>
                </div>

                <p class="tutor-bio-copy">${escapeHtml(tutor.bio)}</p>

                <div class="tutor-tags">
                  <span class="grade-chip grade-chip--emerald grade-chip--sm">${escapeHtml(tutor.highlight)}</span>
                  ${courseChips}
                </div>
              </div>

              <div class="tutor-card-footer">
                <div>
                  <span class="rate-label">Hourly Fee</span>
                  <span class="rate-value">PKR ${tutor.hourlyFee.toLocaleString()}</span>
                  <span class="rate-unit">/hr</span>
                </div>
                <button
                  class="btn ${isSelected ? "btn-secondary" : "btn-primary"} btn-xs"
                  data-select-tutor="${escapeHtml(tutor.id)}"
                  type="button"
                >
                  ${isSelected ? "Selected" : "Select Tutor"}
                </button>
              </div>
            </article>
          `;
        })
        .join("");

      tutorGrid.querySelectorAll("[data-select-tutor]").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectTutor(btn.dataset.selectTutor);
        });
      });
    };

    const resetFilters = () => {
      filterState.query = "";
      filterState.subject = "all";
      if (tutorSearch) tutorSearch.value = "";
      syncSubjectControls("all");
      renderTutorDirectory();
    };

    if (tutorSearch) {
      tutorSearch.addEventListener("input", () => {
        filterState.query = tutorSearch.value;
        renderTutorDirectory();
      });
    }

    if (subjectFilter) {
      subjectFilter.addEventListener("change", () => {
        filterState.subject = subjectFilter.value;
        syncSubjectControls(filterState.subject);
        renderTutorDirectory();
      });
    }

    subjectPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        filterState.subject = pill.dataset.subjectPill || "all";
        syncSubjectControls(filterState.subject);
        renderTutorDirectory();
      });
    });

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", resetFilters);
    }

    /* ----------------------------------------------------------------------
       3. Booking Form, Date/Time Validation & Live Fee Calculator (FAST10)
       ---------------------------------------------------------------------- */
    const bookingForm = document.getElementById("booking-form");
    const bookingMode = document.getElementById("booking-mode");
    const bookingDuration = document.getElementById("booking-duration");
    const bookingDate = document.getElementById("booking-date");
    const bookingTime = document.getElementById("booking-time");
    const bookingEmail = document.getElementById("booking-email");
    const bookingTopic = document.getElementById("booking-topic");
    const promoInput = document.getElementById("promo-code");
    const applyPromoBtn = document.getElementById("apply-promo-btn");
    const timePresetBtns = Array.from(document.querySelectorAll("[data-preset-time]"));

    const bookingFormBanner = document.getElementById("booking-form-banner");
    const bookingFormBannerText = document.getElementById("booking-form-banner-text");
    const promoError = document.getElementById("promo-error");
    const promoSuccess = document.getElementById("promo-success");

    const feeRateEl = document.getElementById("fee-rate");
    const feeDurationLabelEl = document.getElementById("fee-duration-label");
    const feeSubtotalEl = document.getElementById("fee-subtotal");
    const feeDiscountRowEl = document.getElementById("fee-discount-row");
    const feeDiscountEl = document.getElementById("fee-discount");
    const feeTotalEl = document.getElementById("fee-total");

    let activePromoCode = "";

    const getTodayLocalIso = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const getTomorrowLocalIso = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const y = tomorrow.getFullYear();
      const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const d = String(tomorrow.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    // Initialize default date/time & prefill email from active session
    if (bookingDate) {
      bookingDate.min = getTodayLocalIso();
      bookingDate.value = getTomorrowLocalIso();
    }
    if (bookingTime) {
      bookingTime.value = "16:00";
    }
    const authSession = readAuthSession();
    if (authSession && authSession.email && bookingEmail) {
      bookingEmail.value = authSession.email;
    }

    const populateTutorDropdown = () => {
      if (!bookingTutorSelect) return;
      bookingTutorSelect.innerHTML = TUTORS.map(
        (t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)} (${escapeHtml(t.campus)} • PKR ${t.hourlyFee}/hr)</option>`
      ).join("");
    };

    const selectTutor = (tutorId) => {
      const tutor = getTutorById(tutorId);
      selectedTutorId = tutor.id;

      if (bookingTutorSelect) bookingTutorSelect.value = tutor.id;
      if (selectedRatePill) selectedRatePill.textContent = `PKR ${tutor.hourlyFee.toLocaleString()}/hr`;

      if (bookingCourseSelect) {
        bookingCourseSelect.innerHTML = tutor.courses
          .map((c) => `<option value="${escapeHtml(c.label)}">${escapeHtml(c.label)}</option>`)
          .join("");
      }

      renderTutorDirectory();
      calculateFeeBreakdown();
    };

    const calculateFeeBreakdown = () => {
      const tutor = getTutorById(selectedTutorId);
      const hours = parseFloat(bookingDuration ? bookingDuration.value : "1") || 1;
      const subtotal = Math.round(tutor.hourlyFee * hours);
      const hasPromo = activePromoCode === "FAST10";
      const discount = hasPromo ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal - discount;

      if (feeRateEl) feeRateEl.textContent = `PKR ${tutor.hourlyFee.toLocaleString()}/hr`;
      if (feeDurationLabelEl) feeDurationLabelEl.textContent = `${hours} ${hours === 1 ? "hr" : "hrs"}`;
      if (feeSubtotalEl) feeSubtotalEl.textContent = `PKR ${subtotal.toLocaleString()}`;
      if (feeDiscountRowEl) feeDiscountRowEl.hidden = !hasPromo;
      if (feeDiscountEl) feeDiscountEl.textContent = `- PKR ${discount.toLocaleString()}`;
      if (feeTotalEl) feeTotalEl.textContent = `PKR ${total.toLocaleString()}`;

      return { hourlyFee: tutor.hourlyFee, hours, subtotal, discount, total, promoApplied: hasPromo ? "FAST10" : "" };
    };

    const applyPromoCode = ({ showFeedback = true } = {}) => {
      if (!promoInput) return;
      const code = promoInput.value.trim().toUpperCase();
      if (promoError) promoError.textContent = "";
      if (promoSuccess) promoSuccess.hidden = true;
      promoInput.classList.remove("is-invalid");

      if (!code) {
        activePromoCode = "";
        calculateFeeBreakdown();
        return;
      }

      if (code === "FAST10") {
        activePromoCode = "FAST10";
        if (promoSuccess && showFeedback) {
          promoSuccess.textContent = "FAST10 applied — 10% student discount active.";
          promoSuccess.hidden = false;
        }
      } else {
        activePromoCode = "";
        if (promoError && showFeedback) {
          promoError.textContent = 'Invalid promo code. Try "FAST10" for 10% off.';
        }
        if (showFeedback) promoInput.classList.add("is-invalid");
      }
      calculateFeeBreakdown();
    };

    if (applyPromoBtn) {
      applyPromoBtn.addEventListener("click", () => applyPromoCode({ showFeedback: true }));
    }

    if (promoInput) {
      promoInput.addEventListener("input", () => {
        const val = promoInput.value.trim().toUpperCase();
        if (val === "FAST10" || val === "") {
          applyPromoCode({ showFeedback: val === "FAST10" });
        } else {
          activePromoCode = "";
          if (promoSuccess) promoSuccess.hidden = true;
          calculateFeeBreakdown();
        }
      });
    }

    timePresetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.presetTime || "16:00";
        if (bookingTime) bookingTime.value = t;
        timePresetBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
        validateTime();
      });
    });

    if (bookingTime) {
      bookingTime.addEventListener("input", () => {
        timePresetBtns.forEach((b) => {
          b.classList.toggle("is-active", b.dataset.presetTime === bookingTime.value);
        });
      });
    }

    // Validation Helpers
    const setFieldError = (input, errorId, message) => {
      const errEl = document.getElementById(errorId);
      if (errEl) errEl.textContent = message || "";
      if (input) {
        input.classList.toggle("is-invalid", Boolean(message));
        if (message) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
      return !message;
    };

    const validateDate = () => {
      const val = bookingDate ? bookingDate.value : "";
      if (!val) return setFieldError(bookingDate, "booking-date-error", "Please choose a session date.");
      if (val < getTodayLocalIso()) {
        return setFieldError(bookingDate, "booking-date-error", "Date cannot be in the past.");
      }
      return setFieldError(bookingDate, "booking-date-error", "");
    };

    const validateTime = () => {
      const timeVal = bookingTime ? bookingTime.value : "";
      if (!timeVal) return setFieldError(bookingTime, "booking-time-error", "Please choose a session time.");

      const [hh, mm] = timeVal.split(":").map(Number);
      const minutes = hh * 60 + mm;
      if (minutes < 8 * 60 || minutes > 23 * 60 + 30) {
        return setFieldError(
          bookingTime,
          "booking-time-error",
          "Mentorship hours are 08:00 AM to 11:30 PM."
        );
      }

      if (bookingDate && bookingDate.value === getTodayLocalIso()) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (minutes <= nowMinutes) {
          return setFieldError(
            bookingTime,
            "booking-time-error",
            "That time has already passed today. Choose an upcoming slot."
          );
        }
      }

      return setFieldError(bookingTime, "booking-time-error", "");
    };

    const validateEmail = () => {
      const val = bookingEmail ? bookingEmail.value.trim() : "";
      if (!val) return setFieldError(bookingEmail, "booking-email-error", "FAST NU-ID email is required.");
      if (!/^[^\s@]+@nu\.edu\.pk$/i.test(val)) {
        return setFieldError(bookingEmail, "booking-email-error", "Please use your @nu.edu.pk email address.");
      }
      return setFieldError(bookingEmail, "booking-email-error", "");
    };

    const validateTopic = () => {
      const val = bookingTopic ? bookingTopic.value.trim() : "";
      if (val.length < 4) {
        return setFieldError(bookingTopic, "booking-topic-error", "Enter a brief topic (at least 4 characters).");
      }
      return setFieldError(bookingTopic, "booking-topic-error", "");
    };

    if (bookingDate) {
      bookingDate.addEventListener("change", () => {
        validateDate();
        if (bookingTime && bookingTime.value) validateTime();
      });
    }
    if (bookingTime) bookingTime.addEventListener("change", validateTime);
    if (bookingEmail) bookingEmail.addEventListener("blur", validateEmail);
    if (bookingTopic) bookingTopic.addEventListener("blur", validateTopic);

    if (bookingTutorSelect) {
      bookingTutorSelect.addEventListener("change", () => selectTutor(bookingTutorSelect.value));
    }
    if (bookingDuration) {
      bookingDuration.addEventListener("change", calculateFeeBreakdown);
    }

    /* ----------------------------------------------------------------------
       4. Booked Sessions Persistence (localStorage) & Confirmation Popup
       ---------------------------------------------------------------------- */
    const bookedSessionsList = document.getElementById("booked-sessions-list");
    const bookedCountPill = document.getElementById("booked-count-pill");

    const confirmBackdrop = document.getElementById("confirm-modal-backdrop");
    const confirmRefEyebrow = document.getElementById("confirm-ref-eyebrow");
    const confirmHeading = document.getElementById("confirm-heading");
    const confirmSubheading = document.getElementById("confirm-subheading");
    const confirmDetailsGrid = document.getElementById("confirm-details-grid");
    const confirmDoneBtn = document.getElementById("confirm-done-btn");
    const confirmCloseX = document.getElementById("confirm-close-x");

    const loadBookedSessions = () => {
      try {
        const raw = localStorage.getItem(BOOKINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        return [];
      }
    };

    const saveBookedSessions = (list) => {
      try {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
      } catch (err) {
        // Ignore storage errors
      }
    };

    const formatTime12h = (time24) => {
      const [hStr, mStr] = String(time24 || "16:00").split(":");
      const h = Number(hStr);
      const suffix = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(h12).padStart(2, "0")}:${mStr} ${suffix}`;
    };

    const renderBookedSessions = () => {
      const sessions = loadBookedSessions();
      if (bookedCountPill) {
        bookedCountPill.textContent = `${sessions.length} Scheduled`;
      }
      if (!bookedSessionsList) return;

      if (sessions.length === 0) {
        bookedSessionsList.innerHTML =
          '<p class="field-hint">No sessions booked yet. Select a senior tutor and confirm a slot to save your booking here.</p>';
        return;
      }

      bookedSessionsList.innerHTML = sessions
        .map((item) => {
          const promoText = item.promoApplied ? ` • Promo ${escapeHtml(item.promoApplied)} (-10%)` : "";
          return `
            <article class="booked-item">
              <div>
                <div class="booked-item-title">${escapeHtml(item.course)} — with ${escapeHtml(item.tutorName)}</div>
                <div class="booked-item-meta">
                  ${escapeHtml(item.date)} at ${escapeHtml(formatTime12h(item.time))} (${escapeHtml(item.duration)} hr${Number(item.duration) === 1 ? "" : "s"}) • ${escapeHtml(item.mode)}
                </div>
                <div class="booked-item-meta">
                  Topic: ${escapeHtml(item.topic)} • Ref: <strong>${escapeHtml(item.ref)}</strong>${promoText}
                </div>
              </div>
              <div class="booked-item-actions">
                <span class="booked-fee-tag">PKR ${Number(item.totalFee).toLocaleString()}</span>
                <button class="btn btn-secondary btn-xs" data-cancel-booking="${escapeHtml(item.ref)}" type="button">Cancel</button>
              </div>
            </article>
          `;
        })
        .join("");

      bookedSessionsList.querySelectorAll("[data-cancel-booking]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const ref = btn.dataset.cancelBooking;
          const updated = loadBookedSessions().filter((b) => b.ref !== ref);
          saveBookedSessions(updated);
          renderBookedSessions();
        });
      });
    };

    const openConfirmationPopup = (booking) => {
      if (!confirmBackdrop) return;
      if (confirmRefEyebrow) confirmRefEyebrow.textContent = `Booking Confirmed • ${booking.ref}`;
      if (confirmHeading) confirmHeading.textContent = `Session reserved with ${booking.tutorName}`;
      if (confirmSubheading) {
        confirmSubheading.textContent = `${booking.date} at ${formatTime12h(booking.time)} • ${booking.mode}`;
      }
      if (confirmDetailsGrid) {
        confirmDetailsGrid.innerHTML = `
          <div class="confirm-detail-row"><span>Course</span><strong>${escapeHtml(booking.course)}</strong></div>
          <div class="confirm-detail-row"><span>Duration</span><strong>${escapeHtml(booking.duration)} hour${Number(booking.duration) === 1 ? "" : "s"}</strong></div>
          <div class="confirm-detail-row"><span>Topic</span><strong>${escapeHtml(booking.topic)}</strong></div>
          <div class="confirm-detail-row"><span>Confirmation Email</span><strong>${escapeHtml(booking.email)}</strong></div>
          ${booking.promoApplied ? `<div class="confirm-detail-row"><span>Promo Applied</span><strong>${escapeHtml(booking.promoApplied)} (10% off)</strong></div>` : ""}
          <div class="confirm-detail-row"><span>Total Payable</span><strong>PKR ${Number(booking.totalFee).toLocaleString()}</strong></div>
        `;
      }
      confirmBackdrop.hidden = false;
      document.body.style.overflow = "hidden";
      if (confirmDoneBtn) confirmDoneBtn.focus();
    };

    const closeConfirmationPopup = () => {
      if (!confirmBackdrop) return;
      confirmBackdrop.hidden = true;
      document.body.style.overflow = "";
    };

    if (confirmDoneBtn) confirmDoneBtn.addEventListener("click", closeConfirmationPopup);
    if (confirmCloseX) confirmCloseX.addEventListener("click", closeConfirmationPopup);
    if (confirmBackdrop) {
      confirmBackdrop.addEventListener("click", (event) => {
        if (event.target === confirmBackdrop) closeConfirmationPopup();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (confirmBackdrop && !confirmBackdrop.hidden) closeConfirmationPopup();
        if (mobileNavDrawer && !mobileNavDrawer.hidden) setMobileMenuOpen(false);
      }
    });

    if (bookingForm) {
      bookingForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (bookingFormBanner) bookingFormBanner.hidden = true;

        const okDate = validateDate();
        const okTime = validateTime();
        const okEmail = validateEmail();
        const okTopic = validateTopic();

        // Check unapplied promo text if user typed one without clicking Apply
        if (promoInput && promoInput.value.trim() !== "") {
          const typedCode = promoInput.value.trim().toUpperCase();
          if (typedCode !== "FAST10") {
            applyPromoCode({ showFeedback: true });
            if (bookingFormBanner && bookingFormBannerText) {
              bookingFormBannerText.textContent = 'Invalid promo code entered. Clear it or enter "FAST10".';
              bookingFormBanner.hidden = false;
            }
            return;
          }
          applyPromoCode({ showFeedback: true });
        }

        if (!okDate || !okTime || !okEmail || !okTopic) {
          if (bookingFormBanner && bookingFormBannerText) {
            bookingFormBannerText.textContent = "Please fix the invalid fields highlighted below before confirming.";
            bookingFormBanner.hidden = false;
          }
          return;
        }

        const tutor = getTutorById(selectedTutorId);
        const pricing = calculateFeeBreakdown();
        const bookingRecord = {
          ref: `FT-${Math.floor(1000 + Math.random() * 9000)}`,
          tutorId: tutor.id,
          tutorName: tutor.name,
          course: bookingCourseSelect ? bookingCourseSelect.value : tutor.courses[0].label,
          mode: bookingMode ? bookingMode.value : "In-Person (Campus Library / Lab)",
          duration: String(pricing.hours),
          date: bookingDate.value,
          time: bookingTime.value,
          email: bookingEmail.value.trim(),
          topic: bookingTopic.value.trim(),
          promoApplied: pricing.promoApplied,
          totalFee: pricing.total,
        };

        const existing = loadBookedSessions();
        existing.unshift(bookingRecord);
        saveBookedSessions(existing);
        renderBookedSessions();
        openConfirmationPopup(bookingRecord);

        if (bookingTopic) bookingTopic.value = "";
      });
    }

    /* ----------------------------------------------------------------------
       5. Initialize Page State & Support ?course= Query Param
       ---------------------------------------------------------------------- */
    populateTutorDropdown();
    selectTutor(selectedTutorId);

    const urlCourse = new URLSearchParams(window.location.search).get("course");
    if (urlCourse) {
      const mapped = {
        CS2001: "Data Structures",
        CS1004: "OOP",
        CS2005: "Database Systems",
        CS2006: "Operating Systems",
      }[urlCourse.toUpperCase()];
      if (mapped && subjectFilter && subjectFilter.querySelector(`option[value="${mapped}"]`)) {
        filterState.subject = mapped;
        syncSubjectControls(mapped);
        renderTutorDirectory();
      }
    }

    renderBookedSessions();
  });
})();
