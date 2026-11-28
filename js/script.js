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

  const campusFilterToggle = document.getElementById("campus-filter-toggle");
  const campusFilterBar = document.getElementById("campus-filter-bar");
  const campusPills = document.querySelectorAll("[data-campus-pill]");

  const activeFilterBanner = document.getElementById("active-filter-banner");
  const activeFilterSummary = document.getElementById("active-filter-summary");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  const emptyResetBtn = document.getElementById("empty-reset-btn");
  const emptyTutorsState = document.getElementById("empty-tutors-state");
  const tutorCards = document.querySelectorAll(".tutor-card");
  const tutorsSection = document.getElementById("best-tutors");

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
  };

 
  const normalizeSearchText = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

    const normalizedQuery = normalizeSearchText(filterState.query);
    const queryTokens = normalizedQuery ? normalizedQuery.split(" ") : [];
    const selectedCampus = filterState.campus;
    let visibleCount = 0;

    tutorCards.forEach((card) => {
      const cardCampus = (card.dataset.campus || "").toLowerCase();

      const searchableText = normalizeSearchText(
        `${card.dataset.courses || ""} ${card.textContent}`
      );

      const compactSearchableText = searchableText.replace(/\s/g, "");

      const matchesCampus =
        selectedCampus === "all" ||
        cardCampus === selectedCampus.toLowerCase();

      const matchesQuery =
        queryTokens.length === 0 ||
        queryTokens.every(
          (token) =>
            searchableText.includes(token) ||
            compactSearchableText.includes(token)
        );

      const isVisible = matchesCampus && matchesQuery;


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
        desc: "Search by course code, campus, and senior ratings to pick a mentor who aced your exact course.",
        tag: "Filter by campus and teacher",
        icon: "arrow_right_alt",
      },
      {
        title: "Book with Seniors",
        desc: "Pick In-Person or Online mode, choose your time slot, and pay safely via Online transfer or campus cash.",
        tag: "100% money-back guarantee",
        icon: "lock",
      },
      {
        title: "Ace the Exam",
        desc: "Meet in the campus library or online, walk through past sessionals, and walk into your exam confident.",
        tag: "Guaranteed GPA Boost",
        icon: "verified",
      },
    ],
    tutor: [
      {
        title: "Submit Transcript",
        desc: "Upload your Flex portal grade slip showing an A or A- grade and active Nu-ID email for 24-hr review.",
        tag: "24-hr Nu-ID verification",
        icon: "verified_user",
      },
      {
        title: "Set Schedule & Rate",
        desc: "Choose which days and lab gaps you are free, customize your hourly rate, and sync your slots.",
        tag: "Full control over lab gaps",
        icon: "schedule",
      },
      {
        title: "Teach & Get Paid",
        desc: "Deliver high-impact peer sessions, help juniors beat the curve, and receive weekly wallet or IBAN payouts.",
        tag: "Weekly SadaPay / IBAN payout",
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
     5. Interactive Modals & 3-Step Booking Wizard (Vertical Prototype)
     ------------------------------------------------------------------------ */
  const modalBackdrop = document.getElementById("modal-backdrop");
  const allModals = document.querySelectorAll(".modal-dialog");
  const bookingModal = document.getElementById("booking-modal");
  const applyModal = document.getElementById("apply-modal");
  const authModal = document.getElementById("auth-modal");

  let lastFocusedElement = null;

  const openModal = (dialogEl) => {
    if (!modalBackdrop || !dialogEl) return;
    lastFocusedElement = document.activeElement;
    allModals.forEach((m) => {
      m.hidden = m !== dialogEl;
    });
    modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    const firstInput = dialogEl.querySelector(
      "input:not([hidden]), select:not([hidden]), button:not([data-close-modal]):not([disabled])"
    );
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

  // --- Booking Wizard ---
  const bookingForm = document.getElementById("booking-form");
  const bookingStepLabel = document.getElementById("booking-step-label");
  const bookingSummaryBox = document.getElementById("booking-summary-box");
  const bookingTutorName = document.getElementById("booking-tutor-name");
  const bookingTutorMeta = document.getElementById("booking-tutor-meta");
  const bookingTutorRate = document.getElementById("booking-tutor-rate");

  const bookingFormat = document.getElementById("booking-format");
  const bookingPayment = document.getElementById("booking-payment");
  const bookingEmail = document.getElementById("booking-email");
  const bookingEmailError = document.getElementById("booking-email-error");
  const bookingNotes = document.getElementById("booking-notes");

  const bookingStep1 = document.getElementById("booking-step-1");
  const bookingStep2 = document.getElementById("booking-step-2");
  const bookingStep3 = document.getElementById("booking-step-3");
  const bookingNextBtn = document.getElementById("booking-next-btn");
  const bookingBackBtn = document.getElementById("booking-back-btn");
  const bookingDoneBtn = document.getElementById("booking-done-btn");
  const bookingStep2Summary = document.getElementById("booking-step2-summary");

  const confirmSlotHeading = document.getElementById("confirm-slot-heading");
  const confirmModeBadge = document.getElementById("confirm-mode-badge");
  const confirmEmailNote = document.getElementById("confirm-email-note");

  const wizardIndicators = document.querySelectorAll("[data-wizard-indicator]");
  const slotChips = document.querySelectorAll(".slot-chip:not(:disabled)");

  let selectedSlot = "Today 4:00 PM";

  const stepMetaLabels = {
    1: "Step 1 of 3 • Schedule",
    2: "Step 2 of 3 • Student Details",
    3: "Step 3 of 3 • Confirmed",
  };

  const setBookingStep = (stepNumber) => {
    if (bookingStep1) bookingStep1.hidden = stepNumber !== 1;
    if (bookingStep2) bookingStep2.hidden = stepNumber !== 2;
    if (bookingStep3) bookingStep3.hidden = stepNumber !== 3;
    if (bookingSummaryBox) bookingSummaryBox.hidden = stepNumber === 3;
    if (bookingStepLabel) {
      bookingStepLabel.textContent = stepMetaLabels[stepNumber] || "";
    }

    wizardIndicators.forEach((pill) => {
      const idx = Number(pill.dataset.wizardIndicator);
      pill.classList.toggle("is-active", idx === stepNumber);
      pill.classList.toggle("is-done", idx < stepNumber);
    });

    const modeVal = bookingFormat ? bookingFormat.value : "In-Person";
    const payVal = bookingPayment ? bookingPayment.value : "Online";

    if (stepNumber === 2 && bookingStep2Summary) {
      bookingStep2Summary.textContent = `${selectedSlot} • ${modeVal} • ${payVal} Payment`;
      if (bookingEmail) bookingEmail.focus();
    }

    if (stepNumber === 3 && bookingDoneBtn) {
      bookingDoneBtn.focus();
    }
  };

  slotChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      slotChips.forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      selectedSlot = chip.dataset.slot || chip.textContent.trim();
    });
  });

  document.querySelectorAll("[data-book-tutor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setMobileMenuOpen(false);
      if (bookingForm) bookingForm.reset();
      if (bookingEmailError) bookingEmailError.hidden = true;

      // Reset slot selection to default first available slot
      slotChips.forEach((c, idx) => {
        const isFirst = idx === 0;
        c.classList.toggle("is-selected", isFirst);
        if (isFirst) selectedSlot = c.dataset.slot || "Today 4:00 PM";
      });

      if (bookingTutorName) bookingTutorName.textContent = btn.dataset.bookTutor || "Senior Mentor";
      if (bookingTutorMeta) {
        bookingTutorMeta.textContent = `${btn.dataset.bookCampus || "Islamabad"} • ${
          btn.dataset.bookCourse || "Course Mentorship"
        }`;
      }
      if (bookingTutorRate) bookingTutorRate.textContent = btn.dataset.bookRate || "PKR 850/hr";

      setBookingStep(1);
      openModal(bookingModal);
    });
  });

  if (bookingNextBtn) {
    bookingNextBtn.addEventListener("click", () => {
      if (bookingEmailError) bookingEmailError.hidden = true;
      setBookingStep(2);
    });
  }

  if (bookingBackBtn) {
    bookingBackBtn.addEventListener("click", () => {
      if (bookingEmailError) bookingEmailError.hidden = true;
      setBookingStep(1);
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (bookingEmailError) bookingEmailError.hidden = true;

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
      const format = bookingFormat ? bookingFormat.value : "In-Person";
      const payment = bookingPayment ? bookingPayment.value : "Online";
      const topic = bookingNotes ? bookingNotes.value.trim() : "";

      if (confirmSlotHeading) {
        confirmSlotHeading.textContent = `Slot Reserved ${selectedSlot}`;
      }
      if (confirmModeBadge) {
        confirmModeBadge.textContent = `${format} • ${payment} Payment with ${tutor}`;
      }
      if (confirmEmailNote) {
        confirmEmailNote.textContent = topic
          ? `Details for "${topic}" sent to your email address (${emailVal}).`
          : `Details sent to your email address (${emailVal}).`;
      }

      setBookingStep(3);
    });
  }

  // --- Live Booking Email Validation ---
  if (bookingEmail) {
    bookingEmail.addEventListener("input", () => {
      const emailVal = bookingEmail.value.trim();

      if (isValidNuEmail(emailVal)) {
        if (bookingEmailError) bookingEmailError.hidden = true;
        bookingEmail.removeAttribute("aria-invalid");
      } else if (emailVal.length > 0) {
        if (bookingEmailError) {
          bookingEmailError.textContent =
            "Use your official FAST student email ending in @nu.edu.pk.";
          bookingEmailError.hidden = false;
        }
        bookingEmail.setAttribute("aria-invalid", "true");
      } else {
        if (bookingEmailError) bookingEmailError.hidden = true;
        bookingEmail.removeAttribute("aria-invalid");
      }
    });
  }

  // --- Tutor Application Modal ---
  const applyForm = document.getElementById("apply-form");
  const applySuccess = document.getElementById("apply-success");

  document.querySelectorAll("[data-open-apply]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setMobileMenuOpen(false);
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

  /* ------------------------------------------------------------------------
     6. Deep-Link Modal Opening From Other Pages (?modal=apply|login|signup)
     ------------------------------------------------------------------------ */
  const requestedModal = new URLSearchParams(window.location.search).get("modal");
  if (requestedModal === "apply" && applyModal) {
    openModal(applyModal);
  } else if ((requestedModal === "login" || requestedModal === "signup") && authModal) {
    setAuthMode(requestedModal);
    openModal(authModal);
  }
  if (requestedModal && window.history?.replaceState) {
    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
});
