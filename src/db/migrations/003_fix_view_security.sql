-- Set proper permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Drop existing views
DROP VIEW IF EXISTS today_schedules;
DROP VIEW IF EXISTS user_schedules;

-- Update existing RLS policy
DROP POLICY IF EXISTS "Users can access their schedules" ON schedules;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON schedules;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON schedules;

-- Ensure RLS is enabled
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Fix function search_path 
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON schedules
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM schedule_participants 
    WHERE schedule_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Enable write access for authenticated users"
ON schedules
FOR ALL
TO authenticated
USING (creator_id = auth.uid());

-- Recreate today_schedules view
CREATE VIEW today_schedules
WITH (security_invoker = on)
AS
SELECT 
  s.id,
  s.title,
  s.start_time,
  s.end_time,
  s.is_online,
  s.location,
  s.creator_id,
  u.display_name as creator_name,
  sp.status as participant_status,
  auth.uid() = s.creator_id as is_creator
FROM schedules s
JOIN users u ON s.creator_id = u.id
LEFT JOIN schedule_participants sp ON s.id = sp.schedule_id AND sp.user_id = auth.uid()
WHERE DATE(s.start_time AT TIME ZONE 'Asia/Tokyo') = CURRENT_DATE;

-- Recreate user_schedules view
CREATE VIEW user_schedules
WITH (security_invoker = on)
AS
SELECT 
  s.id,
  s.title,
  s.description,
  s.start_time,
  s.end_time,
  s.is_online,
  s.location,
  s.creator_id,
  u.display_name as creator_name,
  sp.status as participant_status,
  auth.uid() = s.creator_id as is_creator
FROM schedules s
JOIN users u ON s.creator_id = u.id
LEFT JOIN schedule_participants sp ON s.id = sp.schedule_id AND sp.user_id = auth.uid()
WHERE s.creator_id = auth.uid() 
   OR sp.user_id = auth.uid();

-- Grant permissions on views
GRANT SELECT ON today_schedules TO authenticated;
GRANT SELECT ON user_schedules TO authenticated; 