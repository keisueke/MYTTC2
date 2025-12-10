# MYTTC2 Cloudflare Workers API

MYTTC2アプリのバックエンドAPIです。Cloudflare Workers + D1で動作します。

## クイックスタート

自分専用のAPIをデプロイする手順:

```bash
# 1. Wrangler CLIをインストール
npm install -g wrangler

# 2. Cloudflareにログイン
wrangler login

# 3. D1データベースを作成
wrangler d1 create my-mytcc2-db

# 4. wrangler.tomlのdatabase_idを更新（上記コマンドの出力を参照）

# 5. スキーマを適用
wrangler d1 execute my-mytcc2-db --file=../migrations/0001_initial_schema.sql

# 6. 依存関係をインストール
npm install

# 7. デプロイ
npm run deploy
```

詳細な手順は [Cloudflare自己デプロイガイド](../docs/cloudflare-self-deploy.md) を参照してください。

## ディレクトリ構成

```
workers/
├── src/
│   ├── index.ts      # メインエントリーポイント
│   ├── auth.ts       # 認証・CORSミドルウェア
│   ├── db.ts         # D1データベースヘルパー
│   ├── types.ts      # 型定義
│   └── routes/
│       ├── tasks.ts  # タスクAPI
│       └── sync.ts   # データ同期API
├── wrangler.toml     # Wrangler設定
├── package.json
└── tsconfig.json
```

## コマンド一覧

```bash
# 開発サーバーを起動（ローカル）
npm run dev

# 本番環境にデプロイ
npm run deploy

# マイグレーション実行（新規セットアップ時）
wrangler d1 execute <DB名> --file=../migrations/0001_initial_schema.sql

# シークレットを設定
wrangler secret put API_KEY
wrangler secret put ALLOWED_ORIGINS
```

## 設定ファイル（wrangler.toml）

```toml
name = "my-mytcc2-api"              # Workers名（任意）
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "my-mytcc2-db"       # D1データベース名
database_id = "xxxxxxxx-xxxx-..."    # D1データベースID（作成時に表示される）
```

## 環境変数・シークレット

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `API_KEY` | いいえ | APIキー認証を有効にする場合に設定 |
| `ALLOWED_ORIGINS` | いいえ | CORS許可オリジン（カンマ区切り） |

### 設定方法

**開発環境** (`.dev.vars`ファイルを作成):
```bash
API_KEY=dev-api-key-12345
ALLOWED_ORIGINS=http://localhost:5173
```

**本番環境**:
```bash
wrangler secret put API_KEY
# プロンプトで値を入力

wrangler secret put ALLOWED_ORIGINS
# プロンプトで値を入力（例: https://xxxxx.pages.dev）
```

## APIエンドポイント

### ヘルスチェック

```
GET /health
```

レスポンス:
```json
{"status": "ok"}
```

### タスク管理

```
GET    /api/tasks        # タスク一覧取得
GET    /api/tasks/:id    # タスク取得
POST   /api/tasks        # タスク作成
PUT    /api/tasks/:id    # タスク更新
DELETE /api/tasks/:id    # タスク削除
```

### データ同期

```
GET  /api/sync          # データ同期（取得）
POST /api/sync          # データ同期（送信）
```

## 認証

### APIキー認証（オプション）

`API_KEY` シークレットを設定すると、APIキー認証が有効になります。

リクエストヘッダーで指定:
```
X-API-Key: your-api-key
```

または、クエリパラメータで指定:
```
?api_key=your-api-key
```

### CORS設定

デフォルトでは全オリジンを許可します。

特定のオリジンのみ許可する場合は `ALLOWED_ORIGINS` を設定:
```bash
wrangler secret put ALLOWED_ORIGINS
# 入力: https://xxxxx.pages.dev,http://localhost:5173
```

## ローカル開発

```bash
# 開発サーバーを起動
npm run dev

# http://localhost:8787 でAPIが起動
```

ローカルのD1データベースは自動的に作成されます（`.wrangler/state/`）。

## トラブルシューティング

### 「database_id is required」エラー

`wrangler.toml` の `database_id` が設定されていません。

```bash
# D1データベースを作成して、出力されたIDを設定
wrangler d1 create my-mytcc2-db
```

### 「Table not found」エラー

スキーマが適用されていません。

```bash
wrangler d1 execute my-mytcc2-db --file=../migrations/0001_initial_schema.sql
```

### CORSエラー

`ALLOWED_ORIGINS` にフロントエンドのURLが含まれているか確認してください。

開発時は `ALLOWED_ORIGINS` を設定しない（全オリジン許可）のが簡単です。

## 参考リンク

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Hono Documentation](https://hono.dev/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
