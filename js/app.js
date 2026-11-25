/* ==========================================================================
   ASHOS TV — INTERATIVIDADE & CINEMA PRISM CANVAS
   ========================================================================== */
(() => {
  "use strict";

  const ACCESS_CODE = "ASH7X4";

  const SCREENS = [
    {
      src: "assets/screens/inicio.png",
      badge: "TELA REAL 01 / 07",
      title: "Início & Destaques Cinematográficos",
      desc: "Abertura instantânea com destaques duplos em 16:9, cápsula superior Liquid Glass e acesso direto ao que você estava assistindo.",
      glow: "radial-gradient(circle, rgba(56,189,248,0.55) 0%, rgba(168,85,247,0.3) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/filmes-grade.png",
      badge: "TELA REAL 02 / 07",
      title: "Filmes · Catálogo Completo & Gêneros",
      desc: "Descendo na aba Filmes: grade completa de pôsteres em alta resolução, filtros por gênero e tags de dublagem PT-BR.",
      glow: "radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(56,189,248,0.28) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/filmes.png",
      badge: "TELA REAL 03 / 07",
      title: "Filmes · Estreias & Em Alta",
      desc: "Destaques duplos no topo da aba Filmes com acesso em 1 toque e fileira Em alta logo abaixo.",
      glow: "radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(56,189,248,0.28) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/series.png",
      badge: "TELA REAL 04 / 07",
      title: "Séries · Temporadas & Em Alta",
      desc: "Destaques de séries (The Rings of Power, The Body, MobLand e mais) com pula abertura e contagem automática.",
      glow: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(96,165,250,0.28) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/desenhos.png",
      badge: "TELA REAL 05 / 07",
      title: "Animes & Desenhos",
      desc: "Aba dedicada com filtro rápido para Desenhos e Animes — trazendo One Piece, Attack on Titan, Black Clover e muito mais em PT-BR.",
      glow: "radial-gradient(circle, rgba(52,211,153,0.48) 0%, rgba(56,189,248,0.28) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/fileiras.png",
      badge: "TELA REAL 06 / 07",
      title: "Início · Novos Episódios & Lembretes",
      desc: "Descendo na tela inicial: avisos de novos episódios das suas séries e alertas do que acabou de chegar.",
      glow: "radial-gradient(circle, rgba(96,165,250,0.5) 0%, rgba(56,189,248,0.28) 55%, transparent 80%)"
    },
    {
      src: "assets/screens/detalhes.png",
      badge: "TELA REAL 07 / 07",
      title: "Detalhes, Sinopse Traduzida & 4K",
      desc: "Sinopse traduzida para português do Brasil, nota IMDb, elenco, episódios e áudio dublado priorizado em 1 clique.",
      glow: "radial-gradient(circle, rgba(129,140,248,0.48) 0%, rgba(99,102,241,0.32) 55%, transparent 80%)"
    }
  ];

  const REL = "https://github.com/zackdartdev/ashos-tv/releases/download/v2.0.1";

  const DOWNLOADS = {
    android: {
      badge: "● Versão 2.0.1",
      size: "APK Universal · 50,7 MB",
      title: "AshOS TV para Celular & Tablet Android",
      desc: "Baixe direto no celular ou aponte a câmera para o QR Code ao lado. Compatível com qualquer celular ou tablet Android.",
      mainUrl: `${REL}/AshOS-TV-Android.apk`,
      mainLabel: "Baixar AshOS TV Android (.apk)",
      variants: [
        { label: "ARM64 Leve (27,5 MB)", url: `${REL}/AshOS-TV-2.0.1-ARM64.apk` }
      ],
      steps: [
        "Aponte a câmera do celular para o QR Code ou toque em <strong>Baixar AshOS TV Android</strong>.",
        "Abra o arquivo <code>AshOS-TV-Android.apk</code> e permita <strong>Instalar apps desconhecidos</strong>.",
        `Abra o AshOS TV, entre usando o código <strong class="mono">${ACCESS_CODE}</strong> e aproveite.`
      ],
      qr: "assets/qr/qr-android.svg",
      qrTitle: "Aponte a câmera do celular",
      qrSub: "Baixa o instalador oficial do Android direto no telefone.",
      showQrSwitch: true
    },
    firestick: {
      badge: "● Versão 2.0.1",
      size: "APK 32 bits Leve · 28,0 MB",
      title: "AshOS TV para Amazon Fire TV Stick",
      desc: "Compilação leve 32-bit feita sob medida para rodar a 60 fps no Fire Stick sem travar nem ocupar espaço.",
      mainUrl: `${REL}/AshOS-TV-2.0.1-FireStick.apk`,
      mainLabel: "Baixar versão Fire Stick (.apk)",
      variants: [
        { label: "Universal (50,7 MB)", url: `${REL}/AshOS-TV-Android.apk` }
      ],
      steps: [
        "Na loja da Amazon no Fire Stick, instale o app gratuito <strong>Downloader</strong>.",
        "Vá em <em>Configurações › Minha Fire TV › Opções do desenvolvedor</em> e permita instalar apps pelo Downloader.",
        `Escaneie o QR Code ao lado ou baixe pelo navegador e entre com o código <strong class="mono">${ACCESS_CODE}</strong>.`
      ],
      qr: "assets/qr/qr-firestick.svg",
      qrTitle: "QR Code · Fire TV Stick (32-bit)",
      qrSub: "Link direto da versão leve 32 bits para Fire Stick.",
      showQrSwitch: false
    },
    androidtv: {
      badge: "● Versão 2.0.1",
      size: "APK TV Universal · 50,7 MB",
      title: "AshOS TV para Android TV & Google TV",
      desc: "Interface feita para o controle remoto com destaques em tela cheia, troca rápida de canais e áudio dublado no topo.",
      mainUrl: `${REL}/AshOS-TV-Android.apk`,
      mainLabel: "Baixar para Android TV (.apk)",
      variants: [
        { label: "32-bit TV Leve (28,0 MB)", url: `${REL}/AshOS-TV-2.0.1-FireStick.apk` }
      ],
      steps: [
        "Na Play Store da sua TV, instale o app <strong>Downloader</strong> ou gerenciador de arquivos.",
        "Baixe o APK pelo botão ao lado ou envie do celular para a TV usando o QR Code.",
        `Abra o AshOS TV e entre com o código <strong class="mono">${ACCESS_CODE}</strong>.`
      ],
      qr: "assets/qr/qr-android.svg",
      qrTitle: "QR Code · Android TV",
      qrSub: "Escaneie no celular para baixar e enviar para sua TV.",
      showQrSwitch: false
    },
    windows: {
      badge: "● Versão 2.1.2",
      size: "Instalador Windows · 7 ao 11",
      title: "AshOS TV para Windows (7 ao 11)",
      desc: "App nativo com janela cinema dedicada. Roda liso no Windows 11, 10, 8 e até em PCs antigos com Windows 7 (32 e 64 bits).",
      mainUrl: `${REL}/Instalar-AshOS-TV-2.1.2.exe`,
      mainLabel: "Baixar Instalador Windows (.exe)",
      variants: [
        { label: "Portátil x64 (.zip)", url: `${REL}/AshOS-TV-2.1.2-Win64.zip` },
        { label: "Portátil Win7 32-bit (.zip)", url: `${REL}/AshOS-TV-2.1.2-Win7-x86.zip` }
      ],
      steps: [
        "Baixe e execute o arquivo <code>Instalar-AshOS-TV-2.1.2.exe</code> (ou extraia a versão Portátil).",
        "O aplicativo abre automaticamente em janela dedicada sem barras de navegador.",
        `Digite o código <strong class="mono">${ACCESS_CODE}</strong> e comece a assistir.`
      ],
      qr: "assets/qr/qr-site.svg",
      qrTitle: "Abrir esta página no celular",
      qrSub: "Compartilhe o link oficial do AshOS TV com quem você quiser.",
      showQrSwitch: false
    },
    iphone: {
      badge: "● Versão 2.0.1",
      size: "Perfil iOS WebClip + WebApp",
      title: "AshOS TV para iPhone (iOS)",
      desc: "Visual Liquid Glass nativo, Picture-in-Picture (PiP) e instalação direta na Tela de Início do iPhone.",
      mainUrl: `${REL}/AshOS-TV-2.0.1-iPhone.mobileconfig`,
      mainLabel: "Baixar Perfil AshOS iPhone",
      variants: [
        { label: "Abrir Direto no Safari", url: "app/index.html" }
      ],
      steps: [
        "Baixe o perfil <code>AshOS-TV-2.0.1-iPhone.mobileconfig</code> ou toque em <strong>Abrir Direto no Safari</strong>.",
        "No Safari, você também pode tocar em <em>Compartilhar › Adicionar à Tela de Início</em>.",
        `Abra o AshOS TV no iPhone e entre com o código <strong class="mono">${ACCESS_CODE}</strong>.`
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
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
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
      showToast(`Código ${code} copiado! Use ao abrir o AshOS TV.`);
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
  const heroAmbilight = document.getElementById("heroAmbilight");
  document.querySelectorAll("[data-hero-screen]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-hero-screen]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      if (heroPreviewImg) heroPreviewImg.src = btn.dataset.heroScreen;
      if (heroAmbilight) heroAmbilight.dataset.color = btn.dataset.ambilight || "amber";
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
      showcaseImg.alt = `${item.title} — print real da interface do AshOS TV`;
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
        if (ytStep2Title) ytStep2Title.textContent = "Selecione seu Perfil no topo da TV";
        if (ytStep2Desc) ytStep2Desc.textContent = "No Fire Stick ou Android TV, use o controle remoto até o ícone do seu Perfil no canto superior direito.";
        if (miniUiTrigger) miniUiTrigger.textContent = "Topo › Perfil (A)";
      } else {
        if (ytStep2Title) ytStep2Title.textContent = "Toque nos três pontinhos (•••)";
        if (ytStep2Desc) ytStep2Desc.textContent = "No celular Android e no iPhone, eles ficam lá no topo, bem ao lado da lupa de busca.";
        if (miniUiTrigger) miniUiTrigger.textContent = "••• Perfil";
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
      angle += 0.0025;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const g1 = ctx.createLinearGradient(-r, -r, r, r);
      g1.addColorStop(0, "rgba(56, 189, 248, 0.22)");
      g1.addColorStop(0.5, "rgba(168, 85, 247, 0.08)");
      g1.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.strokeStyle = g1;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 1.45);
      ctx.stroke();
      ctx.rotate(-angle * 2.1);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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
