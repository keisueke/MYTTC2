# 入力バリデーション・インジェクション対策設計書

## 1. 概要

本設計書は、アプリケーション全体のテキスト入力に対して制御文字の禁止とインジェクション攻撃対策を実装するための設計を記述します。

### 1.1 目的

- **制御文字の禁止**: データの整合性を保ち、表示や処理に支障をきたす制御文字の入力を防止
- **インジェクション対策**: SQLインジェクション、XSS（Cross-Site Scripting）などの攻撃を防止
- **将来のDB接続への備え**: Cloudflare D1などのデータベース接続時にも安全に動作する設計

### 1.2 設計方針

**二重防衛線アーキテクチャ**を採用：

1. **第一防衛線（フロントエンド）**: ユーザー入力時にバリデーションを実行し、問題のある入力を早期に検出・ブロック
2. **最終防衛線（サービス層）**: データ保存前にサニタイズ処理を実行し、UIを経由しないデータ流入にも対応

## 2. 禁止文字の定義

### 2.1 制御文字

以下の制御文字を禁止します：

#### 禁止範囲
- **C0制御文字**: `\u0000` - `\u001F`（改行・タブを除く）
- **DEL文字**: `\u007F`
- **C1制御文字**: `\u0080` - `\u009F`

#### 許可する制御文字
以下の制御文字は通常の入力として必要であるため許可します：
- **改行（LF）**: `\n` (`\u000A`)
- **改行（CR）**: `\r` (`\u000D`)
- **タブ**: `\t` (`\u0009`)

### 2.2 インジェクション関連の危険なパターン

以下のパターンを検出してブロックします：

| パターン | 説明 | 対策理由 |
|---------|------|---------|
| `<script[^>]*>` | スクリプトタグ | XSS攻撃の防止 |
| `javascript:` | JavaScriptプロトコル | XSS攻撃の防止 |
| `on\w+\s*=` | イベントハンドラ（onclick等） | XSS攻撃の防止 |
| `['";\\]` | シングルクォート、ダブルクォート、セミコロン、バックスラッシュ | SQLインジェクション対策（将来のDB接続時） |

## 3. アーキテクチャ

### 3.1 レイヤー構成

```
┌─────────────────────────────────────┐
│  フロントエンド（React Components）  │
│  - バリデーション実行               │
│  - エラーメッセージ表示             │
│  - 保存をブロック                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  サービス層（taskService.ts等）      │
│  - サニタイズ処理                   │
│  - 制御文字の削除                   │
│  - 最終防衛線                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  データストレージ（LocalStorage）    │
│  将来: Cloudflare D1（パラメータ化） │
└─────────────────────────────────────┘
```

### 3.2 データフロー

```
ユーザー入力
    ↓
[バリデーション] ← 第一防衛線
    ↓ (エラー時: ブロック)
フォーム送信
    ↓
[サニタイズ] ← 最終防衛線
    ↓
データ保存
```

## 4. 実装詳細

### 4.1 共通バリデーション関数

**ファイル**: `src/utils/validation.ts`

#### 主要関数

##### `validateTextInput(input: string, fieldName?: string): ValidationResult`

テキスト入力のバリデーションを実行します。

**パラメータ**:
- `input`: 検証するテキスト
- `fieldName`: フィールド名（エラーメッセージ用、オプション）

**戻り値**:
```typescript
interface ValidationResult {
  valid: boolean              // バリデーション結果
  invalidChars: string[]      // 検出された無効文字の種類
  errorMessage?: string        // エラーメッセージ（日本語）
}
```

**処理内容**:
1. 制御文字の検出（許可文字を除く）
2. 危険なパターンの検出
3. エラーメッセージの生成

##### `sanitizeText(input: string): string`

テキストをサニタイズ（制御文字を削除）します。

**注意**: これは最終防衛線として使用するもので、通常はバリデーションでブロックする

**処理内容**:
1. 禁止制御文字の削除
2. 危険なパターンの削除

