-- ユーザー作成トリガー関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーを削除（念のため）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 新規ユーザー作成時のトリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- トリガーのテストクエリ
/*
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  jsonb_build_object(
    'display_name', 'Test User',
    'role', 'member'
  )
);
*/ 