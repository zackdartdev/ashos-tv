-- ============================================================================
-- PulseTV v3.0 — Controle de Logins e Códigos de Acesso no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Tabela de Códigos de Acesso (controle total: ativar, pausar, mudar código, limite de acessos)
create table if not exists public.pulse_access_codes (
  code text primary key,
  is_active boolean not null default true,
  max_uses integer not null default 1000,
  current_uses integer not null default 0,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- 2. Tabela de Sessões / Logins (rastreamento por aparelho e revogação remota)
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

-- Insere o novo código exclusivo padrão do PulseTV: PLS9K4
insert into public.pulse_access_codes (code, is_active, max_uses, notes)
values ('PLS9K4', true, 1000, 'Lote oficial PulseTV v3.0')
on conflict (code) do update
set is_active = excluded.is_active,
    max_uses = excluded.max_uses;

-- Ativa Row Level Security (clientes anônimos só podem validar via RPC segura)
alter table public.pulse_access_codes enable row level security;
alter table public.pulse_login_sessions enable row level security;

-- 3. Função RPC Segura chamada pelo app PulseTV no login
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
  select * into v_row
  from public.pulse_access_codes
  where code = v_clean;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'Código inválido ou não autorizado.');
  end if;

  if not v_row.is_active then
    return jsonb_build_object('ok', false, 'reason', 'Este código foi desativado pelo administrador.');
  end if;

  if v_row.expires_at is not null and v_row.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'Este código expirou.');
  end if;

  -- Se o mesmo aparelho já entrou antes com este código, apenas renova a sessão sem gastar nova vaga
  if p_device_fingerprint is not null and length(p_device_fingerprint) > 4 then
    select id into v_existing_session
    from public.pulse_login_sessions
    where code = v_clean
      and device_fingerprint = p_device_fingerprint
      and revoked = false
    limit 1;
  end if;

  if v_existing_session is not null then
    update public.pulse_login_sessions
    set last_seen_at = now(),
        user_name = coalesce(nullif(trim(p_user_name), ''), user_name)
    where id = v_existing_session;

    return jsonb_build_object(
      'ok', true,
      'session_id', v_existing_session,
      'remaining_slots', greatest(0, v_row.max_uses - v_row.current_uses)
    );
  end if;

  if v_row.current_uses >= v_row.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'Limite máximo de acessos atingido para este código.');
  end if;

  insert into public.pulse_login_sessions (code, user_name, device_model, device_fingerprint)
  values (v_clean, nullif(trim(p_user_name), ''), p_device_model, p_device_fingerprint)
  returning id into v_new_session;

  update public.pulse_access_codes
  set current_uses = current_uses + 1
  where code = v_clean;

  return jsonb_build_object(
    'ok', true,
    'session_id', v_new_session,
    'remaining_slots', greatest(0, v_row.max_uses - (v_row.current_uses + 1))
  );
end;
$$;

-- 4. Função RPC para validar se a sessão ainda está ativa (permite revogação remota!)
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
  select s.revoked, c.is_active
  into v_revoked, v_code_active
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

grant execute on function public.verify_pulse_login(text, text, text, text) to anon, authenticated;
grant execute on function public.check_pulse_session(uuid) to anon, authenticated;
