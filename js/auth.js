/* ==========================================================================
   FASTutor — Auth Portal Controller (Student Login, Tutor Login, Sign Up)
   Pure Vanilla JS: live validation, password strength meter, mobile menu,
   and localStorage session persistence with navbar user + logout controls.
   ========================================================================== */

(() => {
  "use strict";

  const SESSION_KEY = "fastutor_session";
  const USERS_KEY = "fastutor_users";

  document.addEventListener("DOMContentLoaded", () => {
    /* ----------------------------------------------------------------------
       1. Sticky Header Elevation & Mobile Navigation Menu
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
        const currentlyOpen = !mobileNavDrawer.hidden;
        setMobileMenuOpen(!currentlyOpen);
      });
    }

    if (mobileNavDrawer) {
      mobileNavDrawer.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMobileMenuOpen(false));
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobileNavDrawer && !mobileNavDrawer.hidden) {
        setMobileMenuOpen(false);
        if (mobileMenuToggle) mobileMenuToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024 && mobileNavDrawer && !mobileNavDrawer.hidden) {
        setMobileMenuOpen(false);
      }
    });

    /* ----------------------------------------------------------------------
       2. localStorage Helpers & Navbar Session Rendering
       ---------------------------------------------------------------------- */
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

    const activeSessionBox = document.getElementById("active-session-box");
    const cardSessionAvatar = document.getElementById("card-session-avatar");
    const cardSessionName = document.getElementById("card-session-name");
    const cardSessionMeta = document.getElementById("card-session-meta");
    const cardLogoutBtn = document.getElementById("card-logout-btn");

    const readSession = () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    };

    const writeSession = (session) => {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch (err) {
        // Ignore storage errors if blocked
      }
    };

    const clearSession = () => {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (err) {
        // Ignore storage errors if blocked
      }
    };

    const readUsers = () => {
      try {
        const raw = localStorage.getItem(USERS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        return [];
      }
    };

    const saveUser = (userRecord) => {
      try {
        const users = readUsers().filter(
          (u) => u.email.toLowerCase() !== userRecord.email.toLowerCase()
        );
        users.push(userRecord);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      } catch (err) {
        // Ignore storage errors
      }
    };

    const formatNameFromEmail = (email) => {
      const local = email.split("@")[0] || "FASTian";
      if (/^[iplkf]\d{6}$/i.test(local)) {
        return local.toUpperCase();
      }
      return local
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    };

    const getInitials = (name) => {
      const parts = String(name || "F").trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    };

    const renderSessionUI = () => {
      const session = readSession();
      const isLoggedIn = Boolean(session && session.name);

      if (navGuestActions) navGuestActions.hidden = isLoggedIn;
      if (navUserActions) navUserActions.hidden = !isLoggedIn;
      if (mobileGuestActions) mobileGuestActions.hidden = isLoggedIn;
      if (mobileUserActions) mobileUserActions.hidden = !isLoggedIn;
      if (activeSessionBox) activeSessionBox.hidden = !isLoggedIn;

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

      if (cardSessionAvatar) cardSessionAvatar.textContent = initials;
      if (cardSessionName) cardSessionName.textContent = session.name;
      if (cardSessionMeta) {
        const metaParts = [roleLabel, session.rollNo, session.campus ? `${session.campus} Campus` : "", session.email].filter(Boolean);
        cardSessionMeta.textContent = metaParts.join(" • ");
      }
    };

    /* ----------------------------------------------------------------------
       3. Feedback Banner & 3-Tab Switcher
       ---------------------------------------------------------------------- */
    const authBanner = document.getElementById("auth-banner");
    const authBannerIcon = document.getElementById("auth-banner-icon");
    const authBannerText = document.getElementById("auth-banner-text");

    const showBanner = (type, message) => {
      if (!authBanner || !authBannerIcon || !authBannerText) return;
      const icons = {
        success: "check_circle",
        error: "error",
        info: "info",
      };
      authBanner.className = `auth-banner auth-banner--${type}`;
      authBannerIcon.textContent = icons[type] || "info";
      authBannerText.textContent = message;
      authBanner.hidden = false;
    };

    const hideBanner = () => {
      if (authBanner) authBanner.hidden = true;
    };

    const tabs = Array.from(document.querySelectorAll("[data-auth-tab]"));
    const portalEyebrow = document.getElementById("auth-portal-eyebrow");
    const portalTitle = document.getElementById("auth-portal-title");

    const tabHeadings = {
      "student-login": {
        eyebrow: "Student Portal",
        title: "Welcome back, FASTian",
      },
      "tutor-login": {
        eyebrow: "Senior Mentor Portal",
        title: "Sign in to teach & mentor",
      },
      signup: {
        eyebrow: "New Account",
        title: "Join the FASTutor Network",
      },
    };

    const activateTab = (tabName, { focus = false, clearAlerts = true } = {}) => {
      const targetTab = tabs.find((t) => t.dataset.authTab === tabName) || tabs[0];
      if (!targetTab) return;

      tabs.forEach((tab) => {
        const active = tab === targetTab;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("tabindex", active ? "0" : "-1");

        const panelId = tab.getAttribute("aria-controls");
        const panel = panelId ? document.getElementById(panelId) : null;
        if (panel) panel.hidden = !active;
      });

      const heading = tabHeadings[targetTab.dataset.authTab];
      if (heading) {
        if (portalEyebrow) portalEyebrow.textContent = heading.eyebrow;
        if (portalTitle) portalTitle.textContent = heading.title;
      }

      if (clearAlerts) hideBanner();
      if (focus) targetTab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(tab.dataset.authTab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        activateTab(tabs[next].dataset.authTab, { focus: true });
      });
    });

    document.querySelectorAll("[data-switch-tab]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        setMobileMenuOpen(false);
        activateTab(trigger.dataset.switchTab);
      });
    });

    // Deep link support (?tab=tutor-login | ?mode=signup | #tab-signup)
    const params = new URLSearchParams(window.location.search);
    const paramTab = params.get("tab");
    const paramMode = params.get("mode");
    const hashTab = window.location.hash.replace(/^#tab-/, "");

    if (paramTab && tabHeadings[paramTab]) {
      activateTab(paramTab);
    } else if (paramMode === "signup") {
      activateTab("signup");
    } else if (paramMode === "login") {
      activateTab("student-login");
    } else if (hashTab && tabHeadings[hashTab]) {
      activateTab(hashTab);
    }

    const handleLogout = () => {
      clearSession();
      renderSessionUI();
      setMobileMenuOpen(false);
      showBanner("info", "You have logged out of your FASTutor session.");
    };

    if (navLogoutBtn) navLogoutBtn.addEventListener("click", handleLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);
    if (cardLogoutBtn) cardLogoutBtn.addEventListener("click", handleLogout);

    /* ----------------------------------------------------------------------
       4. Password Visibility Toggles & Recovery Drawers
       ---------------------------------------------------------------------- */
    document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.togglePassword);
        if (!input) return;
        const willReveal = input.type === "password";
        input.type = willReveal ? "text" : "password";
        btn.textContent = willReveal ? "Hide" : "Show";
        btn.setAttribute("aria-pressed", String(willReveal));
      });
    });

    document.querySelectorAll("[data-toggle-recovery]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const box = document.getElementById(btn.dataset.toggleRecovery);
        if (!box) return;
        box.hidden = !box.hidden;
        if (!box.hidden) {
          const emailField = box.querySelector('input[type="email"]');
          if (emailField) emailField.focus();
        }
      });
    });

    document.querySelectorAll("[data-close-recovery]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const box = document.getElementById(btn.dataset.closeRecovery);
        if (box) box.hidden = true;
      });
    });

    const isValidNuEmail = (email) => /^[^\s@]+@nu\.edu\.pk$/i.test(email.trim());
    const isValidRollNo = (roll) => /^\d{2}[A-Za-z]-\d{4}$/.test(roll.trim());

    document.querySelectorAll("[data-send-recovery]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prefix = btn.dataset.sendRecovery;
        const emailInput = document.getElementById(`${prefix}-recovery-email`);
        const errEl = document.getElementById(`${prefix}-recovery-error`);
        const statusEl = document.getElementById(`${prefix}-recovery-status`);
        const emailVal = emailInput ? emailInput.value.trim() : "";

        if (!isValidNuEmail(emailVal)) {
          if (errEl) errEl.textContent = "Enter a valid @nu.edu.pk university email.";
          if (emailInput) emailInput.classList.add("is-invalid");
          if (statusEl) statusEl.textContent = "";
          return;
        }

        if (errEl) errEl.textContent = "";
        if (emailInput) emailInput.classList.remove("is-invalid");
        if (statusEl) {
          statusEl.style.color = "var(--color-secondary-dark)";
          statusEl.textContent = `Password reset link queued for ${emailVal}.`;
        }
      });
    });

    /* ----------------------------------------------------------------------
       5. Live Field Validation Helpers
       ---------------------------------------------------------------------- */
    const setFieldState = (input, errorId, errorMsg) => {
      const errorEl = document.getElementById(errorId);
      if (errorEl) errorEl.textContent = errorMsg || "";
      if (!input) return !errorMsg;

      if (errorMsg) {
        input.classList.add("is-invalid");
        input.classList.remove("is-valid");
        input.setAttribute("aria-invalid", "true");
        return false;
      }

      input.classList.remove("is-invalid");
      if (String(input.value || "").trim().length > 0) {
        input.classList.add("is-valid");
      } else {
        input.classList.remove("is-valid");
      }
      input.removeAttribute("aria-invalid");
      return true;
    };

    const attachLiveValidator = (input, validatorFn) => {
      if (!input) return;
      let touched = false;
      input.addEventListener("blur", () => {
        touched = true;
        validatorFn();
      });
      input.addEventListener("input", () => {
        if (touched || input.classList.contains("is-invalid")) {
          validatorFn();
        }
      });
    };

    /* ----------------------------------------------------------------------
       6. Student Login Form Validation & Submission
       ---------------------------------------------------------------------- */
    const studentForm = document.getElementById("student-login-form");
    const studentEmail = document.getElementById("student-email");
    const studentPassword = document.getElementById("student-password");
    const studentRemember = document.getElementById("student-remember");

    const validateStudentEmail = () => {
      const val = studentEmail.value.trim();
      if (!val) return setFieldState(studentEmail, "student-email-error", "NU-ID email is required.");
      if (!isValidNuEmail(val)) {
        return setFieldState(studentEmail, "student-email-error", "Use your @nu.edu.pk address (e.g. i243182@nu.edu.pk).");
      }
      return setFieldState(studentEmail, "student-email-error", "");
    };

    const validateStudentPassword = () => {
      const val = studentPassword.value;
      if (!val) return setFieldState(studentPassword, "student-password-error", "Password is required.");
      if (val.length < 6) {
        return setFieldState(studentPassword, "student-password-error", "Password must be at least 6 characters.");
      }
      return setFieldState(studentPassword, "student-password-error", "");
    };

    attachLiveValidator(studentEmail, validateStudentEmail);
    attachLiveValidator(studentPassword, validateStudentPassword);

    if (studentForm) {
      studentForm.addEventListener("submit", (event) => {
        event.preventDefault();
        hideBanner();

        const okEmail = validateStudentEmail();
        const okPass = validateStudentPassword();
        if (!okEmail || !okPass) {
          showBanner("error", "Please fix the highlighted fields before logging in.");
          return;
        }

        const emailVal = studentEmail.value.trim().toLowerCase();
        const passVal = studentPassword.value;
        const existingUser = readUsers().find((u) => u.email.toLowerCase() === emailVal);

        if (existingUser && existingUser.password !== passVal) {
          setFieldState(studentPassword, "student-password-error", "Incorrect password for this account.");
          showBanner("error", "Invalid credentials. Check your password and try again.");
          return;
        }

        const session = {
          name: existingUser ? existingUser.name : formatNameFromEmail(emailVal),
          email: emailVal,
          role: "student",
          campus: existingUser ? existingUser.campus : "Islamabad",
          rollNo: existingUser ? existingUser.rollNo : "",
          remember: Boolean(studentRemember && studentRemember.checked),
          loggedInAt: new Date().toISOString(),
        };

        writeSession(session);
        renderSessionUI();
        studentForm.reset();
        [studentEmail, studentPassword].forEach((el) => el.classList.remove("is-valid"));
        showBanner("success", `Signed in as ${session.name} (Student). Your session is saved in this browser.`);
      });
    }

    /* ----------------------------------------------------------------------
       7. Tutor Login Form Validation & Submission
       ---------------------------------------------------------------------- */
    const tutorForm = document.getElementById("tutor-login-form");
    const tutorEmail = document.getElementById("tutor-email");
    const tutorRoll = document.getElementById("tutor-roll");
    const tutorPassword = document.getElementById("tutor-password");
    const tutorRemember = document.getElementById("tutor-remember");

    const validateTutorEmail = () => {
      const val = tutorEmail.value.trim();
      if (!val) return setFieldState(tutorEmail, "tutor-email-error", "Mentor NU-ID email is required.");
      if (!isValidNuEmail(val)) {
        return setFieldState(tutorEmail, "tutor-email-error", "Enter a valid @nu.edu.pk email.");
      }
      return setFieldState(tutorEmail, "tutor-email-error", "");
    };

    const validateTutorRoll = () => {
      const val = tutorRoll.value.trim();
      if (!val) return setFieldState(tutorRoll, "tutor-roll-error", "Verified Roll No. is required.");
      if (!isValidRollNo(val)) {
        return setFieldState(tutorRoll, "tutor-roll-error", "Use format XXC-XXXX (e.g. 22I-1045).");
      }
      return setFieldState(tutorRoll, "tutor-roll-error", "");
    };

    const validateTutorPassword = () => {
      const val = tutorPassword.value;
      if (!val) return setFieldState(tutorPassword, "tutor-password-error", "Password is required.");
      if (val.length < 6) {
        return setFieldState(tutorPassword, "tutor-password-error", "Password must be at least 6 characters.");
      }
      return setFieldState(tutorPassword, "tutor-password-error", "");
    };

    attachLiveValidator(tutorEmail, validateTutorEmail);
    attachLiveValidator(tutorRoll, validateTutorRoll);
    attachLiveValidator(tutorPassword, validateTutorPassword);

    if (tutorForm) {
      tutorForm.addEventListener("submit", (event) => {
        event.preventDefault();
        hideBanner();

        const okEmail = validateTutorEmail();
        const okRoll = validateTutorRoll();
        const okPass = validateTutorPassword();
        if (!okEmail || !okRoll || !okPass) {
          showBanner("error", "Please complete all required senior tutor fields.");
          return;
        }

        const emailVal = tutorEmail.value.trim().toLowerCase();
        const rollVal = tutorRoll.value.trim().toUpperCase();
        const passVal = tutorPassword.value;
        const existingUser = readUsers().find((u) => u.email.toLowerCase() === emailVal);

        if (existingUser && existingUser.password !== passVal) {
          setFieldState(tutorPassword, "tutor-password-error", "Incorrect password for this mentor account.");
          showBanner("error", "Invalid mentor credentials. Please try again.");
          return;
        }

        const session = {
          name: existingUser ? existingUser.name : formatNameFromEmail(emailVal),
          email: emailVal,
          role: "tutor",
          campus: existingUser ? existingUser.campus : "Islamabad",
          rollNo: existingUser ? existingUser.rollNo : rollVal,
          remember: Boolean(tutorRemember && tutorRemember.checked),
          loggedInAt: new Date().toISOString(),
        };

        writeSession(session);
        renderSessionUI();
        tutorForm.reset();
        [tutorEmail, tutorRoll, tutorPassword].forEach((el) => el.classList.remove("is-valid"));
        showBanner("success", `Signed in as ${session.name} (Senior Tutor). Welcome back to FASTutor!`);
      });
    }

    /* ----------------------------------------------------------------------
       8. Sign Up Form, Role Toggle & Live Password Strength Meter
       ---------------------------------------------------------------------- */
    const signupForm = document.getElementById("signup-form");
    const roleRadios = document.querySelectorAll('input[name="signupRole"]');
    const tutorExtraBox = document.getElementById("signup-tutor-fields");

    const signupName = document.getElementById("signup-name");
    const signupRoll = document.getElementById("signup-roll");
    const signupCampus = document.getElementById("signup-campus");
    const signupEmail = document.getElementById("signup-email");
    const signupCgpa = document.getElementById("signup-cgpa");
    const signupCourses = document.getElementById("signup-courses");
    const signupPassword = document.getElementById("signup-password");
    const signupConfirm = document.getElementById("signup-confirm");
    const signupTerms = document.getElementById("signup-terms");

    const strengthWrap = document.getElementById("strength-wrap");
    const strengthLabel = document.getElementById("strength-label");
    const ruleLength = document.getElementById("rule-length");
    const ruleUpper = document.getElementById("rule-upper");
    const ruleNumber = document.getElementById("rule-number");
    const ruleSpecial = document.getElementById("rule-special");

    const getSelectedRole = () => {
      const checked = document.querySelector('input[name="signupRole"]:checked');
      return checked ? checked.value : "student";
    };

    roleRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        const isTutor = getSelectedRole() === "tutor";
        if (tutorExtraBox) tutorExtraBox.hidden = !isTutor;
      });
    });

    const evaluatePasswordStrength = (value) => {
      const checks = {
        length: value.length >= 8,
        upper: /[A-Z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[^A-Za-z0-9]/.test(value),
      };

      const score = Object.values(checks).filter(Boolean).length;
      const labels = ["Enter a password", "Weak", "Fair", "Good", "Strong"];

      if (strengthWrap) strengthWrap.setAttribute("data-strength", String(value ? score || 1 : 0));
      if (strengthLabel) strengthLabel.textContent = value ? labels[score] || "Weak" : labels[0];

      if (ruleLength) ruleLength.classList.toggle("is-met", checks.length);
      if (ruleUpper) ruleUpper.classList.toggle("is-met", checks.upper);
      if (ruleNumber) ruleNumber.classList.toggle("is-met", checks.number);
      if (ruleSpecial) ruleSpecial.classList.toggle("is-met", checks.special);

      return { checks, score };
    };

    const validateSignupName = () => {
      const val = signupName.value.trim();
      if (val.length < 2) {
        return setFieldState(signupName, "signup-name-error", "Enter your full name (at least 2 characters).");
      }
      return setFieldState(signupName, "signup-name-error", "");
    };

    const validateSignupRoll = () => {
      const val = signupRoll.value.trim();
      if (!val) return setFieldState(signupRoll, "signup-roll-error", "Roll number is required.");
      if (!isValidRollNo(val)) {
        return setFieldState(signupRoll, "signup-roll-error", "Use format XXC-XXXX (e.g. 24I-3182).");
      }
      return setFieldState(signupRoll, "signup-roll-error", "");
    };

    const validateSignupCampus = () => {
      if (!signupCampus.value) {
        return setFieldState(signupCampus, "signup-campus-error", "Select your FAST campus.");
      }
      return setFieldState(signupCampus, "signup-campus-error", "");
    };

    const validateSignupEmail = () => {
      const val = signupEmail.value.trim();
      if (!val) return setFieldState(signupEmail, "signup-email-error", "Official NU-ID email is required.");
      if (!isValidNuEmail(val)) {
        return setFieldState(signupEmail, "signup-email-error", "Must end with @nu.edu.pk.");
      }
      return setFieldState(signupEmail, "signup-email-error", "");
    };

    const validateSignupCgpa = () => {
      if (getSelectedRole() !== "tutor") {
        return setFieldState(signupCgpa, "signup-cgpa-error", "");
      }
      const num = parseFloat(signupCgpa.value);
      if (Number.isNaN(num) || num < 3.2 || num > 4.0) {
        return setFieldState(signupCgpa, "signup-cgpa-error", "Tutor verification requires a CGPA between 3.20 and 4.00.");
      }
      return setFieldState(signupCgpa, "signup-cgpa-error", "");
    };

    const validateSignupCourses = () => {
      if (getSelectedRole() !== "tutor") {
        return setFieldState(signupCourses, "signup-courses-error", "");
      }
      if (signupCourses.value.trim().length < 3) {
        return setFieldState(signupCourses, "signup-courses-error", "List at least one A/A- course (e.g. CS-2001 DSA).");
      }
      return setFieldState(signupCourses, "signup-courses-error", "");
    };

    const validateSignupPassword = () => {
      const val = signupPassword.value;
      const { checks } = evaluatePasswordStrength(val);
      if (!val) return setFieldState(signupPassword, "signup-password-error", "Create a password.");
      if (!checks.length || !checks.upper || !checks.number) {
        return setFieldState(
          signupPassword,
          "signup-password-error",
          "Use 8+ chars with at least 1 uppercase letter and 1 number."
        );
      }
      return setFieldState(signupPassword, "signup-password-error", "");
    };

    const validateSignupConfirm = () => {
      const val = signupConfirm.value;
      if (!val) return setFieldState(signupConfirm, "signup-confirm-error", "Please confirm your password.");
      if (val !== signupPassword.value) {
        return setFieldState(signupConfirm, "signup-confirm-error", "Passwords do not match.");
      }
      return setFieldState(signupConfirm, "signup-confirm-error", "");
    };

    const validateSignupTerms = () => {
      const err = document.getElementById("signup-terms-error");
      if (!signupTerms.checked) {
        if (err) err.textContent = "Please accept the Terms of Service and Student Guidelines.";
        return false;
      }
      if (err) err.textContent = "";
      return true;
    };

    attachLiveValidator(signupName, validateSignupName);
    attachLiveValidator(signupRoll, validateSignupRoll);
    attachLiveValidator(signupCampus, validateSignupCampus);
    attachLiveValidator(signupEmail, validateSignupEmail);
    attachLiveValidator(signupCgpa, validateSignupCgpa);
    attachLiveValidator(signupCourses, validateSignupCourses);

    if (signupPassword) {
      let passTouched = false;
      signupPassword.addEventListener("blur", () => {
        passTouched = true;
        validateSignupPassword();
      });
      signupPassword.addEventListener("input", () => {
        evaluatePasswordStrength(signupPassword.value);
        if (passTouched || signupPassword.classList.contains("is-invalid")) {
          validateSignupPassword();
        }
        if (signupConfirm && signupConfirm.value) {
          validateSignupConfirm();
        }
      });
    }

    attachLiveValidator(signupConfirm, validateSignupConfirm);
    if (signupTerms) {
      signupTerms.addEventListener("change", validateSignupTerms);
    }

    if (signupForm) {
      signupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        hideBanner();

        const results = [
          validateSignupName(),
          validateSignupRoll(),
          validateSignupCampus(),
          validateSignupEmail(),
          validateSignupCgpa(),
          validateSignupCourses(),
          validateSignupPassword(),
          validateSignupConfirm(),
          validateSignupTerms(),
        ];

        if (results.some((ok) => !ok)) {
          showBanner("error", "Please resolve the validation errors highlighted below.");
          return;
        }

        const emailVal = signupEmail.value.trim().toLowerCase();
        const alreadyExists = readUsers().some((u) => u.email.toLowerCase() === emailVal);
        if (alreadyExists) {
          setFieldState(signupEmail, "signup-email-error", "An account with this @nu.edu.pk email already exists.");
          showBanner("error", "This NU-ID email is already registered. Switch to Login to sign in.");
          return;
        }

        const role = getSelectedRole();
        const newUser = {
          name: signupName.value.trim(),
          rollNo: signupRoll.value.trim().toUpperCase(),
          campus: signupCampus.value,
          email: emailVal,
          role,
          cgpa: role === "tutor" ? signupCgpa.value : "",
          courses: role === "tutor" ? signupCourses.value.trim() : "",
          password: signupPassword.value,
        };

        saveUser(newUser);
        writeSession({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          campus: newUser.campus,
          rollNo: newUser.rollNo,
          loggedInAt: new Date().toISOString(),
        });

        renderSessionUI();
        signupForm.reset();
        if (tutorExtraBox) tutorExtraBox.hidden = true;
        evaluatePasswordStrength("");
        signupForm.querySelectorAll(".form-control").forEach((el) => el.classList.remove("is-valid"));

        const roleText = role === "tutor" ? "Senior Tutor" : "Student";
        showBanner(
          "success",
          `Welcome to FASTutor, ${newUser.name}! Your ${roleText} account (${newUser.campus}) is active.`
        );
      });
    }

    /* ----------------------------------------------------------------------
       9. Initialize Persisted Session State on Page Load
       ---------------------------------------------------------------------- */
    renderSessionUI();
  });
})();
