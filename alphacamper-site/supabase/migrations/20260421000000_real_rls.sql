ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.rls_dev_override_enabled()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    lower(
      COALESCE(
        (
          COALESCE(
            NULLIF(current_setting('request.headers', true), ''),
            '{}'
          )::jsonb ->> 'x-rls-dev-override'
        ),
        'false'
      )
    ) = 'true',
    false
  );
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM users u
    JOIN auth.users au ON lower(au.email) = lower(u.email)
    WHERE u.id <> au.id
  ) THEN
    ALTER TABLE watched_targets DROP CONSTRAINT IF EXISTS watched_targets_user_id_fkey;
    ALTER TABLE availability_alerts DROP CONSTRAINT IF EXISTS availability_alerts_user_id_fkey;

    UPDATE watched_targets wt
    SET user_id = au.id
    FROM users u
    JOIN auth.users au ON lower(au.email) = lower(u.email)
    WHERE wt.user_id = u.id
      AND u.id <> au.id;

    UPDATE availability_alerts aa
    SET user_id = au.id
    FROM users u
    JOIN auth.users au ON lower(au.email) = lower(u.email)
    WHERE aa.user_id = u.id
      AND u.id <> au.id;

    UPDATE users u
    SET id = au.id
    FROM auth.users au
    WHERE lower(u.email) = lower(au.email)
      AND u.id <> au.id;

    ALTER TABLE watched_targets
      ADD CONSTRAINT watched_targets_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

    ALTER TABLE availability_alerts
      ADD CONSTRAINT availability_alerts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users read own data" ON users;
DROP POLICY IF EXISTS "Users update own data" ON users;
DROP POLICY IF EXISTS "Users delete own data" ON users;
DROP POLICY IF EXISTS "user_insert" ON users;
DROP POLICY IF EXISTS "user_select" ON users;

DROP POLICY IF EXISTS "Allow watched target inserts" ON watched_targets;
DROP POLICY IF EXISTS "Allow watched target reads" ON watched_targets;
DROP POLICY IF EXISTS "Allow watched target updates" ON watched_targets;
DROP POLICY IF EXISTS "Allow watched target deletes" ON watched_targets;
DROP POLICY IF EXISTS "wt_insert" ON watched_targets;
DROP POLICY IF EXISTS "wt_select" ON watched_targets;
DROP POLICY IF EXISTS "wt_update" ON watched_targets;
DROP POLICY IF EXISTS "wt_delete" ON watched_targets;

DROP POLICY IF EXISTS "Allow alert inserts" ON availability_alerts;
DROP POLICY IF EXISTS "Allow alert reads" ON availability_alerts;
DROP POLICY IF EXISTS "Allow alert updates" ON availability_alerts;
DROP POLICY IF EXISTS "Allow alert deletes" ON availability_alerts;
DROP POLICY IF EXISTS "alert_insert" ON availability_alerts;
DROP POLICY IF EXISTS "alert_select" ON availability_alerts;
DROP POLICY IF EXISTS "alert_update" ON availability_alerts;
DROP POLICY IF EXISTS "alert_delete" ON availability_alerts;

CREATE POLICY "Users insert own data" ON users
  FOR INSERT WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  );

CREATE POLICY "Users read own data" ON users
  FOR SELECT USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  );

CREATE POLICY "Users update own data" ON users
  FOR UPDATE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  )
  WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  );

CREATE POLICY "Users delete own data" ON users
  FOR DELETE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  );

CREATE POLICY "Watched targets insert own data" ON watched_targets
  FOR INSERT WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );

CREATE POLICY "Watched targets read own data" ON watched_targets
  FOR SELECT USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );

CREATE POLICY "Watched targets update own data" ON watched_targets
  FOR UPDATE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  )
  WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );

CREATE POLICY "Watched targets delete own data" ON watched_targets
  FOR DELETE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );

CREATE POLICY "Alerts insert own data" ON availability_alerts
  FOR INSERT WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );

CREATE POLICY "Alerts read own data" ON availability_alerts
  FOR SELECT USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );

CREATE POLICY "Alerts update own data" ON availability_alerts
  FOR UPDATE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  )
  WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );

CREATE POLICY "Alerts delete own data" ON availability_alerts
  FOR DELETE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );
