alter table public.profiles
  add column if not exists branch_code text not null default 'main';

alter table public.profiles
  add column if not exists last_login_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'manager', 'branch_manager', 'staff', 'driver'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin', 'manager', 'branch_manager')
  );
$$;
