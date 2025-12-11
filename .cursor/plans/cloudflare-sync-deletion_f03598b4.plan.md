---
name: cloudflare-sync-deletion
overview: Cloudflare同期時にローカルで削除したタスクがCloudflare側でも削除されるように、双方向同期ロジックとWorkersの保存処理を修正する。
todos:
  - id: cf-sync-delete-tasks-logic
    content: workers/src/routes/sync.ts の postSync に、ローカルに存在しないタスクIDを Cloudflare DB から削除するロジックを追加する
    status: completed
  - id: cf-sync-delete-tasks-verify
    content: タスク削除→同期→リロードのシナリオで、Cloudflare側からタスクが復活しないことを確認する
    status: completed
---

## Cloudflare同期で削除を正しく反映する計画

### ゴール
- ローカルでタスクを削除してCloudflare同期したときに、**Cloudflare側のDBからも対応するタスクが削除され、リロードしても復活しない**状態にする。
- 既存の「ルーティン設定」「repeatPattern」などのフィールドが、削除処理によって壊れないようにする。

### 方針
1. **同期の前提を明確化**
   - 「この端末から同期を実行したときは、**その時点のローカル状態をCloudflare DBにミラーリングする**」という仕様にする。
   - つまり、`POST /api/sync` で送った `tasks` のID一覧が **その時点で存在すべきタスクの完全集合** とみなし、それ以外のタスクは削除対象とする。

2. **Workers側 `postSync` で削除を扱う**（`workers/src/routes/sync.ts`）
   - 現状: `INSERT OR REPLACE INTO tasks ...` で「あるものの更新／新規作成」だけを行い、「無くなったものの削除」はしていない。
   - 修正案（タスクに限定して実施）:
     - `body.data.tasks` が `undefined` の場合: タスクは何もしない（互換性維持）。
     - `body.data.tasks` が **空配列** の場合: `DELETE FROM tasks;` で全削除（ローカルが0件ならクラウドも0件）。
     - `body.data.tasks` に1件以上ある場合:
       - `const ids = body.data.tasks.map(t => t.id)` を取得
       - 先に `DELETE FROM tasks WHERE id NOT IN (?, ?, ...)` を追加クエリとして実行
       - その後、既存ロジックどおり `INSERT OR REPLACE` で残すべきタスクを再保存
   - こうすることで、「ローカル一覧に存在しないIDのタスク」はクラウドからも消える。

3. **他エンティティへの影響を最小限に**
   - 今回はまず **tasksのみ削除連動** を実装し、`projects` や `modes` 等は従来どおり（削除しない）とする。
   - 今後の要望に応じて、`wishes` や `subTasks` などにも同様のパターンを拡張できるよう、削除ロジックは関数化しておく（例: `buildDeleteMissingQuery('tasks', 'id', ids)`）。

4. **フロント側の変更有無の確認**
   - `src/services/cloudflareApi.ts` の `syncToCloudflare` はすでに **ローカルの全タスク配列を送っている** ので、追加のフィールドは不要。
   - `useCloudflare.syncBidirectional` も、「ローカルをCloudflareにアップロード → その後Cloudflareから再取得」というフローなので、削除ロジックをWorkers側に入れれば期待どおりに動作する。

5. **テストと確認シナリオ**
   - シナリオA: 既存タスクあり → 1件削除 → 同期 → リロード → **削除したタスクが復活しない** ことを確認。
   - シナリオB: すべてのタスクを削除 → 同期 → リロード → **タスク0件のまま** であることを確認。
   - シナリオC: ルーティン設定付きタスクを含む状態で同期 → リロード → **repeatPatternが維持されている** ことを確認。

### 実装対象ファイル
- `workers/src/routes/sync.ts`:
  - `postSync` 内で `body.data.tasks` を使った削除ロジックを追加
- （フロント側ファイルは、削除連動のための変更は不要な想定）