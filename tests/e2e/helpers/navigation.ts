import { Page } from '@playwright/test'

/**
 * ページ遷移のヘルパー関数
 */

/**
 * ダッシュボードページに遷移
 */
export async function navigateToDashboard(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
}

/**
 * タスク一覧ページに遷移
 */
export async function navigateToTasks(page: Page) {
  await page.goto('/tasks')
  await page.waitForLoadState('networkidle')
}

/**
 * ルーティンページに遷移
 */
export async function navigateToRoutine(page: Page) {
  await page.goto('/repeat-tasks')
  await page.waitForLoadState('networkidle')
}

/**
 * 日次記録ページに遷移
 */
export async function navigateToDailyRecords(page: Page) {
  await page.goto('/daily-records')
  await page.waitForLoadState('networkidle')
}

/**
 * 分析ページに遷移
 */
export async function navigateToAnalyze(page: Page) {
  await page.goto('/analyze')
  await page.waitForLoadState('networkidle')
}

/**
 * 設定ページに遷移
 */
export async function navigateToSettings(page: Page) {
  await page.goto('/settings')
  await page.waitForLoadState('networkidle')
}

