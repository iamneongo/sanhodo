create table if not exists public.admin_login_audits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  email text,
  role text,
  branch_id uuid references public.branches(id) on delete set null,
  login_method text not null default 'password',
  success boolean not null default true,
  ip_address text,
  user_agent text,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_audits_profile_idx
  on public.admin_login_audits(profile_id, created_at desc);

create index if not exists admin_login_audits_email_idx
  on public.admin_login_audits(email, created_at desc);

create index if not exists admin_login_audits_branch_idx
  on public.admin_login_audits(branch_id, created_at desc);
