
create policy "School members can read branding files"
on storage.objects for select to authenticated
using (bucket_id = 'school-branding' and public.is_member_of_school(auth.uid(), ((storage.foldername(name))[1])::uuid));

create policy "School admins can upload branding files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'school-branding' and (
    public.is_super_admin(auth.uid())
    or public.has_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'school_admin')
    or public.has_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'school_owner')
  )
);

create policy "School admins can update branding files"
on storage.objects for update to authenticated
using (
  bucket_id = 'school-branding' and (
    public.is_super_admin(auth.uid())
    or public.has_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'school_admin')
    or public.has_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'school_owner')
  )
);

create policy "School admins can delete branding files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'school-branding' and (
    public.is_super_admin(auth.uid())
    or public.has_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'school_admin')
    or public.has_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'school_owner')
  )
);
