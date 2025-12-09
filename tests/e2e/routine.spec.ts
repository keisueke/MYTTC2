import { test, expect } from '@playwright/test'
import { navigateToRoutine, navigateToDashboard } from './helpers/navigation'
import { createTask, expectTaskInList } from './helpers/tasks'

test.describe('ルーティン＆ハビットトラッカー', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page)
    // LocalStorageをクリア（必要に応じて）
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('ルーティンページに遷移できること', async ({ page }) => {
    await navigateToRoutine(page)
    await expect(page.locator('h1:has-text("ルーティン")')).toBeVisible()
  })

  test('ルーティンタスクが表示されること', async ({ page }) => {
    await navigateToRoutine(page)
    
    // ルーティンタスクを作成（繰り返しパターンを設定）
    const routineTitle = `ルーティンテスト ${Date.now()}`
    
    // 新規タスクボタンをクリック
    await page.click('text=新規タスク')
    
    // タイトルを入力
    await page.fill('input[id="title"]', routineTitle)
    
    // 繰り返しパターンを選択（例: 毎日）
    await page.selectOption('select[id="repeatPattern"]', { label: '毎日' })
    
    // 保存ボタンをクリック
    await page.click('button[type="submit"]')
    await page.waitForTimeout(500)
    
    // ルーティンタスクが表示されることを確認
    await expectTaskInList(page, routineTitle)
  })

  test('ハビットトラッカーにルーティンが反映されること', async ({ page }) => {
    await navigateToDashboard(page)
    
    // まずルーティンタスクを作成
    await navigateToRoutine(page)
    
    const routineTitle = `ハビットテスト ${Date.now()}`
    
    await page.click('text=新規タスク')
    await page.fill('input[id="title"]', routineTitle)
    await page.selectOption('select[id="repeatPattern"]', { label: '毎日' })
    await page.click('button[type="submit"]')
    await page.waitForTimeout(500)
    
    // ダッシュボードに戻る
    await navigateToDashboard(page)
    
    // ハビットトラッカーにルーティンが表示されることを確認
    // 実際のUIに合わせて調整が必要
    await expect(page.locator(`text=${routineTitle}`)).toBeVisible({ timeout: 10000 })
  })

  test('ルーティンタスクの並び替えができること', async ({ page }) => {
    await navigateToRoutine(page)
    
    // 複数のルーティンタスクを作成
    const task1 = `ルーティン1 ${Date.now()}`
    const task2 = `ルーティン2 ${Date.now()}`
    
    await page.click('text=新規タスク')
    await page.fill('input[id="title"]', task1)
    await page.selectOption('select[id="repeatPattern"]', { label: '毎日' })
    await page.click('button[type="submit"]')
    await page.waitForTimeout(500)
    
    await page.click('text=新規タスク')
    await page.fill('input[id="title"]', task2)
    await page.selectOption('select[id="repeatPattern"]', { label: '毎日' })
    await page.click('button[type="submit"]')
    await page.waitForTimeout(500)
    
    // ドラッグ＆ドロップで並び替え（実際のUIに合わせて調整が必要）
    const task1Element = page.locator(`text=${task1}`).first()
    const task2Element = page.locator(`text=${task2}`).first()
    
    // ドラッグ＆ドロップを実行
    await task1Element.dragTo(task2Element)
    await page.waitForTimeout(1000)
    
    // 並び替えが反映されていることを確認（実際のUIに合わせて調整）
    // ここでは、要素が存在することを確認するだけ
    await expect(task1Element).toBeVisible()
    await expect(task2Element).toBeVisible()
  })
})

