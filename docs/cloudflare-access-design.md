# Cloudflare Access 認証設計

## 概要

MYTTC2アプリケーションの認証構成について、Cloudflare Accessを使用した保護方針を定義する。

## 認証構成の選択肢

### オプション1: Cloudflare Access による保護（推奨）

```
┌─────────────────┐      ┌─────────────────────┐      ┌─────────────┐
│  GitHub Pages   │──────│  Cloudflare Access  │──────│   Workers   │
│  (フロントエンド)  │      │  (認証ゲートウェイ)    │      │   + D1 DB   │
└─────────────────┘      └─────────────────────┘      └─────────────┘
```

**メリット:**
- フロントエンドにAPIキーを埋め込む必要がない
- ブラウザのクッキーで認証状態を管理
- 自分のメールアドレスだけにアクセスを制限可能
- Cloudflareの無料プランで利用可能（50ユーザーまで）

**デメリット:**
- 初回アクセス時にCloudflare Accessのログイン画面が表示される
- 設定がやや複雑

### オプション2: APIキー認証のみ

```
┌─────────────────┐                              ┌─────────────┐
│  GitHub Pages   │──────[X-API-Key Header]──────│   Workers   │
│  (フロントエンド)  │                              │   + D1 DB   │
└─────────────────┘                              └─────────────┘
```

**メリット:**
- 設定がシンプル
- 追加の認証画面なし

**デメリット:**
- APIキーをフロントエンドに埋め込む必要がある
- APIキーが漏洩するとデータにアクセスされるリスク

### オプション3: 認証なし（開発用）

**メリット:**
- 設定不要
- 開発時に便利

**デメリット:**
- 誰でもAPIにアクセス可能
- 本番環境では非推奨

## 推奨構成

**個人利用の場合**: オプション1（Cloudflare Access）を推奨

### 設定方針

1. **認証方法**: One-time PIN via Email
   - 自分のメールアドレスにワンタイムPINが送信される
   - 30日間セッションを維持（設定可能）

2. **許可するメールアドレス**: 
   - 自分のメールアドレスのみを許可リストに追加
   - 例: `your-email@example.com`

3. **保護対象**:
   - Workers APIエンドポイント: `https://mytcc2-api.thesket129.workers.dev/*`

4. **セッション有効期間**:
   - 推奨: 30日（個人利用のため長めに設定）

## Cloudflare Access 設定手順

### 1. Zero Trust ダッシュボードにアクセス

1. Cloudflare Dashboardにログイン
2. 左メニューから「Zero Trust」を選択
3. 初回の場合はチーム名を設定（例: `mytcc2-team`）

### 2. アプリケーションの追加

1. Zero Trust → Access → Applications
2. 「Add an application」をクリック
3. 「Self-hosted」を選択
4. 以下を設定:
   - **Application name**: `MYTTC2 API`
   - **Session Duration**: `30 days`
   - **Application domain**: `mytcc2-api.thesket129.workers.dev`
   - **Path**: `/*`（全パスを保護）または `/api/*`（APIのみ保護）

### 3. ポリシーの設定

1. Policy name: `Allow Owner`
2. Action: `Allow`
3. Include rules:
   - **Selector**: `Emails`
   - **Value**: `your-email@example.com`（自分のメールアドレス）

### 4. 認証方法の設定

1. Zero Trust → Settings → Authentication
2. 「Login methods」で「One-time PIN」を有効化
3. 必要に応じて他の認証方法（GitHub, Googleなど）も追加可能

## フロントエンドからの利用

Cloudflare Accessが有効な場合、フロントエンドからのAPIリクエストは以下のように動作する：

1. **初回アクセス時**:
   - APIリクエストがCloudflare Accessにリダイレクト
   - ログイン画面が表示される
   - メールアドレスを入力 → PINを受信 → 入力
   - 認証成功後、クッキーが設定される

2. **認証済みの場合**:
   - クッキーが自動的に送信される
   - APIキーなしでAPIにアクセス可能

3. **フロントエンドコードの変更**:
   - `credentials: 'include'` をfetchオプションに追加する必要がある
   - CORSの設定も調整が必要

## 注意事項

### CORS設定との組み合わせ

Cloudflare Accessを使用する場合、Workers側のCORS設定を調整する必要がある：

```typescript
// workers/src/auth.ts
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://your-username.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Credentials': 'true', // 重要: クッキーを許可
  }
}
```

### APIキー認証との併用

Cloudflare Accessを使用する場合、Workers側のAPIキー認証は無効化（または補助的に使用）できる：

- `API_KEY`環境変数を設定しない → 認証スキップ
- Cloudflare Accessが認証を担当

## 現時点での推奨

**段階的に導入する場合:**

1. **Phase 1（現在）**: APIキー認証なし、CORS制限のみ
   - CORSをGitHub PagesのURLに制限
   - 簡易的な保護として機能

2. **Phase 2（推奨）**: Cloudflare Accessを追加
   - 本人のみアクセス可能に
   - APIキーの管理が不要に

3. **Phase 3（将来）**: カスタムドメイン + 同一オリジン
   - フロントとAPIを同一ドメインに
   - CORSの問題を完全に解消

## まとめ

| 項目 | 推奨設定 |
|------|----------|
| 認証方式 | Cloudflare Access (One-time PIN) |
| 許可ユーザー | 自分のメールアドレスのみ |
| セッション期間 | 30日 |
| APIキー | 不要（Accessで代替） |
| CORS | GitHub PagesのURLのみ許可 |

