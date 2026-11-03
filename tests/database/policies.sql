create function public.test_assert(value boolean, description text) returns void
language plpgsql as $$ begin
  if value is distinct from true then raise exception 'FAIL: %', description; end if;
  raise notice 'PASS: %', description;
end; $$;

select public.test_assert(
  (select count(*) = 4 from pg_class where relnamespace = 'public'::regnamespace and relname in ('organizations','memberships','employees','payroll_entries') and relrowsecurity),
  'RLS enabled on all four sample tables');

set role authenticated;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select public.test_assert((select count(*) = 1 from public.organizations), 'payroll user sees only own organization');
select public.test_assert((select count(*) = 1 from public.memberships), 'membership reads reveal only caller membership');
select public.test_assert((select count(*) = 6 from public.payroll_entries), 'payroll user cannot read the other organization');
select public.test_assert(
  jsonb_array_length(public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-09')->'rows') = 3,
  'RPC exports exactly approved employees for the earning month');
select public.test_assert(
  public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-09')->'rows'->0->>'bonus_cents' = '-2500',
  'negative bonus survives database serialization');
select public.test_assert(
  jsonb_array_length(public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-01')->'rows') = 0,
  'empty month returns an explicit empty array');
do $$ begin
  perform public.payroll_export_rows('20000000-0000-0000-0000-000000000002','2026-09');
  raise exception 'FAIL: cross-organization RPC was allowed';
exception when insufficient_privilege then raise notice 'PASS: cross-organization RPC denied'; end $$;
do $$ begin
  perform public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-13');
  raise exception 'FAIL: invalid month was allowed';
exception when invalid_parameter_value then raise notice 'PASS: invalid month denied by database'; end $$;
do $$ begin
  update public.memberships set role='admin';
  raise exception 'FAIL: self-promotion was allowed';
exception when insufficient_privilege then raise notice 'PASS: membership self-promotion denied'; end $$;
do $$ begin
  update public.payroll_entries set bonus_cents=1000000;
  raise exception 'FAIL: browser payroll mutation was allowed';
exception when insufficient_privilege then raise notice 'PASS: browser payroll mutation denied'; end $$;
do $$ begin
  delete from public.payroll_entries;
  raise exception 'FAIL: browser payroll deletion was allowed';
exception when insufficient_privilege then raise notice 'PASS: browser payroll deletion denied'; end $$;
do $$ begin
  insert into public.organizations(name) values ('injected');
  raise exception 'FAIL: browser organization creation was allowed';
exception when insufficient_privilege then raise notice 'PASS: browser organization creation denied'; end $$;

set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
select public.test_assert((select count(*) = 1 from public.employees), 'technician sees only own employee record');
select public.test_assert((select count(*) = 0 from public.payroll_entries), 'technician sees no payroll rows');
do $$ begin
  perform public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-09');
  raise exception 'FAIL: technician export was allowed';
exception when insufficient_privilege then raise notice 'PASS: technician export denied'; end $$;

set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
select public.test_assert((select count(*) = 0 from public.payroll_entries), 'dispatcher sees no payroll rows');
do $$ begin
  perform public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-09');
  raise exception 'FAIL: dispatcher export was allowed';
exception when insufficient_privilege then raise notice 'PASS: dispatcher export denied'; end $$;

set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000004';
select public.test_assert(jsonb_array_length(public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-09')->'rows') = 3, 'organization admin can export payroll');

set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000005';
select public.test_assert((select count(*) = 1 from public.payroll_entries), 'second organization payroll user is isolated');

set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000006';
set request.jwt.claims = '{"app_metadata":{"role":"admin"},"user_metadata":{"role":"admin"}}';
select public.test_assert((select count(*) = 0 from public.organizations), 'nonmember sees no organization despite forged metadata');
do $$ begin
  perform public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-09');
  raise exception 'FAIL: forged metadata granted export';
exception when insufficient_privilege then raise notice 'PASS: database ignores metadata role claims'; end $$;

set role anon;
do $$ begin
  perform 1 from public.payroll_entries;
  raise exception 'FAIL: anonymous table read was allowed';
exception when insufficient_privilege then raise notice 'PASS: anonymous table read denied'; end $$;
do $$ begin
  perform public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-09');
  raise exception 'FAIL: anonymous RPC was allowed';
exception when insufficient_privilege then raise notice 'PASS: anonymous RPC denied'; end $$;
reset role;

do $$ begin
  insert into public.payroll_entries(organization_id, employee_id, earning_month, booking_month, wage_cents, approval_state)
  values ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '2026-09', '2026-10', 100, 'approved');
  raise exception 'FAIL: cross-organization employee reference was allowed';
exception when foreign_key_violation then raise notice 'PASS: cross-organization foreign key denied'; end $$;
do $$ begin
  update public.payroll_entries set net_deduction_cents=-1;
  raise exception 'FAIL: negative deduction magnitude was allowed';
exception when check_violation then raise notice 'PASS: invalid monetary sign denied'; end $$;
do $$ begin
  update public.payroll_entries set earning_month='2026-13';
  raise exception 'FAIL: invalid database month was allowed';
exception when check_violation then raise notice 'PASS: invalid database month denied'; end $$;

-- Membership revocation applies immediately, even if an old token is still valid.
delete from public.memberships where user_id='10000000-0000-0000-0000-000000000001';
set role authenticated;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
do $$ begin
  perform public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-09');
  raise exception 'FAIL: revoked membership retained export';
exception when insufficient_privilege then raise notice 'PASS: revoked membership immediately denied'; end $$;
reset role;

insert into public.employees(organization_id, employee_no, employment_type)
select '20000000-0000-0000-0000-000000000001', 'T-' || n::text, 'employee' from generate_series(1,1002) n;
insert into public.payroll_entries(organization_id, employee_id, earning_month, booking_month, wage_cents, approval_state)
select organization_id, id, '2026-12', '2026-12', 100, 'approved' from public.employees where employee_no like 'T-%';
set role authenticated;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000004';
select public.test_assert(jsonb_array_length(public.payroll_export_rows('20000000-0000-0000-0000-000000000001','2026-12')->'rows') = 1001, 'RPC returns overflow sentinel rather than silently truncating at 1000');
reset role;
