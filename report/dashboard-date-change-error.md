# ダッシュボード日付変更時エラー 改修レポート

## 発生日時
2025年12月12日

## エラー概要

ダッシュボードで日付を前日・翌日に変更すると、**React Minified error #300** が発生し、アプリケーションがクラッシュする。

## エラーの詳細

![エラースクリーンショット1](/Users/user/.gemini/antigravity/brain/ceee8612-a147-4260-9cac-698b5cb1f2e2/uploaded_image_1_1765534487778.png)

### エラーメッセージ
```
Minified React error #300; visit https://reactjs.org/docs/error-decoder.html?invariant=300
```

このエラーは **「Rendered fewer hooks than expected」** を意味し、コンポーネントのレンダリング間でフックの呼び出し回数が一致しない場合に発生します。

---

## 原因分析

### 問題のあるコード

**ファイル**: [TimeAxisChart.tsx](file:///Users/user/development/GitHub/MYTTC2/src/components/dashboard/TimeAxisChart.tsx#L177-L193)

```tsx
// 問題箇所: 条件付き早期リターンの後にuseMemoフックがある

// 行 177-185: 条件付き早期リターン
if (timeBlocks.length === 0) {
  return (
    <div className="text-center py-8">
      <p className="font-display text-sm text-[var(--color-text-tertiary)]">
        {date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}の作業記録がありません
      </p>
    </div>
  )
}

// 行 187-193: 早期リターン後に呼ばれるuseMemo ← これが問題！
const visibleBlocks = useMemo(() => {
  return timeBlocks.filter(block => {
    return block.endHour > startHour && block.startHour < endHour
  })
}, [timeBlocks, startHour, endHour])
```

### なぜエラーが発生するか

1. **Reactのフックの規則**: フックは常にコンポーネントのトップレベルで、同じ順序で呼び出される必要がある
2. **日付変更時の挙動**:
   - 「今日」にはタスクがある（`timeBlocks.length > 0`）→ `useMemo`が呼ばれる
   - 「昨日」にはタスクがない（`timeBlocks.length === 0`）→ 早期リターンで`useMemo`がスキップされる
3. **結果**: レンダリング間でフックの呼び出し回数が変わり、Reactがエラーを投げる

---

## 修正方針

### 推奨修正

`useMemo`フックを条件付き早期リターンの**前**に移動し、常に呼び出されるようにする。

```diff
  // 最大レイヤー数を計算
  const maxLayers = useMemo(() => {
    if (timeBlocks.length === 0) return 1
    return Math.max(...timeBlocks.map(b => b.layer)) + 1
  }, [timeBlocks])
  
+  // 表示範囲内のタスクのみをフィルタリング（早期リターン前に移動）
+  const visibleBlocks = useMemo(() => {
+    return timeBlocks.filter(block => {
+      return block.endHour > startHour && block.startHour < endHour
+    })
+  }, [timeBlocks, startHour, endHour])

  // タスクブロックの位置とサイズを計算（表示範囲を考慮）
  const getBlockStyle = (block: TaskTimeBlock) => {
    ...
  }
  
  if (timeBlocks.length === 0) {
    return (
      <div className="text-center py-8">
        ...
      </div>
    )
  }

-  // 表示範囲内のタスクのみをフィルタリング
-  const visibleBlocks = useMemo(() => {
-    return timeBlocks.filter(block => {
-      return block.endHour > startHour && block.startHour < endHour
-    })
-  }, [timeBlocks, startHour, endHour])

  return (
    ...
  )
```

---

## 影響範囲

| コンポーネント | 影響 |
|-------------|------|
| `TimeAxisChart.tsx` | 直接修正が必要 |
| `Dashboard.tsx` | 修正不要（`TimeAxisChart`を使用しているのみ） |

---

## 修正手順

1. `TimeAxisChart.tsx`を開く
2. 行 187-193 の `visibleBlocks` の `useMemo` を行 146 の後（`maxLayers`の後）に移動
3. ローカルでテスト（日付変更を確認）
4. ビルド・デプロイ

---

## テスト項目

- [ ] ダッシュボードを開く
- [ ] 前日ボタンをクリック（タスクがない日へ移動）
- [ ] 翌日ボタンをクリック（タスクがある日へ移動）
- [ ] 複数回日付を切り替えてもエラーが発生しないことを確認
- [ ] 本番環境（Cloudflare Pages）でも動作確認

---

## 参考資料

- [React公式ドキュメント - フックの規則](https://ja.react.dev/reference/rules/rules-of-hooks)
- [React Error Decoder - Error #300](https://reactjs.org/docs/error-decoder.html?invariant=300)
