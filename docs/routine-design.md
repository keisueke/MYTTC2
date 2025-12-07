# ルーティンタスク管理 現行設計（2025-12-07時点）

## データモデル
- `Task`
  - 繰り返しタスクはテンプレートとして1件のみ保持（`repeatPattern !== 'none'`）。
  - 進行/完了状態: `isRunning`, `startTime`, `endTime`, `elapsedTime`, `completedAt`.
  - 未実行記録: `skippedAt`.
- `RoutineExecution`（新設）
  - `routineTaskId`（テンプレートへの参照）
  - `date`（実行日）
  - 実行ログ: `startTime`, `endTime`, `elapsedTime`, `completedAt`, `skippedAt`
  - メタ: `createdAt`, `updatedAt`
- `AppData`
  - `routineExecutions` を追加（既存データと共存）

## フロー
1) 当日分生成  
`ensureTodayRoutineExecutions` が繰り返しテンプレートを走査し、当日分の `RoutineExecution` を未生成なら作成。

2) 朝5時の未完了検出  
`getIncompleteRoutinesFromYesterday` で前日（5時基準）の `RoutineExecution` を確認し、`completedAt` も `skippedAt` も無いものを未完了として抽出。Dashboardでモーダル表示しユーザー選択:
   - 今日も実行する: 当日分の `RoutineExecution` を作成
   - 今日はスキップ: 前日分 `RoutineExecution.skippedAt` を付与
   - 削除: テンプレート `Task` を削除
   - 変更: 現状は通知のみ（編集導線は未接続）

3) タイマー連動  
`startTaskTimer` / `stopTaskTimer` が、繰り返しタスクの場合は当日 `RoutineExecution` の `startTime` / `endTime` / `elapsedTime` / `completedAt` を更新。

## 表示ロジック
- TaskList  
  - 繰り返しタスクはテンプレートを1行表示。`isRepeatTaskForToday` と `RoutineExecution` で今日の表示判定。完了表示は `RoutineExecution.completedAt` を優先。
- TaskItem  
  - 繰り返しタスクは `RoutineExecution` の完了・経過時間を反映。通常タスクは従来通り。
- HabitTracker  
  - タイトル＋パターンでグループ化し、`RoutineExecution` から日別完了を算出。
- Dashboard  
  - 未完了ルーティンのモーダル表示。HabitTrackerに `routineExecutions` を供給。

## サービス関数（主要）
- RoutineExecution系: `getRoutineExecutions`, `addRoutineExecution`, `updateRoutineExecution`, `deleteRoutineExecution`, `ensureTodayRoutineExecutions`
- 互換: `processIncompleteTasksFromYesterday`（旧ロジック、互換用）
- タイマー: `startTaskTimer` / `stopTaskTimer` が `RoutineExecution` も更新

## 現状の制約・課題
- 「変更する」選択肢がTask編集画面に遷移していない（通知のみ）。
- RoutineExecution完了を手動で切り替えるUIが無く、タイマー依存。
- タイマー未使用時の完了/スキップ手動操作導線が不足。
- 既存 `Task` 完了と `RoutineExecution` 完了が並存（後方互換のため）。一本化するかの判断が必要。

## 今後の検討ポイント
- 完了/未完了の単一ソース化: 繰り返しタスクは `RoutineExecution` を正とし、Task側の `completedAt` / `elapsedTime` を表示に使わない運用へ移行するか。
- 手動完了/スキップUI: タスクリスト/モーダルに「完了」「スキップ」ボタンを追加し、`RoutineExecution` を直接更新。
- 編集導線: 「変更する」でTask編集を開く（`TaskForm` 再利用）。
- 集計/分析: `RoutineExecution` ベースで日次/週次の完了率、空き時間推定を追加。
- 後方互換: 過去のTask完了データをRoutineExecutionに移行するマイグレーションの要否を検討。

