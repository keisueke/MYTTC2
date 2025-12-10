# Cloudflare Pages デプロイ確認ガイド

## デプロイ成功の確認手順

### 1. Cloudflare Dashboardでデプロイ状況を確認

1. [Cloudflare Dashboard](https://dash.cloudflare.com)にアクセス
2. 「Workers & Pages」→「Pages」を選択
3. プロジェクトを選択
4. 「Deployments」タブを開く
5. 最新のデプロイメントのステータスを確認：
   - ✅ **Success**: 緑色のチェックマークが表示されている
   - ⏳ **Building/Deploying**: 進行中（数分待つ）
   - ❌ **Failed**: 赤色のエラーアイコン（ビルドログを確認）

### 2. デプロイURLにアクセス

デプロイが成功したら、以下のURLでアプリにアクセスできます：

- **本番環境**: `https://<project-name>.pages.dev`
  - 例: `https://mytcc2.pages.dev`
- **プレビュー環境**: `https://<branch-name>.<project-name>.pages.dev`

### 3. アプリの動作確認

ブラウザでアプリを開き、以下を確認：

1. **ページが正常に表示される**
   - ダッシュボードが表示される
   - エラーメッセージが表示されない

2. **設定画面でCloudflare API URLを確認**
   - `/settings`にアクセス
   - 「外部連携」セクションの「Cloudflare設定」を確認
   - API URLが`https://mytcc2-api.thesket129.workers.dev`に設定されているか確認

3. **データの読み書きができる**
   - タスクを作成
   - タスクを編集
   - タスクを削除
   - データが正しく保存・取得できることを確認

### 4. ブラウザのコンソールでエラーを確認

1. ブラウザの開発者ツールを開く（F12）
2. 「Console」タブを開く
3. エラーメッセージがないか確認
4. ネットワークエラーがないか確認

## よくある問題と対処法

### デプロイは成功するが、ページが表示されない

**確認事項**:
- ビルド出力ディレクトリが`dist`に設定されているか
- `dist/index.html`が存在するか
- ベースパスが正しく設定されているか（Cloudflare Pagesでは`/`）

**対処法**:
- Cloudflare Dashboardでビルド設定を確認
- ビルドログで`dist`ディレクトリが正しく生成されているか確認

### API接続エラーが発生する

**確認事項**:
- 設定画面でCloudflare API URLが正しく設定されているか
- Workers APIが正常に動作しているか（`https://mytcc2-api.thesket129.workers.dev/health`にアクセス）

**対処法**:
- 設定画面でCloudflare API URLを再設定
- Workers APIのヘルスチェックを確認

### 環境変数が反映されない

**確認事項**:
- Cloudflare Dashboardで環境変数が正しく設定されているか
- 環境変数はProductionとPreviewで別々に設定する必要がある

**対処法**:
- 環境変数を再設定
- 新しいコミットをプッシュして再ビルド

## デプロイログの確認方法

1. Cloudflare Dashboardでプロジェクトを選択
2. 「Deployments」タブを開く
3. デプロイメントをクリック
4. 「Build logs」を確認

### 正常なビルドログの例

```
✓ built in 4.07s
Success: Build command completed
```

### エラーログの例

```
Failed: error occurred while running deploy command
Wrangler requires at least Node.js v20.0.0
```

この場合、Deploy commandが設定されている可能性があります。`docs/cloudflare-pages-fix-deploy-command.md`を参照してください。

## 自動デプロイの確認

GitHubにプッシュした後、自動デプロイが開始されることを確認：

1. GitHubにコミットをプッシュ
2. 数秒〜1分以内にCloudflare Dashboardの「Deployments」タブに新しいデプロイメントが表示される
3. デプロイメントのステータスが「Building」→「Deploying」→「Success」に変わる

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Deploy Command削除ガイド](./cloudflare-pages-fix-deploy-command.md)
- [セットアップガイド](./cloudflare-pages-setup.md)

