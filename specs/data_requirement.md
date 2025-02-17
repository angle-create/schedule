# スケジュール管理システム データ設計

## 1. データベース概要
Supabaseを使用し、PostgreSQLデータベースで実装します。

## 2. テーブル設計

### 2.1 users（ユーザー）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 schedules（予定）
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  is_online BOOLEAN DEFAULT false,
  creator_id UUID NOT NULL REFERENCES users(id),
  recurrence_rule TEXT, -- iCalendarのRRULEフォーマット
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 schedule_participants（予定参加者）
```sql
CREATE TABLE schedule_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(schedule_id, user_id)
);
```

### 2.4 notification_settings（通知設定）
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  slack_channel VARCHAR(100),
  slack_mention_type VARCHAR(20) DEFAULT 'none', -- 'none', 'direct', 'here', 'channel'
  email_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  reminder_before_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### 2.5 schedule_changes（予定変更履歴）
```sql
CREATE TABLE schedule_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id),
  changed_by UUID NOT NULL REFERENCES users(id),
  change_type VARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
  changes JSONB, -- 変更内容を格納
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 3. インデックス設計
```sql
-- スケジュール検索の効率化
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_schedules_end_time ON schedules(end_time);
CREATE INDEX idx_schedules_creator ON schedules(creator_id);

-- 参加者検索の効率化
CREATE INDEX idx_schedule_participants_user ON schedule_participants(user_id);
CREATE INDEX idx_schedule_participants_schedule ON schedule_participants(schedule_id);
CREATE INDEX idx_schedule_participants_status ON schedule_participants(status);

-- 変更履歴の検索効率化
CREATE INDEX idx_schedule_changes_schedule ON schedule_changes(schedule_id);
```

## 4. RLS（Row Level Security）ポリシー

### 4.1 schedules
```sql
-- 読み取りポリシー
CREATE POLICY "スケジュールの読み取り" ON schedules
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM schedule_participants WHERE schedule_id = schedules.id
      UNION
      SELECT creator_id FROM schedules WHERE id = schedules.id
    )
  );

-- 作成ポリシー
CREATE POLICY "スケジュールの作成" ON schedules
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- 更新ポリシー
CREATE POLICY "スケジュールの更新" ON schedules
  FOR UPDATE
  USING (
    auth.uid() = creator_id OR
    auth.uid() IN (
      SELECT user_id FROM users WHERE role = 'admin'
    )
  );
```

## 5. データ関連機能

### 5.1 関数とトリガー
```sql
-- 予定変更時の通知トリガー
CREATE FUNCTION notify_schedule_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO schedule_changes (
    schedule_id,
    changed_by,
    change_type,
    changes
  ) VALUES (
    NEW.id,
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    CASE
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'before', row_to_json(OLD),
        'after', row_to_json(NEW)
      )
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON schedules
FOR EACH ROW EXECUTE FUNCTION notify_schedule_change();
```

### 5.2 ビュー
```sql
-- ユーザーの予定一覧ビュー
CREATE VIEW user_schedules AS
SELECT 
  s.*,
  sp.status as participant_status,
  u.display_name as creator_name
FROM schedules s
JOIN schedule_participants sp ON s.id = sp.schedule_id
JOIN users u ON s.creator_id = u.id
WHERE sp.user_id = auth.uid();

-- 今日の予定ビュー
CREATE VIEW today_schedules AS
SELECT *
FROM user_schedules
WHERE 
  start_time >= CURRENT_DATE AND
  start_time < (CURRENT_DATE + INTERVAL '1 day');
```