---
name: cloudflare-migration
overview: GitHub APIベースのデータ管理からCloudflare（D1/KV + Workers + Pages）への移行
todos:
  - id: cf-research
    content: Cloudflare D1とKVの比較検討、無料プランの制限確認、最適なデータストレージ選択
    status: pending
  - id: cf-d1-schema
    content: Cloudflare D1のデータベーススキーマ設計（tasks, projects, modes, tags, daily_records等のテーブル定義）
    status: pending
    dependencies:
      - cf-research
  - id: cf-workers-api
    content: Cloudflare WorkersでREST APIエンドポイントを作成（CRUD操作、認証、データ同期）
    status: pending
    dependencies:
      - cf-d1-schema
  - id: cf-auth
    content: 認証システムの実装（Cloudflare Access、またはJWTベースの独自認証）
    status: pending
  - id: cf-client-service
    content: フロントエンドのデータサービス層をGitHub APIからCloudflare Workers APIに切り替え
    status: pending
    dependencies:
      - cf-workers-api
  - id: cf-migration-script
    content: 既存のGitHubデータをCloudflare D1に移行するスクリプトの作成
    status: pending
    dependencies:
      - cf-d1-schema
      - cf-workers-api
  - id: cf-pages-deploy
    content: Cloudflare Pagesへのデプロイ設定（wrangler.toml、ビルド設定、環境変数）
    status: pending
  - id: cf-testing
    content: 移行後の動作確認とテスト（E2Eテストの更新、データ整合性確認）
    status: pending
    dependencies:
      - cf-client-service
      - cf-pages-deploy
---

# Cloudflare移行実装計画

## 概要

現在GitHub APIを使用してデータを保存・同期しているシステムを、Cloudflare（D1/KV + Workers + Pages）に移行します。これにより、無料プランでもより安定したデータ管理と高速なAPI応答が可能になります。

## 現状の構成

### データ管理
- **ローカルストレージ**: ブラウザのLocalStorageにデータを保存
- **GitHub API**: データをGitHubリポジトリのJSONファイルとして保存・同期
- **データ分割**: 複数のJSONファイルに分割（tasks.json, memos.json, dailyRecords.json, goals.json, settings.json）

### デプロイ
- **GitHub Pages**: 静的サイトとしてデプロイ
- **ベースパス**: `/MYTTC2/`

## 移行先の構成

### データストレージ
- **Cloudflare D1**: SQLiteベースのデータベース（推奨）
  - リレーショナルデータに適している
  - 無料プラン: 5GBストレージ、100,000行/日（読み取り）、1,000行/日（書き込み）
- **または Cloudflare KV**: Key-Valueストレージ
  - シンプルなデータ構造に適している
  - 無料プラン: 100,000読み取り/日、1,000書き込み/日

### API
- **Cloudflare Workers**: REST APIエンドポイント
  - 無料プラン: 100,000リクエスト/日

### デプロイ
- **Cloudflare Pages**: フロントエンドのデプロイ
  - 無料プラン: 無制限のビルド、無制限の帯域幅

## 実装内容

### 1. データストレージの選択とスキーマ設計

**ファイル**: `wrangler.toml`（新規）、`migrations/`（新規）

#### Cloudflare D1を選択する場合

**スキーマ設計例**:

```sql
-- tasks テーブル
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT,
  mode_id TEXT,
  tag_ids TEXT, -- JSON配列として保存
  goal_id TEXT,
  repeat_pattern TEXT NOT NULL DEFAULT 'none',
  repeat_config TEXT, -- JSONとして保存
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  elapsed_time INTEGER,
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
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL
);

-- modes テーブル
CREATE TABLE modes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL
);

-- tags テーブル
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL
);

-- routine_executions テーブル
CREATE TABLE routine_executions (
  id TEXT PRIMARY KEY,
  routine_task_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completed_at TEXT,
  skipped_at TEXT,
  elapsed_time INTEGER,
  start_time TEXT,
  end_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (routine_task_id) REFERENCES tasks(id)
);

-- daily_records テーブル
CREATE TABLE daily_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight REAL,
  bedtime TEXT,
  wake_time TEXT,
  sleep_duration INTEGER,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  snack TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- goals テーブル
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER,
  parent_goal_id TEXT,
  position INTEGER,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- memos テーブル
CREATE TABLE memos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- memo_templates テーブル
CREATE TABLE memo_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- wishes テーブル
CREATE TABLE wishes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT,
  mode_id TEXT,
  tag_ids TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- sub_tasks テーブル
CREATE TABLE sub_tasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed_at TEXT,
  order_index INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- user_settings テーブル（設定情報）
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  theme TEXT,
  sidebar_always_visible INTEGER DEFAULT 0,
  sidebar_width INTEGER DEFAULT 320,
  week_start_day TEXT DEFAULT 'monday',
  time_section_settings TEXT, -- JSONとして保存
  time_axis_settings TEXT, -- JSONとして保存
  dashboard_layout TEXT, -- JSONとして保存
  summary_config TEXT, -- JSONとして保存
  weather_config TEXT, -- JSONとして保存
  ui_mode TEXT DEFAULT 'desktop',
  updated_at TEXT NOT NULL
);
```

