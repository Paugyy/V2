(async function () {
  const featuredTrack = document.getElementById("featuredTrack");
  const projectsGrid = document.getElementById("projectsGrid");

  // Petit helper pour afficher une erreur dans la page
  function showError(target, msg) {
    if (!target) return;
    target.innerHTML = `<p style="padding:14px;color:#AAB6D3;">${msg}</p>`;
  }

  // Construit une URL absolue fiable (fonctionne sur GitHub Pages /Web01/)
  // Exemple: base = https://paugyy.github.io/Web01/pages/projets.html
  // new URL("../data/projects.json", base) => https://paugyy.github.io/Web01/data/projects.json
  const base = document.baseURI;
  const jsonUrl = featuredTrack
    ? new URL("data/projects.json", base)          // sur index
    : new URL("../data/projects.json", base);      // sur pages/

  let projects = [];
  try {
    const res = await fetch(jsonUrl.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} sur ${jsonUrl}`);
    projects = await res.json();
    if (!Array.isArray(projects)) throw new Error("Le JSON doit être un tableau []");
  } catch (err) {
    console.error("Erreur chargement projets:", err);
    showError(featuredTrack, "Impossible de charger les projets (vérifie data/projects.json).");
    showError(projectsGrid, "Impossible de charger les projets (vérifie data/projects.json).");
    return;
  }

  // Tri du plus récent au plus ancien
  projects.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const catLabel = (c) => c === "entreprise" ? "Entreprise" : (c === "ecole" ? "École" : "Perso");
  const tagClass = (c) => (c === "ecole" ? "tag tag--alt" : "tag");

  // ===== Accueil : Projets à la une =====
  if (featuredTrack) {
    const featured = projects.slice(0, 8);
    if (featured.length === 0) {
      showError(featuredTrack, "Aucun projet dans data/projects.json.");
      return;
    }

    featuredTrack.innerHTML = featured.map(p => `
      <a class="feature-card" href="${p.url || "pages/projets.html"}">
        <div class="feature-top">
          <h3 class="h3">${p.title || "Projet"}</h3>
          <span class="${tagClass(p.category)}">${catLabel(p.category)}</span>
        </div>
        <p class="muted">${p.summary || ""}</p>
        <div class="feature-bottom">
          <span>${p.stack || ""}</span>
          <span>${(p.date || "").slice(0,4)}</span>
        </div>
      </a>
    `).join("");

    // Défilement auto (pause hover)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      let raf = null;
      const speed = 0.35;

      const tick = () => {
        featuredTrack.scrollLeft += speed;
        const max = featuredTrack.scrollWidth - featuredTrack.clientWidth;
        if (featuredTrack.scrollLeft >= max) featuredTrack.scrollLeft = 0;
        raf = requestAnimationFrame(tick);
      };

      const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
      const stop  = () => { if (raf) cancelAnimationFrame(raf); raf = null; };

      featuredTrack.addEventListener("mouseenter", stop);
      featuredTrack.addEventListener("mouseleave", start);
      featuredTrack.addEventListener("focusin", stop);
      featuredTrack.addEventListener("focusout", start);

      start();
    }
  }

  // ===== Page projets : grille =====
  if (projectsGrid) {
    const render = (filter) => {
      const list = filter === "all" ? projects : projects.filter(p => p.category === filter);

      if (list.length === 0) {
        projectsGrid.innerHTML = `<p style="padding:14px;color:#AAB6D3;">Aucun projet pour ce filtre.</p>`;
        return;
      }

      projectsGrid.innerHTML = list.map(p => `
        <a class="project-card" href="${p.url || "projets.html"}">
          <div class="project-top">
            <h3 class="h3">${p.title || "Projet"}</h3>
            <span class="${tagClass(p.category)}">${catLabel(p.category)}</span>
          </div>
          <p class="muted">${p.summary || ""}</p>
          <div class="project-bottom">
            <span>${p.stack || ""}</span>
            <span>${(p.date || "").slice(0,4)}</span>
          </div>
        </a>
      `).join("");
    };

    render("all");

    document.querySelectorAll(".chip").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".chip").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        render(btn.dataset.filter);
      });
    });
  }
})();