---
name: playwright-e2e-setup
overview: Playwrightを使ってこのReactアプリにE2Eテスト環境を導入し、主要なユーザーフローを自動テストする
todos:
  - id: pw-setup
    content: Playwrightの依存関係追加と`playwright.config.ts`、`test:e2e`スクリプトの基本セットアップを行う
    status: pending
  - id: pw-webserver
    content: Playwright設定に`webServer`を追加し、テスト実行時に開発サーバーが自動起動・停止するようにする
    status: pending
    dependencies:
      - pw-setup
  - id: pw-tasks-e2e
    content: タスクの基本フロー（作成→編集→完了＋禁止文字バリデーション）をカバーするE2Eテストを`tests/e2e/tasks.spec.ts`に実装する
    status: pending
    dependencies:
      - pw-webserver
  - id: pw-routine-e2e
    content: ルーティン＆ハビットトラッカー周りのE2Eテストを`tests/e2e/routine.spec.ts`に実装する
    status: pending
    dependencies:
      - pw-webserver
  - id: pw-daily-analyze-e2e
    content: 日次記録および分析ページ（振り返りタブ含む）のE2Eテストを追加し、入力禁止文字も含めて確認する
    status: pending
    dependencies:
      - pw-webserver
  - id: pw-docs
    content: Playwrightテストの実行方法とCI統合方針を`docs/testing/playwright.md`などにドキュメント化する
    status: pending
    dependencies:
      - pw-setup
      - pw-tasks-e2e
---

### Playwright E2Eテスト導入計画

1. **Playwright導入と基本セットアップ**  

- `devDependencies` に `@playwright/test` を追加し、`npx playwright install` で主要3ブラウザ（Chromium / Firefox / WebKit）をセットアップする。  
- ルートに `playwright.config.ts` を作成し、ベースURL（例: `http://localhost:5173`）、タイムアウト、テストディレクトリ（`tests/e2e`）などを設定。  
- `package.json` に `test:e2e` スクリプト（`playwright test`）を追加し、ローカルで簡単に実行できるようにする。

2. **テスト用開発サーバー起動フローの定義**  

- Playwrightの`webServer`設定を使い、テスト実行時に自動で `npm run dev` または `npm run preview` を起動し、テスト終了後に停止するように設定。  
- 既存のポート競合を避けるため、テスト時に使用するポートを明示的に指定する（例: 4173）。

3. **共通ヘルパー・セレクタ戦略の設計**  

- ページ遷移（ダッシュボード → タスク → ルーティン など）やログインが必要な場合の共通処理を `tests/e2e/helpers` にユーティリティ関数として切り出す。  
- ボタンや入力要素には、可能な範囲で `data-testid` などの安定したセレクタを付与する方針をドキュメント化する（実際の付与は必要に応じて別タスクで対応）。

4. **基本フローE2Eテストの追加（タスク周り）**  

- テストファイル例: `tests/e2e/tasks.spec.ts`。  
- シナリオ例: 
 - タスク一覧ページに遷移できること。  
 - 新規タスクを作成し、一覧に表示されること。  
 - タスクの編集・完了（タイマー開始→停止、または手動完了）が正しく反映されること。  
- 入力禁止文字がブロックされること（制御文字を入力してエラーメッセージが表示されること）もテストに含める。

5. **ルーティン＆ハビットトラッカーのE2Eテスト**  

- テストファイル例: `tests/e2e/routine.spec.ts`。  
- シナリオ例: ルーティンタブでのタスク表示・並び替え（ドラッグ＆ドロップ）、ハビットトラッカーにルーティンが正しく反映されること。

6. **日次記録・分析周りのE2Eテスト**  

- テストファイル例: `tests/e2e/daily-records.spec.ts`, `tests/e2e/analyze.spec.ts`。  
- シナリオ例: 今日の記録入力→日次記録ページでの統計確認、分析ページでのタイムライン・振り返りタブへの遷移確認。  
- 入力禁止文字が日次記録フォームでもブロックされることを確認する。

7. **実行方法と今後のCI統合方針のドキュメント化**  

- `README` または `docs/testing/playwright.md` を作成し、ローカルでのテスト実行方法（`npm run test:e2e`）と推奨ワークフローを記載。  
- 将来的にGitHub ActionsなどのCIで `npm run test:e2e` を実行する際の基本的なジョブ構成（Nodeセットアップ → 依存関係インストール → Playwrightブラウザインストール → テスト実行）の骨子だけ記述しておく。