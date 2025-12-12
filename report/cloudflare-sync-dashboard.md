# ダッシュボードにCloudflare同期ボタンを追加

**更新日**: 2024-12-12

## 概要
Cloudflareが設定されている場合、ダッシュボードのヘッダー部分にCloudflare同期ボタンを表示するように機能を追加。

## 変更内容

### [修正] Dashboard.tsx
`src/pages/Dashboard.tsx`

1. **インポートの追加**
   - `useCloudflare` フック
   - `loadCloudflareConfig` 関数

2. **状態の追加**
   - `cloudflareSyncing`: 同期中フラグ
   - `cloudflareSyncBidirectional`: 同期関数
   - `cloudflareConfig`: 設定の有無を確認

3. **ハンドラーの追加**
   - `handleCloudflareSync`: 同期処理（Settings.tsxと同じロジック）

4. **UIの追加**
   - GitHub同期ボタンの隣にCloudflare同期ボタンを配置
   - モバイルでは「CF同期」、デスクトップでは「Cloudflare同期」と表示
   - クラウドアイコンを使用

## 動作
- Cloudflareが設定されていない場合: ボタンは非表示
- Cloudflareが設定されている場合: ボタンが表示され、クリックで同期実行
- 同期結果に応じて通知を表示
