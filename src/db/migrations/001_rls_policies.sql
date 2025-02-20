-- RLSを有効化
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_changes ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "全てのユーザーが参照可能" ON users;
DROP POLICY IF EXISTS "ユーザーは自分の情報を更新可能" ON users;
DROP POLICY IF EXISTS "管理者は全てのユーザー情報を更新可能" ON users;

DROP POLICY IF EXISTS "ユーザーは予定を参照可能" ON schedules;
DROP POLICY IF EXISTS "ユーザーは予定を更新可能" ON schedules;
DROP POLICY IF EXISTS "ユーザーは予定を作成可能" ON schedules;
DROP POLICY IF EXISTS "ユーザーは予定を削除可能" ON schedules;

DROP POLICY IF EXISTS "ユーザーは参加情報を参照可能" ON schedule_participants;
DROP POLICY IF EXISTS "ユーザーは参加ステータスを更新可能" ON schedule_participants;
DROP POLICY IF EXISTS "ユーザーは参加者を追加可能" ON schedule_participants;

DROP POLICY IF EXISTS "ユーザーは自分の通知設定を参照可能" ON notification_settings;
DROP POLICY IF EXISTS "ユーザーは自分の通知設定を更新可能" ON notification_settings;
DROP POLICY IF EXISTS "ユーザーは自分の通知設定を作成可能" ON notification_settings;

DROP POLICY IF EXISTS "ユーザーは関連する予定の変更履歴を参照可能" ON schedule_changes;
DROP POLICY IF EXISTS "システムは変更履歴を作成可能" ON schedule_changes;

-- usersテーブルのポリシー
CREATE POLICY "全てのユーザーが参照可能" ON users
  FOR SELECT USING (true);

CREATE POLICY "ユーザーは自分の情報を更新可能" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "管理者は全てのユーザー情報を更新可能" ON users
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');

-- schedulesテーブルのポリシー
CREATE POLICY "基本的なスケジュールアクセス" ON schedules
  FOR ALL USING (
    creator_id = auth.uid() 
    OR auth.jwt()->>'role' = 'admin'
  );

-- schedule_participantsテーブルのポリシー
CREATE POLICY "基本的な参加者アクセス" ON schedule_participants
  FOR ALL USING (
    user_id = auth.uid() 
    OR auth.jwt()->>'role' = 'admin'
  );

-- notification_settingsテーブルのポリシー
CREATE POLICY "基本的な通知設定アクセス" ON notification_settings
  FOR ALL USING (
    user_id = auth.uid() 
    OR auth.jwt()->>'role' = 'admin'
  );

-- schedule_changesテーブルのポリシー
CREATE POLICY "基本的な変更履歴アクセス" ON schedule_changes
  FOR ALL USING (
    auth.uid() IS NOT NULL 
    OR auth.jwt()->>'role' = 'admin'
  ); 