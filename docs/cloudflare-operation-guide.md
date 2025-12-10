# Cloudflare Workers + D1 運用ガイド

## 概要

MYTTC2アプリケーションは以下の構成で動作します：

| コンポーネント | ホスティング | URL |
|---------------|-------------|-----|
| フロントエンド | GitHub Pages | `https://username.github.io/MYTTC2` |
| バックエンドAPI | Cloudflare Workers | `https://mytcc2-api.xxxxx.workers.dev` |
| データベース | Cloudflare D1 | Workers経由でアクセス |

## デプロイ手順

### フロントエンド（GitHub Pages）

1. コードを変更
2. コミット＆プッシュ

```bash
git add .
git commit -m "feat: 新機能を追加"
git push origin main
```

3. GitHub Actionsが自動的にビルド＆デプロイ
4. 数分後に `https://username.github.io/MYTTC2` で反映

### バックエンドAPI（Cloudflare Workers）

1. `workers/` ディレクトリに移動

```bash
cd workers
```

2. 依存関係をインストール（初回のみ）

```bash
npm install
```

3. デプロイ

```bash
npm run deploy
# または
wrangler deploy
```

4. デプロイ完了後、`https://mytcc2-api.xxxxx.workers.dev` で反映

## 環境変数の設定

### CORS設定（ALLOWED_ORIGINS）

本番環境でCORSを制限する場合、Cloudflare Dashboardで環境変数を設定：

1. Cloudflare Dashboard → Workers & Pages → mytcc2-api
2. Settings → Variables
3. 「Add variable」で以下を追加：
   - Variable name: `ALLOWED_ORIGINS`
   - Value: `https://username.github.io` （カンマ区切りで複数指定可能）

または、wranglerコマンドで設定：

```bash
cd workers
wrangler secret put ALLOWED_ORIGINS
# プロンプトで値を入力: https://username.github.io
```

### APIキー認証（オプション）

Cloudflare Accessを使用しない場合、APIキー認証を有効化できます：

```bash
cd workers
wrangler secret put API_KEY
# プロンプトで任意のAPIキーを入力
```

フロントエンドのSettings画面で同じAPIキーを設定してください。

## Cloudflare Access の設定（推奨）

APIキーなしで安全にAPIを保護する方法です。

### 1. Zero Trust ダッシュボードにアクセス

1. Cloudflare Dashboard → Zero Trust
2. 初回の場合はチーム名を設定

### 2. アプリケーションの追加

1. Access → Applications → Add an application
2. Self-hosted を選択
3. 設定：
   - Application name: `MYTTC2 API`
   - Application domain: `mytcc2-api.xxxxx.workers.dev`
   - Path: `/*`
   - Session Duration: `30 days`

### 3. ポリシーの設定

1. Policy name: `Allow Owner`
2. Action: `Allow`
3. Include rules:
   - Selector: `Emails`
   - Value: `your-email@example.com`

### 4. 認証方法の設定

1. Settings → Authentication → Login methods
2. 「One-time PIN」を有効化

これで、自分のメールアドレスでログインした場合のみAPIにアクセスできます。

## フロントエンドの設定

### Settings画面でCloudflare APIを設定

1. アプリの Settings ページを開く
2. 「Cloudflare設定」セクションを見つける
3. 以下を入力：
   - API URL: `https://mytcc2-api.xxxxx.workers.dev`
   - API Key: （Cloudflare Access使用時は空欄のまま）
4. 「保存」をクリック
5. 「接続テスト」で接続を確認

## トラブルシューティング

### CORSエラーが発生する

1. Workers側の`ALLOWED_ORIGINS`環境変数を確認
2. フロントエンドのURLが正しく含まれているか確認
3. 開発時は`ALLOWED_ORIGINS`を設定しない（全オリジン許可）

```bash
# 環境変数を確認
wrangler secret list

# 環境変数を削除（開発時）
wrangler secret delete ALLOWED_ORIGINS
```

### 接続テストが失敗する

1. Workers APIがデプロイされているか確認

```bash
curl https://mytcc2-api.xxxxx.workers.dev/health
# {"status":"ok"} が返ればOK
```

2. Cloudflare Accessが有効な場合、ブラウザでログインしているか確認

### データが同期されない

1. D1データベースが正しく設定されているか確認

```bash
cd workers
wrangler d1 list
wrangler d1 execute mytcc2-db --command "SELECT COUNT(*) FROM tasks"
```

2. マイグレーションが適用されているか確認

```bash
wrangler d1 migrations list mytcc2-db
```

## ローカル開発

### フロントエンド

```bash
npm run dev
# http://localhost:5173 で起動
```

### Workers API（ローカル）

```bash
cd workers
wrangler dev
# http://localhost:8787 で起動
```

ローカルのWorkersに接続する場合、フロントエンドのCloudflare設定で：
- API URL: `http://localhost:8787`

## バックアップ

### D1データベースのエクスポート

```bash
cd workers
wrangler d1 export mytcc2-db --output=backup.sql
```

### D1データベースのインポート

```bash
cd workers
wrangler d1 execute mytcc2-db --file=backup.sql
```

## セキュリティチェックリスト

- [ ] `ALLOWED_ORIGINS` が本番フロントエンドのURLのみに設定されている
- [ ] Cloudflare Access が有効になっている（または`API_KEY`が設定されている）
- [ ] GitHub Personal Access Token がリポジトリに含まれていない
- [ ] D1データベースのバックアップが定期的に取得されている

## 参考リンク

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Cloudflare Access ドキュメント](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Wrangler CLI リファレンス](https://developers.cloudflare.com/workers/wrangler/)

