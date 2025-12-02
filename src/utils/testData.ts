import { Task, Project, Mode, Tag } from '../types'

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
    },
    {
      title: 'APIエンドポイントの設計',
      description: 'RESTful APIの設計とドキュメント作成',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
    },
    {
      title: 'データベーススキーマの設計',
      description: 'ER図の作成とテーブル設計',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
    },
    {
      title: 'UIコンポーネントの作成',
      description: '再利用可能なReactコンポーネントの実装',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
    },
    {
      title: 'ユニットテストの作成',
      description: '主要機能のテストケースを追加',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
    },
    {
      title: 'パフォーマンス最適化',
      description: 'クエリの最適化とキャッシュ戦略の実装',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
    },
    {
      title: 'セキュリティレビュー',
      description: '脆弱性のチェックと修正',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
    },
    {
      title: 'ドキュメントの更新',
      description: 'READMEとAPIドキュメントの更新',
      projectId: undefined,
      modeId: undefined,
      tagIds: undefined,
      repeatPattern: 'none',
    },
  ]

  return {
    projects: testProjects,
    modes: testModes,
    tags: testTags,
    tasks: testTasks,
  }
}

