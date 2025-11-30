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
```

## GitHub API設定

1. GitHubでPersonal Access Token (PAT)を生成
   - スコープ: `repo`（リポジトリへのフルアクセス）
2. アプリの設定画面で以下を設定:
   - GitHub Token
   - リポジトリ所有者（owner）
   - リポジトリ名（repo）

データは指定したリポジトリの `data/tasks.json` に保存されます。

## 開発計画

詳細は [PROJECT_PLAN.md](./PROJECT_PLAN.md) を参照してください。
