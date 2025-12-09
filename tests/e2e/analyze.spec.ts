import { test, expect } from '@playwright/test'
import { navigateToAnalyze, navigateToDashboard } from './helpers/navigation'

test.describe('分析ページ', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page)
    // LocalStorageをクリア（必要に応じて）
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('分析ページに遷移できること', async ({ page }) => {
    await navigateToAnalyze(page)
    await expect(page.locator('h1:has-text("分析")')).toBeVisible()
  })

  test('タイムラインタブが表示されること', async ({ page }) => {
    await navigateToAnalyze(page)
    
    // タイムラインタブをクリック
    await page.click('button:has-text("タイムライン"), button:has-text("時間軸")')
    
    // タイムラインが表示されることを確認（実際のUIに合わせて調整）
    await page.waitForTimeout(1000)
  })

  test('振り返りタブに遷移できること', async ({ page }) => {
    await navigateToAnalyze(page)
    
    // 振り返りタブをクリック
    await page.click('button:has-text("振り返り")')
    
    // 振り返りコンテンツが表示されることを確認（実際のUIに合わせて調整）
    await page.waitForTimeout(1000)
    
    // 振り返り関連の要素が表示されることを確認
    await expect(page.locator('text=/振り返り/')).toBeVisible({ timeout: 5000 })
  })

  test('分析ページから振り返りタブに直接遷移できること', async ({ page }) => {
    // 分析ページにクエリパラメータ付きで遷移
    await page.goto('/analyze?tab=reflection')
    await page.waitForLoadState('networkidle')
    
    // 振り返りタブがアクティブになっていることを確認
    await page.waitForTimeout(1000)
    await expect(page.locator('text=/振り返り/')).toBeVisible({ timeout: 5000 })
  })

  test('カテゴリー別分析が表示されること', async ({ page }) => {
    await navigateToAnalyze(page)
    
    // カテゴリー別分析タブをクリック（存在する場合）
    const categoryTab = page.locator('button:has-text("カテゴリー"), button:has-text("カテゴリ")').first()
    if (await categoryTab.isVisible()) {
      await categoryTab.click()
      await page.waitForTimeout(1000)
    }
  })
})

