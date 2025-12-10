# MYTTC2 Cloudflare Workers API

Cloudflare Workersで実装されたREST APIです。

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発環境で起動
npm run dev

# 本番環境にデプロイ
npm run deploy
```

## データベースマイグレーション

```bash
# マイグレーションを実行
npm run migrate
```

## 環境変数

### 開発環境

`.dev.vars`ファイルを作成（Gitにコミットしない）:

```bash
API_KEY=your-dev-api-key
```

### 本番環境

Cloudflare DashboardまたはWrangler CLIで設定:

```bash
wrangler secret put API_KEY
```

## APIエンドポイント

### ヘルスチェック

```
GET /health
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

APIキー認証を使用する場合、リクエストヘッダーに以下を追加:

```
X-API-Key: your-api-key
```

または、クエリパラメータで指定:

```
?api_key=your-api-key
```

## 参考リンク

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Hono Documentation](https://hono.dev/)

