# Playwright 作業方法ガイド

このドキュメントでは、Playwrightを使用したE2Eテストの実践的な作業方法を説明します。テストの作成、デバッグ、保守のワークフローを中心に解説します。

> **関連ドキュメント**: [Playwright E2Eテスト](./playwright.md) - セットアップ、実行方法、設定ファイルの詳細

## 目次

1. [基本的なテストの書き方](#基本的なテストの書き方)
2. [セレクタの選び方とデバッグ](#セレクタの選び方とデバッグ)
3. [待機処理のベストプラクティス](#待機処理のベストプラクティス)
4. [よくある問題と解決方法](#よくある問題と解決方法)
5. [テストの追加・修正方法](#テストの追加修正方法)
6. [デバッグのワークフロー](#デバッグのワークフロー)
7. [テストの保守方法](#テストの保守方法)

## 基本的なテストの書き方

### テストファイルの構造

```typescript
import { test, expect } from '@playwright/test'
import { navigateToTasks } from './helpers/navigation'

test.describe('機能名', () => {
  // 各テスト前のセットアップ
  test.beforeEach(async ({ page }) => {
    await navigateToTasks(page)
    // LocalStorageをクリア（必要に応じて）
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('テストケースの説明', async ({ page }) => {
    // 1. 準備（Arrange）
    // 2. 実行（Act）
    // 3. 検証（Assert）
  })
})
```

### 基本的な操作パターン

#### 1. ページ遷移

```typescript
// 方法1: 直接URLで遷移
await page.goto('/tasks')
await page.waitForLoadState('networkidle')

// 方法2: ヘルパー関数を使用（推奨）
import { navigateToTasks } from './helpers/navigation'
await navigateToTasks(page)
```

#### 2. 要素の検索と操作

```typescript
// テキストで検索
await page.click('text=新規タスク')

// IDで検索
await page.fill('input[id="title"]', 'タスク名')

// プレースホルダーで検索
await page.fill('input[placeholder*="タイトル"]', 'タスク名')

// 複合セレクタ
await page.click('button:has-text("保存")')
```

#### 3. 入力フィールドへの入力

```typescript
// テキスト入力
await page.fill('input[id="title"]', 'タスク名')

// テキストエリア
await page.fill('textarea[id="description"]', '説明文')

// セレクトボックス
await page.selectOption('select[id="projectId"]', { label: 'プロジェクト名' })

// チェックボックス
await page.check('input[type="checkbox"]')
```

#### 4. アサーション（検証）

```typescript
// 要素が表示されていることを確認
await expect(page.locator('text=タスク名')).toBeVisible()

// 要素が存在しないことを確認
await expect(page.locator('text=削除されたタスク')).not.toBeVisible()

// テキストが一致することを確認
await expect(page.locator('h1')).toHaveText('今日のタスク')

// 要素の数が一致することを確認
await expect(page.locator('.task-item')).toHaveCount(5)
```

### 実践例: タスク作成のテスト

```typescript
test('新規タスクを作成できること', async ({ page }) => {
  // 1. 準備: タスク一覧ページに遷移
  await navigateToTasks(page)
  
  // 2. 実行: タスクを作成
  const taskTitle = `テストタスク ${Date.now()}`
  await page.click('text=新規タスク')
  await page.fill('input[id="title"]', taskTitle)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(500) // 保存処理の完了を待つ
  
  // 3. 検証: タスクが一覧に表示される
  await expect(page.locator(`text=${taskTitle}`)).toBeVisible()
})
```

## セレクタの選び方とデバッグ

### セレクタの優先順位

1. **`data-testid`**（最推奨）: テスト専用の属性
   ```typescript
   await page.click('[data-testid="create-task-button"]')
   ```
   - 注意: 現在の実装では `data-testid` は使用していませんが、将来的に追加することを検討

2. **ID属性**: 一意で安定している
   ```typescript
   await page.fill('input[id="title"]', 'タスク名')
   ```

3. **テキスト内容**: ユーザーが見る内容と一致
   ```typescript
   await page.click('text=新規タスク')
   ```

4. **プレースホルダー**: 入力フィールドで有効
   ```typescript
   await page.fill('input[placeholder*="タイトル"]', 'タスク名')
   ```

5. **CSSセレクタ**: 構造に依存するため注意が必要
   ```typescript
   await page.click('.btn-industrial')
   ```

### セレクタのデバッグ方法

#### 1. Playwright Inspectorを使用

```bash
# デバッグモードで実行
PWDEBUG=1 npm run test:e2e
```

または

```bash
# UIモードで実行（推奨）
npm run test:e2e:ui
```

#### 2. セレクタの検証

```typescript
// セレクタが要素を見つけられるか確認
const element = page.locator('text=新規タスク')
console.log(await element.count()) // 要素の数を確認

// 要素が表示されるまで待つ
await element.waitFor({ state: 'visible' })
```

#### 3. スクリーンショットで確認

```typescript
// テスト中にスクリーンショットを撮る
await page.screenshot({ path: 'debug-screenshot.png' })

// 特定の要素のスクリーンショット
await page.locator('.task-item').first().screenshot({ path: 'task-item.png' })
```

## 待機処理のベストプラクティス

### 推奨される待機方法

#### 1. 自動待機（推奨）

Playwrightの操作は自動的に待機するため、明示的な待機は不要な場合が多い：

```typescript
// ✅ 良い例: 自動待機
await page.click('text=保存')
await expect(page.locator('text=保存しました')).toBeVisible()

// ❌ 悪い例: 不必要な固定待機
await page.click('text=保存')
await page.waitForTimeout(2000) // 不要な場合が多い
await expect(page.locator('text=保存しました')).toBeVisible()
```

#### 2. ネットワークアイドルを待つ

```typescript
// ページ遷移後、ネットワークリクエストが完了するまで待つ
await page.goto('/tasks')
await page.waitForLoadState('networkidle')
```

#### 3. 要素の状態を待つ

```typescript
// 要素が表示されるまで待つ
await page.locator('text=タスク名').waitFor({ state: 'visible' })

// 要素が非表示になるまで待つ
await page.locator('.loading-spinner').waitFor({ state: 'hidden' })

// 要素がDOMに追加されるまで待つ
await page.locator('.new-item').waitFor({ state: 'attached' })
```

#### 4. 固定待機（最後の手段）

```typescript
// アニメーションや複雑な処理の完了を待つ場合のみ使用
await page.waitForTimeout(500)
```

### 待機処理の実践例

```typescript
test('タスク作成後の表示確認', async ({ page }) => {
  await navigateToTasks(page)
  
  // タスクを作成
  await page.click('text=新規タスク')
  await page.fill('input[id="title"]', 'テストタスク')
  await page.click('button[type="submit"]')
  
  // 方法1: 要素が表示されるまで待つ（推奨）
  await page.locator('text=テストタスク').waitFor({ state: 'visible' })
  
  // 方法2: ネットワークアイドルを待つ
  await page.waitForLoadState('networkidle')
  
  // 方法3: 固定待機（最後の手段）
  await page.waitForTimeout(500)
  
  // 検証
  await expect(page.locator('text=テストタスク')).toBeVisible()
})
```

## よくある問題と解決方法

### 問題1: セレクタが見つからない

**症状**: `TimeoutError: Locator not found`

**原因と解決方法**:

1. **要素がまだ表示されていない**
   ```typescript
   // ❌ 悪い例
   await page.click('text=新規タスク')
   
   // ✅ 良い例: 要素が表示されるまで待つ
   await page.locator('text=新規タスク').waitFor({ state: 'visible' })
   await page.click('text=新規タスク')
   ```

2. **セレクタが間違っている**
   ```typescript
   // セレクタを検証
   const count = await page.locator('text=新規タスク').count()
   console.log(`Found ${count} elements`)
   
   // より具体的なセレクタを使用
   await page.click('button:has-text("新規タスク")')
   ```

3. **要素が別のフレーム内にある**
   ```typescript
   // フレームを取得して操作
   const frame = page.frame({ name: 'iframe-name' })
   await frame?.click('text=ボタン')
   ```

### 問題2: タイムアウトエラー

**症状**: `Timeout 30000ms exceeded`

**解決方法**:

1. **タイムアウト時間を延長**
   ```typescript
   test('長時間かかるテスト', async ({ page }) => {
     test.setTimeout(60000) // 60秒に延長
     // ...
   })
   ```

2. **待機処理を追加**
   ```typescript
   await page.waitForLoadState('networkidle')
   await page.waitForTimeout(1000)
   ```

3. **要素の状態を確認してから操作**
   ```typescript
   await page.locator('.loading').waitFor({ state: 'hidden' })
   await page.click('text=保存')
   ```

### 問題3: テストが不安定（フレーキー）

**症状**: 時々失敗する、再実行すると成功する

**解決方法**:

1. **適切な待機処理を追加**
   ```typescript
   // ❌ 悪い例: 固定待機のみ
   await page.click('text=保存')
   await page.waitForTimeout(2000)
   
   // ✅ 良い例: 状態を確認してから待機
   await page.click('text=保存')
   await page.locator('text=保存しました').waitFor({ state: 'visible' })
   ```

2. **再試行設定を調整**
   ```typescript
   // playwright.config.ts
   retries: process.env.CI ? 2 : 0
   ```

3. **テストデータを一意にする**
   ```typescript
   // タイムスタンプを使用して一意性を保証
   const taskTitle = `テストタスク ${Date.now()}`
   ```

### 問題4: LocalStorageの状態が残っている

**症状**: 前のテストのデータが影響する

**解決方法**:

```typescript
test.beforeEach(async ({ page }) => {
  // LocalStorageをクリア
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})
```

## テストの追加・修正方法

### 新しいテストを追加する手順

1. **テストファイルを開く（または新規作成）**
   ```bash
   # 既存ファイルに追加
   code tests/e2e/tasks.spec.ts
   
   # 新規ファイルを作成
   touch tests/e2e/new-feature.spec.ts
   ```

2. **テストケースを記述**
   ```typescript
   test('新しい機能のテスト', async ({ page }) => {
     // テストコードを記述
   })
   ```

3. **テストを実行して確認**
   ```bash
   # 特定のテストファイルのみ実行
   npx playwright test tests/e2e/new-feature.spec.ts
   
   # UIモードで実行（推奨）
   npm run test:e2e:ui
   ```

### 既存のテストを修正する手順

1. **テストを実行して失敗を確認**
   ```bash
   npm run test:e2e
   ```

2. **UIモードで実行して問題を特定**
   ```bash
   npm run test:e2e:ui
   ```

3. **セレクタや待機処理を修正**
   ```typescript
   // 修正前
   await page.click('text=ボタン')
   
   // 修正後
   await page.locator('button:has-text("ボタン")').waitFor({ state: 'visible' })
   await page.click('button:has-text("ボタン")')
   ```

4. **再実行して確認**
   ```bash
   npx playwright test tests/e2e/tasks.spec.ts
   ```

### ヘルパー関数を追加する手順

1. **適切なヘルパーファイルを選択（または新規作成）**
   ```typescript
   // tests/e2e/helpers/new-feature.ts
   import { Page } from '@playwright/test'
   
   export async function newHelperFunction(page: Page) {
     // ヘルパー関数の実装
   }
   ```

2. **テストファイルでインポートして使用**
   ```typescript
   import { newHelperFunction } from './helpers/new-feature'
   
   test('テストケース', async ({ page }) => {
     await newHelperFunction(page)
   })
   ```

## デバッグのワークフロー

### ステップ1: 問題の特定

```bash
# テストを実行して失敗を確認
npm run test:e2e

# 失敗したテストの詳細を確認
# test-results/ ディレクトリにスクリーンショットとトレースが保存される
```

### ステップ2: UIモードで実行

```bash
# UIモードでテストを実行
npm run test:e2e:ui

# テストの実行を一時停止して、ブラウザの状態を確認
# セレクタを検証して、正しい要素を選択できているか確認
```

### ステップ3: ヘッドモードで実行

```bash
# ブラウザを表示してテストを実行
npm run test:e2e:headed

# テストの動作を目視で確認
# 問題の原因を特定
```

### ステップ4: デバッグコードを追加

```typescript
test('デバッグ用テスト', async ({ page }) => {
  await navigateToTasks(page)
  
  // スクリーンショットを撮る
  await page.screenshot({ path: 'debug-1.png' })
  
  // 要素の数を確認
  const buttonCount = await page.locator('text=新規タスク').count()
  console.log(`Found ${buttonCount} buttons`)
  
  // 要素のテキストを確認
  const buttonText = await page.locator('button').first().textContent()
  console.log(`Button text: ${buttonText}`)
  
  // 操作を実行
  await page.click('text=新規タスク')
  
  // 操作後のスクリーンショット
  await page.screenshot({ path: 'debug-2.png' })
})
```

### ステップ5: トレースを確認

```bash
# トレースファイルを開く
npx playwright show-trace test-results/path-to-trace.zip

# テストの実行過程を時系列で確認
# 各操作の前後の状態を確認
```

## テストの保守方法

### 定期的なメンテナンス

1. **テストの実行結果を確認**
   ```bash
   # 定期的にテストを実行
   npm run test:e2e
   
   # 失敗したテストを修正
   ```

2. **セレクタの更新**
   - UIが変更された場合、セレクタを更新
   - より安定したセレクタに変更（例: `data-testid` の追加）

3. **テストデータのクリーンアップ**
   ```typescript
   test.beforeEach(async ({ page }) => {
     // テストデータをクリーンアップ
     await page.evaluate(() => localStorage.clear())
   })
   ```

### テストのリファクタリング

1. **重複コードをヘルパー関数に抽出**
   ```typescript
   // 重複している処理をヘルパー関数に
   export async function createTaskWithDefaults(page: Page, title: string) {
     await page.click('text=新規タスク')
     await page.fill('input[id="title"]', title)
     await page.click('button[type="submit"]')
     await page.waitForTimeout(500)
   }
   ```

2. **テストデータを定数化**
   ```typescript
   const TEST_DATA = {
     taskTitle: 'テストタスク',
     projectName: 'テストプロジェクト',
   }
   ```

3. **ページオブジェクトパターンの導入（大規模な場合）**
   ```typescript
   class TasksPage {
     constructor(private page: Page) {}
     
     async createTask(title: string) {
       await this.page.click('text=新規タスク')
       await this.page.fill('input[id="title"]', title)
       await this.page.click('button[type="submit"]')
     }
   }
   ```

### テストの品質向上

1. **テストの独立性を保つ**
   - 各テストは独立して実行できるようにする
   - テスト間で状態を共有しない

2. **明確なテスト名**
   ```typescript
   // ❌ 悪い例
   test('test1', async ({ page }) => { ... })
   
   // ✅ 良い例
   test('新規タスクを作成できること', async ({ page }) => { ... })
   ```

3. **適切なアサーション**
   ```typescript
   // ❌ 悪い例: 存在確認のみ
   await expect(page.locator('text=タスク名')).toBeVisible()
   
   // ✅ 良い例: 具体的な状態を確認
   await expect(page.locator('text=タスク名')).toBeVisible()
   await expect(page.locator('.task-item').first()).toHaveText('タスク名')
   ```

## 実践的なワークフロー例

### シナリオ1: 新しい機能のテストを追加

```bash
# 1. 機能を実装
# 2. テストファイルを作成または既存ファイルに追加
code tests/e2e/new-feature.spec.ts

# 3. テストを記述
# 4. UIモードで実行して確認
npm run test:e2e:ui

# 5. 問題があれば修正
# 6. すべてのブラウザで実行して確認
npm run test:e2e
```

### シナリオ2: 失敗したテストを修正

```bash
# 1. テストを実行して失敗を確認
npm run test:e2e

# 2. 失敗したテストのスクリーンショットを確認
open test-results/

# 3. UIモードで実行して問題を特定
npm run test:e2e:ui

# 4. セレクタや待機処理を修正
code tests/e2e/failing-test.spec.ts

# 5. 修正後のテストを再実行
npx playwright test tests/e2e/failing-test.spec.ts

# 6. すべてのテストを実行して確認
npm run test:e2e
```

### シナリオ3: セレクタの更新

```bash
# 1. UIが変更されたことを確認
# 2. テストを実行して失敗を確認
npm run test:e2e

# 3. ブラウザの開発者ツールで新しいセレクタを確認
# 4. セレクタを更新
code tests/e2e/updated-test.spec.ts

# 5. UIモードで実行して確認
npm run test:e2e:ui

# 6. すべてのブラウザで実行して確認
npm run test:e2e
```

## チェックリスト

テストを追加・修正する際のチェックリスト：

- [ ] テストが独立して実行できるか
- [ ] 適切な待機処理が含まれているか
- [ ] セレクタが安定しているか（UI変更に強いか）
- [ ] テスト名が明確か
- [ ] エラーメッセージが分かりやすいか
- [ ] すべてのブラウザで実行して確認したか
- [ ] テストデータが一意か（タイムスタンプなど）
- [ ] LocalStorageなどの状態がクリーンアップされているか

## 参考リソース

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Selectors](https://playwright.dev/docs/selectors)

