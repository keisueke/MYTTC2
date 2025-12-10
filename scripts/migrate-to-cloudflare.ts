// GitHub APIからCloudflare D1へのデータ移行スクリプト

import * as githubApi from '../src/services/githubApi'
import * as dataSplitService from '../src/services/dataSplitService'
import * as migrationService from '../src/services/migrationService'
import { GitHubConfig } from '../src/types'
import { cloudflareApi } from './cloudflare-migration-helper'

/**
 * GitHubからデータを取得
 */
async function loadDataFromGitHub(config: GitHubConfig) {
  // 移行が必要かチェック
  const migrated = await migrationService.isMigrated(config)
  if (!migrated) {
    // 移行を実行
    await migrationService.migrateFromSingleFile(config)
  }

  // 自動検出でデータを読み込み
  return await migrationService.loadDataAutoDetect(config)
}

/**
 * Cloudflare D1にデータをインポート
 */
async function importToCloudflare(
  cloudflareConfig: { apiUrl: string; apiKey?: string },
  data: any
) {
  console.log('Importing data to Cloudflare...')

  // データ同期APIを使用してインポート
  const response = await cloudflareApi.syncToCloudflare(cloudflareConfig, data)

  console.log('Import completed:', response.lastSynced)
  return response
}

/**
 * データ整合性の確認
 */
async function verifyDataIntegrity(
  githubConfig: GitHubConfig,
  cloudflareConfig: { apiUrl: string; apiKey?: string }
) {
  console.log('Verifying data integrity...')

  // GitHubからデータを取得
  const githubData = await loadDataFromGitHub(githubConfig)

  // Cloudflareからデータを取得
  const cloudflareData = await cloudflareApi.syncFromCloudflare(cloudflareConfig)

  // データの比較
  const tasksMatch = githubData.tasks.length === cloudflareData.data.tasks.length
  const projectsMatch = githubData.projects?.length === cloudflareData.data.projects.length
  const modesMatch = githubData.modes?.length === cloudflareData.data.modes.length
  const tagsMatch = githubData.tags?.length === cloudflareData.data.tags.length

  console.log('Verification results:')
  console.log(`  Tasks: ${tasksMatch ? 'OK' : 'MISMATCH'} (GitHub: ${githubData.tasks.length}, Cloudflare: ${cloudflareData.data.tasks.length})`)
  console.log(`  Projects: ${projectsMatch ? 'OK' : 'MISMATCH'} (GitHub: ${githubData.projects?.length || 0}, Cloudflare: ${cloudflareData.data.projects.length})`)
  console.log(`  Modes: ${modesMatch ? 'OK' : 'MISMATCH'} (GitHub: ${githubData.modes?.length || 0}, Cloudflare: ${cloudflareData.data.modes.length})`)
  console.log(`  Tags: ${tagsMatch ? 'OK' : 'MISMATCH'} (GitHub: ${githubData.tags?.length || 0}, Cloudflare: ${cloudflareData.data.tags.length})`)

  return tasksMatch && projectsMatch && modesMatch && tagsMatch
}

/**
 * メインの移行処理
 */
async function migrate() {
  const args = process.argv.slice(2)

  // コマンドライン引数から設定を取得
  const githubToken = args[0] || process.env.GITHUB_TOKEN
  const githubOwner = args[1] || process.env.GITHUB_OWNER
  const githubRepo = args[2] || process.env.GITHUB_REPO
  const cloudflareApiUrl = args[3] || process.env.CLOUDFLARE_API_URL
  const cloudflareApiKey = args[4] || process.env.CLOUDFLARE_API_KEY

  if (!githubToken || !githubOwner || !githubRepo || !cloudflareApiUrl) {
    console.error('Usage: ts-node migrate-to-cloudflare.ts <github-token> <github-owner> <github-repo> <cloudflare-api-url> [cloudflare-api-key]')
    console.error('Or set environment variables: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, CLOUDFLARE_API_URL, CLOUDFLARE_API_KEY')
    process.exit(1)
  }

  const githubConfig: GitHubConfig = {
    token: githubToken,
    owner: githubOwner,
    repo: githubRepo,
    dataPath: 'data/tasks.json',
  }

  const cloudflareConfig = {
    apiUrl: cloudflareApiUrl,
    apiKey: cloudflareApiKey,
  }

  try {
    console.log('Starting migration from GitHub to Cloudflare...')
    console.log(`GitHub: ${githubOwner}/${githubRepo}`)
    console.log(`Cloudflare API: ${cloudflareApiUrl}`)

    // 1. GitHubからデータを取得
    console.log('\n1. Loading data from GitHub...')
    const data = await loadDataFromGitHub(githubConfig)
    console.log(`   Loaded ${data.tasks.length} tasks, ${data.projects?.length || 0} projects, ${data.modes?.length || 0} modes, ${data.tags?.length || 0} tags`)

    // 2. Cloudflareにインポート
    console.log('\n2. Importing data to Cloudflare...')
    await importToCloudflare(cloudflareConfig, data)

    // 3. データ整合性の確認
    console.log('\n3. Verifying data integrity...')
    const isValid = await verifyDataIntegrity(githubConfig, cloudflareConfig)

    if (isValid) {
      console.log('\n✅ Migration completed successfully!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Migration completed with warnings. Please verify the data manually.')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// スクリプトとして実行された場合（ESモジュール対応）
migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})

export { migrate, loadDataFromGitHub, importToCloudflare, verifyDataIntegrity }

