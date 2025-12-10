# Cloudflare Pages デプロイ トラブルシューティング

## よくある問題と解決方法

### 1. ビルドが失敗する

#### エラー: "Command failed: npm run build"

**原因**: 依存関係がインストールされていない、またはNode.jsのバージョンが合わない

**解決方法**:
1. Cloudflare Dashboardでビルド設定を確認
   - Build command: `npm ci && npm run build`
   - Node.js version: 18以上

2. `.nvmrc`ファイルが存在するか確認（Node.js 18を指定）

3. `package.json`に`engines`フィールドが設定されているか確認

#### エラー: "TypeScript compilation failed"

**原因**: TypeScriptの型エラー

**解決方法**:
```bash
# ローカルで確認
npm run build
```

ローカルでビルドが成功することを確認してから、再度デプロイ

#### エラー: "Module not found"

**原因**: 依存関係が不足している

**解決方法**:
1. `package.json`の依存関係を確認
2. `package-lock.json`がコミットされているか確認
3. ビルドコマンドに`npm ci`を含める（`cloudflare-pages.toml`で設定済み）

### 2. 環境変数が反映されない

**原因**: 環境変数の設定が正しくない

**解決方法**:
1. Cloudflare Dashboardで環境変数を確認
   - `CLOUDFLARE_API_URL`: `https://mytcc2-api.thesket129.workers.dev`
   - `CLOUDFLARE_API_KEY`: （オプション）

2. 環境変数はProductionとPreviewで別々に設定可能

3. 環境変数を変更した場合は、新しいコミットをプッシュして再ビルド

### 3. ベースパスが正しくない

**原因**: `vite.config.ts`の`base`設定が正しくない

**解決方法**:
- `CF_PAGES=1`が設定されているか確認（`cloudflare-pages.toml`で設定済み）
- Cloudflare Pagesでは`base: '/'`が正しい

### 4. ビルドタイムアウト

**原因**: ビルドに時間がかかりすぎている

**解決方法**:
1. ビルドログを確認して、どのステップで時間がかかっているか確認
2. 不要な依存関係を削除
3. ビルドキャッシュを有効化（Cloudflare Pagesは自動的にキャッシュを使用）

### 5. デプロイは成功するが、アプリが動作しない

**原因**: 環境変数がフロントエンドで使用できない

**解決方法**:
1. 環境変数はビルド時に`import.meta.env`で使用可能
2. 実行時に使用する場合は、設定画面で手動設定が必要

## ビルドログの確認方法

1. Cloudflare Dashboardにアクセス
2. 「Workers & Pages」→ プロジェクトを選択
3. 「Deployments」タブを開く
4. 失敗したデプロイをクリック
5. 「Build logs」を確認

## デバッグ手順

### 1. ローカルでビルドを確認

```bash
npm ci
npm run build
```

### 2. ビルド出力を確認

```bash
ls -la dist/
```

`dist/index.html`と`dist/assets/`が存在することを確認

### 3. プレビューで確認

```bash
npm run preview
```

ローカルで`http://localhost:4173`にアクセスして動作確認

### 4. Cloudflare Pagesのビルドログと比較

ローカルで成功するが、Cloudflare Pagesで失敗する場合：
- Node.jsのバージョンの違い
- 環境変数の違い
- ビルド環境の違い

## よくあるエラーメッセージ

### "npm: command not found"

**解決方法**: Node.jsのバージョンを確認（`.nvmrc`ファイルを確認）

### "ENOENT: no such file or directory"

**解決方法**: ビルド出力ディレクトリ（`dist`）が正しく設定されているか確認

### "Build exceeded maximum time"

**解決方法**: 
- ビルド時間を短縮（不要な依存関係を削除）
- ビルドキャッシュを有効化

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Build Configuration](https://developers.cloudflare.com/pages/platform/build-configuration/)
- [Environment Variables](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)

