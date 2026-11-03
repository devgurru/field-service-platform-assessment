-- Original evaluation schema. Apply only to an empty evaluation project.
-- Organization scoping here demonstrates isolation; it does not imply a SaaS requirement.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120)
);

create table public.memberships (
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('admin', 'payroll', 'dispatcher', 'technician')),
  primary key (organization_id, user_id)
);
create index memberships_user_idx on public.memberships(user_id);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid references auth.users(id),
  employee_no text not null check (employee_no ~ '^[A-Z0-9][A-Z0-9-]{0,23}$'),
  employment_type text not null check (employment_type in ('employee', 'mini_job', 'subcontractor')),
  unique (organization_id, id),
  unique (organization_id, employee_no)
);
create index employees_user_idx on public.employees(user_id);

create table public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  employee_id uuid not null,
  earning_month text not null check (earning_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  booking_month text not null check (booking_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  wage_cents bigint not null check (wage_cents between 0 and 1000000000),
  compensation_cents bigint not null default 0 check (compensation_cents between 0 and 1000000000),
  net_deduction_cents bigint not null default 0 check (net_deduction_cents between 0 and 1000000000),
  bonus_cents bigint not null default 0 check (bonus_cents between -1000000000 and 1000000000),
  approval_state text not null check (approval_state in ('pending', 'approved')),
  foreign key (organization_id, employee_id) references public.employees(organization_id, id),
  unique (organization_id, employee_id, earning_month)
);
create index payroll_export_idx on public.payroll_entries(organization_id, earning_month, approval_state);

-- The only definer helper reads authoritative membership, with no dynamic SQL.
-- Keeping it out of the exposed API schema also avoids recursive membership policies.
create function private.has_role(p_organization_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.role = any(p_roles)
  );
$$;
revoke all on function private.has_role(uuid, text[]) from public, anon;
grant execute on function private.has_role(uuid, text[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.employees enable row level security;
alter table public.payroll_entries enable row level security;

-- Explicit table privileges, not policies alone. Browser writes and self-promotion are denied.
revoke all on public.organizations, public.memberships, public.employees, public.payroll_entries from anon, authenticated;
grant select on public.organizations, public.memberships, public.employees, public.payroll_entries to authenticated;

create policy organizations_member_read on public.organizations for select to authenticated
using (private.has_role(id, array['admin','payroll','dispatcher','technician']));

create policy memberships_self_read on public.memberships for select to authenticated
using (user_id = (select auth.uid()));

create policy employees_scoped_read on public.employees for select to authenticated
using (
  private.has_role(organization_id, array['admin','payroll'])
  or (
    user_id = (select auth.uid())
    and private.has_role(organization_id, array['technician'])
  )
);

create policy payroll_privileged_read on public.payroll_entries for select to authenticated
using (private.has_role(organization_id, array['admin','payroll']));

-- A single JSON value prevents PostgREST's default row limit from silently
-- truncating an export. Fetch one beyond the supported limit; the exporter
-- rejects that result rather than returning a partial file.
create function public.payroll_export_rows(p_organization_id uuid, p_earning_month text)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not private.has_role(p_organization_id, array['admin','payroll']) then
    raise insufficient_privilege using message = 'Payroll export not permitted';
  end if;
  if p_earning_month is null or p_earning_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then
    raise invalid_parameter_value using message = 'Invalid earning month';
  end if;
  return (
    select jsonb_build_object('rows', coalesce(jsonb_agg(to_jsonb(export_row)), '[]'::jsonb))
    from (
      select e.employee_no, e.employment_type, p.earning_month, p.booking_month,
        p.wage_cents, p.compensation_cents, p.net_deduction_cents, p.bonus_cents, p.approval_state
      from public.payroll_entries p
      join public.employees e on e.organization_id = p.organization_id and e.id = p.employee_id
      where p.organization_id = p_organization_id and p.earning_month = p_earning_month
        and p.approval_state = 'approved' and e.employment_type <> 'subcontractor'
      order by e.employee_no collate "C"
      limit 1001
    ) export_row
  );
end;
$$;
revoke all on function public.payroll_export_rows(uuid, text) from public, anon;
grant execute on function public.payroll_export_rows(uuid, text) to authenticated;

comment on function public.payroll_export_rows(uuid, text) is
  'Read-only evaluation RPC: caller privileges and RLS apply; no service-role access.';
