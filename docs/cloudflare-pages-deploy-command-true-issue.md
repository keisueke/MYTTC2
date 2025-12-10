# Deploy commandが`true`の場合のデプロイ問題

## 問題

Deploy commandを`true`に設定しているが、ビルドは成功するものの、Cloudflare Pages上でデプロイが行われない。

## 原因

`true`コマンドは成功を返しますが、Cloudflare Pagesが自動デプロイをスキップしている可能性があります。これは、Deploy commandが設定されている場合、Cloudflare Pagesが「デプロイは手動で行う」と判断しているためです。

## 解決方法

### 方法1: Deploy commandを完全に削除（推奨）

1. Cloudflare Dashboardでプロジェクトを開く
2. 「Settings」タブ → 「Builds & deployments」
3. 「Deploy command」フィールドを確認
4. `true`を削除して、**完全に空欄にする**
5. 「Save」をクリック
6. 新しいコミットをプッシュして再デプロイ

**重要**: 空欄にできない場合は、以下の方法を試してください。

### 方法2: ビルドログを確認

1. Cloudflare Dashboardで最新のデプロイメントを開く
2. 「Build logs」を確認
3. 以下のメッセージを探す：
   - "Deploying to Cloudflare Pages..."
   - "No files to deploy"
   - "Deploy command completed"

### 方法3: ビルド出力ディレクトリの確認

`cloudflare-pages.toml`に`output_dir = "dist"`が設定されているか確認：

```toml
[build]
command = "npm ci && npm run build"
cwd = "."
output_dir = "dist"
```

このファイルをコミット・プッシュ：

```bash
git add cloudflare-pages.toml
git commit -m "Add output_dir to cloudflare-pages.toml"
git push origin main
```

### 方法4: Dashboardでビルド出力ディレクトリを設定

Cloudflare Dashboardの設定画面で：

1. 「Settings」タブを開く
2. 「Builds & deployments」セクションを確認
3. 「Build output directory」または「Publish directory」フィールドがあるか確認
4. あれば`dist`を設定
5. 「Save」をクリック

## 確認手順

### 1. ビルドログの確認

正常なデプロイの場合、以下のようなログが表示されます：

```
✓ built in 4.07s
Success: Build command completed
Deploying to Cloudflare Pages...
Success: Deployment completed
```

### 2. デプロイステータスの確認

「Deployments」タブで：

- ステータスが「Success」になっているか
- 「Deploying」のステップが表示されているか
- エラーアイコンが表示されていないか

### 3. ファイルの確認

ビルドログで以下を確認：

- `dist/index.html`が生成されているか
- `dist/assets/`ディレクトリが生成されているか
- エラーメッセージがないか

## トラブルシューティング

### ビルドログに「No files to deploy」と表示される

**原因**: ビルド出力ディレクトリが認識されていない

**解決方法**:
1. `cloudflare-pages.toml`に`output_dir = "dist"`を追加
2. コミット・プッシュして再デプロイ

### ビルドは成功するが、デプロイステップが表示されない

**原因**: Deploy commandが設定されているため、自動デプロイがスキップされている

**解決方法**:
1. Deploy commandを完全に削除（空欄にする）
2. 再デプロイ

### DashboardでDeploy commandを削除できない

**原因**: UIの制限

**解決方法**:
1. `cloudflare-pages.toml`で設定を上書きできないか確認
2. プロジェクトを再作成する（最終手段）

## 参考

- [Cloudflare Pages Build Configuration](https://developers.cloudflare.com/pages/platform/build-configuration/)
- [Deploy Command Documentation](https://developers.cloudflare.com/pages/platform/build-configuration/#deploy-command)

