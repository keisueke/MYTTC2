-- Cloudflare D1 初期スキーマ
-- マイグレーション: 0001_initial_schema.sql

-- tasks テーブル
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT,
  mode_id TEXT,
  tag_ids TEXT, -- JSON配列として保存 ['id1', 'id2']
  goal_id TEXT,
  repeat_pattern TEXT NOT NULL DEFAULT 'none',
  repeat_config TEXT, -- JSONとして保存
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  elapsed_time INTEGER DEFAULT 0,
  is_running INTEGER DEFAULT 0,
  estimated_time INTEGER,
  completed_at TEXT,
  skipped_at TEXT,
  order_index INTEGER,
  due_date TEXT,
  time_section_id TEXT,
  show_in_routine_checker INTEGER DEFAULT 1
);

-- projects テーブル
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL
);

-- modes テーブル
CREATE TABLE IF NOT EXISTS modes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL
);

-- tags テーブル
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL
);

-- routine_executions テーブル
CREATE TABLE IF NOT EXISTS routine_executions (
  id TEXT PRIMARY KEY,
  routine_task_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD形式
  completed_at TEXT,
  skipped_at TEXT,
  elapsed_time INTEGER DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (routine_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(routine_task_id, date)
);

-- daily_records テーブル
CREATE TABLE IF NOT EXISTS daily_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD形式
  weight REAL,
  bedtime TEXT, -- HH:mm形式
  wake_time TEXT, -- HH:mm形式
  sleep_duration INTEGER, -- 分単位
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  snack TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- goals テーブル
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  parent_goal_id TEXT,
  position INTEGER,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_goal_id) REFERENCES goals(id) ON DELETE SET NULL
);

-- memos テーブル
CREATE TABLE IF NOT EXISTS memos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- memo_templates テーブル
CREATE TABLE IF NOT EXISTS memo_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- wishes テーブル
CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT,
  mode_id TEXT,
  tag_ids TEXT, -- JSON配列として保存
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (mode_id) REFERENCES modes(id) ON DELETE SET NULL
);

-- sub_tasks テーブル
CREATE TABLE IF NOT EXISTS sub_tasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed_at TEXT,
  order_index INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- user_settings テーブル（設定情報）
-- 現在は単一ユーザー想定のため、user_idは固定値 'default' を使用
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY DEFAULT 'default',
  theme TEXT DEFAULT 'dark',
  sidebar_always_visible INTEGER DEFAULT 0,
  sidebar_width INTEGER DEFAULT 320,
  week_start_day TEXT DEFAULT 'monday',
  time_section_settings TEXT, -- JSONとして保存
  time_axis_settings TEXT, -- JSONとして保存 {'startHour': 6, 'endHour': 22}
  dashboard_layout TEXT, -- JSONとして保存
  summary_config TEXT, -- JSONとして保存
  weather_config TEXT, -- JSONとして保存 {'cityName': '東京', 'latitude': 35.6762, 'longitude': 139.6503}
  ui_mode TEXT DEFAULT 'desktop',
  updated_at TEXT NOT NULL
);

-- インデックスの作成（パフォーマンス向上のため）

-- tasks テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_mode_id ON tasks(mode_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_repeat_pattern ON tasks(repeat_pattern);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- routine_executions テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_routine_executions_routine_task_id ON routine_executions(routine_task_id);
CREATE INDEX IF NOT EXISTS idx_routine_executions_date ON routine_executions(date);
CREATE INDEX IF NOT EXISTS idx_routine_executions_completed_at ON routine_executions(completed_at);

-- daily_records テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);

-- goals テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_goals_year ON goals(year);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal_id ON goals(parent_goal_id);

-- sub_tasks テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_sub_tasks_task_id ON sub_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_sub_tasks_order_index ON sub_tasks(order_index);

-- wishes テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_wishes_project_id ON wishes(project_id);
CREATE INDEX IF NOT EXISTS idx_wishes_mode_id ON wishes(mode_id);

