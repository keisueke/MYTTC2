import { Task, Project, Mode, Tag, Memo, MemoTemplate, Goal, Wish } from '../types'

/**
 * テスト用のデータを生成する
 */
export function generateTestData() {

  // テスト用プロジェクト
  const testProjects: Omit<Project, 'id' | 'createdAt'>[] = [
    { name: 'Web開発' },
    { name: 'モバイルアプリ' },
    { name: 'デザイン' },
    { name: 'マーケティング' },
    { name: '研究開発' },
  ]

  // テスト用モード
  const testModes: Omit<Mode, 'id' | 'createdAt'>[] = [
    { name: '集中', color: '#DC2626' },
    { name: '学習', color: '#2563EB' },
    { name: 'レビュー', color: '#059669' },
    { name: '会議', color: '#7C3AED' },
    { name: '雑務', color: '#6B7280' },
  ]

  // テスト用タグ
  const testTags: Omit<Tag, 'id' | 'createdAt'>[] = [
    { name: '緊急' },
    { name: '重要' },
    { name: 'バグ修正' },
    { name: '新機能' },
    { name: 'リファクタリング' },
    { name: 'ドキュメント' },
    { name: 'テスト' },
  ]

  // テスト用タスク
  const testTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: 'ログイン機能の実装',
      description: 'ユーザー認証とセッション管理を実装する',
      projectId: undefined, // 後で設定
      modeId: undefined, // 後で設定
      tagIds: undefined, // 後で設定
      repeatPattern: 'none',
      estimatedTime: 120, // 2時間
    },
    {
      title: 'APIエンドポイントの設計',
      description: 'RESTful APIの設計とドキュメント作成',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 90, // 1.5時間
    },
    {
      title: 'データベーススキーマの設計',
      description: 'ER図の作成とテーブル設計',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 180, // 3時間
    },
    {
      title: 'UIコンポーネントの作成',
      description: '再利用可能なReactコンポーネントの実装',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 150, // 2.5時間
    },
    {
      title: 'ユニットテストの作成',
      description: '主要機能のテストケースを追加',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 120, // 2時間
    },
    {
      title: 'パフォーマンス最適化',
      description: 'クエリの最適化とキャッシュ戦略の実装',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 240, // 4時間
    },
    {
      title: 'セキュリティレビュー',
      description: '脆弱性のチェックと修正',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 90, // 1.5時間
    },
    {
      title: 'ドキュメントの更新',
      description: 'READMEとAPIドキュメントの更新',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 60, // 1時間
    },
    {
      title: '朝のメールチェック',
      description: '重要なメールに返信し、優先順位を確認',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'daily',
      estimatedTime: 30, // 30分
    },
    {
      title: '週次レビュー',
      description: '今週の進捗を確認し、来週の計画を立てる',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'weekly',
      estimatedTime: 60, // 1時間
    },
    {
      title: 'コードレビュー',
      description: 'プルリクエストのレビューとフィードバック',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 45, // 45分
    },
    {
      title: 'バグ修正',
      description: '報告されたバグの調査と修正',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 90, // 1.5時間
    },
    {
      title: '新機能の設計',
      description: '要件定義と技術仕様の作成',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 180, // 3時間
    },
    {
      title: 'デプロイ準備',
      description: '本番環境へのデプロイ準備とチェックリスト確認',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 60, // 1時間
    },
    {
      title: 'チームミーティング',
      description: '週次のチームミーティングに参加',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'weekly',
      estimatedTime: 60, // 1時間
    },
    {
      title: '学習時間',
      description: '新しい技術やフレームワークの学習',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'daily',
      estimatedTime: 60, // 1時間
    },
    {
      title: 'リファクタリング',
      description: '既存コードの改善と最適化',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
      estimatedTime: 120, // 2時間
    },
    {
      title: '月次レポート作成',
      description: '月次の進捗レポートを作成',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'monthly',
      estimatedTime: 90, // 1.5時間
    },
  ]

  // テスト用メモ
  const testMemos: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: '週次レビュー',
      content: '今週の進捗:\n- ログイン機能の実装完了\n- APIエンドポイントの設計進行中\n- データベーススキーマの設計完了\n\n来週の予定:\n- UIコンポーネントの作成開始\n- ユニットテストの作成\n- パフォーマンス最適化の検討',
    },
    {
      title: '新機能アイデア',
      content: 'ダッシュボードに統計グラフを追加\n- 週次/月次のタスク完了率\n- プロジェクト別の時間分析\n- モード別の作業時間分布\n\n実装優先度: 中\n関連タスク: ダッシュボード改善',
    },
    {
      title: '会議議事録 - プロジェクト計画',
      content: '日時: 2025年12月3日 14:00-15:00\n参加者: 田中、佐藤、鈴木\n\n議題:\n- 次期リリースの機能要件\n- 開発スケジュールの調整\n\n決定事項:\n- ログイン機能を優先実装\n- デプロイ日を12月15日に設定\n\nアクションアイテム:\n- 田中: API設計書の作成\n- 佐藤: UIデザインの確認',
    },
    {
      title: '学習ノート - React Hooks',
      content: 'useState: 状態管理\n- 初期値を設定可能\n- 関数型更新も可能\n\nuseEffect: 副作用の処理\n- 依存配列で実行タイミングを制御\n- クリーンアップ関数でリソース解放\n\nuseCallback: 関数のメモ化\n- 依存配列が変わらない限り同じ関数を返す\n- パフォーマンス最適化に有効',
    },
    {
      title: 'バグ修正メモ',
      content: '問題: サイドバーのリサイズが正常に動作しない\n\n原因: イベントリスナーのクリーンアップが不完全\n\n解決策:\n- useEffectの依存配列を適切に設定\n- クリーンアップ関数でイベントリスナーを削除\n\nステータス: 修正済み',
    },
    {
      title: 'TODOリスト',
      content: '緊急:\n- [ ] バグ修正のレビュー\n- [ ] デプロイ準備\n\n重要:\n- [ ] ドキュメント更新\n- [ ] テストケース追加\n\nその他:\n- [ ] コードレビュー\n- [ ] リファクタリング',
    },
    {
      title: 'パフォーマンス改善アイデア',
      content: '現状の問題:\n- 大量のタスク表示時にレンダリングが遅い\n- チャートの描画に時間がかかる\n\n改善案:\n1. 仮想スクロールの導入\n2. チャートの遅延読み込み\n3. メモ化の活用\n\n優先度: 高',
    },
    {
      title: 'デザイン改善メモ',
      content: 'UI/UX改善点:\n- ボタンのホバー効果を統一\n- カラーパレットの調整\n- フォントサイズの最適化\n\n参考サイト:\n- Material Design\n- Tailwind CSS公式',
    },
    {
      title: '技術調査 - 状態管理',
      content: '検討中のライブラリ:\n1. Zustand: 軽量でシンプル\n2. Jotai: アトミックな状態管理\n3. Recoil: Facebook製、複雑な状態に適している\n\n結論: 現時点ではContext APIで十分。将来的にZustandを検討',
    },
  ]

  // テスト用メモテンプレート
  const testMemoTemplates: Omit<MemoTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: '会議議事録',
      content: '日時: \n参加者: \n議題: \n\n決定事項:\n- \n- \n\nアクションアイテム:\n- \n- \n\n次回会議: ',
    },
    {
      title: '日報',
      content: '日付: \n\n今日の作業:\n- \n- \n\n完了したタスク:\n- \n- \n\n課題:\n- \n\n明日の予定:\n- \n- ',
    },
    {
      title: '週次レビュー',
      content: '週: \n\n今週の進捗:\n- \n- \n\n完了したタスク:\n- \n- \n\n来週の予定:\n- \n- \n\n課題・改善点:\n- ',
    },
    {
      title: 'バグレポート',
      content: 'バグID: \n発見日時: \n報告者: \n\n問題の説明:\n\n再現手順:\n1. \n2. \n3. \n\n期待される動作:\n\n実際の動作:\n\n環境:\n- OS: \n- ブラウザ: \n\nステータス: ',
    },
    {
      title: '学習ノート',
      content: 'テーマ: \n日付: \n\n学習内容:\n\n重要なポイント:\n- \n- \n\n実践例:\n\n参考資料:\n- \n- ',
    },
  ]

  // テスト用年間目標（2025年）
  const currentYear = new Date().getFullYear()
  const testGoals: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // 中央目標（position: 0）
    {
      year: currentYear,
      category: 'other',
      title: 'バランスの取れた生活',
      description: '仕事、健康、家族、趣味のバランスを保つ',
      progress: 60,
      position: 0,
    },
    // 社会貢献（position: 1）
    {
      year: currentYear,
      category: 'social-contribution',
      title: 'オープンソースへの貢献',
      description: 'GitHubで月1回以上コミット、ドキュメント改善',
      progress: 40,
      parentGoalId: undefined, // 後で設定
      position: 1,
    },
    {
      year: currentYear,
      category: 'social-contribution',
      title: '技術ブログの執筆',
      description: '月2回以上、技術的な知見をブログで共有',
      progress: 30,
      parentGoalId: undefined,
    },
    // 家族（position: 2）
    {
      year: currentYear,
      category: 'family',
      title: '家族との時間を増やす',
      description: '週末は家族と過ごす時間を確保',
      progress: 70,
      parentGoalId: undefined,
      position: 2,
    },
    {
      year: currentYear,
      category: 'family',
      title: '家族旅行の計画',
      description: '年に2回、家族旅行を実施',
      progress: 50,
      parentGoalId: undefined,
    },
    // 人間関係（position: 3）
    {
      year: currentYear,
      category: 'relationships',
      title: 'ネットワーキングの拡大',
      description: '業界イベントに参加し、新しいつながりを作る',
      progress: 45,
      parentGoalId: undefined,
      position: 3,
    },
    {
      year: currentYear,
      category: 'relationships',
      title: 'メンターシップ',
      description: '後輩や新人のメンターとしてサポート',
      progress: 60,
      parentGoalId: undefined,
    },
    // 趣味（position: 4）
    {
      year: currentYear,
      category: 'hobby',
      title: '読書習慣',
      description: '月2冊以上の技術書・ビジネス書を読む',
      progress: 55,
      parentGoalId: undefined,
      position: 4,
    },
    {
      year: currentYear,
      category: 'hobby',
      title: '写真撮影',
      description: '週末に写真を撮り、SNSで共有',
      progress: 40,
      parentGoalId: undefined,
    },
    // 仕事（position: 5）
    {
      year: currentYear,
      category: 'work',
      title: 'スキルアップ',
      description: '新しい技術を3つ以上習得',
      progress: 65,
      parentGoalId: undefined,
      position: 5,
    },
    {
      year: currentYear,
      category: 'work',
      title: 'プロジェクトリーダー',
      description: '重要なプロジェクトのリーダーを務める',
      progress: 50,
      parentGoalId: undefined,
    },
    // ファイナンス（position: 6）
    {
      year: currentYear,
      category: 'finance',
      title: '投資の学習',
      description: '投資の基礎を学び、ポートフォリオを構築',
      progress: 35,
      parentGoalId: undefined,
      position: 6,
    },
    {
      year: currentYear,
      category: 'finance',
      title: '貯蓄目標',
      description: '年間で一定額の貯蓄を達成',
      progress: 60,
      parentGoalId: undefined,
    },
    // 健康（position: 7）
    {
      year: currentYear,
      category: 'health',
      title: '運動習慣',
      description: '週3回以上、30分以上の運動',
      progress: 50,
      parentGoalId: undefined,
      position: 7,
    },
    {
      year: currentYear,
      category: 'health',
      title: '健康的な食事',
      description: 'バランスの取れた食事を心がける',
      progress: 65,
      parentGoalId: undefined,
    },
    // 知性（position: 8）
    {
      year: currentYear,
      category: 'intelligence',
      title: '資格取得',
      description: '関連する資格を2つ以上取得',
      progress: 40,
      parentGoalId: undefined,
      position: 8,
    },
    {
      year: currentYear,
      category: 'intelligence',
      title: '言語学習',
      description: '英語力を向上させ、TOEIC800点以上',
      progress: 55,
      parentGoalId: undefined,
    },
  ]

  // テスト用Wishリスト
  const testWishes: Omit<Wish, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: '新しいMacBook Pro',
      description: 'M3チップ搭載のMacBook Pro 16インチ',
    },
    {
      title: 'プログラミング書籍',
      description: 'Clean Architecture、Design Patterns、System Design',
    },
    {
      title: 'スタンディングデスク',
      description: '電動昇降式のスタンディングデスク',
    },
    {
      title: 'オンラインコース',
      description: 'AWS認定資格のオンラインコース',
    },
    {
      title: 'モニター',
      description: '4K解像度の27インチモニター',
    },
    {
      title: 'キーボード',
      description: 'メカニカルキーボード（静音タイプ）',
    },
    {
      title: 'ノイズキャンセリングヘッドフォン',
      description: '集中作業用の高品質ヘッドフォン',
    },
    {
      title: 'プログラミング環境の改善',
      description: '開発環境のセットアップとツールの最適化',
    },
    {
      title: '技術カンファレンス参加',
      description: 'React ConfやJSConfなどの技術カンファレンス',
    },
    {
      title: 'フィットネスグッズ',
      description: 'ホームジム用のダンベルセット',
    },
  ]

  return {
    projects: testProjects,
    modes: testModes,
    tags: testTags,
    tasks: testTasks,
    memos: testMemos,
    memoTemplates: testMemoTemplates,
    goals: testGoals,
    wishes: testWishes,
  }
}

