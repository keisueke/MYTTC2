# Cloudflare Pages デプロイガイド

## 概要

このアプリケーションをCloudflare Pagesにデプロイする手順を説明します。

## 前提条件

1. Cloudflareアカウントの作成
2. Cloudflare D1データベースの作成
3. Cloudflare Workers APIのデプロイ

## デプロイ手順

### 1. Cloudflare D1データベースの作成

```bash
# Wrangler CLIをインストール（まだの場合）
npm install -g wrangler

# ログイン
wrangler login

# D1データベースを作成
wrangler d1 create mytcc2-db

# データベースIDを取得（wrangler.tomlに設定）
```

### 2. マイグレーションの実行

```bash
cd workers

# マイグレーションを実行
wrangler d1 migrations apply mytcc2-db
```

### 3. Cloudflare Workers APIのデプロイ

```bash
cd workers

# 開発環境でテスト
npm run dev

# 本番環境にデプロイ
npm run deploy
```

### 4. 環境変数の設定

Cloudflare Dashboardで以下を設定：

**Workers環境変数**:
- `API_KEY`: API認証用のキー（オプション、開発環境では省略可能）

**Pages環境変数**:
- `CLOUDFLARE_API_URL`: Workers APIのURL（例: `https://mytcc2-api.your-subdomain.workers.dev`）
- `CLOUDFLARE_API_KEY`: API認証キー（Workersで設定したものと同じ）

### 5. Cloudflare Pagesへのデプロイ

#### 方法1: GitHub連携（推奨）

1. Cloudflare Dashboardで「Pages」を選択
2. 「Create a project」→「Connect to Git」
3. GitHubリポジトリを選択
4. ビルド設定:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`（プロジェクトルート）
   - **Deploy command**: **空欄**または`true`（削除できない場合は`true`を設定）

**重要**: Deploy commandには`npx wrangler deploy`などを設定しないでください。Cloudflare Pagesは静的ファイルを自動的にデプロイするため、追加のデプロイコマンドは不要です。

**Deploy commandを空欄にできない場合**: `true`コマンドを設定してください。これは何も実行せず、常に成功を返すため、Cloudflare Pagesが自動的に静的ファイルをデプロイします。

#### 方法2: Wrangler CLI（手動デプロイ用）

```bash
# Pagesプロジェクトを作成
wrangler pages project create mytcc2

# デプロイ
wrangler pages deploy dist
```

**注意**: 通常はGitHub連携を使用し、Wrangler CLIは手動デプロイが必要な場合のみ使用します。

### 6. カスタムドメインの設定（オプション）

1. Cloudflare Dashboardで「Pages」→ プロジェクトを選択
2. 「Custom domains」タブでドメインを追加
3. DNS設定を確認

## Workers(API)とPages(フロント)の役割分離

このプロジェクトでは、以下のように役割を分離しています：

- **Cloudflare Pages（フロントエンド）**: 
  - GitHub連携で自動デプロイ
  - 静的ファイル（`dist`）を配信
  - ビルドコマンド: `npm run build`のみ
  - Deploy command: 不要（空欄）

- **Cloudflare Workers（API）**:
  - ローカルから`wrangler deploy`で手動デプロイ
  - D1データベースと連携
  - REST APIエンドポイントを提供
  - デプロイ先: `https://mytcc2-api.thesket129.workers.dev`

**運用方針**:
- フロントエンドの更新: GitHubにプッシュするだけで自動デプロイ
- APIの更新: ローカルで`cd workers && npm run deploy`を実行

## 設定ファイル

### `wrangler.toml` (Workers)

```toml
name = "mytcc2-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "mytcc2-db"
database_id = "your-database-id"
```

### `vite.config.ts` (Pages)

```typescript
base: process.env.CF_PAGES === '1' ? '/' : '/MYTTC2/'
```

Cloudflare Pagesでは`CF_PAGES=1`が自動的に設定されるため、ベースパスは`/`になります。

## 環境変数の管理

### 開発環境

`.dev.vars`ファイルを作成（Gitにコミットしない）:

```bash
# workers/.dev.vars
API_KEY=your-dev-api-key
```

### 本番環境

Cloudflare DashboardまたはWrangler CLIで設定:

```bash
# Workers環境変数
wrangler secret put API_KEY

# Pages環境変数
wrangler pages secret put CLOUDFLARE_API_URL
wrangler pages secret put CLOUDFLARE_API_KEY
```

## トラブルシューティング

### データベース接続エラー

- D1データベースが正しく作成されているか確認
- `wrangler.toml`の`database_id`が正しいか確認
- マイグレーションが実行されているか確認

### API接続エラー

- `CLOUDFLARE_API_URL`が正しく設定されているか確認
- CORS設定が正しいか確認
- APIキーが正しく設定されているか確認

### ビルドエラー

- Node.jsのバージョンが18以上か確認
- 依存関係が正しくインストールされているか確認
- 環境変数が正しく設定されているか確認

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

