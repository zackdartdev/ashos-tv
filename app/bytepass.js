/* ==========================================================================
   ZACK BYTEPASS™ v1.0 — ASSINATURA DIGITAL ANTI-CLONAGEM & PROPRIEDADE ÚNICA
   © 2026 Zack Studios. Todos os direitos reservados.
   Proibida cópia, clonagem, engenharia reversa ou redistribuição sem autorização.
   ========================================================================== */
(function () {
  "use strict";

  const OWNER = "Zack Studios";
  const CERT_SHA256 = "EA0202DC01C7D964186359F19DC7BB3223841C826FDFFBEEAF60044444E8EAD6";
  const SIGNATURE_ID = "ZBP-300-EA0202DC";
  const ALLOWED_HOSTS = new Set([
    "zackdartdev.github.io",
    "localhost",
    "127.0.0.1",
    ""
  ]);

  function lockUnauthorizedClone(reason) {
    try {
      document.documentElement.innerHTML = `
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zack Studios · Acesso Bloqueado</title></head>
        <body style="margin:0;min-height:100vh;background:#050508;color:#fff;font-family:-apple-system,Inter,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;">
          <div style="max-width:460px;padding:30px 26px;border-radius:22px;background:rgba(20,22,30,0.92);border:1px solid #E50914;box-shadow:0 24px 60px rgba(229,9,20,0.28);">
            <div style="display:inline-block;padding:5px 12px;border-radius:99px;background:rgba(229,9,20,0.18);border:1px solid rgba(255,36,56,0.5);color:#FF4D5A;font-size:11px;font-weight:800;letter-spacing:.1em;margin-bottom:14px;">ZACK BYTEPASS™ · PROTEÇÃO ANTI-CLONE</div>
            <h1 style="margin:0 0 10px;font-size:22px;">Cópia Não Autorizada Bloqueada</h1>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#CBD5E1;">
              O <strong>PulseTV</strong>, seu código-fonte, design e identidade são de <strong>propriedade única e exclusiva da ${OWNER}</strong>.
            </p>
            <p style="margin:0 0 18px;font-size:12.5px;color:#94A3B8;">Motivo técnico: ${reason}</p>
            <div style="padding-top:14px;border-top:1px solid rgba(255,255,255,0.1);font-size:11.5px;color:#64748B;">
              © 2026 ${OWNER} · Assinatura ${SIGNATURE_ID} · Todos os direitos reservados.
            </div>
          </div>
        </body>
      `;
    } catch (_) {}
  }

  let valid = true;
  let reason = "OK";
  let nativeProof = null;

  const host = (window.location && window.location.hostname ? window.location.hostname : "").toLowerCase();
  const proto = (window.location && window.location.protocol ? window.location.protocol : "").toLowerCase();

  if (window.PulseNative && typeof window.PulseNative.getBytepassProof === "function") {
    try {
      nativeProof = JSON.parse(window.PulseNative.getBytepassProof());
      if (!nativeProof || !nativeProof.valid || String(nativeProof.certSha256 || "").toUpperCase() !== CERT_SHA256) {
        valid = false;
        reason = (nativeProof && nativeProof.reason) || "Assinatura APK Zack Bytepass inválida.";
      }
    } catch (_) {
      valid = false;
      reason = "Falha ao validar prova nativa Zack Bytepass.";
    }
  } else if (proto === "http:" || proto === "https:") {
    if (!ALLOWED_HOSTS.has(host)) {
      valid = false;
      reason = "Domínio não autorizado (" + host + ").";
    }
  }

  async function verifyWithSupabase(sbUrl, sbAnonKey, deviceLabel) {
    if (!sbUrl || !sbAnonKey) return { ok: valid, mode: "local" };
    try {
      const res = await fetch(sbUrl.replace(/\/+$/, "") + "/rest/v1/rpc/verify_bytepass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": sbAnonKey,
          "Authorization": "Bearer " + sbAnonKey
        },
        body: JSON.stringify({
          p_cert_sha256: nativeProof ? nativeProof.certSha256 : CERT_SHA256,
          p_origin: proto === "file:" ? "android_asset" : (host || "local"),
          p_device: deviceLabel || navigator.userAgent.slice(0, 60)
        })
      });
      if (res.ok) {
        const d = await res.json();
        if (d && d.ok === false) {
          lockUnauthorizedClone(d.reason || "Assinatura bloqueada pelo servidor Zack Studios.");
        }
        return d;
      }
    } catch (_) {}
    return { ok: valid, mode: "offline" };
  }

  window.ZACK_BYTEPASS = Object.freeze({
    owner: OWNER,
    signatureId: SIGNATURE_ID,
    certSha256: CERT_SHA256,
    valid: valid,
    reason: reason,
    verifyWithSupabase: verifyWithSupabase
  });

  if (!valid) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => lockUnauthorizedClone(reason));
    } else {
      lockUnauthorizedClone(reason);
    }
  }
})();
