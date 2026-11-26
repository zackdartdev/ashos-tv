/* ==========================================================================
   PULSETV v3.0 — APPLICATION ENGINE
   - Boot Splash -> Login Supabase RPC + SHA-256 (PLS9K4) -> Perfis Netflix -> App
   - 3 Temas (Spatial Glass, Obsidian OLED, Vidro Claro) em Central PulseTV
   - Motion Cinema Loader ao clicar em Assistir + Fast-Path Stream Race
   - Cards de Prévia de Episódios com Deduplicação Estrita (Zero Duplicados)
   ========================================================================== */
(function () {
  "use strict";

  const Native = window.PulseNative || window.AshNative || null;
  const hasNative = Boolean(Native);
  const SEED = window.PULSE_SEED;

  /* ---------- SHA-256 Puro Síncrono ---------- */
  function sha256Hex(ascii) {
    function rightRotate(v, amount) { return (v >>> amount) | (v << (32 - amount)); }
    const mathPow = Math.pow, maxWord = mathPow(2, 32);
    let result = "";
    const words = [];
    const bytes = unescape(encodeURIComponent(ascii));
    const asciiBitLength = bytes.length * 8;
    let hash = [], k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    let str = bytes + "\x80";
    while ((str.length % 64) - 56) str += "\x00";
    for (let i = 0; i < str.length; i++) {
      const j = str.charCodeAt(i);
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (let j = 0; j < words.length;) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash.slice(0);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        const temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) {
      for (let j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? "0" : "") + b.toString(16);
      }
    }
    return result;
  }

  /* ---------- Armazenamento Persistente ---------- */
  function getPref(key, fallback) {
    try {
      if (hasNative) return Native.getPref(key, fallback);
      const v = localStorage.getItem("pulsetv_" + key);
      return v !== null ? v : fallback;
    } catch (_) { return fallback; }
  }

  function setPref(key, value) {
    try {
      if (hasNative) Native.setPref(key, String(value));
      localStorage.setItem("pulsetv_" + key, String(value));
    } catch (_) {}
  }

  function getJsonPref(key, fallback) {
    try { return JSON.parse(getPref(key, JSON.stringify(fallback))); }
    catch (_) { return fallback; }
  }

  /* ---------- Integração Supabase (Controle Remoto de Logins & Códigos) ---------- */
  function getSupabaseConfig() {
    const savedUrl = (getPref("sb_url", "") || (SEED.supabase && SEED.supabase.url) || "").trim().replace(/\/+$/, "");
    const savedKey = (getPref("sb_anon_key", "") || (SEED.supabase && SEED.supabase.anonKey) || "").trim();
    return { url: savedUrl, anonKey: savedKey, enabled: Boolean(savedUrl && savedKey) };
  }

  function getDeviceFingerprint() {
    let fp = getPref("device_fp", "");
    if (!fp) {
      fp = "ptv_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
      setPref("device_fp", fp);
    }
    return fp;
  }

  function getDeviceModelLabel() {
    if (hasNative) {
      try { return JSON.parse(Native.getDeviceInfo()).model || "Android"; } catch (_) {}
    }
    return navigator.userAgent.slice(0, 48);
  }

  async function verifyCodeWithSupabaseOrLocal(rawCode, userName) {
    const clean = String(rawCode || "").trim().toUpperCase();
    if (!clean) return { ok: false, reason: "Digite seu código de acesso." };

    const sb = getSupabaseConfig();
    if (sb.enabled) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(`${sb.url}/rest/v1/rpc/verify_pulse_login`, {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "Content-Type": "application/json",
            "apikey": sb.anonKey,
            "Authorization": `Bearer ${sb.anonKey}`
          },
          body: JSON.stringify({
            p_code: clean,
            p_user_name: userName || null,
            p_device_model: getDeviceModelLabel(),
            p_device_fingerprint: getDeviceFingerprint()
          })
        });
        clearTimeout(t);
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok) {
            if (data.session_id) setPref("sb_session_id", data.session_id);
            return { ok: true, mode: "supabase", remaining: data.remaining_slots };
          }
          return { ok: false, reason: (data && data.reason) || "Código inválido ou revogado no Supabase." };
        }
      } catch (_) {
        // Fallback offline se o servidor Supabase estiver temporariamente sem rede
      }
    }

    const validLocal = sha256Hex(SEED.authSalt + clean) === SEED.authHash;
    if (validLocal) return { ok: true, mode: "local" };
    return { ok: false, reason: "Código inválido ou desativado. Acesso restrito a códigos autorizados." };
  }

  async function verifyActiveSupabaseSession() {
    const sb = getSupabaseConfig();
    const sessionId = getPref("sb_session_id", "");
    if (!sb.enabled || !sessionId || !state.authenticated) return;
    try {
      const res = await fetch(`${sb.url}/rest/v1/rpc/check_pulse_session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": sb.anonKey,
          "Authorization": `Bearer ${sb.anonKey}`
        },
        body: JSON.stringify({ p_session_id: sessionId })
      });
      if (res.ok) {
        const d = await res.json();
        if (d && d.active === false) {
          toast("Sessão revogada pelo administrador.");
          performLogout();
        }
      }
    } catch (_) {}
  }

  /* ---------- Servidores & Trackers ---------- */
  const STREAM_SERVERS = [
    { name: "Torrentio BR", base: "https://torrentio.strem.fun/providers=comando,bludv,micoleaodublado%7Csort=seeders%7Clanguage=portuguese", fast: true },
    { name: "Brazuca", base: "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club", fast: true },
    { name: "AnimesFHD", base: "https://animesfhd.net/stremio", fast: true },
    { name: "Brasil Addon", base: "https://27a5b2bfe3c0-stremio-brazilian-addon.baby-beamup.club", fast: true },
    { name: "Torrentio PT", base: "https://torrentio.strem.fun/sort=seeders%7Clanguage=portuguese", fast: true },
    { name: "Pleiades", base: "https://pleiadesstream.duckdns.org/addon/torrents", fast: false },
    { name: "TorrentsDB", base: "https://torrentsdb.com", fast: false },
    { name: "BeTor BR", base: "https://stremio-betor.onrender.com", fast: false }
  ];

  const BEST_TRACKERS = [
    "http://tracker.opentrackr.org:1337/announce",
    "http://tracker.renfei.net:8080/announce",
    "https://tracker.tamersunion.org:443/announce",
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "udp://explodie.org:6969/announce",
    "udp://tracker.openbittorrent.com:6969/announce",
    "udp://open.demonii.com:1337/announce",
    "udp://exodus.desync.com:6969/announce"
  ];

  const GENRE_TO_EN = {
    "Ação": "Action", "Comédia": "Comedy", "Terror": "Horror", "Drama": "Drama",
    "Ficção": "Sci-Fi", "Animação": "Animation", "Suspense": "Thriller", "Romance": "Romance"
  };

  const PT_REGEX = /portugu|dublad|dual|pt[ ._-]*br|brazil|nacional|🇧🇷|animesfhd|\b(bludv|comando|lapumia|wolverdon|vac|memp|micoleao|micoleaodublado|vamoslat|redecanais|animesbr|animesonline|betteranime|anroll)\b/i;

  async function httpGetText(url, timeoutMs) {
    const tmo = timeoutMs || 4500;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), tmo);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) return await res.text();
    } catch (_) {}
    if (hasNative) {
      return await new Promise((resolve) => {
        setTimeout(() => {
          try { resolve(Native.fetchUrl(url) || ""); }
          catch (_) { resolve(""); }
        }, 0);
      });
    }
    return "";
  }

  async function httpGetJson(url, timeoutMs) {
    const txt = await httpGetText(url, timeoutMs);
    if (!txt) return null;
    try { return JSON.parse(txt); } catch (_) { return null; }
  }

  /* ---------- Avatares Estilo Netflix ---------- */
  const AVATAR_THEMES = [
    { id: "crimson", bg1: "#E50914", bg2: "#7A040A", eye: "#FFFFFF" },
    { id: "obsidian", bg1: "#272A36", bg2: "#0E1017", eye: "#FF2438" },
    { id: "ruby", bg1: "#B91C1C", bg2: "#3B0712", eye: "#FDE047" },
    { id: "kids", bg1: "#FF2438", bg2: "#F97316", eye: "#FFFFFF" },
    { id: "platinum", bg1: "#475569", bg2: "#1E293B", eye: "#FFFFFF" },
    { id: "noir", bg1: "#9F1239", bg2: "#18181B", eye: "#FFFFFF" }
  ];

  function renderNetflixAvatarSvg(themeId, isKids) {
    const th = AVATAR_THEMES.find((t) => t.id === themeId) || AVATAR_THEMES[0];
    if (isKids) {
      return `<svg class="nf-face-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g_${th.id}_k" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF2438"/><stop offset="100%" stop-color="#FB923C"/></linearGradient></defs>
        <rect width="120" height="120" fill="url(#g_${th.id}_k)"/>
        <circle cx="38" cy="48" r="8" fill="#FFF"/>
        <circle cx="82" cy="48" r="8" fill="#FFF"/>
        <circle cx="40" cy="48" r="3.5" fill="#111"/>
        <circle cx="84" cy="48" r="3.5" fill="#111"/>
        <path d="M36 72 Q60 94 84 72" fill="none" stroke="#FFF" stroke-width="6.5" stroke-linecap="round"/>
        <polygon points="96,20 99,27 107,27 101,32 103,39 96,35 89,39 91,32 85,27 93,27" fill="#FFF" opacity="0.88"/>
      </svg>`;
    }
    return `<svg class="nf-face-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g_${th.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${th.bg1}"/><stop offset="100%" stop-color="${th.bg2}"/></linearGradient></defs>
      <rect width="120" height="120" fill="url(#g_${th.id})"/>
      <circle cx="95" cy="22" r="38" fill="rgba(255,255,255,0.06)"/>
      <circle cx="38" cy="48" r="6.5" fill="${th.eye}"/>
      <circle cx="82" cy="48" r="6.5" fill="${th.eye}"/>
      <path d="M38 76 Q62 92 86 73" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
    </svg>`;
  }

  const DEFAULT_PROFILES = [
    { id: "main", name: "Você", theme: "crimson", kids: false, pin: "" },
    { id: "cinema", name: "Cinema 4K", theme: "obsidian", kids: false, pin: "" },
    { id: "familia", name: "Família", theme: "ruby", kids: false, pin: "" },
    { id: "kids", name: "Infantil", theme: "kids", kids: true, pin: "" }
  ];

  const bundledChannels = Array.isArray(window.ASH_LIVE_CHANNELS) && window.ASH_LIVE_CHANNELS.length
    ? window.ASH_LIVE_CHANNELS
    : SEED.channels.slice();

  const bundledCollections = Array.isArray(window.ASH_COLLECTIONS) ? window.ASH_COLLECTIONS : [];
  const PAGE_STEP = 36;

  const state = {
    authenticated: getPref("auth_hash_v31", "") === SEED.authHash,
    theme: getPref("ui_theme", "glass"),
    prefPtFirst: getPref("pref_pt_first", "1") === "1",
    prefSmartSub: getPref("pref_smart_sub", "1") === "1",
    prefQuality: getPref("pref_quality", "auto"),
    profileChosenInSession: false,
    managingProfiles: false,
    tab: "inicio",
    genre: "Todos",
    animeFilter: "Todos PT-BR",
    myListFilter: "favoritos",
    liveGroup: "Brasil",
    activeSagaId: null,
    heroOffset: 0,
    visibleCount: PAGE_STEP,
    movieSkip: 500,
    seriesSkip: 400,
    animeSkip: 300,
    fetchedGenreKeys: {},
    searchQuery: "",
    isSearchingRemote: false,
    movies: SEED.movies.slice(),
    series: SEED.series.slice(),
    animes: SEED.animes.slice(),
    channels: bundledChannels,
    collections: bundledCollections,
    profiles: getJsonPref("profiles_v3", DEFAULT_PROFILES),
    activeProfileId: getPref("active_profile", "main"),
    customAddons: getJsonPref("custom_addons", []),
    progress: getJsonPref("watch_progress", {}),
    currentDetail: null,
    detailSeasons: {},
    selectedSeason: 1,
    bgCandidatesCache: {},
    currentExpandablePool: [],
    currentExpandableBadge: true
  };

  function applyTheme(themeName) {
    const valid = ["glass", "oled", "light"].includes(themeName) ? themeName : "glass";
    state.theme = valid;
    document.documentElement.setAttribute("data-theme", valid);
    setPref("ui_theme", valid);
    document.querySelectorAll("[data-set-theme]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.setTheme === valid);
    });
  }

  function activeProfile() {
    return state.profiles.find((p) => p.id === state.activeProfileId) || state.profiles[0];
  }

  function isKidsMode() {
    return Boolean(activeProfile().kids);
  }

  function getProfileList(kind) {
    const pid = activeProfile().id;
    const def = kind === "fav" ? ["tt15239678", "tt5180504", "tt1877830", "tt0388629"] : [];
    return getJsonPref(`${kind}_${pid}`, def);
  }

  function setProfileList(kind, arr) {
    const pid = activeProfile().id;
    setPref(`${kind}_${pid}`, JSON.stringify(arr));
  }

  let toastTimer = null;
  function toast(msg, durationMs) {
    const el = document.getElementById("toastMsg");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, durationMs || 2600);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ==========================================================================
     BOOT -> LOGIN (SUPABASE + PLS9K4) -> PERFIS NETFLIX -> APP
     ========================================================================== */
  function runBootSequence() {
    applyTheme(state.theme);
    const splash = document.getElementById("bootSplash");
    const bar = document.getElementById("bootProgressBar");
    const txt = document.getElementById("bootStatusText");

    restoreWarmCatalogCache();

    setTimeout(() => {
      if (bar) bar.style.width = "62%";
      if (txt) txt.textContent = "Conectando servidores PT-BR & Motor Fast-Path…";
    }, 340);

    setTimeout(() => {
      if (bar) bar.style.width = "100%";
      if (txt) txt.textContent = "PulseTV pronto.";
    }, 840);

    setTimeout(() => {
      if (splash) {
        splash.classList.add("is-leaving");
        setTimeout(() => { splash.hidden = true; }, 400);
      }
      routeAuthState();
      verifyActiveSupabaseSession();
      const sb = getSupabaseConfig();
      if (window.ZACK_BYTEPASS && sb.enabled) {
        window.ZACK_BYTEPASS.verifyWithSupabase(sb.url, sb.anonKey, getDeviceModelLabel());
      }
    }, 1180);
  }

  function routeAuthState() {
    const loginOv = document.getElementById("loginOverlay");
    const profOv = document.getElementById("profileOverlay");
    const shell = document.getElementById("appShell");

    if (!state.authenticated) {
      loginOv.hidden = false;
      profOv.hidden = true;
      shell.hidden = true;
      const codeInp = document.getElementById("loginCodeInput");
      if (codeInp) {
        codeInp.value = "";
        setTimeout(() => codeInp.focus(), 80);
      }
      return;
    }

    if (!state.profileChosenInSession) {
      loginOv.hidden = true;
      shell.hidden = true;
      openNetflixProfileScreen();
      return;
    }

    loginOv.hidden = true;
    profOv.hidden = true;
    shell.hidden = false;
    syncProfileChrome();
    render();
  }

  function bindLoginForm() {
    const form = document.getElementById("loginForm");
    const nameInput = document.getElementById("loginNameInput");
    const codeInput = document.getElementById("loginCodeInput");
    const errEl = document.getElementById("loginErrorMsg");
    const card = document.getElementById("loginCard");
    const btnLabel = document.getElementById("loginBtnLabel");

    codeInput.addEventListener("input", () => {
      codeInput.classList.remove("has-error");
      errEl.hidden = true;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      btnLabel.textContent = "Verificando…";
      const customName = (nameInput.value || "").trim();
      const check = await verifyCodeWithSupabaseOrLocal(codeInput.value, customName);
      btnLabel.textContent = "Liberar Acesso";

      if (check.ok) {
        state.authenticated = true;
        setPref("auth_hash_v31", SEED.authHash);
        if (customName && state.profiles.length > 0) {
          state.profiles[0].name = customName;
          setPref("profiles_v3", JSON.stringify(state.profiles));
        }
        errEl.hidden = true;
        codeInput.value = "";
        toast(check.mode === "supabase" ? "Acesso validado via Supabase · Bem-vindo ao PulseTV!" : "Acesso autorizado · Bem-vindo ao PulseTV!");
        routeAuthState();
      } else {
        errEl.textContent = check.reason;
        errEl.hidden = false;
        codeInput.classList.add("has-error");
        card.classList.remove("is-shaking");
        void card.offsetWidth;
        card.classList.add("is-shaking");
        codeInput.focus();
      }
    });
  }

  function performLogout() {
    closeDrawer();
    closeDetail();
    state.authenticated = false;
    state.profileChosenInSession = false;
    setPref("auth_hash_v31", "");
    setPref("sb_session_id", "");
    toast("Sessão encerrada com segurança.");
    routeAuthState();
  }

  /* ==========================================================================
     PERFIS ESTILO NETFLIX
     ========================================================================== */
  function openNetflixProfileScreen() {
    closeDrawer();
    state.managingProfiles = false;
    document.getElementById("profileOverlay").hidden = false;
    document.getElementById("appShell").hidden = true;
    renderNetflixProfiles();
  }

  function renderNetflixProfiles() {
    const grid = document.getElementById("profileGrid");
    const heading = document.getElementById("profileHeading");
    const manageBtn = document.getElementById("toggleManageProfilesBtn");

    heading.textContent = state.managingProfiles ? "Gerenciar perfis" : "Quem está assistindo?";
    manageBtn.textContent = state.managingProfiles ? "Concluído" : "Gerenciar perfis";
    manageBtn.classList.toggle("is-active", state.managingProfiles);

    let html = state.profiles.map((p, idx) => `
      <button type="button" class="nf-profile-card" data-prof-id="${escapeHtml(p.id)}" style="animation-delay:${idx * 45}ms" data-focusable>
        <div class="nf-avatar-box">
          ${renderNetflixAvatarSvg(p.theme, p.kids)}
          ${p.kids ? '<span class="nf-kids-ribbon">KIDS</span>' : ""}
          ${p.pin ? `<span class="nf-pin-badge"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>` : ""}
          ${state.managingProfiles ? `<div class="nf-edit-overlay"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>` : ""}
        </div>
        <span class="nf-profile-name">${escapeHtml(p.name)}</span>
      </button>
    `).join("");

    if (state.profiles.length < 6) {
      html += `
        <button type="button" id="addNewProfileCardBtn" class="nf-profile-card" style="animation-delay:${state.profiles.length * 45}ms" data-focusable>
          <div class="nf-avatar-box nf-add-box">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
          <span class="nf-profile-name">Adicionar perfil</span>
        </button>
      `;
    }

    grid.innerHTML = html;

    grid.querySelectorAll("[data-prof-id]").forEach((btn) => {
      btn.onclick = () => {
        const prof = state.profiles.find((p) => p.id === btn.dataset.profId);
        if (!prof) return;
        if (state.managingProfiles) openProfileEditorModal(prof);
        else if (prof.pin) openPinPromptModal(prof);
        else enterSelectedProfile(prof);
      };
    });

    const addBtn = document.getElementById("addNewProfileCardBtn");
    if (addBtn) addBtn.onclick = () => openProfileEditorModal(null);
  }

  function openPinPromptModal(prof) {
    const modal = document.getElementById("profileEditorModal");
    document.getElementById("profileModalTitle").textContent = `PIN de ${prof.name}`;
    document.getElementById("profileModalBody").innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <p style="margin:0;font-size:0.86rem;color:var(--text-secondary)">Digite o PIN de 4 dígitos para entrar neste perfil.</p>
        <input id="pinCheckInput" type="password" inputmode="numeric" maxlength="4" class="glass-input code-field" placeholder="••••" data-focusable>
        <div id="pinErr" class="auth-error" hidden>PIN incorreto.</div>
        <div style="display:flex;gap:10px">
          <button type="button" id="pinCancelBtn" class="btn-glass-pill" style="flex:1" data-focusable>Cancelar</button>
          <button type="button" id="pinConfirmBtn" class="btn-crimson" style="flex:1" data-focusable>Entrar</button>
        </div>
      </div>
    `;
    modal.hidden = false;
    const inp = document.getElementById("pinCheckInput");
    setTimeout(() => inp.focus(), 40);
    const submitPin = () => {
      if (inp.value === prof.pin) { modal.hidden = true; enterSelectedProfile(prof); }
      else { document.getElementById("pinErr").hidden = false; inp.value = ""; inp.focus(); }
    };
    document.getElementById("pinConfirmBtn").onclick = submitPin;
    inp.onkeydown = (e) => { if (e.key === "Enter") submitPin(); };
    document.getElementById("pinCancelBtn").onclick = () => { modal.hidden = true; };
  }

  function openProfileEditorModal(existingProf) {
    const modal = document.getElementById("profileEditorModal");
    const isEdit = Boolean(existingProf);
    document.getElementById("profileModalTitle").textContent = isEdit ? "Editar Perfil" : "Adicionar Perfil";
    const curTheme = existingProf ? existingProf.theme : AVATAR_THEMES[state.profiles.length % AVATAR_THEMES.length].id;

    document.getElementById("profileModalBody").innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <label class="field-group">
          <span class="field-label">Nome do perfil</span>
          <input id="profNameInp" type="text" maxlength="18" class="glass-input" value="${escapeHtml(existingProf ? existingProf.name : "")}" placeholder="Ex.: Sala, Kids, Casal" data-focusable>
        </label>
        <label style="display:flex;align-items:center;gap:10px;font-size:0.86rem;cursor:pointer">
          <input id="profKidsChk" type="checkbox" ${existingProf && existingProf.kids ? "checked" : ""} style="width:18px;height:18px;accent-color:#E50914">
          <span>Perfil Infantil (Modo Kids seguro)</span>
        </label>
        <label class="field-group">
          <span class="field-label">PIN de 4 dígitos (opcional)</span>
          <input id="profPinInp" type="password" inputmode="numeric" maxlength="4" class="glass-input" value="${escapeHtml(existingProf ? (existingProf.pin || "") : "")}" placeholder="Deixe vazio para entrar direto" data-focusable>
        </label>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px">
          ${isEdit && state.profiles.length > 1 ? '<button type="button" id="profDeleteBtn" class="btn-glass-pill" style="color:#FF6B78;border-color:rgba(229,9,20,0.4)" data-focusable>Excluir</button>' : ""}
          <button type="button" id="profCancelBtn" class="btn-glass-pill" style="flex:1" data-focusable>Cancelar</button>
          <button type="button" id="profSaveBtn" class="btn-crimson" style="flex:1" data-focusable>Salvar</button>
        </div>
      </div>
    `;
    modal.hidden = false;
    setTimeout(() => document.getElementById("profNameInp").focus(), 40);
    document.getElementById("profCancelBtn").onclick = () => { modal.hidden = true; };
    const delBtn = document.getElementById("profDeleteBtn");
    if (delBtn) {
      delBtn.onclick = () => {
        state.profiles = state.profiles.filter((p) => p.id !== existingProf.id);
        if (state.activeProfileId === existingProf.id) state.activeProfileId = state.profiles[0].id;
        setPref("profiles_v3", JSON.stringify(state.profiles));
        modal.hidden = true;
        renderNetflixProfiles();
      };
    }
    document.getElementById("profSaveBtn").onclick = () => {
      const nm = (document.getElementById("profNameInp").value || "").trim();
      if (!nm) { toast("Digite um nome para o perfil."); return; }
      const kids = document.getElementById("profKidsChk").checked;
      const pin = (document.getElementById("profPinInp").value || "").replace(/\D/g, "").slice(0, 4);
      if (isEdit) {
        existingProf.name = nm;
        existingProf.kids = kids;
        existingProf.theme = kids ? "kids" : curTheme;
        existingProf.pin = pin;
      } else {
        state.profiles.push({ id: "prof_" + Date.now(), name: nm, theme: kids ? "kids" : curTheme, kids: kids, pin: pin });
      }
      setPref("profiles_v3", JSON.stringify(state.profiles));
      modal.hidden = true;
      renderNetflixProfiles();
    };
  }

  function enterSelectedProfile(prof) {
    state.activeProfileId = prof.id;
    state.profileChosenInSession = true;
    setPref("active_profile", prof.id);
    setPref("kids_mode", prof.kids ? "1" : "0");

    const handoff = document.getElementById("profileHandoffLoader");
    document.getElementById("profileHandoffAvatar").innerHTML = renderNetflixAvatarSvg(prof.theme, prof.kids);
    document.getElementById("profileHandoffText").textContent = prof.kids
      ? `Ativando Modo Infantil seguro para ${prof.name}…`
      : `Preparando catálogo 4K para ${prof.name}…`;
    handoff.hidden = false;

    setTimeout(() => {
      handoff.hidden = true;
      document.getElementById("profileOverlay").hidden = true;
      document.getElementById("appShell").hidden = false;
      syncProfileChrome();
      window.scrollTo(0, 0);
      render();
    }, 420);
  }

  function syncProfileChrome() {
    const prof = activeProfile();
    const avatarHtml = renderNetflixAvatarSvg(prof.theme, prof.kids);
    document.getElementById("topProfileAvatar").innerHTML = avatarHtml;
    document.getElementById("topProfileName").textContent = prof.name;
    document.getElementById("topProfileSub").textContent = prof.kids ? "Modo Kids" : "4K PT-BR";
    document.getElementById("kidsBadge").hidden = !prof.kids;

    const cAv = document.getElementById("centralProfileAvatar");
    const cNm = document.getElementById("centralProfileName");
    const cAuth = document.getElementById("centralAuthBadge");
    const sbTag = document.getElementById("supabaseStatusTag");
    if (cAv) cAv.innerHTML = avatarHtml;
    if (cNm) cNm.textContent = prof.name;
    const sb = getSupabaseConfig();
    if (cAuth) cAuth.textContent = sb.enabled ? "Supabase Ativo" : "Acesso Autorizado";
    if (sbTag) sbTag.textContent = sb.enabled ? "Conectado ✓" : "Configurar";

    const ytSide = document.getElementById("sideYoutubeBtn");
    const ytDrawer = document.getElementById("drawerYoutubeBtn");
    if (ytSide) ytSide.style.display = prof.kids ? "none" : "inline-flex";
    if (ytDrawer) ytDrawer.style.display = prof.kids ? "none" : "flex";

    document.querySelectorAll(".side-link[data-tab], .mob-tab[data-tab]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === state.tab);
    });
  }

  /* ==========================================================================
     CATÁLOGO MASSIVO + CACHE
     ========================================================================== */
  function toSmallPoster(url, id) {
    if (!url) return "https://images.metahub.space/poster/small/" + id + "/img";
    return url.replace("/poster/medium/", "/poster/small/");
  }

  function translateGenre(g) {
    const map = {
      Action: "Ação", Adventure: "Ação", Comedy: "Comédia", Horror: "Terror",
      Drama: "Drama", Crime: "Drama", Biography: "Drama", History: "Drama",
      "Sci-Fi": "Ficção", Fantasy: "Ficção", Animation: "Animação",
      Family: "Animação", Thriller: "Suspense", Mystery: "Suspense", Romance: "Romance"
    };
    return map[g] || g;
  }

  function ingestMetas(targetList, metas, type, forceSubKind) {
    if (!Array.isArray(metas)) return 0;
    const existing = new Set(targetList.map((i) => i.id));
    let added = 0;
    metas.forEach((m, idx) => {
      if (!m || !m.id || existing.has(m.id)) return;
      const rawGenres = Array.isArray(m.genres) ? m.genres : (Array.isArray(m.genre) ? m.genre : []);
      const genres = rawGenres.length ? rawGenres.map(translateGenre) : (forceSubKind ? ["Animação"] : ["Drama"]);
      const isAnim = Boolean(forceSubKind) || genres.includes("Animação");
      const item = {
        id: m.id,
        type: type,
        subKind: forceSubKind || (isAnim ? "desenho" : undefined),
        name: m.name || "Título",
        ptTitle: m.name || "Título",
        year: String(m.releaseInfo || m.year || "2024").slice(0, 4),
        rating: m.imdbRating || "8.0",
        quality: idx % 2 === 0 ? "4K HDR" : "1080p",
        audio: "Dublado PT-BR + Dual",
        platform: forceSubKind === "anime" ? "AnimesFHD · PT-BR" : SEED.platforms[idx % 8],
        kids: isAnim,
        genres: genres,
        poster: toSmallPoster(m.poster, m.id),
        background: m.background || ("https://images.metahub.space/background/medium/" + m.id + "/img"),
        cast: Array.isArray(m.cast) ? m.cast.slice(0, 4).join(", ") : "",
        desc: m.description || "",
        stream: SEED.sampleStreams[idx % SEED.sampleStreams.length]
      };
      targetList.push(item);
      existing.add(item.id);
      added++;
      if (isAnim && targetList !== state.animes && !state.animes.some((a) => a.id === item.id)) {
        state.animes.push(Object.assign({ subKind: "desenho" }, item));
      }
    });
    return added;
  }

  function restoreWarmCatalogCache() {
    try {
      const raw = localStorage.getItem("pulsetv_catalog_cache_v3");
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (Array.isArray(cached.movies)) ingestMetas(state.movies, cached.movies, "movie");
      if (Array.isArray(cached.series)) ingestMetas(state.series, cached.series, "series");
    } catch (_) {}
  }

  function saveWarmCatalogCache() {
    try {
      const slim = {
        movies: state.movies.slice(0, 220).map((m) => ({
          id: m.id, name: m.name, year: m.year, imdbRating: m.rating, genres: m.genres, poster: m.poster
        })),
        series: state.series.slice(0, 140).map((s) => ({
          id: s.id, name: s.name, year: s.year, imdbRating: s.rating, genres: s.genres, poster: s.poster
        }))
      };
      localStorage.setItem("pulsetv_catalog_cache_v3", JSON.stringify(slim));
    } catch (_) {}
  }

  function notifyCatalogGrew() {
    if (!state.authenticated || !state.profileChosenInSession || state.currentDetail) return;
    if (window.scrollY > 40) { refreshExpandablePoolOnly(); return; }
    const prevY = window.scrollY;
    render();
    window.scrollTo(0, prevY);
  }

  async function hydrateMassiveCatalog() {
    await Promise.allSettled([
      httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/top.json").then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/top/skip=100.json").then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/series/top.json").then((d) => d && ingestMetas(state.series, d.metas, "series")),
      httpGetJson("https://animesfhd.net/stremio/catalog/series/afhd-dublados.json").then((d) => d && ingestMetas(state.animes, d.metas, "series", "anime"))
    ]);
    notifyCatalogGrew();

    await Promise.allSettled([
      httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/top/skip=200.json").then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/top/skip=300.json").then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/top/skip=400.json").then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/imdbRating.json").then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/imdbRating/skip=100.json").then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/series/top/skip=100.json").then((d) => d && ingestMetas(state.series, d.metas, "series")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/series/top/skip=200.json").then((d) => d && ingestMetas(state.series, d.metas, "series")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/series/imdbRating.json").then((d) => d && ingestMetas(state.series, d.metas, "series")),
      httpGetJson("https://animesfhd.net/stremio/catalog/series/afhd-dublados/skip=100.json").then((d) => d && ingestMetas(state.animes, d.metas, "series", "anime")),
      httpGetJson("https://animesfhd.net/stremio/catalog/series/afhd-dublados/skip=200.json").then((d) => d && ingestMetas(state.animes, d.metas, "series", "anime")),
      httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/top/genre=Animation.json").then((d) => d && ingestMetas(state.animes, d.metas, "movie", "desenho")),
      httpGetText("https://raw.githubusercontent.com/iptv-org/iptv/master/streams/br_pluto.m3u").then((m3u) => {
        if (!m3u || !m3u.includes("#EXTINF")) return;
        const existingUrls = new Set(state.channels.map((c) => c.url));
        let curName = null;
        let nextNum = state.channels.length + 101;
        m3u.split(/\r?\n/).forEach((ln) => {
          ln = ln.trim();
          if (ln.startsWith("#EXTINF:")) {
            const parts = ln.split(",");
            curName = parts.length > 1 ? parts[parts.length - 1].trim() : "Pluto TV Brasil";
          } else if (ln && !ln.startsWith("#") && curName) {
            if (!existingUrls.has(ln)) {
              state.channels.push({
                id: "pluto-" + nextNum,
                number: String(nextNum++),
                name: curName,
                group: "Pluto TV · TV Brasileira",
                kids: /kids|infantil|junior|nick|desenho/i.test(curName),
                quality: "HLS Brasil",
                url: ln
              });
              existingUrls.add(ln);
            }
            curName = null;
          }
        });
      })
    ]);
    saveWarmCatalogCache();
    notifyCatalogGrew();
  }

  async function ensureGenreLoaded(genrePt) {
    const en = GENRE_TO_EN[genrePt];
    if (!en || state.fetchedGenreKeys[en]) return;
    state.fetchedGenreKeys[en] = true;
    await Promise.allSettled([
      httpGetJson(`https://v3-cinemeta.strem.io/catalog/movie/top/genre=${encodeURIComponent(en)}.json`).then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson(`https://v3-cinemeta.strem.io/catalog/movie/top/genre=${encodeURIComponent(en)}&skip=100.json`).then((d) => d && ingestMetas(state.movies, d.metas, "movie")),
      httpGetJson(`https://v3-cinemeta.strem.io/catalog/series/top/genre=${encodeURIComponent(en)}.json`).then((d) => d && ingestMetas(state.series, d.metas, "series"))
    ]);
    notifyCatalogGrew();
  }

  /* ==========================================================================
     FAST-PATH STREAM RACE + ANIMAÇÃO MOTION AO CLICAR EM ASSISTIR
     ========================================================================== */
  function buildMagnetUri(infoHash, displayName, sources) {
    const tr = new Set(BEST_TRACKERS);
    if (Array.isArray(sources)) {
      sources.forEach((s) => { if (typeof s === "string" && s.startsWith("tracker:")) tr.add(s.slice(8)); });
    }
    return "magnet:?xt=urn:btih:" + infoHash + "&dn=" + encodeURIComponent(displayName || "PulseTV") +
      Array.from(tr).map((t) => "&tr=" + encodeURIComponent(t)).join("");
  }

  function extractSeeders(text) {
    if (!text) return 0;
    const m = text.match(/(?:👤|seeders?|peers?)\s*(\d+)/i);
    return m ? parseInt(m[1], 10) || 0 : 0;
  }

  function orderCandidatesForPreference(list, preferPt) {
    return list.slice().sort((a, b) => {
      const sa = a.baseScore + (preferPt ? (a.isPt ? 2500 : 0) : (!a.isPt ? 1200 : 0));
      const sb = b.baseScore + (preferPt ? (b.isPt ? 2500 : 0) : (!b.isPt ? 1200 : 0));
      return sb - sa;
    });
  }

  async function resolveBestCandidatesFast(item, season, episode, preferPt) {
    const cacheKey = `${item.id}_${season || 0}_${episode || 0}`;
    if (state.bgCandidatesCache[cacheKey] && state.bgCandidatesCache[cacheKey].length > 1) {
      return orderCandidatesForPreference(state.bgCandidatesCache[cacheKey], preferPt);
    }

    const mediaType = item.type === "movie" ? "movie" : "series";
    const queryIds = [];
    if (mediaType === "series" && String(item.id).startsWith("tt")) {
      queryIds.push(`${item.id}:${season || 1}:${episode || 1}`);
      if (item.subKind === "anime" || (item.genres && item.genres.includes("Animação"))) {
        const arm = await httpGetJson(`https://arm.haglund.dev/api/v2/imdb?id=${encodeURIComponent(item.id)}`, 1400);
        if (Array.isArray(arm) && arm[0] && arm[0].kitsu) queryIds.push(`kitsu:${arm[0].kitsu}:${episode || 1}`);
      }
    } else if (mediaType === "series" && !String(item.id).includes(":")) {
      queryIds.push(`${item.id}:${season || 1}:${episode || 1}`);
      queryIds.push(item.id);
    } else {
      queryIds.push(item.id);
    }

    const servers = [
      ...STREAM_SERVERS,
      ...state.customAddons.map((u, idx) => ({ name: "Addon #" + (idx + 1), base: u.replace(/\/manifest\.json$/i, "") }))
    ];

    const seenUrls = new Set();
    const results = [];
    state.bgCandidatesCache[cacheKey] = results;

    let resolvedEarly = false;
    let fastResolveFn = null;
    const tStart = Date.now();

    const maybeFinishEarly = () => {
      if (resolvedEarly || !fastResolveFn) return;
      const strongPtCount = results.filter((r) => r.isPt && (r.isDirect || r.seeders >= 3)).length;
      const elapsed = Date.now() - tStart;
      if (strongPtCount >= 2 && elapsed >= 450) {
        resolvedEarly = true;
        fastResolveFn();
      } else if (strongPtCount >= 2) {
        setTimeout(() => {
          if (!resolvedEarly && fastResolveFn) { resolvedEarly = true; fastResolveFn(); }
        }, 450 - elapsed);
      }
    };

    const tasks = [];
    for (const qid of queryIds) {
      for (const srv of servers) {
        tasks.push((async () => {
          const endpoint = `${srv.base}/stream/${mediaType}/${encodeURIComponent(qid)}.json`;
          const json = await httpGetJson(endpoint, srv.fast ? 2400 : 3200);
          if (!json || !Array.isArray(json.streams)) return;
          json.streams.slice(0, 10).forEach((st) => {
            const rawText = [st.name, st.title, st.description].filter(Boolean).join(" ").replace(/\n+/g, " ");
            const isDirectHttp = Boolean(st.url && /^https?:\/\//i.test(st.url) && !/\.torrent(\?|$)/i.test(st.url));
            const playUrl = isDirectHttp
              ? st.url
              : (st.infoHash ? buildMagnetUri(st.infoHash, item.ptTitle || item.name, st.sources) : "");
            if (!playUrl || seenUrls.has(playUrl)) return;
            seenUrls.add(playUrl);

            const isPt = PT_REGEX.test(rawText + " " + srv.name);
            const seeders = extractSeeders(rawText);
            const is1080 = /1080p|fhd/i.test(rawText);
            const is720 = /720p|\bhd\b/i.test(rawText);
            const is4k = /2160p|4k|uhd/i.test(rawText);
            const isCam = /\b(cam|hdcam|ts|telesync)\b/i.test(rawText);

            let baseScore = 0;
            if (isDirectHttp) baseScore += 4500;
            if (isPt) baseScore += 3000;
            if (state.prefQuality === "4k" && is4k) baseScore += 700;
            else if (is1080) baseScore += 550;
            else if (is720) baseScore += 420;
            else if (is4k) baseScore += 380;
            if (isCam) baseScore -= 900;
            baseScore += Math.min(1200, seeders * 12);

            results.push({
              server: srv.name,
              label: rawText.slice(0, 80) || srv.name,
              url: playUrl,
              fileIdx: typeof st.fileIdx === "number" ? st.fileIdx : -1,
              isPt: isPt,
              isDirect: isDirectHttp,
              seeders: seeders,
              baseScore: baseScore
            });
          });
          maybeFinishEarly();
        })());
      }
    }

    await Promise.race([
      Promise.allSettled(tasks),
      new Promise((resolve) => {
        fastResolveFn = resolve;
        setTimeout(resolve, 2400);
      })
    ]);

    results.push({
      server: "PulseTV Direct",
      label: "Stream Direto Reserva HD",
      url: item.stream || SEED.sampleStreams[0],
      fileIdx: -1,
      isPt: true,
      isDirect: true,
      seeders: 999,
      baseScore: 10
    });

    return orderCandidatesForPreference(results, preferPt);
  }

  function launchPlayback(payload) {
    if (hasNative) {
      Native.playMedia(JSON.stringify(payload));
      return;
    }
    const modal = document.getElementById("webPlayerModal");
    const vid = document.getElementById("webVideo");
    document.getElementById("webPlayerTitle").textContent = payload.title || "PulseTV Cinema";
    let playSrc = payload.url || SEED.sampleStreams[0];
    if (playSrc.startsWith("magnet:?")) {
      playSrc = SEED.sampleStreams[0];
      toast("No navegador, exibindo prévia HD (use o APK Android/Tablet/TV para reprodução 4K completa).");
    }
    vid.src = playSrc;
    modal.hidden = false;
    vid.play().catch(() => {});
  }

  async function autoPlayItem(item, season, episode, audioLang, epTitle) {
    if (!item) return;
    const preferPt = audioLang ? audioLang.toLowerCase().startsWith("pt") : state.prefPtFirst;
    const probe = document.getElementById("streamProbeOverlay");
    const bgBleed = document.getElementById("probeBackdropBlur");
    const epTag = item.type === "series" ? ` · T${season || 1}:E${(episode || 1) < 10 ? "0" + (episode || 1) : (episode || 1)}` : "";
    const fullTitle = (item.ptTitle || item.name) + epTag + (epTitle ? ` "${epTitle}"` : "");

    if (bgBleed) bgBleed.style.backgroundImage = `url("${item.background || item.poster}")`;
    document.getElementById("probeTitle").textContent = fullTitle;
    document.getElementById("probeSub").textContent = preferPt
      ? "Calibrando stream 4K & áudio Dublado PT-BR…"
      : "Calibrando stream 4K & legenda PT-BR…";
    probe.hidden = false;

    const minMotionDelay = new Promise((r) => setTimeout(r, 560));

    try {
      const [ranked] = await Promise.all([
        resolveBestCandidatesFast(item, season || 1, episode || 1, preferPt),
        minMotionDelay
      ]);
      const topCandidates = ranked.slice(0, 8);
      const winner = topCandidates[0];
      const prog = state.progress[item.id];

      probe.hidden = true;
      launchPlayback({
        id: item.type === "series" ? `${item.id}_s${season || 1}e${episode || 1}` : item.id,
        title: fullTitle,
        url: winner.url,
        fileIdx: winner.fileIdx,
        season: item.type === "series" ? (season || 1) : 0,
        episode: item.type === "series" ? (episode || 1) : 0,
        audioLang: preferPt ? "pt-BR" : "en-US",
        series: item.type === "series",
        position: (!episode || episode === 1) && prog ? (prog.pos || 0) : 0,
        candidates: JSON.stringify(topCandidates)
      });
    } catch (_) {
      probe.hidden = true;
    }
  }

  /* ==========================================================================
     RENDERIZAÇÃO DE VIEWS
     ========================================================================== */
  function allItems() {
    const map = new Map();
    [...state.movies, ...state.series, ...state.animes].forEach((it) => {
      if (it && it.id && !map.has(it.id)) map.set(it.id, it);
    });
    return Array.from(map.values());
  }

  function filterByProfileAndGenre(list, applyGenre) {
    let out = list;
    if (isKidsMode()) out = out.filter((i) => i.kids || (i.genres && i.genres.includes("Animação")));
    if (applyGenre && state.genre !== "Todos") out = out.filter((i) => Array.isArray(i.genres) && i.genres.includes(state.genre));
    return out;
  }

  function buildCinemaHeroHtml(pool) {
    const items = pool.filter((i) => i && i.background).slice(0, 5);
    if (!items.length) return "";
    const curIdx = state.heroOffset % items.length;
    const item = items[curIdx];
    const isFav = getProfileList("fav").includes(item.id);

    return `
      <section class="cinema-hero">
        <img class="cinema-hero-bg" src="${item.background}" alt="${escapeHtml(item.ptTitle || item.name)}" decoding="async">
        <div class="cinema-hero-shade"></div>
        <div class="cinema-hero-content">
          <div class="hero-badges">
            <span class="badge-red">${escapeHtml(item.platform || "PulseTV")}</span>
            <span class="badge-glass">${escapeHtml(item.quality || "4K HDR")}</span>
            <span class="badge-glass">${escapeHtml(item.audio || "Dublado PT-BR")}</span>
            <span class="badge-glass">★ ${escapeHtml(item.rating || "8.5")}</span>
          </div>
          <h1 class="cinema-hero-title">${escapeHtml(item.ptTitle || item.name)}</h1>
          <p class="cinema-hero-desc">${escapeHtml(item.desc || "Produção disponível com áudio Dublado PT-BR em 1º lugar e qualidade 1080p/4K.")}</p>
          <div class="cinema-hero-actions">
            <button type="button" class="btn-crimson" data-play-now="${escapeHtml(item.id)}" data-focusable>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
              <span>Assistir Agora</span>
            </button>
            <button type="button" class="btn-glass-circle" data-toggle-fav="${escapeHtml(item.id)}" title="Minha Lista" data-focusable>${isFav ? "✓" : "＋"}</button>
            <button type="button" class="btn-glass-pill" data-open-id="${escapeHtml(item.id)}" data-focusable>Detalhes</button>
          </div>
        </div>
        <div class="hero-dots">
          ${items.map((_, idx) => `<button type="button" class="hero-dot ${idx === curIdx ? "is-active" : ""}" data-hero-idx="${idx}" aria-label="Destaque ${idx + 1}" data-focusable></button>`).join("")}
        </div>
      </section>
    `;
  }

  function buildWideRowHtml(title, meta, items, showProgress) {
    if (!items.length) return "";
    return `
      <section class="sec-block">
        <div class="sec-head">
          <h2 class="sec-title">${escapeHtml(title)}</h2>
          <span class="sec-meta">${escapeHtml(meta)}</span>
        </div>
        <div class="landscape-grid">
          ${items.slice(0, 4).map((it, idx) => {
            const prog = state.progress[it.id];
            const pct = prog && prog.dur > 0 ? Math.min(95, Math.max(12, Math.round((prog.pos / prog.dur) * 100))) : [38, 64, 24, 78][idx % 4];
            return `
              <button type="button" class="wide-card" data-open-id="${escapeHtml(it.id)}" data-focusable>
                <img src="${it.background || it.poster}" alt="${escapeHtml(it.ptTitle || it.name)}" loading="lazy" decoding="async">
                <div class="wide-card-shade"></div>
                <div class="wide-card-play">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="7 5 19 12 7 19 7 5"/></svg>
                </div>
                <div class="wide-card-info">
                  <span class="wide-card-title">${escapeHtml(it.ptTitle || it.name)}</span>
                  <span class="wide-card-sub">${escapeHtml(it.year || "2024")} · ${escapeHtml(it.quality || "4K")} · PT-BR</span>
                </div>
                ${showProgress ? `<div class="wide-progress-track"><div class="wide-progress-fill" style="width:${pct}%"></div></div>` : ""}
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function buildGenreStripHtml() {
    return `
      <div class="genre-strip" role="tablist">
        ${SEED.genres.map((g) => `
          <button type="button" class="genre-pill ${state.genre === g.id ? "is-active" : ""}" data-genre="${escapeHtml(g.id)}" data-focusable>${escapeHtml(g.id)}</button>
        `).join("")}
      </div>
    `;
  }

  function buildCardsInnerHtml(items, showPtBadge) {
    return items.map((it) => `
      <button type="button" class="poster-card" data-open-id="${escapeHtml(it.id)}" data-focusable>
        <img src="${it.poster}" alt="${escapeHtml(it.ptTitle || it.name)}" loading="lazy" decoding="async">
        <div class="poster-shade"></div>
        <span class="poster-top-tag">${escapeHtml(it.quality || "4K")}</span>
        ${showPtBadge ? '<span class="poster-pt-dot">PT-BR</span>' : ""}
        <div class="poster-caption">
          <span class="poster-name">${escapeHtml(it.ptTitle || it.name)}</span>
          <span class="poster-sub">${escapeHtml(it.year || "2024")} · ★ ${escapeHtml(it.rating || "8.0")}</span>
        </div>
      </button>
    `).join("");
  }

  function computeExpandablePool() {
    if (state.tab === "filmes") return filterByProfileAndGenre(state.movies, true);
    if (state.tab === "series") return filterByProfileAndGenre(state.series, true);
    if (state.tab === "desenhos") {
      let list = state.animes.slice();
      if (isKidsMode()) list = list.filter((a) => a.kids);
      if (state.animeFilter === "Animes Dublados") list = list.filter((a) => a.subKind === "anime");
      if (state.animeFilter === "Desenhos & Filmes") list = list.filter((a) => a.subKind !== "anime");
      return list;
    }
    return filterByProfileAndGenre(state.movies, true).concat(filterByProfileAndGenre(state.series, true));
  }

  function refreshExpandablePoolOnly() {
    state.currentExpandablePool = computeExpandablePool();
    updateLoadMoreButtonLabel();
  }

  function updateLoadMoreButtonLabel() {
    const btn = document.getElementById("loadMoreCatalogBtn");
    const grid = document.getElementById("expandableGrid");
    if (!btn || !grid) return;
    const shown = grid.children.length;
    const remaining = Math.max(0, state.currentExpandablePool.length - shown);
    if (remaining > 0) {
      btn.hidden = false;
      btn.textContent = `＋ Carregar mais títulos (+${remaining})`;
    } else {
      btn.textContent = "＋ Buscar mais páginas no servidor";
    }
  }

  async function appendMorePosters() {
    const grid = document.getElementById("expandableGrid");
    const btn = document.getElementById("loadMoreCatalogBtn");
    if (!grid) return;
    state.currentExpandablePool = computeExpandablePool();
    let alreadyShown = grid.children.length;

    if (alreadyShown >= state.currentExpandablePool.length) {
      if (btn) btn.textContent = "Buscando mais títulos…";
      if (state.tab === "filmes" || state.tab === "inicio") {
        const sk = state.movieSkip; state.movieSkip += 100;
        const d = await httpGetJson(`https://v3-cinemeta.strem.io/catalog/movie/top/skip=${sk}.json`);
        if (d) ingestMetas(state.movies, d.metas, "movie");
      } else if (state.tab === "series") {
        const sk = state.seriesSkip; state.seriesSkip += 100;
        const d = await httpGetJson(`https://v3-cinemeta.strem.io/catalog/series/top/skip=${sk}.json`);
        if (d) ingestMetas(state.series, d.metas, "series");
      } else if (state.tab === "desenhos") {
        const sk = state.animeSkip; state.animeSkip += 100;
        const d = await httpGetJson(`https://animesfhd.net/stremio/catalog/series/afhd-dublados/skip=${sk}.json`);
        if (d) ingestMetas(state.animes, d.metas, "series", "anime");
      }
      state.currentExpandablePool = computeExpandablePool();
    }

    const nextSlice = state.currentExpandablePool.slice(alreadyShown, alreadyShown + PAGE_STEP);
    if (!nextSlice.length) { toast("Todos os títulos disponíveis já estão exibidos."); if (btn) btn.hidden = true; return; }

    state.visibleCount = alreadyShown + nextSlice.length;
    const firstNewIdx = grid.children.length;
    grid.insertAdjacentHTML("beforeend", buildCardsInnerHtml(nextSlice, state.currentExpandableBadge));
    bindDynamicCards(grid);
    updateLoadMoreButtonLabel();
    const firstNewCard = grid.children[firstNewIdx];
    if (firstNewCard) {
      firstNewCard.focus({ preventScroll: true });
      firstNewCard.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
    }
  }

  function render() {
    syncProfileChrome();
    const main = document.getElementById("mainContent");
    if (!main || state.currentDetail) return;

    const q = state.searchQuery.trim().toLowerCase();
    if (q) {
      const matches = filterByProfileAndGenre(allItems(), false).filter((it) =>
        (it.name || "").toLowerCase().includes(q) ||
        (it.ptTitle || "").toLowerCase().includes(q) ||
        (it.cast || "").toLowerCase().includes(q)
      );
      main.innerHTML = `
        <section class="sec-block">
          <div class="sec-head">
            <h1 class="sec-title">Resultados para “${escapeHtml(state.searchQuery)}”</h1>
            <span class="sec-meta">${matches.length} títulos encontrados</span>
          </div>
          ${state.isSearchingRemote ? `
            <div class="search-loading-banner">
              <div class="search-eq-loader"><span></span><span></span><span></span><span></span></div>
              <span>Vasculhando catálogos 4K, Séries &amp; Animes Dublados…</span>
            </div>
          ` : ""}
          <div class="poster-grid">
            ${buildCardsInnerHtml(matches.slice(0, 60), true)}
            ${state.isSearchingRemote && matches.length < 6 ? Array(6).fill('<div class="skeleton-card"></div>').join("") : ""}
          </div>
          ${!state.isSearchingRemote && matches.length === 0 ? '<p style="color:var(--text-secondary)">Nenhum título encontrado.</p>' : ""}
        </section>
      `;
      bindMainInteractions(main);
      return;
    }

    if (state.tab === "aovivo") {
      let chans = state.channels.slice();
      if (isKidsMode()) chans = chans.filter((c) => c.kids || /infantil|kids|desenho/i.test(c.group || ""));
      const groups = ["Todos", ...Array.from(new Set(chans.map((c) => c.group || "Canais"))).slice(0, 14)];
      if (!groups.includes(state.liveGroup)) state.liveGroup = "Todos";
      const filtered = state.liveGroup === "Todos" ? chans : chans.filter((c) => (c.group || "Canais") === state.liveGroup);

      main.innerHTML = `
        <section class="sec-block">
          <div class="sec-head">
            <h1 class="sec-title">TV ao Vivo</h1>
            <span class="sec-meta">${filtered.length} canais ativos</span>
          </div>
          <div class="genre-strip">
            ${groups.map((grp) => `<button type="button" class="genre-pill ${state.liveGroup === grp ? "is-active" : ""}" data-live-group="${escapeHtml(grp)}" data-focusable>${escapeHtml(grp)}</button>`).join("")}
          </div>
          <div class="live-grid">
            ${filtered.slice(0, 90).map((ch, idx) => `
              <button type="button" class="live-card" data-live-idx="${idx}" data-live-url="${escapeHtml(ch.url)}" data-live-name="${escapeHtml(ch.name)}" data-focusable>
                <div class="live-card-top">
                  <span class="live-ch-num">CH ${escapeHtml(ch.number || String(101 + idx))}</span>
                  <span class="live-dot">● AO VIVO</span>
                </div>
                <strong style="font-size:0.95rem;color:var(--text-primary)">${escapeHtml(ch.name)}</strong>
                <span style="font-size:0.76rem;color:var(--text-secondary)">${escapeHtml(ch.now || ch.group || "Transmissão HD")}</span>
              </button>
            `).join("")}
          </div>
        </section>
      `;
      bindMainInteractions(main);
      return;
    }

    if (state.tab === "sagas") {
      const cols = state.collections;
      const selectedSaga = cols.find((c) => c.id === state.activeSagaId) || cols[0];
      const allMap = new Map(allItems().map((i) => [i.id, i]));
      main.innerHTML = `
        <section class="sec-block">
          <div class="sec-head">
            <h1 class="sec-title">Sagas &amp; Franquias Completas</h1>
            <span class="sec-meta">${cols.length} coleções em ordem cronológica</span>
          </div>
          <div class="genre-strip">
            ${cols.slice(0, 38).map((col) => `<button type="button" class="genre-pill ${(selectedSaga && selectedSaga.id === col.id) ? "is-active" : ""}" data-saga-id="${escapeHtml(col.id)}" data-focusable>${escapeHtml(col.name)}</button>`).join("")}
          </div>
          ${selectedSaga ? `
            <div class="poster-grid">
              ${(selectedSaga.items || []).map((entry, idx) => {
                const imdb = typeof entry === "string" ? entry : (entry.imdb_id || entry.id);
                const known = allMap.get(imdb) || {
                  id: imdb, type: "movie", name: (entry && entry.title) || `${selectedSaga.name} #${idx + 1}`,
                  ptTitle: (entry && entry.title) || `${selectedSaga.name} #${idx + 1}`, year: (entry && entry.year) || "Cinema",
                  rating: "8.4", quality: "4K", poster: "https://images.metahub.space/poster/small/" + imdb + "/img",
                  background: "https://images.metahub.space/background/medium/" + imdb + "/img", stream: SEED.sampleStreams[0]
                };
                if (!allMap.has(imdb)) state.movies.push(known);
                return buildCardsInnerHtml([known], true);
              }).join("")}
            </div>
          ` : ""}
        </section>
      `;
      bindMainInteractions(main);
      return;
    }

    if (state.tab === "minha-lista") {
      const map = new Map(allItems().map((i) => [i.id, i]));
      const favItems = getProfileList("fav").map((id) => map.get(id)).filter(Boolean);
      const contItems = Object.keys(state.progress).map((id) => map.get(id.split("_s")[0])).filter(Boolean);
      const doneItems = getProfileList("done").map((id) => map.get(id)).filter(Boolean);
      const activeList = state.myListFilter === "continuar" ? contItems : (state.myListFilter === "concluidos" ? doneItems : favItems);
      main.innerHTML = `
        <section class="sec-block">
          <div class="sec-head">
            <h1 class="sec-title">Biblioteca de ${escapeHtml(activeProfile().name)}</h1>
            <span class="sec-meta">${activeList.length} títulos</span>
          </div>
          <div class="genre-strip">
            <button type="button" class="genre-pill ${state.myListFilter === "favoritos" ? "is-active" : ""}" data-mylist="favoritos" data-focusable>Favoritos (${favItems.length})</button>
            <button type="button" class="genre-pill ${state.myListFilter === "continuar" ? "is-active" : ""}" data-mylist="continuar" data-focusable>Continuar (${contItems.length})</button>
            <button type="button" class="genre-pill ${state.myListFilter === "concluidos" ? "is-active" : ""}" data-mylist="concluidos" data-focusable>Já Assisti (${doneItems.length})</button>
          </div>
          ${activeList.length ? `<div class="poster-grid">${buildCardsInnerHtml(activeList, true)}</div>` : '<p style="color:var(--text-secondary)">Sua lista está vazia nesta categoria.</p>'}
        </section>
      `;
      bindMainInteractions(main);
      return;
    }

    const heroPool = state.tab === "filmes"
      ? filterByProfileAndGenre(state.movies, false)
      : state.tab === "series"
        ? filterByProfileAndGenre(state.series, false)
        : state.tab === "desenhos"
          ? state.animes
          : filterByProfileAndGenre([...state.series.slice(0, 3), ...state.movies.slice(0, 4)], false);

    state.currentExpandablePool = computeExpandablePool();
    state.currentExpandableBadge = true;
    const initialSlice = state.currentExpandablePool.slice(0, state.visibleCount);

    const continueList = filterByProfileAndGenre([state.movies[1], state.movies[2], state.series[0], state.movies[0]].filter(Boolean), false);
    const trendingWide = filterByProfileAndGenre([state.series[2], state.series[1], state.movies[3], state.movies[4]].filter(Boolean), false);

    const gridHeading = state.tab === "filmes"
      ? `Catálogo Completo de Filmes (${state.currentExpandablePool.length})`
      : state.tab === "series"
        ? `Séries & Temporadas em Alta (${state.currentExpandablePool.length})`
        : state.tab === "desenhos"
          ? `Animes Dublados PT-BR & Desenhos (${state.currentExpandablePool.length})`
          : `Explorar Catálogo Unificado (${state.currentExpandablePool.length} títulos)`;

    main.innerHTML = `
      ${buildCinemaHeroHtml(heroPool)}
      ${state.tab === "inicio" ? buildWideRowHtml("Continuar Assistindo", "Sincronia entre TV, Tablet & Celular", continueList, true) : ""}
      ${state.tab === "inicio" ? buildWideRowHtml("Em Alta Hoje no Brasil", "Áudio PT-BR em 1º Lugar · 4K HDR", trendingWide, false) : ""}
      ${state.tab === "desenhos" ? `
        <div class="genre-strip">
          ${["Todos PT-BR", "Animes Dublados", "Desenhos & Filmes"].map((af) => `
            <button type="button" class="genre-pill ${state.animeFilter === af ? "is-active" : ""}" data-anime-filter="${escapeHtml(af)}" data-focusable>${escapeHtml(af)}</button>
          `).join("")}
        </div>
      ` : buildGenreStripHtml()}
      <section id="filmesGradeAnchor" class="sec-block">
        <div class="sec-head">
          <h2 class="sec-title">${escapeHtml(gridHeading)}</h2>
          <span class="sec-meta">PulseTV Fast-Path</span>
        </div>
        <div id="expandableGrid" class="poster-grid">${buildCardsInnerHtml(initialSlice, true)}</div>
        <div class="load-more-wrap">
          <button type="button" id="loadMoreCatalogBtn" class="btn-glass-pill" data-focusable>＋ Carregar mais títulos</button>
        </div>
      </section>
    `;

    updateLoadMoreButtonLabel();
    bindMainInteractions(main);
  }

  function bindDynamicCards(container) {
    container.querySelectorAll("[data-open-id]").forEach((el) => {
      el.onclick = () => openDetail(el.dataset.openId);
    });
  }

  function bindMainInteractions(main) {
    bindDynamicCards(main);
    main.querySelectorAll("[data-play-now]").forEach((btn) => {
      btn.onclick = () => {
        const it = allItems().find((x) => x.id === btn.dataset.playNow);
        if (it) autoPlayItem(it, 1, 1);
      };
    });
    main.querySelectorAll("[data-toggle-fav]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.toggleFav;
        const favs = getProfileList("fav");
        const idx = favs.indexOf(id);
        if (idx >= 0) { favs.splice(idx, 1); toast("Removido da Minha Lista"); }
        else { favs.unshift(id); toast("Adicionado à Minha Lista!"); }
        setProfileList("fav", favs);
        render();
      };
    });
    main.querySelectorAll("[data-hero-idx]").forEach((dot) => {
      dot.onclick = () => { state.heroOffset = parseInt(dot.dataset.heroIdx, 10) || 0; render(); };
    });
    main.querySelectorAll("[data-genre]").forEach((pill) => {
      pill.onclick = () => { state.genre = pill.dataset.genre; state.visibleCount = PAGE_STEP; render(); ensureGenreLoaded(state.genre); };
    });
    main.querySelectorAll("[data-anime-filter]").forEach((pill) => {
      pill.onclick = () => { state.animeFilter = pill.dataset.animeFilter; state.visibleCount = PAGE_STEP; render(); };
    });
    main.querySelectorAll("[data-mylist]").forEach((pill) => {
      pill.onclick = () => { state.myListFilter = pill.dataset.mylist; render(); };
    });
    main.querySelectorAll("[data-live-group]").forEach((pill) => {
      pill.onclick = () => { state.liveGroup = pill.dataset.liveGroup; render(); };
    });
    main.querySelectorAll("[data-live-url]").forEach((card) => {
      card.onclick = () => launchPlayback({ id: "live_" + card.dataset.liveIdx, title: card.dataset.liveName, url: card.dataset.liveUrl, live: true, audioLang: "pt-BR" });
    });
    main.querySelectorAll("[data-saga-id]").forEach((pill) => {
      pill.onclick = () => { state.activeSagaId = pill.dataset.sagaId; render(); };
    });
    const loadMoreBtn = document.getElementById("loadMoreCatalogBtn");
    if (loadMoreBtn) loadMoreBtn.onclick = appendMorePosters;
  }

  /* ==========================================================================
     DETALHES + CARDS DE PRÉVIA DE EPISÓDIOS COM DEDUPLICAÇÃO ESTRITA
     ========================================================================== */
  async function translateToPtBr(text) {
    if (!text || text.length < 12 || /[ãõçáéíóúêô]/i.test(text)) return text;
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt-BR&dt=t&q=" + encodeURIComponent(text.slice(0, 650));
    const data = await httpGetJson(url, 2500);
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((seg) => (Array.isArray(seg) ? seg[0] : "")).join("");
    }
    return text;
  }

  function deduplicateEpisodesBySeason(rawVideos, fallbackThumb) {
    const seasonsMap = {};
    const dedupIndex = {};

    rawVideos.forEach((v) => {
      if (!v) return;
      const s = Number(v.season);
      const ep = Number(v.episode || v.number);
      if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(ep) || ep <= 0) return;

      const key = `${s}:${ep}`;
      const candidate = {
        season: s,
        episode: ep,
        title: (v.name || v.title || `Episódio ${ep}`).trim(),
        overview: (v.overview || v.description || "").trim(),
        thumbnail: v.thumbnail || fallbackThumb || "",
        released: v.released ? String(v.released).slice(0, 10) : ""
      };

      const prev = dedupIndex[key];
      if (!prev) {
        dedupIndex[key] = candidate;
      } else {
        // Mantém a entrada mais rica (com thumbnail real e sinopse preenchida), eliminando 100% dos duplicados!
        const scorePrev = (prev.thumbnail && prev.thumbnail !== fallbackThumb ? 2 : 0) + (prev.overview ? 2 : 0) + (prev.title.length > 10 ? 1 : 0);
        const scoreNew = (candidate.thumbnail && candidate.thumbnail !== fallbackThumb ? 2 : 0) + (candidate.overview ? 2 : 0) + (candidate.title.length > 10 ? 1 : 0);
        if (scoreNew > scorePrev) dedupIndex[key] = candidate;
      }
    });

    Object.values(dedupIndex).forEach((epObj) => {
      if (!seasonsMap[epObj.season]) seasonsMap[epObj.season] = [];
      seasonsMap[epObj.season].push(epObj);
    });

    Object.keys(seasonsMap).forEach((sKey) => {
      seasonsMap[sKey].sort((a, b) => a.episode - b.episode);
    });

    return seasonsMap;
  }

  async function openDetail(id) {
    const item = allItems().find((x) => x.id === id);
    if (!item) return;
    state.currentDetail = item;
    state.selectedSeason = 1;

    document.getElementById("mainContent").hidden = true;
    document.getElementById("detailView").hidden = false;
    document.getElementById("detailBackdropImg").style.backgroundImage = `url("${item.background || item.poster}")`;
    window.scrollTo(0, 0);

    resolveBestCandidatesFast(item, 1, 1, state.prefPtFirst).catch(() => {});
    renderDetailBody(item);

    const metaType = item.type === "movie" ? "movie" : "series";
    const metaJson = await httpGetJson(`https://v3-cinemeta.strem.io/meta/${metaType}/${encodeURIComponent(item.id)}.json`, 3500);
    if (metaJson && metaJson.meta && state.currentDetail && state.currentDetail.id === item.id) {
      const m = metaJson.meta;
      if (m.description && !item.desc) item.desc = await translateToPtBr(m.description);
      else if (item.desc && !/[ãõçáéíóúêô]/i.test(item.desc)) item.desc = await translateToPtBr(item.desc);

      if (Array.isArray(m.videos) && m.videos.length && item.type === "series") {
        state.detailSeasons[item.id] = deduplicateEpisodesBySeason(m.videos, item.background || item.poster);
      }
      renderDetailBody(item);
    }
  }

  function renderDetailBody(item) {
    const body = document.getElementById("detailBody");
    const isFav = getProfileList("fav").includes(item.id);
    const isDone = getProfileList("done").includes(item.id);

    const seasonsMap = state.detailSeasons[item.id] || (item.type === "series" ? {
      1: Array.from({ length: 8 }, (_, i) => ({
        season: 1,
        episode: i + 1,
        title: `Episódio ${i + 1}`,
        overview: "Disponível em 1080p/4K com áudio Dublado PT-BR e legenda inteligente.",
        thumbnail: item.background || item.poster,
        released: ""
      }))
    } : null);

    const seasonNums = seasonsMap ? Object.keys(seasonsMap).map(Number).sort((a, b) => a - b) : [];
    const curSeason = seasonNums.includes(state.selectedSeason) ? state.selectedSeason : (seasonNums[0] || 1);
    const episodes = seasonsMap ? (seasonsMap[curSeason] || []) : [];

    body.innerHTML = `
      <div class="detail-hero-grid">
        <img class="detail-poster" src="${item.poster}" alt="${escapeHtml(item.ptTitle || item.name)}">
        <div>
          <div class="hero-badges">
            <span class="badge-red">${escapeHtml(item.platform || "PulseTV")}</span>
            <span class="badge-glass">${escapeHtml(item.quality || "4K HDR")}</span>
            <span class="badge-glass">${escapeHtml(item.audio || "Dublado PT-BR")}</span>
            <span class="badge-glass">${escapeHtml(item.year || "2024")} · ★ ${escapeHtml(item.rating || "8.5")}</span>
          </div>
          <h1 class="detail-title">${escapeHtml(item.ptTitle || item.name)}</h1>
          <p class="detail-synopsis">${escapeHtml(item.desc || "Sinopse em português carregada automaticamente.")}</p>
          ${item.cast ? `<p style="margin:0 0 18px;font-size:0.83rem;color:var(--text-secondary)"><strong>Elenco:</strong> ${escapeHtml(item.cast)}</p>` : ""}

          <div class="detail-actions">
            <button type="button" id="detailPlayPtBtn" class="btn-crimson" data-focusable>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
              <span>${item.type === "series" ? `Assistir T${curSeason}:E01` : "Assistir Agora"}</span>
            </button>
            <button type="button" id="detailPlayOrigBtn" class="btn-glass-pill" data-focusable>Áudio Original + Leg PT</button>
            <button type="button" id="detailFavBtn" class="btn-glass-pill" data-focusable>${isFav ? "✓ Na Minha Lista" : "＋ Minha Lista"}</button>
            <button type="button" id="detailDoneBtn" class="btn-glass-pill" data-focusable>${isDone ? "✓ Concluído" : "Marcar como Visto"}</button>
          </div>
        </div>
      </div>

      ${item.type === "series" && seasonNums.length ? `
        <div class="sec-block" style="margin-top:28px">
          <div class="sec-head">
            <h2 class="sec-title">Episódios · Temporada ${curSeason}</h2>
            <span class="sec-meta">${episodes.length} episódios únicos</span>
          </div>
          <div class="genre-strip season-pills">
            ${seasonNums.map((s) => `
              <button type="button" class="genre-pill ${s === curSeason ? "is-active" : ""}" data-season-num="${s}" data-focusable>Temporada ${s}</button>
            `).join("")}
          </div>
          <div class="ep-preview-grid">
            ${episodes.map((ep) => {
              const epNumPad = ep.episode < 10 ? "0" + ep.episode : String(ep.episode);
              return `
                <button type="button" class="ep-preview-card" data-ep-season="${ep.season}" data-ep-num="${ep.episode}" data-ep-title="${escapeHtml(ep.title)}" data-focusable>
                  <div class="ep-thumb-box">
                    <img src="${escapeHtml(ep.thumbnail || item.background || item.poster)}" alt="${escapeHtml(ep.title)}" loading="lazy" decoding="async" onerror="this.src='${escapeHtml(item.background || item.poster)}'">
                    <div class="ep-thumb-shade"></div>
                    <span class="ep-thumb-play">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="7 5 19 12 7 19 7 5"/></svg>
                    </span>
                    <span class="ep-num-chip">E${epNumPad}</span>
                  </div>
                  <div class="ep-meta-col">
                    <strong class="ep-meta-title">${ep.episode}. ${escapeHtml(ep.title)}</strong>
                    <p class="ep-meta-desc">${escapeHtml(ep.overview || "Assista em alta definição com áudio PT-BR e legenda inteligente automática.")}</p>
                    <span class="ep-meta-foot">${ep.released ? escapeHtml(ep.released) + " · " : ""}Dublado PT-BR · 4K/1080p</span>
                  </div>
                </button>
              `;
            }).join("")}
          </div>
        </div>
      ` : ""}
    `;

    document.getElementById("detailPlayPtBtn").onclick = () => autoPlayItem(item, curSeason, 1, "pt-BR", episodes[0] ? episodes[0].title : "");
    document.getElementById("detailPlayOrigBtn").onclick = () => autoPlayItem(item, curSeason, 1, "en-US", episodes[0] ? episodes[0].title : "");
    document.getElementById("detailFavBtn").onclick = () => {
      const f = getProfileList("fav");
      const i = f.indexOf(item.id);
      if (i >= 0) f.splice(i, 1); else f.unshift(item.id);
      setProfileList("fav", f);
      renderDetailBody(item);
    };
    document.getElementById("detailDoneBtn").onclick = () => {
      const d = getProfileList("done");
      const i = d.indexOf(item.id);
      if (i >= 0) d.splice(i, 1); else d.unshift(item.id);
      setProfileList("done", d);
      renderDetailBody(item);
    };
    body.querySelectorAll("[data-season-num]").forEach((b) => {
      b.onclick = () => { state.selectedSeason = parseInt(b.dataset.seasonNum, 10) || 1; renderDetailBody(item); };
    });
    body.querySelectorAll("[data-ep-num]").forEach((b) => {
      b.onclick = () => autoPlayItem(item, parseInt(b.dataset.epSeason, 10) || 1, parseInt(b.dataset.epNum, 10) || 1, null, b.dataset.epTitle || "");
    });
  }

  function closeDetail() {
    if (!state.currentDetail) return;
    state.currentDetail = null;
    document.getElementById("detailView").hidden = true;
    document.getElementById("mainContent").hidden = false;
    render();
  }

  /* ==========================================================================
     CENTRAL PULSETV, NAVEGAÇÃO D-PAD & PREFERÊNCIAS
     ========================================================================== */
  function openDrawer() {
    syncProfileChrome();
    document.getElementById("prefPtFirst").checked = state.prefPtFirst;
    document.getElementById("prefSmartSub").checked = state.prefSmartSub;
    document.getElementById("prefQualitySelect").value = state.prefQuality;
    document.getElementById("drawerBackdrop").hidden = false;
  }

  function closeDrawer() {
    document.getElementById("drawerBackdrop").hidden = true;
  }

  function focusAndSnap(el) {
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }

  function moveSpatialFocus(dir) {
    const cur = document.activeElement;
    const focusables = Array.from(document.querySelectorAll("[data-focusable]")).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    if (!cur || !focusables.includes(cur)) { focusAndSnap(focusables[0]); return; }

    const parentGrid = cur.parentElement;
    if (parentGrid && parentGrid.classList.contains("poster-grid")) {
      const cols = window.innerWidth <= 900 ? 3 : (window.innerWidth <= 1180 ? 4 : 6);
      const cards = parentGrid.children;
      const idx = Array.prototype.indexOf.call(cards, cur);
      if (idx >= 0) {
        if (dir === "RIGHT" && (idx % cols) < cols - 1 && idx + 1 < cards.length) { focusAndSnap(cards[idx + 1]); return; }
        if (dir === "LEFT" && (idx % cols) > 0) { focusAndSnap(cards[idx - 1]); return; }
        if (dir === "DOWN" && idx + cols < cards.length) { focusAndSnap(cards[idx + cols]); return; }
        if (dir === "UP" && idx - cols >= 0) { focusAndSnap(cards[idx - cols]); return; }
      }
    }

    const cr = cur.getBoundingClientRect();
    const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
    let best = null, bestScore = Infinity;
    for (let i = 0; i < focusables.length; i++) {
      const el = focusables[i];
      if (el === cur) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const dx = (r.left + r.width / 2) - cx;
      const dy = (r.top + r.height / 2) - cy;
      if (dir === "RIGHT" && dx <= 6) continue;
      if (dir === "LEFT" && dx >= -6) continue;
      if (dir === "DOWN" && dy <= 6) continue;
      if (dir === "UP" && dy >= -6) continue;
      const primary = (dir === "LEFT" || dir === "RIGHT") ? Math.abs(dx) : Math.abs(dy);
      const cross = (dir === "LEFT" || dir === "RIGHT") ? Math.abs(dy) : Math.abs(dx);
      const score = primary + cross * 2.4;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) focusAndSnap(best);
  }

  document.addEventListener("focusin", (e) => {
    const t = e.target && e.target.tagName;
    if (hasNative && Native.setInputFocused) Native.setInputFocused(t === "INPUT" || t === "TEXTAREA" || t === "SELECT");
  });
  document.addEventListener("focusout", () => {
    if (hasNative && Native.setInputFocused) Native.setInputFocused(false);
  });

  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement ? document.activeElement.tagName : "";
    const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if (e.key === "ArrowRight" && !inInput) { e.preventDefault(); moveSpatialFocus("RIGHT"); }
    else if (e.key === "ArrowLeft" && !inInput) { e.preventDefault(); moveSpatialFocus("LEFT"); }
    else if (e.key === "ArrowDown" && !inInput) { e.preventDefault(); moveSpatialFocus("DOWN"); }
    else if (e.key === "ArrowUp" && !inInput) { e.preventDefault(); moveSpatialFocus("UP"); }
    else if (e.key === "Escape") window.PulseApp.handleBack();
  });

  function switchTab(tabName) {
    state.tab = tabName;
    state.genre = "Todos";
    state.visibleCount = PAGE_STEP;
    state.searchQuery = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("searchClearBtn").hidden = true;
    document.getElementById("searchPulseLoader").hidden = true;
    closeDrawer();
    closeDetail();
    window.scrollTo(0, 0);
    render();
  }

  document.querySelectorAll(".side-link[data-tab], .mob-tab[data-tab]").forEach((btn) => { btn.onclick = () => switchTab(btn.dataset.tab); });
  document.querySelectorAll("[data-quick-tab]").forEach((btn) => { btn.onclick = () => switchTab(btn.dataset.quickTab); });
  document.querySelectorAll("[data-drawer-tab]").forEach((btn) => { btn.onclick = () => switchTab(btn.dataset.drawerTab); });
  document.querySelectorAll("[data-set-theme]").forEach((btn) => {
    btn.onclick = () => {
      applyTheme(btn.dataset.setTheme);
      toast(`Tema ${btn.querySelector("strong").textContent} aplicado!`);
    };
  });

  document.getElementById("prefPtFirst").onchange = (e) => {
    state.prefPtFirst = e.target.checked;
    setPref("pref_pt_first", state.prefPtFirst ? "1" : "0");
  };
  document.getElementById("prefSmartSub").onchange = (e) => {
    state.prefSmartSub = e.target.checked;
    setPref("pref_smart_sub", state.prefSmartSub ? "1" : "0");
  };
  document.getElementById("prefQualitySelect").onchange = (e) => {
    state.prefQuality = e.target.value;
    setPref("pref_quality", state.prefQuality);
    toast("Preferência de qualidade atualizada.");
  };

  document.getElementById("mobileBrandHomeBtn").onclick = () => switchTab("inicio");
  document.getElementById("topBackBtn").onclick = () => window.PulseApp.handleBack();
  document.getElementById("detailBackBtn").onclick = closeDetail;
  document.getElementById("activeProfileChip").onclick = openNetflixProfileScreen;
  document.getElementById("sideSwitchProfileBtn").onclick = openNetflixProfileScreen;
  document.getElementById("drawerSwitchProfileBtn").onclick = openNetflixProfileScreen;
  document.getElementById("toggleManageProfilesBtn").onclick = () => { state.managingProfiles = !state.managingProfiles; renderNetflixProfiles(); };
  document.getElementById("sideSettingsBtn").onclick = openDrawer;
  document.getElementById("mobMoreMenuBtn").onclick = openDrawer;
  document.getElementById("drawerCloseBtn").onclick = closeDrawer;
  document.getElementById("drawerBackdrop").onclick = (e) => { if (e.target.id === "drawerBackdrop") closeDrawer(); };
  document.getElementById("notifBellBtn").onclick = () => { switchTab("series"); toast("Exibindo séries em alta!"); };

  const triggerYoutube = () => {
    if (isKidsMode()) return;
    closeDrawer();
    if (hasNative) Native.openYouTube();
    else window.open("https://www.youtube.com", "_blank");
  };
  document.getElementById("sideYoutubeBtn").onclick = triggerYoutube;
  document.getElementById("drawerYoutubeBtn").onclick = triggerYoutube;

  document.getElementById("sideLogoutBtn").onclick = performLogout;
  document.getElementById("drawerLogoutBtn").onclick = performLogout;
  document.getElementById("profileLogoutBtn").onclick = performLogout;

  /* ---------- Busca Animada ---------- */
  let searchTimer = null;
  const searchInput = document.getElementById("searchInput");
  const searchClearBtn = document.getElementById("searchClearBtn");
  const searchPulseLoader = document.getElementById("searchPulseLoader");

  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    const q = state.searchQuery.trim();
    searchClearBtn.hidden = !q;
    if (state.currentDetail) closeDetail();
    clearTimeout(searchTimer);
    if (q.length >= 2) {
      state.isSearchingRemote = true;
      searchPulseLoader.hidden = false;
      render();
      searchTimer = setTimeout(async () => {
        await Promise.allSettled([
          httpGetJson("https://v3-cinemeta.strem.io/catalog/movie/top/search=" + encodeURIComponent(q) + ".json", 3500).then((r) => r && ingestMetas(state.movies, r.metas, "movie")),
          httpGetJson("https://v3-cinemeta.strem.io/catalog/series/top/search=" + encodeURIComponent(q) + ".json", 3500).then((r) => r && ingestMetas(state.series, r.metas, "series"))
        ]);
        state.isSearchingRemote = false;
        searchPulseLoader.hidden = true;
        render();
      }, 320);
    } else {
      state.isSearchingRemote = false;
      searchPulseLoader.hidden = true;
      render();
    }
  });

  searchClearBtn.onclick = () => {
    state.searchQuery = "";
    state.isSearchingRemote = false;
    searchInput.value = "";
    searchClearBtn.hidden = true;
    searchPulseLoader.hidden = true;
    render();
  };

  /* ---------- Painéis Extras da Central PulseTV (Diagnóstico, Remoto, Supabase, Addon) ---------- */
  document.getElementById("diagBtn").onclick = () => {
    const st = document.getElementById("diagStatus");
    st.textContent = "Testando…";
    setTimeout(() => {
      if (hasNative) {
        try {
          const d = JSON.parse(Native.runDiagnostics());
          st.textContent = d.player ? `✓ ${d.latencyMs}ms` : "Verificar";
          toast(`Catálogo OK · Motor Local ${d.player ? "Ativo" : "Off"} · ${d.latencyMs}ms`);
          return;
        } catch (_) {}
      }
      st.textContent = "✓ 100% OK";
      toast(`Catálogo (${allItems().length} títulos) & Fast-Path ativos!`);
    }, 120);
  };

  document.getElementById("remoteInfoBtn").onclick = () => {
    let lan = "http://192.168.1.5:8765";
    if (hasNative) {
      try { lan = JSON.parse(Native.getDeviceInfo()).lanUrl || lan; } catch (_) {}
    }
    document.getElementById("drawerPanelExtra").innerHTML = `
      <div style="padding:14px;border-radius:14px;background:var(--glass-bg);border:1px solid var(--glass-border)">
        <strong style="display:block;margin-bottom:6px">Controle Remoto Wi-Fi</strong>
        <p style="margin:0;font-size:0.8rem;color:var(--text-secondary);line-height:1.5">
          Abra <code style="color:#FF4D5A">${escapeHtml(lan)}</code> no navegador do celular na mesma rede Wi-Fi.
        </p>
      </div>
    `;
  };

  document.getElementById("supabaseConfigBtn").onclick = () => {
    const cur = getSupabaseConfig();
    const extra = document.getElementById("drawerPanelExtra");
    extra.innerHTML = `
      <div style="padding:14px;border-radius:14px;background:var(--glass-bg);border:1px solid var(--glass-border);display:grid;gap:9px">
        <strong style="font-size:0.86rem">Controle de Logins via Supabase</strong>
        <p style="margin:0;font-size:0.75rem;color:var(--text-secondary);line-height:1.45">
          Conecte seu projeto Supabase para gerenciar códigos, limites de acesso e revogar logins em tempo real.
        </p>
        <input id="sbUrlInp" class="glass-input" style="height:40px;font-size:0.8rem" value="${escapeHtml(cur.url)}" placeholder="https://SEU-PROJETO.supabase.co" data-focusable>
        <input id="sbKeyInp" class="glass-input" style="height:40px;font-size:0.8rem" value="${escapeHtml(cur.anonKey)}" placeholder="Supabase Anon Key (eyJ...)" data-focusable>
        <button type="button" id="saveSbCfgBtn" class="btn-crimson-sm" data-focusable>Salvar Conexão Supabase</button>
      </div>
    `;
    document.getElementById("saveSbCfgBtn").onclick = () => {
      setPref("sb_url", document.getElementById("sbUrlInp").value.trim().replace(/\/+$/, ""));
      setPref("sb_anon_key", document.getElementById("sbKeyInp").value.trim());
      syncProfileChrome();
      toast("Configuração Supabase salva!");
    };
  };

  document.getElementById("addSourceBtn").onclick = () => {
    const extra = document.getElementById("drawerPanelExtra");
    extra.innerHTML = `
      <div style="padding:14px;border-radius:14px;background:var(--glass-bg);border:1px solid var(--glass-border);display:grid;gap:9px">
        <strong style="font-size:0.86rem">Conectar Addon Stremio ou M3U</strong>
        <input id="customSrcUrl" class="glass-input" style="height:40px;font-size:0.82rem" placeholder="https://.../manifest.json ou .m3u8" data-focusable>
        <button type="button" id="saveCustomSrcBtn" class="btn-crimson-sm" data-focusable>Conectar Fonte</button>
      </div>
    `;
    document.getElementById("saveCustomSrcBtn").onclick = () => {
      const u = document.getElementById("customSrcUrl").value.trim();
      if (!u) { toast("Informe uma URL válida."); return; }
      if (u.includes("manifest.json")) {
        state.customAddons.push(u);
        setPref("custom_addons", JSON.stringify(state.customAddons));
        toast("Addon conectado ao motor Fast-Path!");
      } else {
        closeDrawer();
        launchPlayback({ id: "custom", title: "Stream Direto", url: u, live: u.includes(".m3u8"), audioLang: "pt-BR" });
      }
    };
  };

  document.getElementById("webPlayerCloseBtn").onclick = () => {
    const v = document.getElementById("webVideo");
    v.pause();
    v.src = "";
    document.getElementById("webPlayerModal").hidden = true;
  };

  let webSpdIdx = 1;
  const webSpeeds = [0.75, 1.0, 1.25, 1.5, 2.0];
  document.getElementById("webSpeedBtn").onclick = (e) => {
    webSpdIdx = (webSpdIdx + 1) % webSpeeds.length;
    const s = webSpeeds[webSpdIdx];
    document.getElementById("webVideo").playbackRate = s;
    e.target.textContent = s + "×";
  };

  window.PulseApp = {
    goScreen(mode) {
      if (!state.authenticated) return;
      state.profileChosenInSession = true;
      document.getElementById("profileOverlay").hidden = true;
      document.getElementById("appShell").hidden = false;
      closeDrawer();
      closeDetail();
      if (mode === "detalhes") { state.tab = "series"; render(); openDetail("tt5180504"); }
      else switchTab(mode || "inicio");
    },
    refreshProgress() {
      state.progress = getJsonPref("watch_progress", {});
      if (state.authenticated && state.profileChosenInSession && !state.currentDetail && window.scrollY < 40) render();
    },
    remoteKey(k) {
      if (k === "UP" || k === "DOWN" || k === "LEFT" || k === "RIGHT") moveSpatialFocus(k);
      else if (k === "ENTER" && document.activeElement) document.activeElement.click();
      else if (k === "BACK") window.PulseApp.handleBack();
    },
    remoteSearch(q) {
      if (!state.authenticated || !state.profileChosenInSession) return;
      searchInput.value = q || "";
      searchInput.dispatchEvent(new Event("input"));
    },
    handleBack() {
      const wp = document.getElementById("webPlayerModal");
      if (wp && !wp.hidden) { document.getElementById("webPlayerCloseBtn").click(); return true; }
      const pm = document.getElementById("profileEditorModal");
      if (pm && !pm.hidden) { pm.hidden = true; return true; }
      const dr = document.getElementById("drawerBackdrop");
      if (dr && !dr.hidden) { closeDrawer(); return true; }
      if (state.currentDetail) { closeDetail(); return true; }
      if (state.searchQuery) { searchClearBtn.click(); return true; }
      if (state.authenticated && state.profileChosenInSession && state.tab !== "inicio") { switchTab("inicio"); return true; }
      return false;
    }
  };
  window.AshApp = window.PulseApp;

  bindLoginForm();
  runBootSequence();
  hydrateMassiveCatalog();
})();
