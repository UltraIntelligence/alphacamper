BEGIN;

CREATE OR REPLACE FUNCTION public.rls_dev_override_enabled()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT false;
$$;

COMMIT;
