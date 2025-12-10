# Cloudflare Pages フロントエンド設定ガイド

## 現在の構成

| 項目 | 値 |
|------|-----|
| **Pages プロジェクト名** | `mytc` |
| **Workers プロジェクト名** | `mytcc-api` |
| **GitHub リポジトリ** | `MYTTC2` |

## Cloudflare Pages（`mytc`）の設定

Cloudflare Dashboard → Workers & Pages → **Pages** → `mytc` → Settings → Builds & deployments

### 必須設定

| 項目 | 値 | 備考 |
|------|-----|------|
| **Build command** | `npm run build` | Viteでビルド |
| **Build output directory** | `dist` | ビルド結果のフォルダ |
| **Deploy command** | **空欄** | ⚠️ 何も入れない！ |

### Deploy command について

**絶対に `npx wrangler deploy` を入れないでください。**

- Cloudflare Pages はビルド結果（`dist/`）を**自動的にデプロイ**します
- Deploy command に何か入れると、その後に実行されますが、**Pages の静的デプロイには不要**です
- `wrangler deploy` は **Workers 用のコマンド**であり、Pages では使いません

もし空欄にできない場合:
- `true` を入力（何もしないコマンド）
- または `echo "done"` を入力

### 環境変数（オプション）

Pages の Settings → Environment variables で設定可能:

| 変数名 | 値 | 用途 |
|--------|-----|------|
| `CF_PAGES` | `1` | Cloudflare Pages 環境であることを示す（自動設定される） |

※ 通常は自動で設定されるため、手動設定は不要です。

## コード側の設定（すでに完了済み）

### 1. `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  base: process.env.CF_PAGES === '1' || process.env.CF_PAGES_URL ? '/' : (process.env.NODE_ENV === 'production' ? '/MYTTC2/' : '/'),
  build: {
    outDir: 'dist',
  },
})
```

- Cloudflare Pages では `base: '/'`
- GitHub Pages では `base: '/MYTTC2/'`

### 2. `src/App.tsx`（getBasename関数）

```typescript
const getBasename = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // 開発環境
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/'
    }
    // Cloudflare Pages
    if (hostname.includes('.pages.dev')) {
      return '/'
    }
    // GitHub Pages
    if (hostname.includes('github.io')) {
      return '/MYTTC2'
    }
    return '/'
  }
  return '/'
}
```

### 3. `public/_redirects`

```
/*    /index.html   200
```

- SPA（Single Page Application）のルーティング用
- すべてのパスを `index.html` にリダイレクト

## デプロイ手順

### 1. コードをプッシュ

```bash
git add .
git commit -m "fix: update for cloudflare pages"
git push origin main
```

### 2. Cloudflare Pages が自動ビルド

1. GitHub へのプッシュを検知
2. `npm run build` を実行
3. `dist/` フォルダを自動デプロイ
4. `https://mytc.pages.dev` でアクセス可能に

### 3. 確認

- `https://mytc.pages.dev` にアクセス
- アプリが表示されればOK

## トラブルシューティング

### 「有効なURLがありません」と表示される

**原因**: Deploy command に `npx wrangler deploy` などが設定されている

**解決策**:
1. Cloudflare Dashboard → `mytc` → Settings → Builds & deployments
2. Deploy command を**空欄**にする
3. 再デプロイ

### ビルドは成功するがページが表示されない

**確認事項**:
1. Build output directory が `dist` になっているか
2. `public/_redirects` ファイルが存在するか
3. `vite.config.ts` の `base` が正しいか

### 404エラーが出る（ページ遷移時）

**原因**: `_redirects` ファイルがない、または設定が間違っている

**解決策**:
`public/_redirects` に以下を記述:
```
/*    /index.html   200
```

### CSSやJSが読み込まれない

**原因**: `base` パスの設定が間違っている

**解決策**:
- Cloudflare Pages では `base: '/'`
- `vite.config.ts` を確認

## Workers API との接続

フロントエンドがデプロイできたら、アプリ内で API を設定:

1. アプリの Settings ページを開く
2. 「Cloudflare設定」セクション
3. API URL: `https://mytcc-api.xxxxx.workers.dev`（実際のWorkers URL）
4. API Key: 空欄（Cloudflare Access 使用時）
5. 「保存」→「接続テスト」

## チェックリスト

- [ ] Pages プロジェクト `mytc` の Build command が `npm run build`
- [ ] Pages プロジェクト `mytc` の Build output directory が `dist`
- [ ] Pages プロジェクト `mytc` の Deploy command が**空欄**
- [ ] `public/_redirects` ファイルが存在する
- [ ] GitHub にプッシュ済み
- [ ] `https://mytc.pages.dev` でアプリが表示される

