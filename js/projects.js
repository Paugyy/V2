(async function () {
  const featuredTrack = document.getElementById("featuredTrack");
  const projectsGrid  = document.getElementById("projectsGrid");

  function showError(target, msg) {
    if (!target) return;
    target.innerHTML = `<p style="padding:14px;color:#AAB6D3;">${msg}</p>`;
  }

  const base   = document.baseURI;
  const jsonUrl = featuredTrack
    ? new URL("data/projects.json", base)
    : new URL("../data/projects.json", base);

  let projects = [];
  try {
    const res = await fetch(jsonUrl.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    projects = await res.json();
    if (!Array.isArray(projects)) throw new Error("JSON invalide");
  } catch (err) {
    showError(featuredTrack, "Impossible de charger les projets.");
    showError(projectsGrid,  "Impossible de charger les projets.");
    return;
  }

  projects.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const catLabel = c => c === "entreprise" ? "Entreprise" : c === "ecole" ? "École" : "Perso";
  const tagClass = c => c === "ecole" ? "tag tag--alt" : "tag";

  /* ── INDEX : carrousel ── */
  if (featuredTrack) {
    const featured = projects.slice(0, 8);
    if (!featured.length) { showError(featuredTrack, "Aucun projet."); return; }

    featuredTrack.innerHTML = featured.map(p => `
      <a class="feature-card" href="pages/projets.html">
        <div class="feature-top">
          <h3 class="h3">${p.title}</h3>
          <span class="${tagClass(p.category)}">${catLabel(p.category)}</span>
        </div>
        <p class="muted">${p.summary}</p>
        <div class="feature-bottom">
          <span>${p.stack}</span>
          <span>${(p.date||"").slice(0,4)}</span>
        </div>
      </a>
    `).join("");

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let raf = null;
      const tick = () => {
        featuredTrack.scrollLeft += 0.35;
        if (featuredTrack.scrollLeft >= featuredTrack.scrollWidth - featuredTrack.clientWidth)
          featuredTrack.scrollLeft = 0;
        raf = requestAnimationFrame(tick);
      };
      const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
      const stop  = () => { if (raf)  cancelAnimationFrame(raf); raf = null; };
      featuredTrack.addEventListener("mouseenter", stop);
      featuredTrack.addEventListener("mouseleave", start);
      start();
    }
  }

  /* ── PAGE PROJETS : grille avec expansion ── */
  if (!projectsGrid) return;

  let expandedId = null; // id du projet actuellement ouvert

  function buildCard(p) {
    const isOpen = expandedId === p.id;

    // Mini-cases procédures liées
    const procs = (p.procedures || []).map(proc => `
      <a class="proc-chip" href="ressources.html" title="Voir la procédure : ${proc.titre}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${proc.titre}
      </a>
    `).join("");

    const procsSection = p.procedures && p.procedures.length ? `
      <div class="proj-procs">
        <span class="proj-procs__label">Procédures liées</span>
        <div class="proj-procs__list">${procs}</div>
      </div>
    ` : "";

    return `
      <article class="project-card ${isOpen ? 'is-expanded' : ''}" data-id="${p.id}" tabindex="0" role="button" aria-expanded="${isOpen}">
        <!-- En-tête toujours visible -->
        <div class="proj-header">
          <div class="proj-header__left">
            <span class="${tagClass(p.category)}">${catLabel(p.category)}</span>
            <h3 class="proj-title">${p.title}</h3>
            <p class="proj-summary muted">${p.summary}</p>
          </div>
          <div class="proj-header__right">
            <span class="proj-stack muted">${p.stack}</span>
            <span class="proj-year muted">${(p.date||"").slice(0,4)}</span>
          </div>
          <div class="proj-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        <!-- Contenu étendu (caché par défaut) -->
        <div class="proj-body" aria-hidden="${!isOpen}">
          <div class="proj-body__inner">
            <div class="proj-section">
              <h4 class="proj-section__title">Contexte</h4>
              <p>${p.context || "—"}</p>
            </div>
            <div class="proj-section">
              <h4 class="proj-section__title">Objectifs</h4>
              <p>${p.objectifs || "—"}</p>
            </div>
            <div class="proj-section">
              <h4 class="proj-section__title">Étapes réalisées</h4>
              <p>${p.etapes || "—"}</p>
            </div>
            <div class="proj-section">
              <h4 class="proj-section__title">Difficultés rencontrées</h4>
              <p>${p.difficultes || "—"}</p>
            </div>
            <div class="proj-section">
              <h4 class="proj-section__title">Résultat</h4>
              <p>${p.resultat || "—"}</p>
            </div>
            ${procsSection}
          </div>
        </div>
      </article>
    `;
  }

  function render(filter) {
    const list = filter === "all" ? projects : projects.filter(p => p.category === filter);
    if (!list.length) {
      projectsGrid.innerHTML = `<p style="padding:14px;color:#AAB6D3;">Aucun projet pour ce filtre.</p>`;
      return;
    }
    projectsGrid.innerHTML = list.map(buildCard).join("");

    // Attacher les listeners de clic
    projectsGrid.querySelectorAll(".project-card").forEach(card => {
      card.addEventListener("click", e => {
        // Ne pas toggle si on clique sur un lien procédure
        if (e.target.closest(".proc-chip")) return;
        const id = card.dataset.id;
        expandedId = (expandedId === id) ? null : id;
        render(filter);
        // Scroll doux vers la carte ouverte
        if (expandedId === id) {
          setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
        }
      });
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); }
      });
    });
  }

  let activeFilter = "all";
  render(activeFilter);

  document.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      expandedId = null;
      activeFilter = btn.dataset.filter;
      render(activeFilter);
    });
  });

})();
