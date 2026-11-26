-- ============================================================================
-- PulseTV v3.0 — Controle de Logins & Assinatura Zack Bytepass™ no Supabase
-- Propriedade única e exclusiva da Zack Studios.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Códigos de Acesso Exclusivos
create table if not exists public.pulse_access_codes (
  code text primary key,
  is_active boolean not null default true,
  max_uses integer not null default 1000,
  current_uses integer not null default 0,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- 2. Sessões / Logins Ativos
create table if not exists public.pulse_login_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.pulse_access_codes(code) on delete cascade,
  user_name text,
  device_model text,
  device_fingerprint text,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- 3. Assinaturas Oficiais Zack Bytepass™ (Anti-Clonagem)
create table if not exists public.pulse_bytepass_signatures (
  id text primary key,
  owner text not null default 'Zack Studios',
  cert_sha256 text not null,
  allowed_origins text[] not null default array['zackdartdev.github.io', '127.0.0.1', 'localhost', 'android_asset'],
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Auditoria de Tentativas de Clonagem / Verificações Bytepass
create table if not exists public.pulse_bytepass_audit (
  id uuid primary key default gen_random_uuid(),
  cert_sha256 text,
  origin text,
  device text,
  status text not null,
  created_at timestamptz not null default now()
);

-- Seed do código exclusivo PLS9K4 e da assinatura oficial Zack Bytepass™
insert into public.pulse_access_codes (code, is_active, max_uses, notes)
values ('PLS9K4', true, 1000, 'Lote oficial PulseTV v3.0 — Zack Studios')
on conflict (code) do update
set is_active = excluded.is_active, max_uses = excluded.max_uses;

insert into public.pulse_bytepass_signatures (id, owner, cert_sha256, is_active)
values ('ZBP-300-EA0202DC', 'Zack Studios', 'EA0202DC01C7D964186359F19DC7BB3223841C826FDFFBEEAF60044444E8EAD6', true)
on conflict (id) do update
set cert_sha256 = excluded.cert_sha256, is_active = excluded.is_active;

alter table public.pulse_access_codes enable row level security;
alter table public.pulse_login_sessions enable row level security;
alter table public.pulse_bytepass_signatures enable row level security;
alter table public.pulse_bytepass_audit enable row level security;

-- RPC 1: Validação Zack Bytepass™ (bloqueia cópias e registra clones)
create or replace function public.verify_bytepass(
  p_cert_sha256 text,
  p_origin text default 'android_asset',
  p_device text default 'unknown'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sig public.pulse_bytepass_signatures%rowtype;
  v_origin_clean text := lower(trim(coalesce(p_origin, '')));
begin
  select * into v_sig
  from public.pulse_bytepass_signatures
  where upper(cert_sha256) = upper(trim(coalesce(p_cert_sha256, '')))
    and is_active = true
  limit 1;

  if not found or not (v_origin_clean = any(v_sig.allowed_origins)) then
    insert into public.pulse_bytepass_audit (cert_sha256, origin, device, status)
    values (p_cert_sha256, v_origin_clean, p_device, 'BLOCKED_CLONE');
    return jsonb_build_object(
      'ok', false,
      'owner', 'Zack Studios',
      'reason', 'Assinatura Zack Bytepass inválida ou domínio clonado.'
    );
  end if;

  insert into public.pulse_bytepass_audit (cert_sha256, origin, device, status)
  values (v_sig.cert_sha256, v_origin_clean, p_device, 'VERIFIED');

  return jsonb_build_object('ok', true, 'owner', v_sig.owner, 'signature_id', v_sig.id);
end;
$$;

-- RPC 2: Validação de Login por Código
create or replace function public.verify_pulse_login(
  p_code text,
  p_user_name text default null,
  p_device_model text default 'Web/Android',
  p_device_fingerprint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean text := upper(trim(coalesce(p_code, '')));
  v_row public.pulse_access_codes%rowtype;
  v_existing_session uuid;
  v_new_session uuid;
begin
  select * into v_row from public.pulse_access_codes where code = v_clean;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'Código inválido ou não autorizado.');
  end if;
  if not v_row.is_active then
    return jsonb_build_object('ok', false, 'reason', 'Este código foi desativado pela Zack Studios.');
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'Este código expirou.');
  end if;

  if p_device_fingerprint is not null and length(p_device_fingerprint) > 4 then
    select id into v_existing_session
    from public.pulse_login_sessions
    where code = v_clean and device_fingerprint = p_device_fingerprint and revoked = false
    limit 1;
  end if;

  if v_existing_session is not null then
    update public.pulse_login_sessions
    set last_seen_at = now(), user_name = coalesce(nullif(trim(p_user_name), ''), user_name)
    where id = v_existing_session;
    return jsonb_build_object('ok', true, 'session_id', v_existing_session, 'remaining_slots', greatest(0, v_row.max_uses - v_row.current_uses));
  end if;

  if v_row.current_uses >= v_row.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'Limite máximo de acessos atingido para este código.');
  end if;

  insert into public.pulse_login_sessions (code, user_name, device_model, device_fingerprint)
  values (v_clean, nullif(trim(p_user_name), ''), p_device_model, p_device_fingerprint)
  returning id into v_new_session;

  update public.pulse_access_codes set current_uses = current_uses + 1 where code = v_clean;
  return jsonb_build_object('ok', true, 'session_id', v_new_session, 'remaining_slots', greatest(0, v_row.max_uses - (v_row.current_uses + 1)));
end;
$$;

-- RPC 3: Verificação de Sessão Ativa (Revogação Remota)
create or replace function public.check_pulse_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revoked boolean;
  v_code_active boolean;
begin
  select s.revoked, c.is_active into v_revoked, v_code_active
  from public.pulse_login_sessions s
  join public.pulse_access_codes c on c.code = s.code
  where s.id = p_session_id;

  if not found or v_revoked or not v_code_active then
    return jsonb_build_object('active', false);
  end if;

  update public.pulse_login_sessions set last_seen_at = now() where id = p_session_id;
  return jsonb_build_object('active', true);
end;
$$;

grant execute on function public.verify_bytepass(text, text, text) to anon, authenticated;
grant execute on function public.verify_pulse_login(text, text, text, text) to anon, authenticated;
grant execute on function public.check_pulse_session(uuid) to anon, authenticated;
