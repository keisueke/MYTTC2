# Cloudflare自己デプロイガイド

## 概要

自分専用のCloudflare Workers + D1をデプロイして、データを保存・同期できます。

## 必要なもの

- Cloudflareアカウント（無料）
- Node.js 18以上
- npm または yarn

## セットアップ手順

### Step 1: Cloudflareアカウントの作成

1. [dash.cloudflare.com](https://dash.cloudflare.com) にアクセス
2. 「Sign up」でアカウントを作成
3. メール認証を完了

### Step 2: Wrangler CLIのインストール

ターミナルで以下を実行:

```bash
npm install -g wrangler
```

### Step 3: Cloudflareにログイン

```bash
wrangler login
```

ブラウザが開くので、Cloudflareにログインして認証を許可します。

### Step 4: リポジトリのクローン

```bash
git clone https://github.com/keisueke/MYTTC2.git
cd MYTTC2/workers
```

### Step 5: D1データベースの作成

```bash
wrangler d1 create my-mytcc2-db
```

出力例:
```
✅ Successfully created DB 'my-mytcc2-db'

[[d1_databases]]
binding = "DB"
database_name = "my-mytcc2-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**`database_id` をコピーしておいてください。**

### Step 6: wrangler.tomlの編集

`workers/wrangler.toml` を編集:

```toml
name = "my-mytcc2-api"  # 任意の名前に変更
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "my-mytcc2-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Step 5でコピーしたID
```

### Step 7: データベーススキーマの適用

```bash
cd workers
wrangler d1 execute my-mytcc2-db --file=../migrations/0001_initial_schema.sql
```

### Step 8: 依存関係のインストール

```bash
npm install
```

### Step 9: Workers APIのデプロイ

```bash
npm run deploy
```

出力例:
```
Uploaded my-mytcc2-api
Deployed my-mytcc2-api triggers
  https://my-mytcc2-api.xxxxx.workers.dev
```

**表示されたURLをコピーしておいてください。**

### Step 10: アプリでの設定

1. MYTTC2アプリを開く
2. 「Settings」ページに移動
3. 「Cloudflare設定」セクションを見つける
4. 以下を入力:

| 項目 | 入力値 |
|------|--------|
| **API URL** | Step 9で表示されたURL（例: `https://my-mytcc2-api.xxxxx.workers.dev`） |
| **API Key** | 空欄（後で設定可能） |

5. 「保存」をクリック
6. 「接続テスト」をクリックして接続を確認

## オプション設定

### APIキー認証の追加

セキュリティを強化したい場合、APIキー認証を追加できます。

1. シークレットを設定:
```bash
wrangler secret put API_KEY
# プロンプトで任意のキーを入力（例: my-secret-key-12345）
```

2. アプリのCloudflare設定で同じAPIキーを入力

### CORS制限の追加

特定のオリジンのみ許可したい場合:

```bash
wrangler secret put ALLOWED_ORIGINS
# プロンプトで許可するオリジンを入力（例: https://xxxxx.pages.dev）
```

### Cloudflare Accessでの保護

より強固な認証が必要な場合は、[Cloudflare Access設計ドキュメント](./cloudflare-access-design.md) を参照してください。

## コマンドまとめ

```bash
# Cloudflareにログイン
wrangler login

# D1データベースの作成
wrangler d1 create my-mytcc2-db

# スキーマの適用
wrangler d1 execute my-mytcc2-db --file=../migrations/0001_initial_schema.sql

# Workersのデプロイ
npm run deploy

# シークレットの設定
wrangler secret put API_KEY
wrangler secret put ALLOWED_ORIGINS

# ローカル開発サーバー
wrangler dev

# データベースの内容確認
wrangler d1 execute my-mytcc2-db --command "SELECT COUNT(*) FROM tasks"
```

## トラブルシューティング

### 「wrangler: command not found」と表示される

```bash
npm install -g wrangler
```

### 「You must be logged in」と表示される

```bash
wrangler login
```

### デプロイ時に「database_id is required」と表示される

`wrangler.toml` の `database_id` が正しく設定されているか確認してください。

### 「接続テストに失敗しました」と表示される

1. Workers APIがデプロイされているか確認:
```bash
curl https://my-mytcc2-api.xxxxx.workers.dev/health
# {"status":"ok"} が返ればOK
```

2. API URLが正しいか確認（末尾にスラッシュがないか等）

### データベースにテーブルがない

スキーマを再適用:
```bash
wrangler d1 execute my-mytcc2-db --file=../migrations/0001_initial_schema.sql
```

## 費用について

Cloudflareの無料プランで十分に動作します。

| リソース | 無料枠 |
|----------|--------|
| Workers | 10万リクエスト/日 |
| D1 | 5GB ストレージ |
| D1 | 500万行読み取り/日 |
| D1 | 10万行書き込み/日 |

個人利用であれば、無料枠を超えることはほぼありません。

## アップデート方法

新しいバージョンがリリースされた場合:

```bash
cd MYTTC2
git pull origin main
cd workers
npm install
npm run deploy
```

マイグレーションがある場合:
```bash
wrangler d1 execute my-mytcc2-db --file=../migrations/XXXX_new_migration.sql
```

## 次のステップ

設定が完了したら、アプリを使い始めましょう！

- データは自動的にCloudflare D1に保存されます
- 別のデバイスでも同じAPI URLを設定すれば、データが同期されます

