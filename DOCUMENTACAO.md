# Documentação Técnica e de Produto — PulseTV v3.0.0

## 1. Visão Geral
O **PulseTV v3.0.0** é um ecossistema completo de streaming multiplataforma (Android Celular, Tablet, Android TV, Amazon Fire TV Stick, Windows 7–11 e iPhone/iOS) com estética **Spatial Glass** (branco, vidro translúcido, preto OLED e vermelho carmesim), catálogo unificado expandido com áudio **PT-BR em 1º lugar**, player nativo minimalista estilo Netflix, perfis individuais, controle de login via **Supabase** e reprodução integrada de vídeo sem interrupções.

- **Site Oficial:** https://zackdartdev.github.io/pulsetv/
- **Web App Direto:** https://zackdartdev.github.io/pulsetv/app/index.html
- **Repositório & Releases:** https://github.com/zackdartdev/pulsetv/releases/tag/v3.0.0
- **Novo Código de Acesso Exclusivo:** `PLS9K4` (o código anterior `HJUZJ4` foi revogado)
- **Chave Pix de Apoio (Nubank):** `(21) 97088-6158` (`+5521970886158`, QR Code BCB EMVCo ISO escaneável)

---

## 2. Arquitetura & Engenharia Implementada

### 2.1 Motor Nativo Android de Baixa Latência (`tv.pulsetv.app`)
- **`TorrEngine.java`**: Daemon local `libtorrserver.so` pré-aquecido na abertura do app em `127.0.0.1:18796` com `CacheSize = 64 MB`, `ConnectionsLimit = 50`, `ResponsiveMode = true` e **`PreloadCache = 0`** (elimina travamento inicial de pré-buffering). Adota **Fast-Path 0ms** enviando `/stream/video?link=...&index=...&play` diretamente ao player quando o índice do arquivo já é conhecido.
- **`PlaybackService.java`**: Serviço em primeiro plano com AndroidX Media3 `ExoPlayer` 1.11.1 configurado com `DefaultLoadControl` (`bufferForPlaybackMs = 550ms`, `minBuffer = 6000ms`, `maxBuffer = 32000ms`).
- **`PlayerActivity.java` (Player Estilo Netflix + Animação Motion 60fps)**:
  - **Barra superior limpa**: botão `←`, título do filme/episódio, Picture-in-Picture (`⧉`) e trava de tela (`🔒`).
  - **Slider vertical de brilho na lateral esquerda** (`BrightnessRailView`), ajustando o brilho da janela por arraste.
  - **Controles centrais amplos**: `⟲ 10s`, `▶/⏸` e `⟳ 10s`.
  - **Linha do tempo vermelha arrastável** (`SeekBar` `#E50914`) com tempo restante em monospace.
  - **Rodapé plano minimalista**: `Velocidade (0.75x–2x)`, `Idioma e legendas` (abre modal Spatial Glass dedicado para faixa PT-BR/Original, legenda inteligente, sincronia `±0.5s`, Áudio Noturno `LoudnessEnhancer` e Timer), `Fonte` e `Pular abertura ⏭`.
  - **Animação Motion nativa (`PulseMotionView`)**: renderização 60fps em `Canvas` com ondas concêntricas vermelhas/brancas e traçado ECG animado durante o carregamento dos primeiros frames.
- **`MainActivity.java`**: WebView acelerada por hardware (`LAYER_TYPE_HARDWARE`), ajuste de teclado (`SOFT_INPUT_ADJUST_RESIZE`) no celular/tablet, modo imersivo automático em Android TV/Fire Stick, interceptação nativa de D-Pad O(1) e servidor de Controle Remoto Wi-Fi na porta `:8765`.

### 2.2 Autenticação Exclusiva & Controle de Logins via Supabase
- **Script SQL pronto:** [`supabase/schema.sql`](supabase/schema.sql)
  - Tabela `pulse_access_codes`: gerencia múltiplos códigos, status ativo/desativado (`is_active`), limite de vagas (`max_uses = 1000`), contador (`current_uses`) e expiração (`expires_at`). Já semeada com **`PLS9K4`**.
  - Tabela `pulse_login_sessions`: registra cada login com `device_model`, `device_fingerprint`, `user_name`, `last_seen_at` e flag `revoked` para bloqueio remoto imediato.
  - RPC segura `verify_pulse_login(...)` e `check_pulse_session(...)` com `SECURITY DEFINER` e RLS habilitado.