### 4.2 フロントエンド実装

#### 適用箇所

以下のフォームコンポーネントにバリデーションを適用：

| コンポーネント | 対象フィールド | ファイル |
|--------------|--------------|---------|
| `TaskForm` | タイトル、説明 | `src/components/tasks/TaskForm.tsx` |
| `TagForm` | タグ名 | `src/components/tags/TagForm.tsx` |
| `ProjectForm` | プロジェクト名 | `src/components/projects/ProjectForm.tsx` |
| `ModeForm` | モード名 | `src/components/modes/ModeForm.tsx` |
| `DailyRecordInput` | 朝食、昼食、夕食、間食 | `src/components/dashboard/DailyRecordInput.tsx` |

#### 実装パターン

```typescript
// 1. インポート
import { validateTextInput } from '../../utils/validation'

// 2. バリデーション関数内で使用
const validate = (): boolean => {
  const newErrors: Record<string, string> = {}
  
  // 必須チェック
  if (!name.trim()) {
    newErrors.name = '名前は必須です'
  } else {
    // バリデーション実行
    const validation = validateTextInput(name, '名前')
    if (!validation.valid && validation.errorMessage) {
      newErrors.name = validation.errorMessage
    }
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

// 3. エラー表示
{errors.name && (
  <p className="mt-1 font-display text-xs text-[var(--color-error)]">
    {errors.name}
  </p>
)}
```

### 4.3 サービス層実装

**ファイル**: `src/services/taskService.ts`

#### 適用箇所

以下の関数でサニタイズ処理を実行：

| 関数 | 対象フィールド |
|------|--------------|
| `addTask` | `title`, `description` |
| `updateTask` | `title`, `description` |
| `addProject` | `name` |
| `updateProject` | `name` |
| `addMode` | `name` |
| `updateMode` | `name` |
| `addTag` | `name` |
| `updateTag` | `name` |
| `saveDailyRecord` | `breakfast`, `lunch`, `dinner`, `snack` |

#### 実装パターン

```typescript
// インポート
import { sanitizeText } from '../utils/validation'

// 追加時
export function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  // 最終防衛線: テキストフィールドをサニタイズ
  const sanitizedTask = {
    ...task,
    title: sanitizeText(task.title),
    description: task.description ? sanitizeText(task.description) : undefined,
  }
  
  // ... 保存処理
}

// 更新時
export function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task {
  // 最終防衛線: テキストフィールドをサニタイズ
  const sanitizedUpdates: Partial<Omit<Task, 'id' | 'createdAt'>> = { ...updates }
  if (updates.title !== undefined) {
    sanitizedUpdates.title = sanitizeText(updates.title)
  }
  if (updates.description !== undefined && updates.description !== null) {
    sanitizedUpdates.description = sanitizeText(updates.description)
  }
  
  // ... 更新処理
}
```

## 5. エラーハンドリング

### 5.1 エラーメッセージ仕様

- **言語**: 日本語
- **形式**: `{フィールド名}に使用できない文字が含まれています: {無効文字の種類}`
- **例**: 
  - `タイトルに使用できない文字が含まれています: C0制御文字`
  - `説明に使用できない文字が含まれています: C0制御文字、危険な文字パターン`

### 5.2 ユーザーへの表示

- **フロントエンド**: エラーメッセージを赤色で表示し、保存ボタンを無効化
- **サービス層**: サニタイズ処理は静かに実行（ログ出力は行わない）

## 6. 将来のDB接続時の考慮事項

### 6.1 Cloudflare D1への移行時

現在の実装は、将来的にCloudflare D1などのデータベースに接続する際にも安全に動作するよう設計されています。

#### パラメータ化クエリの使用

**重要**: サーバー側では必ずパラメータ化クエリ（プレースホルダ）を使用すること

```typescript
// ❌ 悪い例: 文字列連結（インジェクション脆弱性）
const query = `SELECT * FROM tasks WHERE title = '${title}'`

// ✅ 良い例: パラメータ化クエリ
const query = `SELECT * FROM tasks WHERE title = ?`
const result = await db.prepare(query).bind(title).all()
```

