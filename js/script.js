/* ==========================================================================
   FASTutor — Interactive Client Behaviors
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------------------------------------------------
     1. Sticky Header Elevation & Mobile Navigation Menu
     ------------------------------------------------------------------------ */
  const siteHeader = document.getElementById("site-header");
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenuIcon = document.getElementById("mobile-menu-icon");
  const mobileNavDrawer = document.getElementById("mobile-nav-drawer");
  const allNavLinks = document.querySelectorAll("[data-nav]");

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
      const currentlyOpen = !mobileNavDrawer.hidden;
      setMobileMenuOpen(!currentlyOpen);
    });
  }

  allNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetKey = link.dataset.nav;
      allNavLinks.forEach((item) => {
        const active = item.dataset.nav === targetKey;
        item.classList.toggle("is-active", active);
        if (active) {
          item.setAttribute("aria-current", "page");
        } else {
          item.removeAttribute("aria-current");
        }
      });
      setMobileMenuOpen(false);
    });
  });

  /* ------------------------------------------------------------------------
     2. Search Console, Course Cards & Campus Tutor Filtering
     ------------------------------------------------------------------------ */
  const heroSearchForm = document.getElementById("hero-search-form");
  const heroCourseInput = document.getElementById("hero-course-search");
  const heroSearchClear = document.getElementById("hero-search-clear");
  const heroCampusSelect = document.getElementById("hero-campus-select");

  const campusFilterToggle = document.getElementById("campus-filter-toggle");
  const campusFilterBar = document.getElementById("campus-filter-bar");
  const campusPills = document.querySelectorAll("[data-campus-pill]");

  const activeFilterBanner = document.getElementById("active-filter-banner");
  const activeFilterSummary = document.getElementById("active-filter-summary");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  const emptyResetBtn = document.getElementById("empty-reset-btn");
  const emptyTutorsState = document.getElementById("empty-tutors-state");
  const tutorCards = document.querySelectorAll(".tutor-card");
  const tutorsSection = document.getElementById("featured-tutors");

  const filterState = {
    query: "",
    campus: "all",
  };

  const syncClearButton = () => {
    if (!heroCourseInput || !heroSearchClear) return;
    heroSearchClear.hidden = heroCourseInput.value.trim().length === 0;
  };

  const syncCampusPills = (campusValue) => {
    campusPills.forEach((pill) => {
      pill.classList.toggle("is-active", pill.dataset.campusPill === campusValue);
    });
    if (heroCampusSelect) {
      const matchingOption = Array.from(heroCampusSelect.options).find(
        (opt) => opt.value === campusValue
      );
      if (matchingOption) {
        heroCampusSelect.value = campusValue;
      }
    }
  };

  const applyTutorFilters = ({ scrollToResults = false } = {}) => {
    const normalizedQuery = filterState.query.trim().toLowerCase();
    const selectedCampus = filterState.campus;
    let visibleCount = 0;

    tutorCards.forEach((card) => {
      const cardCampus = (card.dataset.campus || "").toLowerCase();
      const cardCourses = (card.dataset.courses || "").toLowerCase();
      const cardText = card.textContent.toLowerCase();

      const matchesCampus =
        selectedCampus === "all" || cardCampus === selectedCampus.toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        cardCourses.includes(normalizedQuery) ||
        cardText.includes(normalizedQuery);

      const isVisible = matchesCampus && matchesQuery;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (emptyTutorsState) {
      emptyTutorsState.hidden = visibleCount > 0;
    }

    const hasActiveFilter = normalizedQuery !== "" || selectedCampus !== "all";
    if (activeFilterBanner && activeFilterSummary) {
      activeFilterBanner.hidden = !hasActiveFilter;
      if (hasActiveFilter) {
        const parts = [];
        if (normalizedQuery) parts.push(`course "${filterState.query.trim()}"`);
        if (selectedCampus !== "all") parts.push(`${selectedCampus} Campus`);
        activeFilterSummary.textContent = `Showing ${visibleCount} verified mentor${
          visibleCount === 1 ? "" : "s"
        } for ${parts.join(" • ")}`;
      }
    }

    syncCampusPills(selectedCampus);
    syncClearButton();

    if (scrollToResults && tutorsSection) {
      tutorsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const resetAllFilters = () => {
    filterState.query = "";
    filterState.campus = "all";
    if (heroCourseInput) heroCourseInput.value = "";
    applyTutorFilters();
  };

  if (heroCourseInput) {
    heroCourseInput.addEventListener("input", () => {
      filterState.query = heroCourseInput.value;
      applyTutorFilters();
    });
  }

  if (heroSearchClear) {
    heroSearchClear.addEventListener("click", () => {
      if (heroCourseInput) {
        heroCourseInput.value = "";
        heroCourseInput.focus();
      }
      filterState.query = "";
      applyTutorFilters();
    });
  }

  if (heroSearchForm) {
    heroSearchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      filterState.query = heroCourseInput ? heroCourseInput.value : "";
      filterState.campus = heroCampusSelect ? heroCampusSelect.value : "all";
      applyTutorFilters({ scrollToResults: true });
    });
  }

  // Popular course tags in hero
  document.querySelectorAll("[data-quick-course]").forEach((tagBtn) => {
    tagBtn.addEventListener("click", () => {
      const course = tagBtn.dataset.quickCourse || "";
      if (heroCourseInput) heroCourseInput.value = course;
      filterState.query = course;
      filterState.campus = "all";
      applyTutorFilters({ scrollToResults: true });
    });
  });

  // Department course cards
  document.querySelectorAll("[data-course-filter]").forEach((courseCard) => {
    const triggerCourseFilter = () => {
      const course = courseCard.dataset.courseFilter || "";
      if (heroCourseInput) heroCourseInput.value = course;
      filterState.query = course;
      filterState.campus = "all";
      applyTutorFilters({ scrollToResults: true });
    };

    courseCard.addEventListener("click", triggerCourseFilter);
    courseCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        triggerCourseFilter();
      }
    });
  });

  // Campus filter bar toggle & pills
  if (campusFilterToggle && campusFilterBar) {
    campusFilterToggle.addEventListener("click", () => {
      const willShow = campusFilterBar.hidden;
      campusFilterBar.hidden = !willShow;
      campusFilterToggle.setAttribute("aria-expanded", String(willShow));
    });
  }

  campusPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterState.campus = pill.dataset.campusPill || "all";
      applyTutorFilters();
    });
  });

  // Footer campus node quick filter
  document.querySelectorAll("[data-footer-campus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterState.campus = btn.dataset.footerCampus || "all";
      filterState.query = "";
      if (heroCourseInput) heroCourseInput.value = "";
      if (campusFilterBar) campusFilterBar.hidden = false;
      applyTutorFilters({ scrollToResults: true });
    });
  });

  if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", resetAllFilters);
  if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetAllFilters);
  document.querySelectorAll("[data-reset-filters]").forEach((el) => {
    el.addEventListener("click", resetAllFilters);
  });

  /* ------------------------------------------------------------------------
     3. "How FASTutor Works" Role Toggle
     ------------------------------------------------------------------------ */
  const howBtns = document.querySelectorAll(".how-btn");
  const stepTitles = document.querySelectorAll(".step-title");
  const stepDescs = document.querySelectorAll(".step-desc");
  const stepTags = document.querySelectorAll(".step-tag");
  const stepTagIcons = document.querySelectorAll(".step-tag-icon");

  const howContentMap = {
    student: [
      {
        title: "Find Your Match",
        desc: "Filter by course syllabus, campus labs, past paper experience, or hourly budget. View authenticated student ratings.",
        tag: "Filter by campus & teacher",
        icon: "arrow_right_alt",
      },
      {
        title: "Book with Escrow",
        desc: "Choose 1-on-1 or collaborative group slots. Pay easily via Sadapay, Nayapay, or campus cash held in guarantee escrow.",
        tag: "100% money-back guarantee",
        icon: "lock",
      },
      {
        title: "Ace the Exam",
        desc: "Meet on campus (library/lab) or Google Meet, review past question walkthroughs, and boost your sessional marks.",
        tag: "Guaranteed GPA boost",
        icon: "verified",
      },
    ],
    tutor: [
      {
        title: "Submit Transcript",
        desc: "Upload your unofficial Flex portal grade slip showing your A or A- grade and active Nu-ID email for 24-hr review.",
        tag: "24-hr Nu-ID verification",
        icon: "verified_user",
      },
      {
        title: "Set Schedule & Rate",
        desc: "Choose which days and labs you are free, customize your hourly rate (PKR 600-1200/hr), and sync your calendar.",
        tag: "Full control over lab gaps",
        icon: "schedule",
      },
      {
        title: "Teach & Get Paid",
        desc: "Deliver high-impact peer sessions, help juniors survive the curve, and enjoy automated weekly payouts to your Sadapay or Nayapay.",
        tag: "Every Monday IBAN / wallet payout",
        icon: "payments",
      },
    ],
  };

  howBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      const steps = howContentMap[role];
      if (!steps) return;

      howBtns.forEach((b) => {
        const isCurrent = b === btn;
        b.classList.toggle("is-active", isCurrent);
        b.setAttribute("aria-selected", String(isCurrent));
      });

      stepTitles.forEach((el, idx) => {
        if (steps[idx]) el.textContent = steps[idx].title;
      });
      stepDescs.forEach((el, idx) => {
        if (steps[idx]) el.textContent = steps[idx].desc;
      });
      stepTags.forEach((el, idx) => {
        if (steps[idx]) el.textContent = steps[idx].tag;
      });
      stepTagIcons.forEach((el, idx) => {
        if (steps[idx]) el.textContent = steps[idx].icon;
      });
    });
  });

  /* ------------------------------------------------------------------------
     4. FAQ Accordion
     ------------------------------------------------------------------------ */
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const toggle = item.querySelector(".faq-toggle");
    const content = item.querySelector(".faq-content");
    if (!toggle || !content) return;

    toggle.addEventListener("click", () => {
      const willOpen = content.hidden;

      faqItems.forEach((other) => {
        const otherContent = other.querySelector(".faq-content");
        const otherToggle = other.querySelector(".faq-toggle");
        other.classList.remove("is-open");
        if (otherContent) otherContent.hidden = true;
        if (otherToggle) otherToggle.setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        item.classList.add("is-open");
        content.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ------------------------------------------------------------------------
     5. Interactive Modals & Form Validation
     ------------------------------------------------------------------------ */
  const modalBackdrop = document.getElementById("modal-backdrop");
  const allModals = document.querySelectorAll(".modal-dialog");
  const bookingModal = document.getElementById("booking-modal");
  const applyModal = document.getElementById("apply-modal");
  const authModal = document.getElementById("auth-modal");
  const infoModal = document.getElementById("info-modal");

  let lastFocusedElement = null;

  const openModal = (dialogEl) => {
    if (!modalBackdrop || !dialogEl) return;
    lastFocusedElement = document.activeElement;
    allModals.forEach((m) => {
      m.hidden = m !== dialogEl;
    });
    modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    const firstInput = dialogEl.querySelector("input, select, button:not([data-close-modal])");
    if (firstInput) firstInput.focus();
  };

  const closeAllModals = () => {
    if (!modalBackdrop) return;
    modalBackdrop.hidden = true;
    allModals.forEach((m) => {
      m.hidden = true;
    });
    document.body.style.overflow = "";
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  };

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (event) => {
      if (event.target === modalBackdrop) closeAllModals();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modalBackdrop && !modalBackdrop.hidden) closeAllModals();
      if (mobileNavDrawer && !mobileNavDrawer.hidden) setMobileMenuOpen(false);
    }
  });

  const isValidNuEmail = (email) => /^[^\s@]+@nu\.edu\.pk$/i.test(email.trim());

  // --- Booking Modal ---
  const bookingForm = document.getElementById("booking-form");
  const bookingTutorName = document.getElementById("booking-tutor-name");
  const bookingTutorMeta = document.getElementById("booking-tutor-meta");
  const bookingTutorRate = document.getElementById("booking-tutor-rate");
  const bookingEmail = document.getElementById("booking-email");
  const bookingEmailError = document.getElementById("booking-email-error");
  const bookingSuccess = document.getElementById("booking-success");
  const slotChips = document.querySelectorAll(".slot-chip:not(:disabled)");

  let selectedSlot = "Today • 4:00 PM";

  slotChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      slotChips.forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      selectedSlot = chip.dataset.slot || chip.textContent.trim();
    });
  });

  document.querySelectorAll("[data-book-tutor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (bookingForm) bookingForm.reset();
      if (bookingEmailError) bookingEmailError.hidden = true;
      if (bookingSuccess) bookingSuccess.hidden = true;

      if (bookingTutorName) bookingTutorName.textContent = btn.dataset.bookTutor || "Senior Mentor";
      if (bookingTutorMeta) {
        bookingTutorMeta.textContent = `${btn.dataset.bookCampus || "FAST Campus"} • ${
          btn.dataset.bookCourse || "Course Mentorship"
        }`;
      }
      if (bookingTutorRate) bookingTutorRate.textContent = btn.dataset.bookRate || "PKR 800/hr";

      openModal(bookingModal);
    });
  });

  if (bookingForm) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (bookingEmailError) bookingEmailError.hidden = true;
      if (bookingSuccess) bookingSuccess.hidden = true;

      const emailVal = bookingEmail ? bookingEmail.value.trim() : "";
      if (!isValidNuEmail(emailVal)) {
        if (bookingEmailError) {
          bookingEmailError.textContent =
            "Please enter your official FAST student email ending in @nu.edu.pk.";
          bookingEmailError.hidden = false;
        }
        if (bookingEmail) bookingEmail.focus();
        return;
      }

      const tutor = bookingTutorName ? bookingTutorName.textContent : "your mentor";
      const format = document.getElementById("booking-format")?.value || "On-Campus";
      const payment = document.getElementById("booking-payment")?.value || "SadaPay";

      if (bookingSuccess) {
        bookingSuccess.textContent = `Escrow slot reserved with ${tutor} for ${selectedSlot} (${format}). Payment instructions via ${payment} sent to ${emailVal}.`;
        bookingSuccess.hidden = false;
      }
    });
  }

  // --- Tutor Application Modal ---
  const applyForm = document.getElementById("apply-form");
  const applySuccess = document.getElementById("apply-success");

  document.querySelectorAll("[data-open-apply]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (applyForm) applyForm.reset();
      if (applySuccess) applySuccess.hidden = true;
      document.querySelectorAll("#apply-form .form-error").forEach((el) => {
        el.hidden = true;
      });
      openModal(applyModal);
    });
  });

  if (applyForm) {
    applyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      document.querySelectorAll("#apply-form .form-error").forEach((el) => {
        el.hidden = true;
      });
      if (applySuccess) applySuccess.hidden = true;

      const nameVal = document.getElementById("apply-name")?.value.trim() || "";
      const emailVal = document.getElementById("apply-email")?.value.trim() || "";
      const cgpaVal = parseFloat(document.getElementById("apply-cgpa")?.value || "0");
      const coursesVal = document.getElementById("apply-courses")?.value.trim() || "";

      let valid = true;

      if (nameVal.length < 2) {
        const err = document.getElementById("apply-name-error");
        if (err) {
          err.textContent = "Please enter your full name as listed on Flex.";
          err.hidden = false;
        }
        valid = false;
      }

      if (!isValidNuEmail(emailVal)) {
        const err = document.getElementById("apply-email-error");
        if (err) {
          err.textContent = "A valid @nu.edu.pk student email is required.";
          err.hidden = false;
        }
        valid = false;
      }

      if (Number.isNaN(cgpaVal) || cgpaVal < 3.2 || cgpaVal > 4.0) {
        const err = document.getElementById("apply-cgpa-error");
        if (err) {
          err.textContent = "Tutor eligibility requires a verified CGPA between 3.20 and 4.00.";
          err.hidden = false;
        }
        valid = false;
      }

      if (coursesVal.length < 3) {
        const err = document.getElementById("apply-courses-error");
        if (err) {
          err.textContent = "List at least one course where you earned an A or A- grade.";
          err.hidden = false;
        }
        valid = false;
      }

      if (!valid) return;

      if (applySuccess) {
        applySuccess.textContent = `Application received for ${nameVal} (CGPA ${cgpaVal.toFixed(
          2
        )}). Check ${emailVal} for your Flex transcript verification link.`;
        applySuccess.hidden = false;
      }
    });
  }

  // --- Auth Modal (Log in / Get Started) ---
  const authForm = document.getElementById("auth-form");
  const authTabs = document.querySelectorAll("[data-auth-tab]");
  const authModalTitle = document.getElementById("auth-modal-title");
  const authNameGroup = document.getElementById("auth-name-group");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const authSuccess = document.getElementById("auth-success");

  let authMode = "login";

  const setAuthMode = (mode) => {
    authMode = mode;
    authTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.authTab === mode);
    });
    if (authNameGroup) authNameGroup.hidden = mode !== "signup";
    if (authModalTitle) {
      authModalTitle.textContent =
        mode === "signup" ? "Join the FASTutor Network" : "Welcome back, FASTian";
    }
    if (authSubmitBtn) {
      authSubmitBtn.textContent =
        mode === "signup" ? "Create Verified Account" : "Log in to FASTutor";
    }
    if (authSuccess) authSuccess.hidden = true;
    document.querySelectorAll("#auth-form .form-error").forEach((el) => {
      el.hidden = true;
    });
  };

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => setAuthMode(tab.dataset.authTab || "login"));
  });

  document.querySelectorAll("[data-open-auth]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setMobileMenuOpen(false);
      if (authForm) authForm.reset();
      setAuthMode(btn.dataset.openAuth || "login");
      openModal(authModal);
    });
  });

  if (authForm) {
    authForm.addEventListener("submit", (event) => {
      event.preventDefault();
      document.querySelectorAll("#auth-form .form-error").forEach((el) => {
        el.hidden = true;
      });
      if (authSuccess) authSuccess.hidden = true;

      const emailVal = document.getElementById("auth-email")?.value.trim() || "";
      const passVal = document.getElementById("auth-password")?.value || "";

      let valid = true;
      if (!isValidNuEmail(emailVal)) {
        const err = document.getElementById("auth-email-error");
        if (err) {
          err.textContent = "Use your university @nu.edu.pk address.";
          err.hidden = false;
        }
        valid = false;
      }

      if (passVal.length < 6) {
        const err = document.getElementById("auth-password-error");
        if (err) {
          err.textContent = "Password must be at least 6 characters.";
          err.hidden = false;
        }
        valid = false;
      }

      if (!valid) return;

      if (authSuccess) {
        authSuccess.textContent =
          authMode === "signup"
            ? `Verification link sent to ${emailVal}. Confirm your Nu-ID to unlock instant tutor booking.`
            : `Signed in as ${emailVal}. Redirecting to your FASTutor student dashboard...`;
        authSuccess.hidden = false;
      }
    });
  }

  // --- Campus Guides & WhatsApp Info Modal ---
  const infoEyebrow = document.getElementById("info-modal-eyebrow");
  const infoTitle = document.getElementById("info-modal-title");
  const infoBody = document.getElementById("info-modal-body");

  const articlesMap = {
    "oop-uml": {
      eyebrow: "Exam Preparation • CS-217",
      title: "How to survive OOP Sessional 1: What teachers look for in UML",
      html: `
        <p><strong>1. Distinguish Composition vs. Aggregation:</strong> Filled diamonds mean lifecycle ownership (e.g., <em>Department</em> owns <em>CourseSection</em>), while hollow diamonds indicate independent lifecycles.</p>
        <p><strong>2. Cardinality & Visibility Markers:</strong> Always label <code>+</code> (public), <code>-</code> (private), and <code>#</code> (protected) members alongside multiplicity (<code>1..*</code>, <code>0..1</code>) — graders deduct up to 30% for omitted arrowheads.</p>
        <p><strong>3. Map Directly to C++ Headers:</strong> Ensure every association arrow corresponds to an actual pointer, reference, or member object in your class declaration.</p>
      `,
    },
    "dsa-patterns": {
      eyebrow: "DSA Strategy • CS-2001",
      title: "Top 10 DSA LeetCode patterns that frequently appear in FAST Midterms",
      html: `
        <p><strong>1. Recursion & Tree Traversals:</strong> Master lowest common ancestor (LCA), diameter of a binary tree, and AVL single/double rotation dry-runs on paper.</p>
        <p><strong>2. Fast & Slow Pointers:</strong> Cycle detection, middle-node splitting, and reversing k-groups in singly/doubly linked lists without extra memory.</p>
        <p><strong>3. Monotonic Stack & Prefix Sums:</strong> Next greater element, histogram area, and sliding-window subarray constraints commonly tested in Lab Midterms.</p>
      `,
    },
    "study-spots": {
      eyebrow: "Campus Life • ISB & LHR",
      title: "Campus Guide: Best quiet study spots with power outlets in Islamabad & Lahore",
      html: `
        <p><strong>Islamabad (H-11/4):</strong> Central Library 2nd-floor quiet cubicles (east wall sockets), C-Block mezzanine benches before 1:00 PM, and the CS Basement discussion tables.</p>
        <p><strong>Lahore (Faisal Town):</strong> Main Library upper reading hall corner desks, New Academic Block corridor booths, and the CS Lab waiting lounge between afternoon slots.</p>
      `,
    },
  };

  document.querySelectorAll("[data-article-id]").forEach((card) => {
    const openArticle = () => {
      const article = articlesMap[card.dataset.articleId];
      if (!article) return;
      if (infoEyebrow) infoEyebrow.textContent = article.eyebrow;
      if (infoTitle) infoTitle.textContent = article.title;
      if (infoBody) infoBody.innerHTML = article.html;
      openModal(infoModal);
    };

    card.addEventListener("click", openArticle);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openArticle();
      }
    });
  });

  document.querySelectorAll("[data-open-whatsapp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (infoEyebrow) infoEyebrow.textContent = "Verified Campus Circles";
      if (infoTitle) infoTitle.textContent = "Join Official FASTutor WhatsApp Channels";
      if (infoBody) {
        infoBody.innerHTML = `
          <p>Select your campus community channel to get instant past-paper drops, sessional sprint schedules, and verified TA availability:</p>
          <p><strong>• Islamabad (H-11/4):</strong> #FASTutor-ISB-Hub (1,420 members)</p>
          <p><strong>• Lahore (Faisal Town):</strong> #FASTutor-LHR-Hub (1,180 members)</p>
          <p><strong>• Karachi, Peshawar & CFD:</strong> #FASTutor-National-Network (960 members)</p>
          <p>Sign in with your <strong>@nu.edu.pk</strong> email to receive your single-use campus invite link.</p>
        `;
      }
      openModal(infoModal);
    });
  });
});
