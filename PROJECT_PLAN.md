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
- **時間計測機能**
  - タスクごとのタイマー機能（開始/停止/リセット）
  - 累計時間の記録（複数回の開始/停止に対応）
  - リアルタイムでの経過時間表示（MM:SS または HH:MM:SS形式）
  - 同時に1つのタスクのみ実行可能（開始時に他のタスクは自動停止）
  - タスク完了時にタイマーを自動停止

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

### Phase 8: 時間計測機能
- [x] タスク型定義に時間計測フィールド追加（startTime, endTime, elapsedTime, isRunning）
- [x] タイマー開始/停止/リセット機能の実装
- [x] リアルタイムタイマー表示機能
- [x] 累計時間の記録機能
- [x] UIコンポーネントへの統合（開始/停止/リセットボタン）

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

## 時間計測機能の実装詳細

### データ構造
タスク型（`Task`）に以下のフィールドを追加：
- `startTime?: string` - 開始時刻（ISO date string）
- `endTime?: string` - 終了時刻（ISO date string）
- `elapsedTime?: number` - 累計経過時間（秒）
- `isRunning?: boolean` - 現在実行中かどうか

### 機能仕様
1. **タイマー開始**
   - タスクごとに独立したタイマーを開始可能
   - 他の実行中タスクがある場合、自動的に停止してから開始
   - 開始時刻を記録

2. **タイマー停止**
   - 経過時間を計算して`elapsedTime`に累計
   - 停止時刻を記録
   - 次回開始時に累計時間から継続

3. **タイマーリセット**
   - 累計時間を0にリセット
   - 開始/終了時刻をクリア

4. **表示機能**
   - リアルタイムで経過時間を更新（1秒間隔）
   - 実行中は緑色で表示し、アニメーションで実行中を示す
   - 時間表示形式: `MM:SS`（1時間未満）または `HH:MM:SS`（1時間以上）

5. **自動停止**
   - タスクを完了にした場合、実行中のタイマーを自動停止
   - 経過時間を累計に加算

### 実装ファイル
- `src/types/index.ts` - 型定義
- `src/services/taskService.ts` - タイマー操作関数（startTaskTimer, stopTaskTimer, resetTaskTimer）
- `src/hooks/useTasks.ts` - タイマー操作フック
- `src/components/tasks/TaskItem.tsx` - UIコンポーネント（タイマー表示、開始/停止/リセットボタン）

## デプロイ
- GitHub Actionsで自動ビルド・デプロイ
- `gh-pages`ブランチまたは`docs`フォルダにデプロイ
- Viteの`base`設定を適切に設定

