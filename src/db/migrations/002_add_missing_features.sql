-- アバター機能の追加
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- カレンダー表示設定テーブルの作成
CREATE TABLE calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  default_view TEXT NOT NULL DEFAULT 'month' CHECK (default_view IN ('month', 'week', 'day')),
  week_starts_on INTEGER NOT NULL DEFAULT 0,
  display_hour_start INTEGER NOT NULL DEFAULT 0,
  display_hour_end INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Slack通知の詳細設定の追加
ALTER TABLE notification_settings 
  ADD COLUMN notify_on_create BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN notify_on_update BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN notify_on_status_change BOOLEAN NOT NULL DEFAULT true;

-- カレンダー設定のRLSポリシー
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のカレンダー設定を参照可能" ON calendar_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ユーザーは自分のカレンダー設定を更新可能" ON calendar_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "ユーザーは自分のカレンダー設定を作成可能" ON calendar_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 更新日時トリガーの追加
CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at(); 