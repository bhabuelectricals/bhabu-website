/* Bhabu Electricals — site interactions (no dependencies) */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Header state + mobile nav */
  const header = $(".header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const toggle = $(".nav-toggle"), nav = $(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
    });
    $$("a", nav).forEach((a) => a.addEventListener("click", () => nav.classList.remove("is-open")));
  }

  /* Reveal on scroll */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
  const observe = (root = document) => $$(".reveal:not(.is-in)", root).forEach((el) => io ? io.observe(el) : el.classList.add("is-in"));
  observe();

  /* Count-up numbers */
  const counters = $$("[data-count]");
  if (counters.length && io) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1600;
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
          el.textContent = v.toLocaleString("en-IN");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick); cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  }

  /* Hero slideshow */
  const slides = $$(".hero__slide");
  if (slides.length > 1) {
    const dots = $$(".hero__dots button"), cap = $(".hero__caption");
    let i = 0, timer;
    const show = (n) => {
      slides[i].classList.remove("is-active"); dots[i] && dots[i].classList.remove("is-active");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active"); dots[i] && dots[i].classList.add("is-active");
      if (cap) cap.textContent = slides[i].dataset.caption || "";
    };
    const play = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 6500); };
    dots.forEach((d, n) => d.addEventListener("click", () => { show(n); play(); }));
    play();
  }

  /* FAQ: search + nav highlight */
  const faqSearch = $("#faq-search");
  if (faqSearch) {
    faqSearch.addEventListener("input", () => {
      const q = faqSearch.value.trim().toLowerCase();
      $$(".faq").forEach((f) => {
        const hit = !q || f.textContent.toLowerCase().includes(q);
        f.style.display = hit ? "" : "none";
        if (q && hit) f.open = true;
      });
      $$(".faq-group").forEach((g) => { g.style.display = $$(".faq", g).some((f) => f.style.display !== "none") ? "" : "none"; });
    });
  }
  const faqLinks = $$(".faq-nav a");
  if (faqLinks.length && io) {
    const gio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) faqLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-40% 0px -55% 0px" });
    $$(".faq-group").forEach((g) => gio.observe(g));
  }

  /* Journal filter */
  const jchips = $$("[data-jfilter]");
  jchips.forEach((c) => c.addEventListener("click", () => {
    jchips.forEach((x) => x.classList.toggle("is-active", x === c));
    const f = c.dataset.jfilter;
    $$("[data-jcat]").forEach((p) => { p.style.display = f === "all" || p.dataset.jcat === f ? "" : "none"; });
  }));

  /* Contact form -> email or WhatsApp */
  const form = $("#enquiry-form");
  if (form) {
    const compose = () => {
      const d = Object.fromEntries(new FormData(form).entries());
      return {
        subject: `Project enquiry: ${d.type || "General"} — ${d.name || ""}`,
        body: `Name: ${d.name}\nPhone: ${d.phone}\nEmail: ${d.email}\nProject type: ${d.type}\nLocation: ${d.location}\nApprox. load: ${d.load || "-"}\n\n${d.message}`,
      };
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const m = compose();
      window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
    });
    const wa = $("#send-wa");
    wa && wa.addEventListener("click", () => {
      if (!form.reportValidity()) return;
      const m = compose();
      window.open(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(m.subject + "\n\n" + m.body)}`, "_blank", "noopener");
    });
  }

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------------- Projects ---------------- */
  const P = window.BE_PROJECTS;
  if (!P) return;
  const ICONS = window.BE_ICONS || {};
  const imgBase = "assets/img/projects/";
  const sectorName = (k) => (P.sectors.find((s) => s.key === k) || {}).name || k;

  const placeholder = (p, big) => `
    <div class="ph">
      <div class="ph__icon">${ICONS[p.sector] || ""}</div>
      <img class="ph__mark" src="assets/img/brand/mark-white.png" alt="">
      <div class="ph__load">${esc(p.load || sectorName(p.sector))}<small>${p.scope ? esc(p.scope) + " electrical installation" : "Electrical installation"}</small></div>
    </div>`;

  const cardHTML = (p) => {
    const hasImg = p.images.length > 0;
    return `
    <button class="pcard reveal" data-slug="${p.slug}" aria-label="View ${esc(p.name)}, ${esc(p.location)}">
      <div class="pcard__img">
        ${hasImg ? `<img src="${imgBase}${p.slug}/${p.images[0]}-t.jpg" alt="${esc(p.name)}, ${esc(p.location)}" loading="lazy">` : placeholder(p)}
        <div class="pcard__badge">${p.ongoing ? '<span class="live">ON-GOING</span>' : ""}${p.scope ? `<span>${esc(p.scope)}</span>` : ""}</div>
        ${p.images.length > 1 ? `<span class="pcard__count"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 17-5-5-8 7"/></svg>${p.images.length}</span>` : ""}
      </div>
      <div class="pcard__body">
        <span class="pcard__sector">${esc(sectorName(p.sector))}</span>
        <h3>${esc(p.name)}</h3>
        <span class="pcard__loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>${esc(p.location)}</span>
        ${p.load ? `<div class="pcard__specs"><span class="tag">${esc(p.load)}</span></div>` : ""}
      </div>
    </button>`;
  };

  /* Grid page */
  const grid = $("#project-grid");
  if (grid) {
    const state = { sector: "all", q: "", photos: false };
    const params = new URLSearchParams(location.search);
    if (params.get("sector")) state.sector = params.get("sector");
    const chips = $("#sector-chips"), count = $("#result-count");
    const counts = P.projects.reduce((m, p) => { m[p.sector] = (m[p.sector] || 0) + 1; if (p.ongoing) m.ongoing = (m.ongoing || 0) + 1; return m; }, {});
    chips.innerHTML = `<button class="chip" data-sector="all">All projects <small>${P.projects.length}</small></button>` +
      P.sectors.map((s) => `<button class="chip" data-sector="${s.key}">${esc(s.name)} <small>${counts[s.key] || 0}</small></button>`).join("");
    const render = () => {
      $$(".chip", chips).forEach((c) => c.classList.toggle("is-active", c.dataset.sector === state.sector));
      const q = state.q.toLowerCase();
      const list = P.projects.filter((p) =>
        (state.sector === "all" || p.sector === state.sector || (state.sector === "ongoing" && p.ongoing)) &&
        (!state.photos || p.images.length) &&
        (!q || [p.name, p.location, p.client, p.architect, p.consultant, p.load, p.scope].join(" ").toLowerCase().includes(q)));
      list.sort((a, b) => (b.images.length > 0) - (a.images.length > 0));
      grid.innerHTML = list.map(cardHTML).join("") || `<div class="empty" style="grid-column:1/-1">No projects match your search.</div>`;
      count.textContent = `Showing ${list.length} of ${P.projects.length} projects`;
      observe(grid);
    };
    chips.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      state.sector = b.dataset.sector; render();
      const u = new URL(location); state.sector === "all" ? u.searchParams.delete("sector") : u.searchParams.set("sector", state.sector);
      history.replaceState(null, "", u);
    });
    $("#project-search").addEventListener("input", (e) => { state.q = e.target.value; render(); });
    $("#photos-only").addEventListener("change", (e) => { state.photos = e.target.checked; render(); });
    render();
  }

  /* Modal (projects page + featured tiles on other pages) */
  const modal = $("#project-modal");
  if (!modal) return;
  let gal = { p: null, i: 0 };
  const showImg = (n) => {
    const p = gal.p; if (!p.images.length) return;
    gal.i = (n + p.images.length) % p.images.length;
    $(".gallery__main img", modal).src = `${imgBase}${p.slug}/${p.images[gal.i]}.jpg`;
    $$(".gallery__thumbs button", modal).forEach((b, k) => b.classList.toggle("is-active", k === gal.i));
    const t = $$(".gallery__thumbs button", modal)[gal.i]; t && t.scrollIntoView({ block: "nearest", inline: "center" });
  };
  const openProject = (slug, push = true) => {
    const p = P.projects.find((x) => x.slug === slug); if (!p) return;
    gal = { p, i: 0 };
    const rows = [["Sector", sectorName(p.sector)], ["Location", p.location], ["Scope", p.scope && (p.scope + " electrical installation")], ["Connected load", p.load],
      ["Client", p.client], ["Architect", p.architect], ["Consultant", p.consultant], ["Status", p.ongoing ? "On-going" : "Completed"]].filter((r) => r[1]);
    const many = p.images.length > 1;
    $(".modal__dialog", modal).innerHTML = `
      <button class="modal__close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <div class="gallery">
        ${p.images.length ? `<div class="gallery__main"><img alt="${esc(p.name)}, ${esc(p.location)}">
          ${many ? `<button class="gallery__nav gallery__nav--prev" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m15 18-6-6 6-6"/></svg></button>
          <button class="gallery__nav gallery__nav--next" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m9 18 6-6-6-6"/></svg></button>` : ""}</div>
          ${many ? `<div class="gallery__thumbs">${p.images.map((im) => `<button aria-label="Photo"><img src="${imgBase}${p.slug}/${im}-t.jpg" alt="" loading="lazy"></button>`).join("")}</div>` : ""}`
        : placeholder(p, true)}
      </div>
      <div class="modal__info">
        <span class="eyebrow">${p.ongoing ? "On-going project" : "Completed project"}</span>
        <h2 id="modal-title">${esc(p.name)}</h2>
        <p class="pcard__loc">${esc(p.location)}</p>
        <dl class="spec-list">${rows.map((r) => `<div><dt>${r[0]}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl>
        <a class="btn btn--primary" style="margin-top:32px" href="contact.html">Discuss a similar project <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      </div>`;
    showImg(0);
    modal.classList.add("is-open"); document.body.style.overflow = "hidden";
    $(".modal__close", modal).focus();
    if (push && grid) history.replaceState(null, "", "#" + slug);
  };
  const close = () => {
    modal.classList.remove("is-open"); document.body.style.overflow = "";
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  };
  modal.addEventListener("click", (e) => {
    if (e.target.closest(".modal__close") || e.target.classList.contains("modal__backdrop")) return close();
    if (e.target.closest(".gallery__nav--prev")) return showImg(gal.i - 1);
    if (e.target.closest(".gallery__nav--next")) return showImg(gal.i + 1);
    const t = e.target.closest(".gallery__thumbs button");
    if (t) showImg($$(".gallery__thumbs button", modal).indexOf(t));
  });
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") showImg(gal.i + 1);
    if (e.key === "ArrowLeft") showImg(gal.i - 1);
  });
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-slug]");
    if (c && !modal.contains(c)) { e.preventDefault(); openProject(c.dataset.slug); }
  });
  if (location.hash.length > 1) openProject(location.hash.slice(1), false);
})();
