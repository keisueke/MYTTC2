---
name: auto-sync-github-cloudflare
overview: GitHub同期とCloudflare同期の両方に対して、操作時・終了時に自動同期を行う仕組みを追加する計画
todos:
  - id: sync-backend-hook
    content: GitHub/Cloudflare共通の同期フック（useSyncBackend仮称）を実装
    status: completed
  - id: autosync-on-change
    content: useTasksに変更検知＋デバウンス付き自動同期ロジックを追加
    status: completed
    dependencies:
      - sync-backend-hook
  - id: autosync-on-exit
    content: beforeunload/visibilitychangeでの最終同期処理を追加
    status: completed
    dependencies:
      - sync-backend-hook
  - id: autosync-ui-docs
    content: Settings画面とself-hostingガイドに自動同期の挙動説明を追記
    status: completed
    dependencies:
      - autosync-on-change
      - autosync-on-exit
---

# 自動同期（GitHub & Cloudflare）実装計画

## ゴール

- **GitHub同期** と **Cloudflare同期** の両方について、
- タスクなどの**操作時に自動同期（デバウンス付き）**
- ブラウザ終了・リロード時に**最終同期（フェイルセーフ）**
を行う仕組みを追加する。
- ただし、**LocalStorageのみ利用（外部同期なし）の場合は何もしない**。

---

## 方針

- 既存の同期ロジック（GitHub: `useGitHub` / Cloudflare: `useCloudflare`）を**共通インターフェースでラップ**し、
- 「今有効な同期バックエンド」を1つだけ選んで自動同期の対象にする。
- 自動同期は **「最新状態をリモートにアップロード」中心** とし、複雑な競合解決は従来どおり手動（GitHubの競合ダイアログなど）に任せる。

---

## 実装ステップ

### 1. 同期バックエンドの抽象化レイヤー

**目的:** GitHub/Cloudflareの違いを隠し、「今アクティブな同期先」に対して共通のAPIで同期を呼び出せるようにする。

- 新しいフック `useSyncBackend`（例）を作成
- 役割:
  - 現在の有効なバックエンド種別を判定: `'github' | 'cloudflare' | 'none'`
  - `syncNow()` 関数を提供（内部でGitHubまたはCloudflareに委譲）
- 判定ロジック:
  - GitHub設定が有効 → `'github'`
  - そうでなければ Cloudflare設定が有効 → `'cloudflare'`
  - どちらも無ければ `'none'`
- 返却インターフェース（イメージ）:
  - `backendType`: `'github' | 'cloudflare' | 'none'`
  - `syncNow(): Promise<'pulled' | 'pushed' | 'up-to-date' | 'conflict' | 'skipped'>`

※ 既存の `useGitHub().syncBidirectional` と `useCloudflare().syncBidirectional` を内部でラップする構成にする。

---

### 2. 操作時自動同期（変更トリガー + デバウンス）

**目的:** タスクなどの状態が変わったタイミングで、少し待ってからまとめて同期する。

- 対象となる「変更イベント」:
- タスク追加・更新・削除
- プロジェクト/モード/タグ追加・更新・削除
- ルーティンタスク実行、DailyRecordの保存 など
- 実装案:
- `useTasks` 内に「変更検知用フラグ」を追加
  - 例: `lastChangedAt: number` を `useRef` or `useState` で持つ
  - データ変更処理の最後で `lastChangedAt = Date.now()` を更新
- 別の `useEffect` で `lastChangedAt` を監視し、
  - `backendType !== 'none'` のときのみ動作
  - **デバウンス**: 最後の変更から 2〜3 秒後に `syncNow()` を呼び出す
  - 連続操作時は、タイマーをクリアして再セット
- エラー処理:
- 自動同期エラーは **通知のみ**（`showNotification`）にとどめ、UIブロックはしない
- 深刻なエラー（認証エラーなど）は、Settingsのリンクなどを案内

---

### 3. 終了時同期（beforeunload / visibilitychange）

**目的:** ページを閉じる・リロードする直前に、未同期変更があれば同期を試みる。

- アプローチ:
- すでに `useTasks` には `visibilitychange` / `focus` ベースのリロード処理があるので、その周辺に組み込む
- `window.addEventListener('beforeunload', handler)` を使うが、
  - 非同期処理の完了は保証されない → あくまで「ベストエフォート」
- 実装イメージ:
- `pendingChanges` フラグ（直近で変更があったか）を `useRef<boolean>` で持つ
- 変更発生時に `pendingChanges = true`
- 自動同期（デバウンス）成功時に `pendingChanges = false`
- `beforeunload`/`visibilitychange`（`document.visibilityState === 'hidden'`）で:
  - `backendType !== 'none' && pendingChanges === true` の時のみ `syncNow()` を試みる
  - `navigator.sendBeacon` で簡易エンドポイントを叩くことも検討（ただし既存APIとの整合性次第で後回し）

---

### 4. 競合・頻度に関する調整

**目的:** 過剰な同期や予期しない競合を防ぐ。

- GitHub同期:
- `syncBidirectional` はリモート優先の簡易ロジックのため、
  - 自動同期では **「ローカル変更をプッシュするだけ」の軽量版** を用意することも検討（将来案）
- Cloudflare同期:
- D1側の書き込み回数に配慮し、
  - デバウンス間隔（例: 3〜5秒）と、**「一定時間内に最大N回」** などの制御を設けることを検討（初期は間隔のみでも可）。

---

### 5. UI/ドキュメント更新

**目的:** ユーザーに「いつ同期されるか」をわかりやすく説明する。

- Settings画面に簡単な説明を追加:
- 「GitHub/Cloudflareが設定されている場合、操作後数秒で自動同期されます」
- 「ページを閉じる時にも、可能な範囲で最終同期を行います」
- `docs/self-hosting-guide.md` に「自動同期の挙動」セクションを追加。

---

## 実装タスク（TODO）

1. `useSyncBackend`（仮称）を実装し、GitHub/Cloudflareの共通同期インターフェースを用意
2. `useTasks` に「変更検知 + デバウンス同期」ロジックを追加
3. `useTasks` に「beforeunload / visibilitychange での最終同期」ロジックを追加
4. 自動同期の失敗時の通知メッセージを整理（GitHub/Cloudflare別に案内）
5. Settings画面とドキュメントに、自動同期の挙動説明を追記