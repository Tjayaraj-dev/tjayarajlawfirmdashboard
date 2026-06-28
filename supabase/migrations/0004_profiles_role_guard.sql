-- Close a privilege-escalation gap: the profiles update policy lets a user edit
-- their own row, which would include the role column — a staff member could
-- self-promote to admin. This trigger blocks any role change made by a normal
-- authenticated user who is not already an admin. service_role / postgres
-- (seeds, migrations, server-side admin actions) bypass it.

-- NOT security definer: the guard must see the CALLER's role via current_user.
-- (security definer would make current_user resolve to the owner, postgres,
-- defeating the check.) is_admin() supplies its own definer rights to read the
-- caller's profile.
create or replace function guard_profile_role()
returns trigger
language plpgsql set search_path = public as $$
begin
  if new.role is distinct from old.role
     and current_user = 'authenticated'
     and not is_admin() then
    raise exception 'Only an admin may change a role';
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard
  before update on profiles
  for each row execute function guard_profile_role();
