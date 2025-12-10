# Cloudflare Pages セットアップガイド

## 概要

Cloudflare PagesにGitHub連携で自動デプロイを設定する手順です。

## セットアップ手順

### 1. Cloudflare Dashboardでプロジェクト作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com)にアクセス
2. 「Workers & Pages」を選択
3. 「Create application」→「Connect to Git」をクリック
4. GitHubアカウントを認証（初回のみ）
5. リポジトリ `MYTTC2` を選択

### 2. ビルド設定

以下の設定を入力：

- **Project name**: `mytcc2`（任意）
- **Production branch**: `main` または `master`（デフォルトブランチ）
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`（プロジェクトルート）

### 3. 環境変数の設定

Cloudflare Dashboardで以下の環境変数を設定：

**Production環境**:
- `CLOUDFLARE_API_URL`: `https://mytcc2-api.thesket129.workers.dev`
- `CLOUDFLARE_API_KEY`: （空欄でOK、設定している場合のみ入力）

**Preview環境**（オプション）:
- 同じ環境変数を設定可能

### 4. デプロイの確認

設定を保存すると、自動的に初回ビルドが開始されます。

- ビルドログを確認
- デプロイが成功すると、URLが表示されます（例: `https://mytcc2.pages.dev`）

## 自動デプロイの動作

### GitHubにプッシュしたとき

1. **main/masterブランチへのプッシュ**:
   - 自動的にビルドが開始
   - ビルド成功後、本番環境にデプロイ
   - URL: `https://mytcc2.pages.dev`

2. **その他のブランチへのプッシュ**:
   - プレビュービルドが作成
   - プレビューURLが生成（例: `https://<branch-name>.mytcc2.pages.dev`）

3. **Pull Request作成時**:
   - プレビュービルドが自動生成
   - PRにプレビューURLがコメントされる

### ビルド設定の確認

`cloudflare-pages.toml`で以下の設定が適用されます：

```toml
[build]
command = "npm run build"
cwd = "."

[build.environment_variables]
NODE_VERSION = "18"
CF_PAGES = "1"  # これによりvite.config.tsでbaseパスが'/'になる
```

## カスタムドメインの設定（オプション）

1. Cloudflare Dashboardでプロジェクトを選択
2. 「Custom domains」タブを開く
3. ドメインを入力
4. DNS設定を確認（Cloudflareで管理しているドメインの場合、自動設定）

## トラブルシューティング

### ビルドが失敗する

- ビルドログを確認
- `package.json`の依存関係が正しいか確認
- Node.jsのバージョンが18以上か確認

### 環境変数が反映されない

- Cloudflare Dashboardで環境変数が正しく設定されているか確認
- ビルドを再実行（新しいコミットをプッシュ）

### ベースパスが正しくない

- `vite.config.ts`の`base`設定を確認
- `CF_PAGES=1`が設定されているか確認

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub連携ガイド](https://developers.cloudflare.com/pages/platform/git-integration/)

