---
name: cloudflare-access-architecture
overview: GitHub Pagesでホストしているフロントエンドから、Cloudflare Workers+D1を同一オリジン相当のAPIとして利用し、Cloudflare Accessで保護する構成への整理・最小実装
todos:
  - id: cf-access-design
    content: Cloudflare AccessでWorkers APIを保護するかどうか、どのメールアドレス/IDでアクセスを許可するか方針を決める
    status: completed
  - id: cf-frontend-config
    content: Settings画面のCloudflare設定に本番用API URL（Workers URL）のみを設定し、APIキー無し運用で問題ないことを確認する
    status: completed
    dependencies:
      - cf-access-design
  - id: cf-workers-cors-review
    content: Workers側のCORS設定を確認し、本番フロント（GitHub PagesのURL）のみ許可するように整理する
    status: completed
    dependencies:
      - cf-frontend-config
  - id: cf-deploy-flow-docs
    content: Workers APIとGitHub Pagesフロントのデプロイ・運用手順をdocsにまとめる
    status: completed
    dependencies:
      - cf-workers-cors-review
---

# Cloudflare Workers + D1 + Access 構成への移行プラン

## ゴール

- フロントエンド側では **APIキーなどを意識せず**、単に`/api/...`を叩くだけでデータにアクセスできるようにする。
- データベースは **Cloudflare D1 + Workers** 経由でのみアクセスされる（ブラウザから直接は触らない）。
- 必要に応じて **Cloudflare Access** でAPI入口を保護し、本人だけが使える状態にする。
- フロントエンドのホスティングは当面 **GitHub Pagesのまま** とし、安定運用を優先する。

## 方針

- バックエンド（Workers+D1）はすでに構築済みなので、「**どう呼ぶか**」「**どう守るか**」を整理する。
- フロントエンドは既に `cloudflareApi.ts` / `useCloudflare` でWorkers APIを呼べる実装がある前提とし、設定と運用ルールを固める。

## 実装・設定ステップ

### 1. バックエンド(API)の入口整理

- WorkersのURLを明確化:
- 現状: `https://mytcc2-api.thesket129.workers.dev`
- 将来: 任意で `https://api.mytcc.example.com` のようなカスタムドメインに変更可能。
- Workers内のルーティングは既に `/api/tasks`, `/api/sync` などで提供されている前提とし、必要であれば `/health` などヘルスチェックも維持。

### 2. Cloudflare Access での保護（オプションだが推奨）

- Cloudflare DashboardでWorkersエンドポイントに対してAccessポリシーを設定:
- 対象: `https://mytcc2-api.thesket129.workers.dev/*` または将来のカスタムドメイン。
- 認証方法: 「One-time PIN via Email」など、個人利用に合うものを選択。
- これにより「自分がCloudflare経由でログインしているときだけAPIにアクセスできる」状態にする。
- フロントエンド側にはトークンやキーを埋め込まず、ブラウザがAccessのクッキーを持っているかどうかだけで制御される構成にする。

### 3. フロントエンドからの呼び出し方法の整理

- 本番用設定:
- `Settings` 画面の「Cloudflare設定」で、**API URLのみ**を設定:
  - `https://mytcc2-api.thesket129.workers.dev`
- API Key欄は空のまま（個人利用であれば不要）。
- フロントエンドのコード側では、既存の `cloudflareApi.ts` / `useCloudflare` を利用し、`
- `fetch(`${config.apiUrl}/api/... `...)` の形式で呼び出し。
- CORSが必要な場合はWorkers側で `Access-Control-Allow-Origin` を `https://<your_github_username>.github.io` に限定して許可（現在の実装を確認し、必要なら調整）。

### 4. デプロイと運用フローの整理

- **Workers(API)**:
- コード変更 → ローカルで
  - `cd workers`
  - `npm run deploy`（`wrangler deploy`ラッパ）
- これで `mytcc2-api.thesket129.workers.dev` が更新される。
- **フロントエンド(GitHub Pages)**:
- コード変更 → 通常どおり `git push` でGitHub PagesのCI/CDを使う（既存ワークフローを維持）。
- この2つを分離しておくことで、Cloudflare Pagesまわりの不安定さに影響されず、安定して使える構成にする。

### 5. ドキュメント化

- `docs/` 配下に、次の内容を整理した短いドキュメントを用意する想定:
- フロントエンドの本番URL（GitHub Pages）
- APIのURL（Workers）
- Cloudflare Accessの有無とログイン方法
- デプロイ手順（Workers / GitHub Pages）

## 追加で検討できる発展事項（後回しでOK）

- カスタムドメインを取得し、
- `app.example.com` → フロント
- `api.example.com` → Workers(API)
に振り分ける構成。
- 将来的にCloudflare Pagesが安定したら、フロントもPagesに移し、
- 同一ドメイン内で `/api/...` をWorkersにプロキシする形へ発展。