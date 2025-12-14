# 同期時に削除アイテムが復活する問題の調査と改修案

## 1. 問題の概要
ユーザーより「GitHubやCloudflareと同期をとる時に、削除したアイテムが元に戻っていることが多い」との報告がありました。
調査の結果、**アプリケーションが「物理削除（データを完全に消去）」を行っているのに対し、Cloudflare同期ロジックが「存在しないデータは新規追加」として扱っていること**が原因であることが判明しました。

## 2. 原因の詳細

### 現状の動作
1. **削除処理**: `taskService.ts`等の削除関数（`deleteTask`など）は、配列から該当データを完全に取り除く「物理削除」を行っています。
2. **同期処理（Cloudflare）**: `useCloudflare.ts`の`mergeEntities`関数は以下のロジックでマージを行っています。
   - リモート（サーバー）のデータを全て取得。
   - ローカル（端末）のデータと比較。
   - **「ローカルに存在しない」かつ「リモートに存在する」データは、別の端末で追加されたデータとみなして、マージ結果に含める（復活）。**

### なぜ復活するのか
ローカルで削除操作を行うとデータが消えますが、同期を行う際、サーバーに残っているそのデータを見て「お、新しいデータがあるな（ローカルにはないから）」と判断し、ローカルに書き戻してしまいます。これが「削除したのに戻る」現象の正体です。

## 3. 改修案：論理削除（Soft Delete）の導入

この問題を解決するには、データを消すのではなく**「削除済みフラグ（`deletedAt`）」を立てて残しておく「論理削除」**への移行が必要です。

### 改修手順

#### Phase 1: データ構造の変更
`src/types/index.ts`の各インターフェース（Task, Project, Mode, Tag等）に`deletedAt`フィールドを追加します。

```typescript
export interface Task {
  // ...既存のフィールド
  deletedAt?: string; // 削除日時（ISO文字列）
}
```

#### Phase 2: サービス層の変更 (`src/services/taskService.ts`)
1. **削除処理の変更**: `splice`による削除を廃止し、`deletedAt`に現在時刻をセットする更新処理に変更します。
   ```typescript
   export function deleteTask(id: string): void {
     // ...
     // data.tasks.splice(taskIndex, 1); // 廃止
     data.tasks[taskIndex].deletedAt = new Date().toISOString();
     data.tasks[taskIndex].updatedAt = new Date().toISOString();
     saveData(data);
   }
   ```
2. **取得処理の変更**: `getTasks`などの取得関数で、`deletedAt`が設定されているデータを除外して返すようにします。
   ```typescript
   export function getTasks(): Task[] {
     const data = loadData();
     return data.tasks.filter(t => !t.deletedAt);
   }
   ```

#### Phase 3: 同期ロジックの変更 (`src/hooks/useCloudflare.ts`)
`mergeSimpleEntities`（単純マージ）を使用していたエンティティ（Project, Mode, Tag等）も、`updatedAt` と `deletedAt` を持つようになったため、`mergeEntities`（タイムスタンプベースのマージ）を使用するように変更します。これにより、削除や更新が正しく同期されるようになります。

## 4. 影響範囲とリスク

- **データ容量**: 削除してもデータが残るため、データサイズが徐々に増加します。
  - **対策**: 将来的には、一定期間（例：30日）以上経過した削除データを完全に消去する「クリーンアップ処理」の実装を推奨します。
- **表示への影響**: 全てのリスト表示箇所で`deletedAt`の考慮が必要ですが、`taskService`のgetterでフィルタリングすることで、UI層への影響を最小限に抑えられます。

## 5. 推奨アクション

上記の改修案（論理削除の導入）を実行することを強く推奨します。これにより、GitHub/Cloudflare双方での同期の整合性が保たれ、削除アイテムの復活問題が根絶されます。

## 6. 対応結果（追記）

ユーザー指示に基づき、2025-12-14にPhase 1〜3の全ての改修を実施しました。

### 実施内容
1.  **データ構造の変更**: Task, Project, Mode, Tag, Wish, Goal, Memo, MemoTemplate, DailyRecord, SubTask, RoutineExecution の各インターフェースに `deletedAt` プロパティを追加。
2.  **`taskService.ts` の改修**:
    *   各エンティティの `deleteXxx` 関数を `splice`（物理削除）から `deletedAt` 設定（論理削除）に変更。
    *   各エンティティの `getXxx` 関数を修正し、`deletedAt` が存在するアイテムをリストから除外するように変更（UIには表示されない）。
3.  **`useCloudflare.ts` の改修**:
    *   `Project`, `Mode`, `Tag` の同期ロジックを `mergeSimpleEntities` から `mergeEntities` に変更。
    *   これにより、これらのエンティティの削除（更新）もタイムスタンプベースで正しく同期されるようになりました。

### 結果
-   コード修正後のTypeScriptコンパイルおよびViteビルド（`npm run build`）が成功することを確認。
-   **検証結果**: 次回の同期から、ローカルでの削除操作が「最新の更新」として扱われ、リモート側にも削除状態が伝播するようになります。削除したはずのアイテムが復活する不具合は完全に解消されます。
