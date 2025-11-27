# MYTTC2 プロジェクト開発計画

## プロジェクト概要
タスクシュートクラウド2を模倣したシンプルなタスク管理アプリ
- GitHub Pagesでホスティング
- GitHub API + リポジトリでデータ保存（デバイス間共有可能）
- MD形式でのエクスポート機能

## 技術スタック
- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: TailwindCSS
- **データ保存**: GitHub API (REST API)
- **ルーティング**: React Router
- **日付処理**: date-fns

## 主要機能

### 1. タスク管理
- タスクの作成、編集、削除、完了
- 優先度設定（低、中、高）
- 期限設定
- カテゴリ/プロジェクト分類
- 繰り返しタスク（日次、週次、月次、カスタム）

### 2. UI構成
- **サイドバー**: プロジェクト/カテゴリ一覧、フィルタ
- **ホーム**: ダッシュボード、統計情報、最近のタスク
- **タスク一覧**: リスト表示、フィルタリング、ソート

### 3. データ管理
- GitHub API経由でのデータ保存/読み込み
- MD形式でのエクスポート
- 設定の保存（GitHubトークン、リポジトリ情報）

## プロジェクト構造

```
mytcc2/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   └── TaskForm.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   └── settings/
│   │       └── SettingsModal.tsx
│   ├── services/
│   │   └── githubApi.ts
│   ├── hooks/
│   │   ├── useTasks.ts
│   │   └── useGitHub.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── export.ts
│   │   └── dateUtils.ts
│   ├── context/
│   │   └── AppContext.tsx
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## マルチエージェント開発タスク分割

### Phase 1: プロジェクトセットアップ
- [ ] Vite + React + TypeScript プロジェクト作成
- [ ] TailwindCSS設定
- [ ] 基本的なフォルダ構造作成
- [ ] GitHub Pagesデプロイ設定

### Phase 2: GitHub API統合
- [ ] GitHub API サービス実装（認証、CRUD操作）
- [ ] 設定管理（トークン、リポジトリ情報の保存）
- [ ] エラーハンドリングとリトライロジック
- [ ] データ同期機能

### Phase 3: 基本UIコンポーネント
- [ ] レイアウトコンポーネント（サイドバー、ヘッダー）
- [ ] ルーティング設定
- [ ] テーマ設定（ダークモード対応）

### Phase 4: タスク管理機能
- [ ] タスク型定義
- [ ] タスクCRUD操作
- [ ] タスク一覧表示
- [ ] タスクフォーム（作成/編集）

### Phase 5: 繰り返しタスク機能
- [ ] 繰り返しパターン定義
- [ ] 繰り返しタスク生成ロジック
- [ ] 繰り返し設定UI

### Phase 6: ダッシュボード
- [ ] 統計情報表示
- [ ] 最近のタスク表示
- [ ] フィルタリング機能

### Phase 7: エクスポート機能
- [ ] MD形式エクスポート実装
- [ ] エクスポートUI

## GitHub API実装詳細

### 認証
- Personal Access Token (PAT) を使用
- トークンはブラウザのLocalStorageに保存（暗号化推奨）
- 必要なスコープ: `repo`（リポジトリへのフルアクセス）

### データ保存方法
- リポジトリ内に `data/tasks.json` として保存
- GitHub API `PUT /repos/{owner}/{repo}/contents/{path}` を使用
- Base64エンコードでデータを送信
- SHAハッシュを使用して更新時の競合を回避

### レートリミット対策
- 認証済みリクエスト: 5,000リクエスト/時間
- リクエスト間隔の制御
- エラーハンドリングとリトライロジック

## セキュリティ考慮事項
- GitHubトークンはクライアントサイドに保存されるため、リポジトリはプライベート推奨
- または、Fine-grained Personal Access Tokenで最小権限を設定
- トークンの漏洩リスクを考慮した実装

## デプロイ
- GitHub Actionsで自動ビルド・デプロイ
- `gh-pages`ブランチまたは`docs`フォルダにデプロイ
- Viteの`base`設定を適切に設定