#### 二重防衛線の重要性

1. **フロントエンド**: ユーザー体験を向上（即座にエラーを表示）
2. **サービス層**: セキュリティの最終防衛線（UIを経由しないデータ流入にも対応）
3. **DB層**: パラメータ化クエリでインジェクションを完全に防止

### 6.2 推奨実装パターン

```typescript
// DBアクセス層の例（将来実装時）
export async function saveTaskToDB(task: Task): Promise<void> {
  // サービス層で既にサニタイズ済みだが、念のため再度チェック
  const sanitizedTitle = sanitizeText(task.title)
  
  // パラメータ化クエリを使用
  await db.prepare(`
    INSERT INTO tasks (id, title, description, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(
    task.id,
    sanitizedTitle,  // パラメータとして渡す
    task.description ? sanitizeText(task.description) : null,
    task.createdAt
  ).run()
}
```

## 7. テストケース

### 7.1 バリデーションテスト

| 入力 | 期待結果 | 理由 |
|------|---------|------|
| `"正常なテキスト"` | ✅ 許可 | 通常の入力 |
| `"テキスト\n改行"` | ✅ 許可 | 改行は許可文字 |
| `"テキスト\tタブ"` | ✅ 許可 | タブは許可文字 |
| `"テキスト\u0001"` | ❌ ブロック | C0制御文字 |
| `"テキスト\u007F"` | ❌ ブロック | DEL文字 |
| `"テキスト\u0080"` | ❌ ブロック | C1制御文字 |
| `"<script>alert('XSS')</script>"` | ❌ ブロック | スクリプトタグ |
| `"javascript:alert('XSS')"` | ❌ ブロック | JavaScriptプロトコル |
| `"onclick='alert(1)'"` | ❌ ブロック | イベントハンドラ |
| `"'; DROP TABLE tasks; --"` | ❌ ブロック | SQLインジェクション関連文字 |

### 7.2 サニタイズテスト

| 入力 | サニタイズ後 | 説明 |
|------|------------|------|
| `"テキスト\u0001"` | `"テキスト"` | 制御文字が削除される |
| `"<script>alert('XSS')</script>"` | `"alert('XSS')"` | スクリプトタグが削除される |

## 8. パフォーマンス考慮事項

### 8.1 バリデーションの実行タイミング

- **リアルタイム**: 入力中にバリデーションを実行しない（パフォーマンス考慮）
- **送信時**: フォーム送信時にバリデーションを実行
- **サニタイズ**: 保存時のみ実行（軽量な処理）

### 8.2 最適化

- バリデーション関数は軽量なため、パフォーマンスへの影響は最小限
- サニタイズ処理も文字列操作のみで高速

## 9. 保守性

### 9.1 拡張性

新しい禁止文字やパターンを追加する場合：

1. `src/utils/validation.ts` の `FORBIDDEN_CONTROL_CHAR_RANGES` または `DANGEROUS_PATTERNS` を更新
2. 既存のフォームコンポーネントは自動的に新しいルールが適用される

### 9.2 設定の外部化（将来の拡張）

将来的に禁止文字を設定可能にする場合：

- 設定ファイルまたはデータベースから読み込む
- ユーザーごとにカスタマイズ可能にする

## 10. まとめ

本設計により、以下のセキュリティ対策が実現されました：

1. ✅ **制御文字の禁止**: データの整合性を保証
2. ✅ **インジェクション対策**: SQLインジェクション、XSS攻撃を防止
3. ✅ **二重防衛線**: フロントエンドとサービス層の両方で保護
4. ✅ **将来への備え**: DB接続時にも安全に動作する設計
5. ✅ **ユーザー体験**: 分かりやすいエラーメッセージで即座にフィードバック

この設計により、アプリケーションのセキュリティが大幅に向上し、将来的な拡張にも対応できる堅牢な基盤が構築されました。

