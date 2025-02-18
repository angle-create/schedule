-- 既存のトリガーとポリシーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP POLICY IF EXISTS "新規ユーザーの作成を許可" ON public.users;
DROP POLICY IF EXISTS "ユーザーは自分の情報を更新可能" ON public.users;
DROP POLICY IF EXISTS "全てのユーザーが参照可能" ON public.users;

-- トリガー関数を作成/更新
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql 
AS $$
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
$$;

-- トリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLSポリシーを更新
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "新規ユーザーの作成を許可" ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ユーザーは自分の情報を更新可能" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "全てのユーザーが参照可能" ON public.users
  FOR SELECT
  USING (true); 