# Cloudflare Pages デプロイ問題の解決ガイド

## 問題: ビルドは成功するが、デプロイが行われない

ビルドは成功しているが、Cloudflare Pages上でデプロイが行われず、「There is nothing here yet」と表示される問題です。

## 原因

Cloudflare Pagesは、ビルドが成功したら自動的に出力ディレクトリ（`dist`）の内容をデプロイします。しかし、以下の場合にデプロイが行われない可能性があります：

1. **Deploy commandが設定されている**: Deploy commandが設定されている場合、Cloudflare Pagesはそのコマンドの実行結果に基づいてデプロイを判断します。`true`コマンドは成功を返しますが、実際には何もデプロイしないため、自動デプロイがスキップされる可能性があります。

2. **ビルド出力ディレクトリが認識されていない**: `cloudflare-pages.toml`の`output_dir`設定が正しく読み込まれていない可能性があります。

3. **Dashboardの設定とファイルの設定が競合している**: Dashboardの設定と`cloudflare-pages.toml`の設定が競合している可能性があります。

## 解決方法

### 方法1: Deploy commandを完全に削除（推奨）

1. Cloudflare Dashboardでプロジェクトを開く
2. 「Settings」タブ → 「Builds & deployments」セクション
3. 「Deploy command」フィールドを確認
4. **可能な限り、フィールドを空欄にする**（削除ボタンがある場合は削除）
5. 「Save」をクリック
6. 新しいコミットをプッシュして再デプロイ

### 方法2: cloudflare-pages.tomlで明示的に設定

`cloudflare-pages.toml`に以下を追加：

```toml
[build]
command = "npm ci && npm run build"
cwd = "."
output_dir = "dist"

[build.environment_variables]
CF_PAGES = "1"
```

このファイルをコミット・プッシュ：

```bash
git add cloudflare-pages.toml
git commit -m "Fix Cloudflare Pages output directory"
git push origin main
```

### 方法3: Dashboardでビルド出力ディレクトリを明示的に設定

Cloudflare Dashboardの設定画面で：

1. 「Settings」タブを開く
2. 「Builds & deployments」セクションを開く
3. 「Build output directory」または「Publish directory」フィールドを探す
4. `dist`を設定
5. 「Save」をクリック

**注意**: 新しいUIでは、このフィールドが表示されない場合があります。その場合は、`cloudflare-pages.toml`の設定が使用されます。

### 方法4: プロジェクトを再作成（最終手段）

上記の方法で解決しない場合：

1. 現在のプロジェクトを削除（または無視）
2. 新しいプロジェクトを作成
3. ビルド設定を正しく設定：
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`（設定できる場合）
   - Root directory: `/`
   - Deploy command: **空欄**（削除）

## 確認手順

### 1. ビルドログの確認

1. Cloudflare Dashboardでプロジェクトを選択
2. 「Deployments」タブを開く
3. 最新のデプロイメントをクリック
4. 「Build logs」を確認

**正常なビルドログの例**:
```
✓ built in 4.07s
Success: Build command completed
```

**デプロイが行われている場合のログ**:
```
Success: Build command completed
Deploying to Cloudflare Pages...
Success: Deployment completed
```

### 2. ビルド出力の確認

ビルドログで以下を確認：

- `dist/index.html`が生成されているか
- `dist/assets/`ディレクトリが生成されているか
- エラーメッセージがないか

### 3. デプロイステータスの確認

「Deployments」タブで：

- ステータスが「Success」になっているか
- 「Deploying」の後に「Success」に変わっているか
- エラーアイコンが表示されていないか

## トラブルシューティング

### ビルドは成功するが、デプロイが「Pending」のまま

**原因**: Deploy commandが設定されている可能性

**解決方法**:
1. Deploy commandを削除
2. 再デプロイ

### ビルドログに「No files to deploy」と表示される

**原因**: ビルド出力ディレクトリが正しく認識されていない

**解決方法**:
1. `cloudflare-pages.toml`に`output_dir = "dist"`を追加
2. コミット・プッシュして再デプロイ

### Dashboardの設定とファイルの設定が競合している

**解決方法**:
1. Dashboardの設定を確認
2. `cloudflare-pages.toml`の設定と一致させる
3. どちらか一方を優先（通常は`cloudflare-pages.toml`が優先）

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Build Configuration](https://developers.cloudflare.com/pages/platform/build-configuration/)

