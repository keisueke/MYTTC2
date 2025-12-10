---
name: cloudflare-pages-deploy-fix
overview: Cloudflare Pagesでのデプロイ失敗（wrangler deployがNode 18で動かない）を解消し、GitHubプッシュだけでフロントエンドが正常に自動デプロイされるようにする。
todos:
  - id: cf-pages-remove-deploy-command
    content: Cloudflare PagesプロジェクトのDeploy commandから`npx wrangler deploy`を削除し、Build commandのみで静的デプロイするように設定する
    status: completed
  - id: cf-pages-redeploy-check
    content: 設定変更後に再デプロイを実行し、PagesのURLでアプリが正常表示されることを確認する
    status: completed
    dependencies:
      - cf-pages-remove-deploy-command
  - id: cf-docs-note-workers-separation
    content: Workers(API)デプロイとPages(フロント)デプロイの役割分離をドキュメントにメモ（必要であれば）
    status: completed
    dependencies:
      - cf-pages-redeploy-check
---

# Cloudflare Pagesデプロイ修正プラン

## ゴール

- Cloudflare Pagesのデプロイがエラーなく完了し、`npm run build`で生成された`dist`を自動的に公開できる状態にする。
- Workers(API)のデプロイはこれまで通り`wrangler deploy`で別管理とし、Pages側のビルド・デプロイからは切り離す。

## 対応方針

1. **問題の切り分け**

- Cloudflare Pagesのビルドログから、`npm run build`は成功していること、`npx wrangler deploy`だけがNode 20不足で失敗していることを確認済みとして扱う。
- フロントエンド(静的ファイル)のデプロイに`wrangler deploy`は不要であることを前提にする。

2. **Cloudflare Pagesプロジェクト設定の修正（Dashboard上の作業）**

- 対象プロジェクト（`keisueke/MYTTC2`に紐づくPagesプロジェクト）を開く。
- **Build settings / ビルドの設定**を開き、以下に変更:
 - **Build command**: `npm run build`（現状どおり）
 - **Build output directory**: `dist`
 - **Root directory**: `/`
 - **Deploy command**: 空欄（削除）または「Use default」を選択して`npx wrangler deploy`を削除
- 設定を保存して、再度手動で「Retry deployment」または新しいコミットをプッシュしてデプロイを走らせる。

3. **Workers(API)との役割分離の確認**

- Workers(API)は既に`wrangler deploy`で`mytcc2-api.thesket129.workers.dev`にデプロイ済みとし、Pagesのデプロイフローからは切り離す設計であることをドキュメントに明記する。
- `docs/cloudflare-deployment.md`あたりに「Frontend(Pages)はGitHub連携のみ、Workersはローカルからwranglerでデプロイ」という運用方針を追記する（必要なら後続対応）。

4. **動作確認**

- 新しいPagesデプロイが成功し、`https://<project>.pages.dev` でアプリが開けることを確認。
- アプリ内の設定画面で`CLOUDFLARE_API_URL`が`https://mytcc2-api.thesket129.workers.dev`に向いていることを確認し、タスクの読み書きができるかを手動でテスト。

5. **（任意）Node 20対応の検討**

- 将来的にPages側でも`wrangler`を使った何かをしたくなった場合に備え、Node 20系へのアップデート方針（`.nvmrc`や`engines`の更新）を別タスクとして切り出す。