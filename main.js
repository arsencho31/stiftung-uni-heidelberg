/* =========================================================================
   FÖRDERER UNIVERSITÄT HEIDELBERG — shared front-end behaviour
   No build step, no dependencies, no browser storage (session-only state)
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- small helpers ---------- */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------- mobile navigation ---------- */
  const navToggle = $(".nav-toggle");
  const mainNav = $(".main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$(".main-nav a").forEach((a) =>
      a.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------- header scroll shadow + scroll progress ---------- */
  const header = $(".site-header");
  const progress = $(".scroll-progress");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (progress) {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
    const backBtn = $(".back-to-top");
    if (backBtn) backBtn.classList.toggle("is-visible", window.scrollY > 700);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- back to top ---------- */
  const backToTop = $(".back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* ---------- scroll reveal ---------- */
  const revealEls = $$(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- animated counters ---------- */
  $$("[data-count]").forEach((el) => {
    const target = parseFloat(el.getAttribute("data-count"));
    const decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const run = () => {
      const dur = 1200;
      const start = performance.now();
      function frame(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };
    if ("IntersectionObserver" in window) {
      const io2 = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              run();
              io2.unobserve(e.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      io2.observe(el);
    } else {
      run();
    }
  });

  /* ---------- active nav link highlighting by section ---------- */
  const sections = $$("main [id]");
  const navLinks = $$(".main-nav a, .subnav a");
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const map = new Map();
    navLinks.forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#")) map.set(href.slice(1), a);
    });
    const io3 = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const link = map.get(e.target.id);
          if (!link) return;
          if (e.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("is-active"));
            map.forEach((a) => {
              if (a.getAttribute("href") === "#" + e.target.id) a.classList.add("is-active");
            });
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach((s) => io3.observe(s));
  }

  /* ---------- smooth-scroll anchor offset for sticky header/subnav ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (ev) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = $(id);
      if (!target) return;
      ev.preventDefault();
      const headerH = document.querySelector(".subnav-wrap") ? 132 : 90;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* ---------- robust hash-anchor landing (fixes cross-page nav links like "Aktuelles") ----------
     Web fonts (Fraunces/Inter/IBM Plex Mono) load asynchronously. If the browser jumps to a
     #anchor before the fonts swap in, later reflow can shift the target out from under the
     viewport, making links such as index.html#aktuelles appear to land back at the top. */
  function landOnHash() {
    if (!location.hash) return;
    let target;
    try { target = document.querySelector(location.hash); } catch (e) { return; }
    if (!target) return;
    const headerH = document.querySelector(".subnav-wrap") ? 132 : 96;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }
  window.addEventListener("load", landOnHash);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(landOnHash, 30));
  } else {
    setTimeout(landOnHash, 350);
  }

  /* ---------- font-size controls — in-memory only ---------- */
  let fontScale = 1;
  const incBtn = $("[data-font-inc]");
  const decBtn = $("[data-font-dec]");
  function applyScale() {
    document.documentElement.style.setProperty("--fontscale", fontScale.toFixed(2));
  }
  if (incBtn) incBtn.addEventListener("click", () => { fontScale = Math.min(1.25, fontScale + 0.075); applyScale(); });
  if (decBtn) decBtn.addEventListener("click", () => { fontScale = Math.max(0.9, fontScale - 0.075); applyScale(); });

  /* ---------- toasts ---------- */
  function toast(msg) {
    let host = $(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span class="dot-ok"></span><span></span>';
    el.querySelector("span:last-child").textContent = msg;
    host.appendChild(el);
    setTimeout(() => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 260);
    }, 3600);
  }
  window.__toast = toast;

  /* ---------- generic demo-form handling (no backend attached) ---------- */
  $$("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const msg = form.getAttribute("data-success") || "Danke! Ihre Angaben wurden übermittelt.";
      toast(msg);
      form.reset();
    });
  });

  /* ---------- copy to clipboard (IBAN etc.) ---------- */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(value);
      } catch (e) {
        /* clipboard API unavailable — still confirm to the user */
      }
      toast("In die Zwischenablage kopiert.");
    });
  });

  /* ---------- accordion (FAQ) ---------- */
  $$(".accordion-item").forEach((item) => {
    const trigger = $(".accordion-trigger", item);
    const panel = $(".accordion-panel", item);
    if (!trigger || !panel) return;
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      // close siblings within the same accordion group
      const group = item.parentElement;
      if (group && group.getAttribute("data-accordion-solo") !== null) {
        $$(".accordion-item", group).forEach((sib) => {
          if (sib !== item) {
            sib.classList.remove("is-open");
            $(".accordion-panel", sib).style.maxHeight = "0px";
          }
        });
      }
      item.classList.toggle("is-open", !isOpen);
      panel.style.maxHeight = !isOpen ? panel.scrollHeight + "px" : "0px";
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  /* ---------- tabs ---------- */
  $$("[data-tabs]").forEach((tabGroup) => {
    const buttons = $$(".tabs-nav button", tabGroup);
    const panels = $$(".tab-panel", tabGroup);
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-active"));
        panels.forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        const target = $("#" + btn.getAttribute("data-tab"), tabGroup);
        if (target) target.classList.add("is-active");
      });
    });
  });

  /* ---------- testimonial slider ---------- */
  $$("[data-slider]").forEach((slider) => {
    const slides = $$(".testi-slide", slider);
    const dotsHost = $(".testi-dots", slider);
    if (!slides.length) return;
    let idx = 0;
    let timer;
    if (dotsHost) {
      dotsHost.innerHTML = "";
      slides.forEach((_, i) => {
        const d = document.createElement("button");
        d.setAttribute("aria-label", "Zitat " + (i + 1));
        if (i === 0) d.classList.add("is-active");
        d.addEventListener("click", () => show(i, true));
        dotsHost.appendChild(d);
      });
    }
    function show(i, manual) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === idx));
      if (dotsHost) $$("button", dotsHost).forEach((d, n) => d.classList.toggle("is-active", n === idx));
      if (manual) restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => show(idx + 1), 6500);
    }
    show(0);
    restart();
    slider.addEventListener("mouseenter", () => clearInterval(timer));
    slider.addEventListener("mouseleave", restart);
  });

  /* ---------- membership fee calculator (GdF) ---------- */
  const memberCalc = $("#member-calc");
  if (memberCalc) {
    const fees = { einzel: 50, firma: 250, student: 10, absolvent: 25 };
    const labels = {
      einzel: "Einzelmitgliedschaft",
      firma: "Firmen- / juristische Mitgliedschaft",
      student: "Ermäßigt für Studierende",
      absolvent: "Ermäßigt für Absolvent:innen (bis 3 Jahre)",
    };
    const out = $("#member-calc-amount");
    const outLabel = $("#member-calc-label");
    function update() {
      const checked = memberCalc.querySelector("input:checked");
      const key = checked ? checked.value : "einzel";
      if (out) out.textContent = fees[key].toFixed(2).replace(".", ",");
      if (outLabel) outLabel.textContent = labels[key];
    }
    $$("input", memberCalc).forEach((r) => r.addEventListener("change", update));
    update();
  }

  /* ---------- donation impact calculator (Stiftung) ---------- */
  const donateAmountInput = $("#donate-amount");
  const donatePills = $("#donate-pills");
  const donateImpact = $("#donate-impact");
  function impactFor(v) {
    if (v >= 500) return "ermöglicht ein volles Semester-Sprachkursprogramm für Geflüchtete.";
    if (v >= 200) return "finanziert Lernmaterialien und ein Tutorium für ein Semester.";
    if (v >= 100) return "übernimmt die Übersetzungskosten für ein ukrainisches Zeugnis.";
    if (v >= 50) return "deckt einen Monat Fahrtkosten zu Sprachkursen.";
    if (v > 0) return "hilft direkt bei den nötigsten Anschaffungen für Lernmaterial.";
    return "— wählen Sie einen Betrag, um die Wirkung zu sehen.";
  }
  function setDonateAmount(v) {
    if (donateAmountInput) donateAmountInput.value = v;
    if (donateImpact) donateImpact.textContent = "Ihre Spende von " + v + " € " + impactFor(v);
  }
  if (donatePills) {
    $$("button", donatePills).forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("button", donatePills).forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        setDonateAmount(parseInt(btn.getAttribute("data-amount"), 10));
      });
    });
  }
  if (donateAmountInput) {
    donateAmountInput.addEventListener("input", () => {
      if (donatePills) $$("button", donatePills).forEach((b) => b.classList.remove("is-active"));
      setDonateAmount(parseInt(donateAmountInput.value, 10) || 0);
    });
    setDonateAmount(parseInt(donateAmountInput.value, 10) || 50);
  }

  /* ---------- multi-step "Mitglied werden" form ---------- */
  const stepForm = $("#join-form");
  if (stepForm) {
    const steps = $$(".form-step", stepForm);
    const dots = $$(".stepper .dot", stepForm);
    let current = 0;
    function render() {
      steps.forEach((s, i) => s.classList.toggle("is-active", i === current));
      dots.forEach((d, i) => d.classList.toggle("is-done", i <= current));
    }
    $$("[data-step-next]", stepForm).forEach((btn) =>
      btn.addEventListener("click", () => {
        const requiredFields = $$("input[required], select[required]", steps[current]);
        const invalid = requiredFields.find((f) => !f.value);
        if (invalid) { invalid.focus(); return; }
        current = Math.min(steps.length - 1, current + 1);
        render();
      })
    );
    $$("[data-step-prev]", stepForm).forEach((btn) =>
      btn.addEventListener("click", () => { current = Math.max(0, current - 1); render(); })
    );
    stepForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      toast("Willkommen! Ihre Beitrittserklärung wurde übermittelt.");
      current = 0;
      render();
      stepForm.reset();
    });
    render();
  }

  /* ---------- cookie consent banner (session only, no storage) ---------- */
  const cookieBanner = $(".cookie-banner");
  if (cookieBanner) {
    setTimeout(() => cookieBanner.classList.add("is-visible"), 900);
    $$("[data-cookie-action]", cookieBanner).forEach((btn) =>
      btn.addEventListener("click", () => cookieBanner.classList.remove("is-visible"))
    );
  }

  /* ---------- command palette (quick jump), toggled via button or Ctrl/Cmd+K ---------- */
  const cmdkBackdrop = $(".cmdk-backdrop");
  if (cmdkBackdrop) {
    const input = $(".cmdk-input", cmdkBackdrop);
    const list = $(".cmdk-list", cmdkBackdrop);
    const items = [
      { label: "Start", group: "Übersicht", href: "index.html" },
      { label: "Aktuelles", group: "Übersicht", href: "index.html#aktuelles" },
      { label: "Kontakt (Übersicht)", group: "Übersicht", href: "index.html#kontakt" },
      { label: "Stiftung — Idee & Auftrag", group: "Stiftung", href: "stiftung.html#idee" },
      { label: "Stiftung — Personen", group: "Stiftung", href: "stiftung.html#personen" },
      { label: "Stiftung — Aktivitäten & Preise", group: "Stiftung", href: "stiftung.html#aktivitaeten" },
      { label: "Stiftung — Spenden", group: "Stiftung", href: "stiftung.html#spenden" },
      { label: "Stiftung — Kontakt", group: "Stiftung", href: "stiftung.html#kontakt" },
      { label: "Gesellschaft der Freunde — Idee", group: "Freunde", href: "gdf.html#idee" },
      { label: "Freunde — Aktivitäten & Sektionen", group: "Freunde", href: "gdf.html#aktivitaeten" },
      { label: "Freunde — Mitgliedschaft & Beitrag", group: "Freunde", href: "gdf.html#mitglieder" },
      { label: "Freunde — Mitglied werden", group: "Freunde", href: "gdf.html#mitglied-werden" },
      { label: "Freunde — Engagement", group: "Freunde", href: "gdf.html#engagement" },
      { label: "Freunde — Kontakt", group: "Freunde", href: "gdf.html#kontakt" },
    ];
    function renderList(filter) {
      const f = (filter || "").toLowerCase();
      const matches = items.filter(
        (it) => it.label.toLowerCase().includes(f) || it.group.toLowerCase().includes(f)
      );
      list.innerHTML = "";
      if (!matches.length) {
        list.innerHTML = '<div class="cmdk-empty">Keine Treffer.</div>';
        return;
      }
      matches.forEach((it, i) => {
        const el = document.createElement("a");
        el.href = it.href;
        el.className = "cmdk-item" + (i === 0 ? " is-active" : "");
        el.innerHTML = "<span>" + it.label + "</span><span class='tag'>" + it.group + "</span>";
        el.addEventListener("click", close);
        list.appendChild(el);
      });
    }
    function open() {
      cmdkBackdrop.classList.add("is-open");
      renderList("");
      setTimeout(() => input.focus(), 50);
    }
    function close() {
      cmdkBackdrop.classList.remove("is-open");
      input.value = "";
    }
    $$("[data-cmdk-open]").forEach((b) => b.addEventListener("click", open));
    cmdkBackdrop.addEventListener("click", (e) => { if (e.target === cmdkBackdrop) close(); });
    input.addEventListener("input", () => renderList(input.value));
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
      if (e.key === "Escape") close();
    });
  }

  /* ---------- newsletter form specific confirmation copy ---------- */
  $$("form[data-newsletter]").forEach((f) =>
    f.addEventListener("submit", (ev) => {
      ev.preventDefault();
      toast("Danke für Ihre Anmeldung zum Newsletter!");
      f.reset();
    })
  );
})();
