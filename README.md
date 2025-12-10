# MYTTC2

タスクシュートクラウド2を模倣したシンプルなタスク管理アプリ

## 特徴

- 🚀 GitHub Pagesでホスティング
- 💾 GitHub API + リポジトリでデータ保存（デバイス間共有可能）
- 📝 MD形式でのエクスポート機能
- 🔄 繰り返しタスク機能
- ⏱️ タスクの時間計測機能（開始/停止/リセット、累計時間記録）
- 🎨 シンプルで使いやすいUI

## 技術スタック

- React 18 + TypeScript
- Vite
- TailwindCSS
- GitHub API (REST API)
- React Router

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# GitHub Pagesにデプロイ
npm run deploy

# E2Eテスト実行
npm run test:e2e
```

## データ同期設定

### GitHub API（現在の方法）

1. GitHubでPersonal Access Token (PAT)を生成
   - スコープ: `repo`（リポジトリへのフルアクセス）
2. アプリの設定画面で以下を設定:
   - GitHub Token
   - リポジトリ所有者（owner）
   - リポジトリ名（repo）

データは指定したリポジトリの `data/tasks.json` に保存されます。

### Cloudflare（移行予定）

Cloudflareへの移行計画については、[Cloudflare移行計画](.cursor/plans/cloudflare-migration_f03598b4.plan.md)を参照してください。

- **データストレージ**: Cloudflare D1（SQLite）
- **API**: Cloudflare Workers
- **デプロイ**: Cloudflare Pages

詳細は以下のドキュメントを参照:
- [Cloudflare ストレージ比較](docs/cloudflare-storage-comparison.md)
- [Cloudflare デプロイガイド](docs/cloudflare-deployment.md)
- [Cloudflare テストガイド](docs/cloudflare-testing.md)

## テスト

E2EテストはPlaywrightを使用しています。

- **テスト実行**: `npm run test:e2e`
- **ドキュメント**: [docs/testing/playwright.md](./docs/testing/playwright.md)
- **作業方法ガイド**: [docs/testing/playwright-workflow.md](./docs/testing/playwright-workflow.md)

## 開発計画

詳細は [PROJECT_PLAN.md](./PROJECT_PLAN.md) を参照してください。
