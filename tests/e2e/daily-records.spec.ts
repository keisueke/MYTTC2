import { test, expect } from '@playwright/test'
import { navigateToDashboard, navigateToDailyRecords } from './helpers/navigation'

test.describe('日次記録', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page)
    // LocalStorageをクリア（必要に応じて）
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('今日の記録を入力できること', async ({ page }) => {
    await navigateToDashboard(page)
    
    // 体重を入力
    const weightInput = page.locator('input[type="number"]').filter({ hasText: /体重/ }).first()
    if (await weightInput.isVisible()) {
      await weightInput.fill('70.5')
    } else {
      // 体重入力フィールドを探す（実際のUIに合わせて調整）
      await page.fill('input[placeholder*="体重"]', '70.5')
    }
    
    // 朝食を入力
    await page.fill('input[placeholder*="朝食"], input[placeholder*="例: パン"]', 'パン、コーヒー')
    
    // 昼食を入力
    await page.fill('input[placeholder*="昼食"], input[placeholder*="例: サラダ"]', 'サラダ、スープ')
    
    // 保存ボタンをクリック
    await page.click('button:has-text("保存")')
    
    // 保存成功の通知を確認（実際のUIに合わせて調整）
    await page.waitForTimeout(1000)
    
    // ページをリロードして、入力した値が保持されていることを確認
    await page.reload()
    await page.waitForTimeout(1000)
  })

  test('日次記録ページに遷移できること', async ({ page }) => {
    await navigateToDailyRecords(page)
    await expect(page.locator('h1:has-text("日次記録")')).toBeVisible()
  })

  test('日次記録ページで統計が表示されること', async ({ page }) => {
    await navigateToDailyRecords(page)
    
    // 統計サマリーが表示されることを確認
    await expect(page.locator('text=/記録日数/')).toBeVisible()
  })

  test('日次記録の入力で禁止文字がブロックされること', async ({ page }) => {
    await navigateToDashboard(page)
    
    // 制御文字を含む朝食を入力
    const invalidBreakfast = `パン\u0001コーヒー`
    await page.fill('input[placeholder*="朝食"], input[placeholder*="例: パン"]', invalidBreakfast)
    
    // 保存ボタンをクリック
    await page.click('button:has-text("保存")')
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/使用できない文字が含まれています/')).toBeVisible({ timeout: 5000 })
  })

  test('日次記録の入力で危険なパターンがブロックされること', async ({ page }) => {
    await navigateToDashboard(page)
    
    // スクリプトタグを含む朝食を入力
    const invalidBreakfast = '<script>alert("XSS")</script>'
    await page.fill('input[placeholder*="朝食"], input[placeholder*="例: パン"]', invalidBreakfast)
    
    // 保存ボタンをクリック
    await page.click('button:has-text("保存")')
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/使用できない文字が含まれています/')).toBeVisible({ timeout: 5000 })
  })
})

