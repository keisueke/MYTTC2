# Cloudflare Pages Deploy Command削除ガイド

## 問題

Cloudflare Pagesのデプロイで以下のエラーが発生している場合：

```
Wrangler requires at least Node.js v20.0.0. You are using v18.20.8.
Failed: error occurred while running deploy command
```

## 原因

Cloudflare Pagesプロジェクトの「Deploy command」に`npx wrangler deploy`が設定されているため、Node.js 20が必要になっています。しかし、Cloudflare Pagesのビルド環境はNode.js 18を使用しているため、不整合が発生しています。

## 解決方法

Cloudflare Pagesは静的ファイルを自動的にデプロイするため、Deploy commandは不要です。以下の手順で削除してください。

### 手順

1. **Cloudflare Dashboardにアクセス**
   - https://dash.cloudflare.com にアクセス
   - ログイン

2. **プロジェクトを選択**
   - 「Workers & Pages」をクリック
   - 左側のメニューから「Pages」を選択
   - プロジェクト（`mytcc2`など）をクリック

3. **設定を開く**
   - プロジェクトページで「Settings」タブをクリック
   - 「Builds & deployments」セクションを開く

4. **Deploy commandを削除または無効化**
   
   **方法A: 空欄にできる場合**
   - 「Deploy command」フィールドを確認
   - `npx wrangler deploy`などが設定されている場合は、**空欄に変更**または削除
   - 「Save」ボタンをクリック
   
   **方法B: 空欄にできない場合（代替案）**
   - 「Deploy command」フィールドに以下のいずれかを設定：
     - `true`（推奨：常に成功し、何も実行しない）
     - `echo "Deploy skipped"`（メッセージを表示して終了）
   - 「Save」ボタンをクリック
   
   **注意**: `true`コマンドはUnix/Linux系の標準コマンドで、常に成功（終了コード0）を返し、何も実行しません。これにより、Deploy commandが実行されますが、実際には何も行われず、Cloudflare Pagesが自動的に静的ファイルをデプロイします。

5. **再デプロイ**
   - 「Deployments」タブに戻る
   - 最新の失敗したデプロイメントをクリック
   - 「Retry deployment」ボタンをクリック
   - または、新しいコミットをGitHubにプッシュして自動デプロイをトリガー

### 確認事項

設定が正しく反映されているか確認：

- **Build command**: `npm run build`（または`npm ci && npm run build`）
- **Build output directory**: `dist`
- **Root directory**: `/`
- **Deploy command**: **空欄**または`true`（これが重要）

## 期待される動作

設定変更後、デプロイは以下のように動作します：

1. GitHubにプッシュ
2. Cloudflare Pagesが自動検知
3. `npm run build`を実行（Node.js 18環境）
4. `dist`ディレクトリの内容を自動的にデプロイ
5. デプロイ完了（エラーなし）

## 補足

### Workers(API)のデプロイについて

Workers(API)のデプロイは、Cloudflare Pagesとは別に、ローカルから`wrangler deploy`で行います：

```bash
cd workers
npm run deploy
```

これは、Pagesのデプロイフローとは完全に分離されています。

### なぜDeploy commandが設定されていたのか

初期設定時に、WorkersとPagesを同じプロジェクトで管理しようとした場合、Deploy commandに`wrangler deploy`が設定されることがあります。しかし、このプロジェクトでは以下のように分離しています：

- **Pages（フロントエンド）**: GitHub連携で自動デプロイ
- **Workers（API）**: ローカルから手動デプロイ

この分離により、それぞれのデプロイ方法を最適化できます。

## トラブルシューティング

### 設定を保存できない

- ブラウザのキャッシュをクリアして再試行
- 別のブラウザで試す
- Cloudflare Dashboardを再読み込み

### 再デプロイが失敗する

- ビルドログを確認して、他のエラーがないか確認
- `package.json`の依存関係が正しいか確認
- `.nvmrc`ファイルが存在し、Node.js 18が指定されているか確認

### デプロイは成功するが、アプリが表示されない

- ビルド出力ディレクトリ（`dist`）が正しく設定されているか確認
- `dist/index.html`が存在するか確認
- ブラウザのコンソールでエラーを確認

