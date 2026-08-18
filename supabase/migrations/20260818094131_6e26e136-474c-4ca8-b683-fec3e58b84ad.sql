-- Trigger-only functions: nobody should call these directly
revoke all on function public.update_updated_at_column() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Policy helper functions: needed by signed-in users for RLS evaluation, never by anonymous callers
revoke all on function public.is_super_admin(uuid) from public, anon;
revoke all on function public.is_member_of_school(uuid, uuid) from public, anon;
revoke all on function public.has_role(uuid, uuid, public.app_role) from public, anon;

grant execute on function public.is_super_admin(uuid) to authenticated;
grant execute on function public.is_member_of_school(uuid, uuid) to authenticated;
grant execute on function public.has_role(uuid, uuid, public.app_role) to authenticated;