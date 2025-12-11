# iPad クリップボードコピー失敗 バグレポート

**報告日**: 2024-12-12  
**報告者**: ユーザー  
**ステータス**: 修正済み

---

## 問題概要

「今日のまとめ」ボタンをiPadで押下した際に、クリップボードへのコピーが失敗する。

## 影響範囲

- **デバイス**: iPad（iPadOS Safari）
- **機能**: ダッシュボードの「今日のまとめをコピー」ボタン
- **ファイル**: `src/utils/export.ts` の `copyToClipboard` 関数

## 原因分析

### 技術的原因

iOS/iPadOS Safariには、クリップボード操作に関する特殊な制約がある：

1. **`navigator.clipboard.writeText()` の制限**
   - HTTPS環境が必須
   - ユーザー操作（クリック等）のイベントハンドラから直接呼び出す必要がある
   - iOS Safariでは追加の制限があり、失敗することがある

2. **`document.execCommand('copy')` の制限**
   - 対象のテキストエリアが**画面上に表示されている必要**がある
   - 元の実装では `left: -999999px` で画面外に配置していたため、iOSでコピーが失敗

### 問題のコード（修正前）

```typescript
// 画面外に配置 → iOS Safariで失敗
textArea.style.position = 'fixed'
textArea.style.left = '-999999px'
textArea.style.top = '-999999px'
```

## 修正内容

### 変更ファイル

- `src/utils/export.ts`

### 修正詳細

1. **iOS/iPadOSデバイスの検出**
   ```typescript
   const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
   ```
   - iPad on iOS 13以降は `MacIntel` として報告されるため、`maxTouchPoints` も確認

2. **テキストエリアの配置変更**
   ```typescript
   textArea.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0;z-index:-1;width:1px;height:1px;'
   ```
   - 画面中央に配置し、`opacity: 0` で視覚的に非表示

3. **iOS用の選択処理**
   ```typescript
   if (isIOS) {
     const range = document.createRange()
     range.selectNodeContents(textArea)
     const selection = window.getSelection()
     if (selection) {
       selection.removeAllRanges()
       selection.addRange(range)
     }
     textArea.setSelectionRange(0, text.length)
   }
   ```

4. **readonly属性の追加**
   ```typescript
   textArea.setAttribute('readonly', '')
   ```
   - iOSでキーボードが表示されないようにする

## 検証計画

- [ ] iPad Safari でテスト
- [ ] iPhone Safari でテスト
- [ ] デスクトップ Chrome でテスト
- [ ] デスクトップ Firefox でテスト
- [ ] デスクトップ Safari でテスト

## 参考情報

- [MDN - Clipboard API](https://developer.mozilla.org/ja/docs/Web/API/Clipboard_API)
- [Can I Use - Clipboard](https://caniuse.com/clipboard)
- iOS Safari では `document.execCommand('copy')` の制約が厳しく、要素が視認可能な状態でなければ動作しない
