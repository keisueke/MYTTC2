---
name: multi-user-self-hosted
overview: 各ユーザーが自分のCloudflare Workers+D1またはGitHub APIを設定して、自分だけのデータを管理できるセルフホスト型アプリにする
todos:
  - id: self-host-guide
    content: セルフホストガイド（docs/self-hosting-guide.md）を作成
    status: completed
  - id: github-sync-doc
    content: GitHub同期の設定ガイド（docs/github-sync-setup.md）を作成
    status: completed
  - id: cloudflare-deploy-doc
    content: Cloudflare自己デプロイガイド（docs/cloudflare-self-deploy.md）を作成
    status: completed
  - id: workers-readme
    content: workers/README.mdを充実させる
    status: completed
  - id: settings-ui-improve
    content: Settings画面に保存方法の説明を追加
    status: completed
    dependencies:
      - self-host-guide
---

# マルチユーザー対応（セルフホスト型）プラン

## 概要

現在のアプリを「各ユーザーが自分のバックエンド（Cloudflare D1 または GitHub）を設定して使う」形式に整理する。

## 現在の状態

- フロントエンド: Cloudflare Pages でホスティング（誰でもアクセス可能）
- データ保存: ブラウザのLocalStorage（デフォルト）
- 外部同期: GitHub API または Cloudflare Workers API（Settings画面で設定可能）

## ゴール

```
┌─────────────────────────────────────────────────────────┐
│  フロントエンド（Cloudflare Pages）                       │
│  https://xxxxx.pages.dev                                │
│  ─────────────────────────────────────────────────────  │
│  データ保存: LocalStorage（デフォルト）                    │
│                                                         │
│  ユーザーが選択可能な同期先:                               │
│  ├─ GitHub API（自分のリポジトリ）                        │
│  └─ Cloudflare Workers API（自分でデプロイしたもの）       │
└─────────────────────────────────────────────────────────┘
```

## 必要な作業

### 1. ドキュメント整備（セルフホストガイド）

ユーザーが自分のバックエンドを構築するためのガイドを作成:

- **GitHub API を使う場合**:
  - Personal Access Token の取得方法
  - リポジトリの作成
  - Settings画面での設定方法

- **Cloudflare Workers + D1 を使う場合**:
  - Cloudflareアカウントの作成
  - Workers + D1 のデプロイ手順（wrangler使用）
  - Settings画面での設定方法

### 2. Settings画面の改善

現在の設定画面を分かりやすく整理:

- **データ保存方法の選択**を明確に表示
  - LocalStorage のみ（デフォルト）
  - GitHub 同期
  - Cloudflare 同期

- **初期設定ウィザード**（オプション）
  - 初回アクセス時に保存方法を選択させる

### 3. Cloudflare Workers テンプレートの整備

ユーザーが簡単にデプロイできるよう、`workers/` ディレクトリを整備:

- README.md にデプロイ手順を記載
- ワンコマンドでデプロイできるスクリプト
- 必要な環境変数の説明

### 4. CORS設定の柔軟化

現在のWorkers APIは特定のオリジンのみ許可する設定だが、セルフホスト用に調整:

- デフォルトで全オリジン許可（`ALLOWED_ORIGINS` 未設定時）
- ユーザーが必要に応じて制限可能

## 実装の優先順位

1. **ドキュメント整備**（最優先）

   - セルフホストガイドの作成
   - GitHub API / Cloudflare API の設定手順

2. **Settings画面の改善**

   - 保存方法の説明を追加
   - 設定フローを分かりやすく

3. **Workers テンプレートの整備**

   - README.md の充実
   - デプロイスクリプトの追加

## 成果物

- `docs/self-hosting-guide.md`: セルフホストガイド
- `docs/github-sync-setup.md`: GitHub同期の設定ガイド
- `docs/cloudflare-self-deploy.md`: Cloudflare自己デプロイガイド
- `workers/README.md`: Workers デプロイ手順
- Settings画面の改善（UIテキストの追加）