**マイグレーションファイル**: `migrations/0001_initial_schema.sql`

### 2. Cloudflare Workers APIの実装

**ディレクトリ**: `workers/`（新規）

**ファイル構成**:
```
workers/
├── src/
│   ├── index.ts          # メインエントリーポイント
│   ├── routes/
│   │   ├── tasks.ts      # タスク関連のエンドポイント
│   │   ├── projects.ts   # プロジェクト関連
│   │   ├── modes.ts      # モード関連
│   │   ├── tags.ts       # タグ関連
│   │   ├── dailyRecords.ts
│   │   ├── goals.ts
│   │   ├── memos.ts
│   │   └── sync.ts       # データ同期エンドポイント
│   ├── auth.ts           # 認証ミドルウェア
│   ├── db.ts             # D1データベース接続
│   └── types.ts          # 型定義
├── wrangler.toml         # Workers設定
└── package.json
```

**主要なエンドポイント**:
- `GET /api/tasks` - タスク一覧取得
- `POST /api/tasks` - タスク作成
- `PUT /api/tasks/:id` - タスク更新
- `DELETE /api/tasks/:id` - タスク削除
- `GET /api/sync` - データ同期（最終更新時刻ベース）
- `POST /api/sync` - データ同期（競合解決）

### 3. 認証システム

**オプション1: Cloudflare Access**（推奨）
- 企業向け機能（有料プランが必要な場合あり）
- 簡単に実装可能

**オプション2: JWTベースの独自認証**
- 無料で実装可能
- ユーザー管理が必要

**オプション3: シンプルなAPIキー認証**
- 開発・個人利用向け
- 環境変数でAPIキーを管理

### 4. フロントエンドのデータサービス層の変更

**ファイル**: `src/services/cloudflareApi.ts`（新規）

- GitHub APIの代わりにCloudflare Workers APIを呼び出す
- 既存の`useGitHub`フックを`useCloudflare`に置き換え
- データ同期ロジックを更新

**変更が必要なファイル**:
- `src/hooks/useGitHub.ts` → `src/hooks/useCloudflare.ts`（新規または置き換え）
- `src/services/taskService.ts` - ローカルストレージの扱いは維持（オフライン対応）

### 5. データ移行スクリプト

**ファイル**: `scripts/migrate-to-cloudflare.ts`（新規）

- GitHub APIから既存データを取得
- Cloudflare D1にデータをインポート
- データ整合性の確認

### 6. Cloudflare Pagesへのデプロイ設定

**ファイル**: `wrangler.toml`（更新）

```toml
name = "mytcc2"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "mytcc2.example.com", zone_name = "example.com" }
]

[[env.production.d1_databases]]
binding = "DB"
database_name = "mytcc2-db"
database_id = "your-database-id"
```

**ビルド設定**:
- `vite.config.ts`の`base`を`/`に変更（Cloudflare Pagesでは通常不要）
- 環境変数の設定

### 7. 環境変数とシークレット管理

**Cloudflare Dashboardで設定**:
- `API_KEY`: API認証用のキー
- `JWT_SECRET`: JWT認証を使用する場合

## 移行手順

### フェーズ1: 準備
1. Cloudflareアカウントの作成
2. D1データベースの作成
3. Workersプロジェクトのセットアップ
4. スキーマの作成とマイグレーション

### フェーズ2: API実装
1. Workers APIの実装
2. 認証システムの実装
3. エンドポイントのテスト

### フェーズ3: フロントエンド統合
1. データサービス層の実装
2. 既存フックの置き換え
3. UIの動作確認

### フェーズ4: データ移行
1. 移行スクリプトの実行
2. データ整合性の確認
3. 既存データのバックアップ

### フェーズ5: デプロイ
1. Cloudflare Pagesへのデプロイ
2. ドメイン設定
3. 動作確認とテスト

### フェーズ6: 切り替え
1. 本番環境での動作確認
2. ユーザーへの通知（必要に応じて）
3. GitHub APIからの切り替え

## 注意事項

### 無料プランの制限
- **D1**: 5GBストレージ、100,000行/日（読み取り）、1,000行/日（書き込み）
- **Workers**: 100,000リクエスト/日
- **Pages**: 無制限（ビルド、帯域幅）

### データ整合性
- オフライン対応のため、ローカルストレージは維持
- 同期時の競合解決ロジックが必要
- トランザクション処理の考慮

### セキュリティ
- APIキーの適切な管理
- HTTPSの強制
- 入力検証（既に実装済み）

### パフォーマンス
- D1の読み取り/書き込み制限を考慮
- キャッシュ戦略の検討
- バッチ処理の実装

## 参考リソース

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 実装の優先順位

1. **高**: D1スキーマ設計、Workers API基本実装
2. **中**: 認証システム、データ移行スクリプト
3. **低**: パフォーマンス最適化、高度な機能

