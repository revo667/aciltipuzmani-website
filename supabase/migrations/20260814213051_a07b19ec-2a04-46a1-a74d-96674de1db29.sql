INSERT INTO public.user_roles (user_id, role)
VALUES ('fe05cc59-b838-4a40-acd6-e8e02ebb4ce8', 'admin')
ON CONFLICT DO NOTHING;