- **No App**: validação prioritária via REST RPC no Supabase quando configurado em **Central PulseTV → Controle de Logins (Supabase)** (ou em `catalog_seed.js`), com fallback seguro offline por hash SHA-256 exclusivo do código `PLS9K4`.

### 2.3 Design System Multi-Temas, Perfis Netflix & Episódios com Prévia
- **Sistema de 3 Temas** selecionáveis em tempo real na **Central PulseTV**:
  1. **Spatial Glass** (padrão): superfícies translúcidas em vidro fumê com desfoque (`blur(28px) saturate(160%)`) e bordas especulares brancas.
  2. **Obsidian OLED**: preto puro `#050508` de máximo contraste.
  3. **Vidro Claro**: acabamento arquitetônico branco/frost com acentos carmesim `#E50914`.
- **Perfis estilo Netflix (`Quem está assistindo?`)**: até 6 perfis individuais com avatares ilustrados, gerenciador completo, proteção por PIN de 4 dígitos, listas/progresso isolados e Modo Infantil seguro.
- **Central PulseTV Completa**: exibe perfil ativo, seletor de temas, atalhos rápidos (`Animes & Kids`, `38 Sagas`, `Minha Lista` e botão minimalista **apenas com o ícone do YouTube**), preferências de áudio/legenda/qualidade, diagnóstico em 1 clique, controle remoto Wi-Fi, configuração Supabase e Logout.
- **Cards de Prévia de Episódios sem Duplicados**: deduplicação estrita por chave `temporada:episodio` priorizando os metadados mais ricos (thumbnail 16:9 + título + sinopse), eliminando episódios repetidos.
- **Adaptação Mobile APK**: barra de navegação inferior fixa de 5 abas, grade responsiva de 3 colunas, alvos de toque `>= 44px` e `0px` de vazamento horizontal validado em celular físico (`RMX5061`) e tablet físico (`Galaxy Tab S10 FE+`).

---

## 3. Como Ativar o Controle de Logins no Supabase (3 Passos)
1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard) e abra o **SQL Editor**.
2. Cole e execute o conteúdo completo de [`supabase/schema.sql`](supabase/schema.sql).
3. No app **PulseTV**, abra **Central PulseTV → Controle de Logins (Supabase)** e informe sua **Project URL** (`https://xxxx.supabase.co`) e sua **Anon Key** — ou preencha `PULSE_SEED.supabase` em `catalog_seed.js` antes de gerar uma nova compilação.

### Comandos Rápidos no SQL Editor do Supabase
```sql
-- Trocar ou criar um novo código de acesso:
insert into public.pulse_access_codes (code, is_active, max_uses, notes)
values ('NOVOCOD', true, 500, 'Novo lote VIP');

-- Desativar o código antigo imediatamente:
update public.pulse_access_codes set is_active = false where code = 'PLS9K4';

-- Ver todos os aparelhos logados:
select user_name, code, device_model, last_seen_at, revoked
from public.pulse_login_sessions
order by last_seen_at desc;
```

---

## 4. Artefatos Compilados (Release `v3.0.0`)
| Plataforma | Arquivo | Observação |
| :--- | :--- | :--- |
| Android Celular, Tablet & Android TV | `PulseTV-Android.apk` | Universal (ARM64 + 32-bit), assinado |
| Android Celular / Tablet Moderno | `PulseTV-3.0.0-ARM64.apk` | 64-bit leve (`arm64-v8a`) |
| Amazon Fire TV Stick / TV 32-bit | `PulseTV-3.0.0-FireStick.apk` | Otimizado 32-bit (`armeabi-v7a`) |
| Windows 7 ao 11 | `Instalar-PulseTV-3.0.0.exe` | Launcher janela cinema dedicada |
| Windows Portátil 64-bit / 32-bit | `PulseTV-3.0.0-Win64.zip` / `Win7-x86.zip` | Extrair e executar offline |
| iPhone / iPad (iOS) | `PulseTV-3.0.0-iPhone.mobileconfig` | WebClip em tela cheia com ícone |
