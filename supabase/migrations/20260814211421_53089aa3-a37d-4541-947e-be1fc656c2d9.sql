REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

DROP POLICY "posts_public_read" ON public.posts;
CREATE POLICY "posts_anon_read" ON public.posts FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "posts_auth_read" ON public.posts FOR SELECT TO authenticated USING (status = 'published' OR public.is_staff(auth.uid()));

DROP POLICY "events_public_read" ON public.events;
CREATE POLICY "events_anon_read" ON public.events FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "events_auth_read" ON public.events FOR SELECT TO authenticated USING (status = 'published' OR public.is_staff(auth.uid()));