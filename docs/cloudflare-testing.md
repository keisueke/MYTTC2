# Cloudflare移行後のテストガイド

## 概要

Cloudflare移行後の動作確認とテスト方法を説明します。

## テスト項目

### 1. データ整合性テスト

#### 手動テスト

1. **データ移行の確認**
   ```bash
   # 移行スクリプトを実行
   npm run migrate:cloudflare
   
   # データ整合性を確認
   # - タスク数が一致するか
   # - プロジェクト、モード、タグが正しく移行されているか
   # - ルーティン実行記録が正しく移行されているか
   ```

2. **データ同期の確認**
   - フロントエンドからデータを同期
   - データが正しく表示されるか確認
   - 更新が正しく反映されるか確認

#### 自動テスト

```typescript
// tests/e2e/cloudflare-sync.spec.ts（新規作成）
test('Cloudflare APIとの同期が正しく動作すること', async ({ page }) => {
  // 1. ローカルデータを作成
  // 2. Cloudflare APIに同期
  // 3. データが正しく保存されているか確認
  // 4. 別デバイスから同期してデータが取得できるか確認
})
```

### 2. APIエンドポイントのテスト

#### 手動テスト

```bash
# Workers APIのヘルスチェック
curl https://your-api.workers.dev/health

# タスク一覧の取得
curl -H "X-API-Key: your-api-key" https://your-api.workers.dev/api/tasks

# タスクの作成
curl -X POST -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"title":"テストタスク","repeat_pattern":"none"}' \
  https://your-api.workers.dev/api/tasks
```

#### 自動テスト

```typescript
// tests/api/cloudflare-api.spec.ts（新規作成）
import { test, expect } from '@playwright/test'

test('Cloudflare Workers APIのエンドポイントが正しく動作すること', async ({ request }) => {
  const apiUrl = process.env.CLOUDFLARE_API_URL || 'http://localhost:8787'
  const apiKey = process.env.CLOUDFLARE_API_KEY

  // ヘルスチェック
  const healthResponse = await request.get(`${apiUrl}/health`)
  expect(healthResponse.ok()).toBeTruthy()

  // タスク一覧の取得
  const tasksResponse = await request.get(`${apiUrl}/api/tasks`, {
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
  })
  expect(tasksResponse.ok()).toBeTruthy()
})
```

### 3. E2Eテストの更新

既存のE2Eテストを更新して、Cloudflare APIを使用する場合のテストも追加します。

**ファイル**: `tests/e2e/cloudflare.spec.ts`（新規）

```typescript
import { test, expect } from '@playwright/test'
import { navigateToSettings } from './helpers/navigation'

test.describe('Cloudflare統合', () => {
  test.beforeEach(async ({ page }) => {
    // LocalStorageをクリア
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('Cloudflare設定を保存できること', async ({ page }) => {
    await navigateToSettings(page)
    
    // Cloudflare設定セクションを探す
    // API URLとAPI Keyを入力
    // 保存ボタンをクリック
    // 設定が保存されていることを確認
  })

  test('Cloudflare APIからデータを同期できること', async ({ page }) => {
    // Cloudflare設定が保存されている前提
    await navigateToSettings(page)
    
    // 同期ボタンをクリック
    // データが正しく同期されることを確認
  })
})
```

### 4. パフォーマンステスト

- API応答時間の測定
- データ同期時間の測定
- 大量データでの動作確認

### 5. エラーハンドリングテスト

- ネットワークエラー時の動作
- API認証エラー時の動作
- データ競合時の動作

## テスト環境のセットアップ

### 開発環境

```bash
# Workers APIをローカルで起動
cd workers
npm run dev

# フロントエンドを起動
npm run dev
```

### テスト環境変数

`.env.test`ファイルを作成:

```bash
CLOUDFLARE_API_URL=http://localhost:8787
CLOUDFLARE_API_KEY=test-api-key
```

## 移行チェックリスト

- [ ] D1データベースが正しく作成されている
- [ ] マイグレーションが実行されている
- [ ] Workers APIがデプロイされている
- [ ] APIエンドポイントが正しく動作している
- [ ] データ移行が完了している
- [ ] データ整合性が確認されている
- [ ] フロントエンドからAPIに接続できる
- [ ] データ同期が正しく動作している
- [ ] エラーハンドリングが正しく動作している
- [ ] E2Eテストが更新されている
- [ ] パフォーマンスが許容範囲内である

## トラブルシューティング

### データが同期されない

- API URLが正しく設定されているか確認
- API Keyが正しく設定されているか確認
- CORS設定が正しいか確認
- ネットワークエラーがないか確認

### データが正しく表示されない

- データ移行が完了しているか確認
- データ形式が正しいか確認
- フロントエンドのデータ変換ロジックを確認

### APIエラーが発生する

- Workers APIのログを確認
- データベース接続が正しいか確認
- 認証が正しく設定されているか確認

