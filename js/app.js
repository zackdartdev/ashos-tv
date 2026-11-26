/* ==========================================================================
   PULSETV v3.0 — INTERATIVIDADE DO SITE OFICIAL & PRISM CANVAS
   ========================================================================== */
(() => {
  "use strict";

  const ACCESS_CODE = "PLS9K4";

  const SCREENS = [
    {
      src: "assets/screens/inicio.png",
      badge: "TELA REAL 01 / 07",
      title: "Início & Destaques Cinematográficos",
      desc: "Sidebar espacial em vidro líquido, busca com equalizador animado, destaque 4K e fileira Continuar Assistindo com barra vermelha.",
      glow: "radial-gradient(circle, rgba(229,9,20,0.52) 0%, rgba(255,255,255,0.14) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/filmes-grade.png",
      badge: "TELA REAL 02 / 07",
      title: "Filmes · Catálogo Expandido & Filtros",
      desc: "Centenas de filmes com filtros de gênero, selos 4K/PT-BR e paginação incremental instantânea sem voltar ao topo.",
      glow: "radial-gradient(circle, rgba(255,36,56,0.5) 0%, rgba(229,9,20,0.2) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/perfis-netflix.png",
      badge: "TELA REAL 03 / 07",
      title: "Quem está assistindo? · Perfis Estilo Netflix",
      desc: "Até 6 perfis individuais com avatares ilustrados, gerenciador integrado, proteção por PIN e Modo Infantil seguro.",
      glow: "radial-gradient(circle, rgba(229,9,20,0.52) 0%, rgba(185,28,28,0.25) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/series.png",
      badge: "TELA REAL 04 / 07",
      title: "Séries · Temporadas & Em Alta",
      desc: "The Witcher, Peaky Blinders, Round 6, Ruptura e centenas de séries com botão Pular Abertura no player.",
      glow: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(229,9,20,0.34) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/desenhos.png",
      badge: "TELA REAL 05 / 07",
      title: "Animes Dublados PT-BR & Kids",
      desc: "One Piece, Solo Leveling, Dan Da Dan, Attack on Titan e animações com áudio dublado em português em 1º lugar.",
      glow: "radial-gradient(circle, rgba(255,36,56,0.48) 0%, rgba(251,146,60,0.22) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/login-auth.png",
      badge: "TELA REAL 06 / 07",
      title: "Tela de Login Protegida (Código PLS9K4)",
      desc: "Autenticação exclusiva validada por hash SHA-256 para garantir acesso somente com o código autorizado.",
      glow: "radial-gradient(circle, rgba(229,9,20,0.55) 0%, rgba(255,255,255,0.12) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/detalhes.png",
      badge: "TELA REAL 07 / 07",
      title: "Detalhes 4K, Sinopse PT-BR & Fast-Path",
      desc: "Sinopse traduzida, elenco, pré-carregamento silencioso das fontes e reprodução imediata em 1 clique.",
      glow: "radial-gradient(circle, rgba(229,9,20,0.48) 0%, rgba(255,255,255,0.16) 55%, transparent 80%)"
    }
  ];

  const REL = "https://github.com/zackdartdev/pulsetv/releases/download/v3.0.0";

  const DOWNLOADS = {
    android: {
      badge: "● Versão 3.0.0",
      size: "APK Universal · Mobile & TV",
      title: "PulseTV para Celular & Tablet Android",
      desc: "Baixe direto no celular ou aponte a câmera para o QR Code ao lado. Layout mobile 100% adaptado sem vazamentos.",
      mainUrl: `${REL}/PulseTV-Android.apk`,
      mainLabel: "Baixar PulseTV Android (.apk)",
      variants: [
        { label: "ARM64 Leve (64-bit)", url: `${REL}/PulseTV-3.0.0-ARM64.apk` }
      ],
      steps: [
        "Aponte a câmera do celular para o QR Code ou toque em <strong>Baixar PulseTV Android</strong>.",
        "Abra o arquivo <code>PulseTV-Android.apk</code> e permita <strong>Instalar apps desconhecidos</strong>.",
        `Abra o PulseTV, faça login com o código <strong class="mono">${ACCESS_CODE}</strong> e escolha seu perfil.`
      ],
      qr: "assets/qr/qr-android.svg",
      qrTitle: "Aponte a câmera do celular",
      qrSub: "Baixa o instalador oficial v3.0.0 direto no telefone.",
      showQrSwitch: true
    },
    firestick: {
      badge: "● Versão 3.0.0",
      size: "APK 32 bits Leve · Fire OS",
      title: "PulseTV para Amazon Fire TV Stick",
      desc: "Compilação leve 32-bit feita sob medida para rodar a 60 fps no Fire Stick com motor Fast-Path sem delay.",
      mainUrl: `${REL}/PulseTV-3.0.0-FireStick.apk`,
      mainLabel: "Baixar versão Fire Stick (.apk)",
      variants: [
        { label: "Universal (.apk)", url: `${REL}/PulseTV-Android.apk` }
      ],
      steps: [
        "Na loja da Amazon no Fire Stick, instale o app gratuito <strong>Downloader</strong>.",
        "Ative a permissão de instalar apps pelo Downloader nas opções de desenvolvedor.",
        `Escaneie o QR Code ao lado e faça login com o código <strong class="mono">${ACCESS_CODE}</strong>.`
      ],
      qr: "assets/qr/qr-firestick.svg",
      qrTitle: "QR Code · Fire TV Stick (32-bit)",
      qrSub: "Link direto da versão leve 32 bits para Fire Stick.",
      showQrSwitch: false
    },
    androidtv: {
      badge: "● Versão 3.0.0",
      size: "APK TV Universal · Leanback",
      title: "PulseTV para Android TV & Google TV",
      desc: "Sidebar espacial feita para o controle remoto com foco O(1) instantâneo, banner nativo na Home da TV e 4K PT-BR.",
      mainUrl: `${REL}/PulseTV-Android.apk`,
      mainLabel: "Baixar para Android TV (.apk)",
      variants: [
        { label: "32-bit TV Leve", url: `${REL}/PulseTV-3.0.0-FireStick.apk` }
      ],
      steps: [
        "Na Play Store da sua TV, instale o app <strong>Downloader</strong> ou Send Files to TV.",
        "Baixe o APK pelo botão ao lado ou escaneie o QR Code.",
        `Abra o PulseTV e entre com o código <strong class="mono">${ACCESS_CODE}</strong>.`
      ],
      qr: "assets/qr/qr-android.svg",
      qrTitle: "QR Code · Android TV",
      qrSub: "Escaneie no celular para baixar e enviar para sua TV.",
      showQrSwitch: false
    },
    windows: {
      badge: "● Versão 3.0.0",
      size: "Instalador Windows · 7 ao 11",
      title: "PulseTV para Windows (7 ao 11)",
      desc: "Aplicativo nativo com janela cinema dedicada sem barras de navegador, compatível do Windows 7 ao Windows 11.",
      mainUrl: `${REL}/Instalar-PulseTV-3.0.0.exe`,
      mainLabel: "Baixar Instalador Windows (.exe)",
      variants: [
        { label: "Portátil x64 (.zip)", url: `${REL}/PulseTV-3.0.0-Win64.zip` },
        { label: "Portátil Win7 32-bit (.zip)", url: `${REL}/PulseTV-3.0.0-Win7-x86.zip` }
      ],
      steps: [
        "Baixe e execute <code>Instalar-PulseTV-3.0.0.exe</code> (ou extraia a versão Portátil).",
        "O aplicativo abre automaticamente em janela dedicada.",
        `Digite o código exclusivo <strong class="mono">${ACCESS_CODE}</strong> e escolha seu perfil.`
      ],
      qr: "assets/qr/qr-site.svg",
      qrTitle: "Abrir site oficial no celular",
      qrSub: "Compartilhe o link oficial do PulseTV.",
      showQrSwitch: false
    },
    iphone: {
      badge: "● Versão 3.0.0",
      size: "Perfil iOS WebClip + WebApp",
      title: "PulseTV para iPhone (iOS)",
      desc: "Visual Spatial Glass para iPhone, barra inferior otimizada e instalação direta na Tela de Início.",
      mainUrl: `${REL}/PulseTV-3.0.0-iPhone.mobileconfig`,
      mainLabel: "Baixar Perfil PulseTV iPhone",
      variants: [
        { label: "Abrir Direto no Safari", url: "app/index.html" }
      ],
      steps: [
        "Baixe o perfil <code>PulseTV-3.0.0-iPhone.mobileconfig</code> ou toque em <strong>Abrir Direto no Safari</strong>.",
        "No Safari, você também pode tocar em <em>Compartilhar › Adicionar à Tela de Início</em>.",
        `Entre com o código <strong class="mono">${ACCESS_CODE}</strong> e aproveite.`
      ],
      qr: "assets/qr/qr-site.svg",
      qrTitle: "Abrir no iPhone",
      qrSub: "Escaneie com a câmera do iPhone para abrir na hora.",
      showQrSwitch: false
    }
  };

  const toastEl = document.getElementById("toast");
  const toastText = document.getElementById("toastText");
  let toastTimer = null;

  function showToast(msg) {
    if (!toastEl || !toastText) return;
    toastText.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2800);
  }

  document.querySelectorAll(".copy-code-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.dataset.code || ACCESS_CODE;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(code);
        }
      } catch (_) {}
      const label = btn.querySelector(".copy-label");
      if (label) {
        const prev = label.textContent;
        label.textContent = "Copiado ✓";
        setTimeout(() => { label.textContent = prev; }, 2000);
      }
      showToast(`Código ${code} copiado! Use no login do PulseTV.`);
    });
  });

  document.querySelectorAll(".copy-pix-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pix = btn.dataset.pix || "";
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(pix);
        }
      } catch (_) {}
      const prev = btn.textContent;
      btn.textContent = "Copiado ✓";
      setTimeout(() => { btn.textContent = prev; }, 2200);
      showToast(btn.dataset.toast || "Chave Pix Nubank copiada!");
    });
  });

  const menuToggle = document.getElementById("menuToggle");
  const mobileDrawer = document.getElementById("mobileDrawer");
  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener("click", () => {
      const open = !mobileDrawer.hidden;
      mobileDrawer.hidden = open;
      menuToggle.setAttribute("aria-expanded", String(!open));
    });
    mobileDrawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileDrawer.hidden = true;
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const heroPreviewImg = document.getElementById("heroPreviewImg");
  document.querySelectorAll("[data-hero-screen]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-hero-screen]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      if (heroPreviewImg) heroPreviewImg.src = btn.dataset.heroScreen;
    });
  });

  let currentScreen = 0;
  const showcaseImg = document.getElementById("showcaseImg");
  const showcaseBadge = document.getElementById("showcaseBadge");
  const showcaseTitle = document.getElementById("showcaseTitle");
  const showcaseDesc = document.getElementById("showcaseDesc");
  const showcaseAmbilight = document.getElementById("showcaseAmbilight");
  const showcaseTabs = document.querySelectorAll(".showcase-tab");
  const mosaicCards = document.querySelectorAll("[data-mosaic-index]");

  function setScreen(index) {
    const idx = ((index % SCREENS.length) + SCREENS.length) % SCREENS.length;
    currentScreen = idx;
    const item = SCREENS[idx];
    if (showcaseImg) {
      showcaseImg.src = item.src;
      showcaseImg.alt = `${item.title} — print real da interface do PulseTV`;
    }
    if (showcaseBadge) showcaseBadge.textContent = item.badge;
    if (showcaseTitle) showcaseTitle.textContent = item.title;
    if (showcaseDesc) showcaseDesc.textContent = item.desc;
    if (showcaseAmbilight) showcaseAmbilight.style.background = item.glow;

    showcaseTabs.forEach((t, i) => {
      const active = i === idx;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
  }

  showcaseTabs.forEach((tab) => {
    tab.addEventListener("click", () => setScreen(Number(tab.dataset.index || 0)));
  });

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const openLightboxBtn = document.getElementById("openLightboxBtn");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  function updateLightbox() {
    const item = SCREENS[currentScreen];
    if (lightboxImg) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.title;
    }
    if (lightboxCaption) lightboxCaption.textContent = `${item.title} — ${item.desc}`;
  }

  function openLightbox() {
    if (!lightbox) return;
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  if (openLightboxBtn) openLightboxBtn.addEventListener("click", openLightbox);
  if (showcaseImg) showcaseImg.addEventListener("click", openLightbox);
  mosaicCards.forEach((card) => {
    card.addEventListener("click", () => {
      setScreen(Number(card.dataset.mosaicIndex || 0));
      openLightbox();
    });
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", () => { setScreen(currentScreen - 1); updateLightbox(); });
  if (lightboxNext) lightboxNext.addEventListener("click", () => { setScreen(currentScreen + 1); updateLightbox(); });
  if (lightbox) lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") { setScreen(currentScreen - 1); updateLightbox(); }
    if (e.key === "ArrowRight") { setScreen(currentScreen + 1); updateLightbox(); }
  });

  const ytStep2Title = document.getElementById("ytStep2Title");
  const ytStep2Desc = document.getElementById("ytStep2Desc");
  const miniUiTrigger = document.getElementById("miniUiTrigger");
  document.querySelectorAll("[data-yt-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.ytMode;
      document.querySelectorAll("[data-yt-mode]").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      if (mode === "tv") {
        if (ytStep2Title) ytStep2Title.textContent = "Acesse a Sidebar Esquerda na TV";
        if (ytStep2Desc) ytStep2Desc.textContent = "No Fire Stick ou Android TV, use a seta esquerda do controle remoto e selecione YouTube.";
        if (miniUiTrigger) miniUiTrigger.textContent = "Sidebar › YouTube";
      } else {
        if (ytStep2Title) ytStep2Title.textContent = "Toque em Menu na barra inferior";
        if (ytStep2Desc) ytStep2Desc.textContent = "No celular Android e no iPhone, toque em Menu na barra inferior e escolha YouTube.";
        if (miniUiTrigger) miniUiTrigger.textContent = "Menu › Central";
      }
    });
  });

  const dlBadge = document.getElementById("dlBadge");
  const dlSize = document.getElementById("dlSize");
  const dlTitle = document.getElementById("dlTitle");
  const dlDesc = document.getElementById("dlDesc");
  const dlMainBtn = document.getElementById("dlMainBtn");
  const dlMainBtnLabel = document.getElementById("dlMainBtnLabel");
  const dlVariants = document.getElementById("dlVariants");
  const dlSteps = document.getElementById("dlSteps");
  const dlQrImg = document.getElementById("dlQrImg");
  const dlQrTitle = document.getElementById("dlQrTitle");
  const dlQrSub = document.getElementById("dlQrSub");
  const qrSwitch = document.getElementById("qrSwitch");

  function selectPlatform(key) {
    const data = DOWNLOADS[key];
    if (!data) return;
    document.querySelectorAll(".dl-tab").forEach((t) => {
      const active = t.dataset.platform === key;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    if (dlBadge) dlBadge.textContent = data.badge;
    if (dlSize) dlSize.textContent = data.size;
    if (dlTitle) dlTitle.textContent = data.title;
    if (dlDesc) dlDesc.textContent = data.desc;
    if (dlMainBtn) dlMainBtn.href = data.mainUrl;
    if (dlMainBtnLabel) dlMainBtnLabel.textContent = data.mainLabel;

    if (dlVariants) {
      dlVariants.innerHTML = "";
      data.variants.forEach((v) => {
        const a = document.createElement("a");
        a.className = "variant-link";
        a.href = v.url;
        a.textContent = `↓ ${v.label}`;
        dlVariants.appendChild(a);
      });
    }
    if (dlSteps) dlSteps.innerHTML = data.steps.map((s) => `<li>${s}</li>`).join("");
    if (dlQrImg) dlQrImg.src = data.qr;
    if (dlQrTitle) dlQrTitle.textContent = data.qrTitle;
    if (dlQrSub) dlQrSub.textContent = data.qrSub;
    if (qrSwitch) qrSwitch.style.display = data.showQrSwitch ? "flex" : "none";
  }

  document.querySelectorAll(".dl-tab").forEach((tab) => {
    tab.addEventListener("click", () => selectPlatform(tab.dataset.platform));
  });

  document.querySelectorAll(".qr-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".qr-pill").forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      if (dlQrImg) dlQrImg.src = pill.dataset.qr;
      if (dlQrTitle) dlQrTitle.textContent = pill.dataset.qrTitle;
      if (dlQrSub) dlQrSub.textContent = pill.dataset.qrSub;
    });
  });

  document.querySelectorAll(".spotlight-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  document.querySelectorAll(".faq-item").forEach((item) => {
    const btn = item.querySelector(".faq-q");
    const ans = item.querySelector(".faq-a");
    if (!btn || !ans) return;
    btn.addEventListener("click", () => {
      const willOpen = ans.hidden;
      ans.hidden = !willOpen;
      item.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
    });
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  const canvas = document.getElementById("prismCanvas");
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, angle = 0;
    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize);
    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.72, cy = h * 0.24, r = Math.min(w, h) * 0.34;
      angle += 0.0024;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const g1 = ctx.createLinearGradient(-r, -r, r, r);
      g1.addColorStop(0, "rgba(229, 9, 20, 0.28)");
      g1.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
      g1.addColorStop(1, "rgba(229, 9, 20, 0)");
      ctx.strokeStyle = g1;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 1.45);
      ctx.stroke();
      ctx.rotate(-angle * 2.1);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0.4, Math.PI * 1.6);
      ctx.stroke();
      ctx.restore();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
