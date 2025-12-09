# Playwright E2Eテスト

このドキュメントでは、Playwrightを使用したE2E（End-to-End）テストの実行方法とCI統合方針について説明します。

## 概要

Playwrightを使用して、アプリケーションの主要なユーザーフローを自動テストしています。主要3ブラウザ（Chromium / Firefox / WebKit）でテストを実行し、クロスブラウザの互換性を確認します。

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### Playwrightブラウザのインストール

```bash
npx playwright install --with-deps chromium firefox webkit
```

初回のみ実行が必要です。主要3ブラウザとその依存関係がインストールされます。

## テストの実行

### 基本的な実行方法

```bash
npm run test:e2e
```

すべてのブラウザ（Chromium / Firefox / WebKit）でテストが実行されます。

### UIモードで実行

```bash
npm run test:e2e:ui
```

PlaywrightのUIモードでテストを実行します。テストの実行状況を視覚的に確認でき、デバッグに便利です。

### ヘッドモードで実行

```bash
npm run test:e2e:headed
```

ブラウザを表示した状態でテストを実行します。テストの動作を目視で確認できます。

### 特定のブラウザで実行

```bash
# Chromiumのみ
npx playwright test --project=chromium

# Firefoxのみ
npx playwright test --project=firefox

# WebKitのみ
npx playwright test --project=webkit
```

### 特定のテストファイルのみ実行

```bash
npx playwright test tests/e2e/tasks.spec.ts
```

## テスト構成

### テストファイル構成

```
tests/e2e/
├── tasks.spec.ts          # タスク管理のE2Eテスト
├── routine.spec.ts        # ルーティン＆ハビットトラッカーのE2Eテスト
├── daily-records.spec.ts  # 日次記録のE2Eテスト
├── analyze.spec.ts        # 分析ページのE2Eテスト
└── helpers/
    ├── navigation.ts      # ページ遷移のヘルパー関数
    └── tasks.ts           # タスク操作のヘルパー関数
```

### テストシナリオ

#### タスク管理 (`tasks.spec.ts`)

- タスク一覧ページへの遷移
- 新規タスクの作成
- タスクの編集
- タスクの削除
- タスクタイマーの開始・停止
- 入力禁止文字（制御文字）のバリデーション
- 入力禁止文字（危険なパターン）のバリデーション
- 正常な文字（日本語・英数字・改行）の入力

#### ルーティン＆ハビットトラッカー (`routine.spec.ts`)

- ルーティンページへの遷移
- ルーティンタスクの作成と表示
- ハビットトラッカーへの反映
- ルーティンタスクの並び替え（ドラッグ＆ドロップ）

#### 日次記録 (`daily-records.spec.ts`)

- 今日の記録の入力
- 日次記録ページへの遷移
- 統計の表示
- 入力禁止文字のバリデーション

#### 分析ページ (`analyze.spec.ts`)

- 分析ページへの遷移
- タイムラインタブの表示
- 振り返りタブへの遷移
- クエリパラメータによる直接遷移

## 設定ファイル

### `playwright.config.ts`

Playwrightの設定ファイルです。以下の設定が含まれています：

- **テストディレクトリ**: `./tests/e2e`
- **ベースURL**: `http://localhost:4173`（開発サーバーのURL）
- **タイムアウト**: 30秒
- **ブラウザ**: Chromium / Firefox / WebKit
- **webServer**: テスト実行時に自動で開発サーバーを起動・停止

### 開発サーバーの自動起動

Playwrightはテスト実行時に自動で `npm run preview` を実行し、開発サーバーを起動します。テスト終了後は自動で停止されます。

ポートは `4173` を使用します（`vite preview` のデフォルトポート）。

## ヘルパー関数

### ページ遷移 (`helpers/navigation.ts`)

- `navigateToDashboard(page)`: ダッシュボードページに遷移
- `navigateToTasks(page)`: タスク一覧ページに遷移
- `navigateToRoutine(page)`: ルーティンページに遷移
- `navigateToDailyRecords(page)`: 日次記録ページに遷移
- `navigateToAnalyze(page)`: 分析ページに遷移
- `navigateToSettings(page)`: 設定ページに遷移

### タスク操作 (`helpers/tasks.ts`)

- `createTask(page, title, options)`: 新規タスクを作成
- `expectTaskInList(page, title)`: タスクが一覧に表示されていることを確認
- `editTask(page, currentTitle, newTitle)`: タスクを編集
- `deleteTask(page, title)`: タスクを削除
- `startTaskTimer(page, title)`: タスクのタイマーを開始
- `stopTaskTimer(page, title)`: タスクのタイマーを停止

## トラブルシューティング

### テストが失敗する場合

1. **開発サーバーが起動していない**: `npm run preview` を手動で実行して、サーバーが正常に起動することを確認してください。

2. **ポートが使用中**: ポート `4173` が使用中の場合は、別のポートを使用するか、使用中のプロセスを終了してください。

3. **タイムアウトエラー**: テストのタイムアウト時間を延長するか、テストの実行速度を改善してください。

4. **セレクタが見つからない**: 実際のUIに合わせてセレクタを調整する必要がある場合があります。

### デバッグ方法

1. **UIモードで実行**: `npm run test:e2e:ui` でテストを実行し、視覚的に確認します。

2. **ヘッドモードで実行**: `npm run test:e2e:headed` でブラウザを表示してテストの動作を確認します。

3. **スクリーンショット**: テスト失敗時に自動でスクリーンショットが保存されます。`test-results/` ディレクトリを確認してください。

4. **トレース**: テスト失敗時にトレースが記録されます。`npx playwright show-trace <trace-file>` で確認できます。

## CI統合方針

将来的にGitHub ActionsなどのCIでテストを実行する場合の基本的な構成です。

### GitHub Actions の例

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox webkit
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### CI環境での注意点

- **並列実行**: CI環境では `workers: 1` に設定して、並列実行を制限します。
- **再試行**: CI環境では `retries: 2` に設定して、一時的な失敗に対して再試行します。
- **ブラウザ**: CI環境では、すべてのブラウザでテストを実行するか、主要ブラウザ（Chromium）のみに制限するかを検討します。

## ベストプラクティス

1. **安定したセレクタの使用**: `data-testid` などの安定したセレクタを使用することを推奨します（現在は実装されていませんが、将来的に追加することを検討）。

2. **テストの独立性**: 各テストは独立して実行できるように設計します。テスト間で状態を共有しないようにします。

3. **適切な待機**: `page.waitForLoadState('networkidle')` や `page.waitForTimeout()` を使用して、適切なタイミングで要素を操作します。

4. **エラーハンドリング**: テストが失敗した場合でも、後続のテストに影響を与えないようにします。

5. **テストデータの管理**: テスト用のデータは、テスト実行前にクリーンアップするか、一意の識別子を使用します。

## 関連ドキュメント

- **[Playwright 作業方法ガイド](./playwright-workflow.md)**: テストの作成、デバッグ、保守の実践的なワークフロー

## 参考リンク

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

