---
name: timestamp-merge-sync
overview: Cloudflare同期をタイムスタンプベースのマージに変更し、updatedAtを比較してより新しい方を採用するようにする。削除は行わず、複数端末間でデータが失われないようにする。
todos:
  - id: remove-delete-logic
    content: workers/src/routes/sync.ts から削除ロジックを削除
    status: completed
  - id: implement-merge-logic
    content: useCloudflare.ts にタイムスタンプベースのマージロジックを実装
    status: completed
  - id: deploy-and-test
    content: Workersをデプロイし、別端末からの同期をテスト
    status: completed
---

# タイムスタンプベースのマージ同期

## 概要

現在の「ローカルでCloudflareを上書き」する同期を、**タイムスタンプベースのマージ**に変更する。これにより、別端末からの初回同期でもデータが消えず、複数端末間で正しく同期される。

## 方針

1. **削除処理を削除**
   - `workers/src/routes/sync.ts` の `buildDeleteMissingQuery` と削除ロジックを削除
   - 代わりに `INSERT OR REPLACE` のみで、存在するデータを更新

2. **フロント側でマージ処理を実装**
   - `useCloudflare.syncBidirectional` を修正
   - Cloudflareからデータを取得
   - ローカルとCloudflareのデータを `updatedAt` で比較
   - より新しい方を採用してマージ
   - マージ結果をCloudflareとローカル両方に保存

3. **マージロジック**
   - 同じIDのエンティティ: `updatedAt` が新しい方を採用
   - ローカルにしか存在しない: ローカルのデータを採用
   - Cloudflareにしか存在しない: Cloudflareのデータを採用

## 実装ファイル

- [workers/src/routes/sync.ts](workers/src/routes/sync.ts): 削除処理を削除
- [src/hooks/useCloudflare.ts](src/hooks/useCloudflare.ts): マージロジックを実装

## 詳細

### マージ関数の例

```typescript
function mergeEntities<T extends { id: string; updatedAt?: string }>(
  local: T[],
  remote: T[]
): T[] {
  const merged = new Map<string, T>()
  
  // リモートのデータを先に追加
  for (const item of remote) {
    merged.set(item.id, item)
  }
  
  // ローカルのデータをマージ（より新しい場合は上書き）
  for (const item of local) {
    const existing = merged.get(item.id)
    if (!existing) {
      merged.set(item.id, item)
    } else {
      const localTime = new Date(item.updatedAt || 0).getTime()
      const remoteTime = new Date(existing.updatedAt || 0).getTime()
      if (localTime > remoteTime) {
        merged.set(item.id, item)
      }
    }
  }
  
  return Array.from(merged.values())
}
```

## 注意点

- 削除はこの方式では即座に反映されない（論理削除が必要な場合は別途対応）
- 時計がずれている端末があると問題になる可能性があるが、一般的な使用では問題ない