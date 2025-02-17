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

DROP POLICY IF EXISTS "ユーザーは自分が作成した予定を参照可能" ON schedules;
DROP POLICY IF EXISTS "ユーザーは自分が参加者の予定を参照可能" ON schedules;
DROP POLICY IF EXISTS "管理者は全ての予定を参照可能" ON schedules;
DROP POLICY IF EXISTS "ユーザーは自分が作成した予定を更新可能" ON schedules;
DROP POLICY IF EXISTS "管理者は全ての予定を更新可能" ON schedules;
DROP POLICY IF EXISTS "ユーザーは予定を作成可能" ON schedules;
DROP POLICY IF EXISTS "ユーザーは自分が作成した予定を削除可能" ON schedules;
DROP POLICY IF EXISTS "管理者は全ての予定を削除可能" ON schedules;

DROP POLICY IF EXISTS "ユーザーは自分の参加情報を参照可能" ON schedule_participants;
DROP POLICY IF EXISTS "予定作成者は参加者情報を参照可能" ON schedule_participants;
DROP POLICY IF EXISTS "管理者は全ての参加者情報を参照可能" ON schedule_participants;
DROP POLICY IF EXISTS "ユーザーは自分の参加ステータスを更新可能" ON schedule_participants;
DROP POLICY IF EXISTS "予定作成者は参加者を追加可能" ON schedule_participants;

DROP POLICY IF EXISTS "ユーザーは自分の通知設定を参照可能" ON notification_settings;
DROP POLICY IF EXISTS "ユーザーは自分の通知設定を更新可能" ON notification_settings;
DROP POLICY IF EXISTS "ユーザーは自分の通知設定を作成可能" ON notification_settings;

DROP POLICY IF EXISTS "ユーザーは関連する予定の変更履歴を参照可能" ON schedule_changes;
DROP POLICY IF EXISTS "管理者は全ての変更履歴を参照可能" ON schedule_changes;
DROP POLICY IF EXISTS "システムは変更履歴を作成可能" ON schedule_changes;

-- usersテーブルのポリシー
CREATE POLICY "全てのユーザーが参照可能" ON users
  FOR SELECT USING (true);

CREATE POLICY "ユーザーは自分の情報を更新可能" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "管理者は全てのユーザー情報を更新可能" ON users
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');

-- schedulesテーブルのポリシー
CREATE POLICY "ユーザーは予定を参照可能" ON schedules
  FOR SELECT USING (
    creator_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
    OR id IN (
      SELECT schedule_id FROM schedule_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ユーザーは予定を更新可能" ON schedules
  FOR UPDATE USING (
    creator_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "ユーザーは予定を作成可能" ON schedules
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ユーザーは予定を削除可能" ON schedules
  FOR DELETE USING (
    creator_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

-- schedule_participantsテーブルのポリシー
CREATE POLICY "ユーザーは参加情報を参照可能" ON schedule_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
    OR schedule_id IN (
      SELECT id FROM schedules
      WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "ユーザーは参加ステータスを更新可能" ON schedule_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "ユーザーは参加者を追加可能" ON schedule_participants
  FOR INSERT WITH CHECK (
    schedule_id IN (
      SELECT id FROM schedules
      WHERE creator_id = auth.uid()
    )
    OR auth.jwt()->>'role' = 'admin'
  );

-- notification_settingsテーブルのポリシー
CREATE POLICY "ユーザーは自分の通知設定を参照可能" ON notification_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ユーザーは自分の通知設定を更新可能" ON notification_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "ユーザーは自分の通知設定を作成可能" ON notification_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- schedule_changesテーブルのポリシー
CREATE POLICY "ユーザーは関連する予定の変更履歴を参照可能" ON schedule_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schedules s
      LEFT JOIN schedule_participants sp ON s.id = sp.schedule_id
      WHERE s.id = schedule_id 
      AND (
        s.creator_id = auth.uid() 
        OR sp.user_id = auth.uid()
        OR auth.jwt()->>'role' = 'admin'
      )
    )
  );

CREATE POLICY "システムは変更履歴を作成可能" ON schedule_changes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); 