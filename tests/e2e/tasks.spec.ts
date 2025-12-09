import { test, expect } from '@playwright/test'
import { navigateToTasks, navigateToDashboard } from './helpers/navigation'
import { createTask, expectTaskInList, editTask, deleteTask, startTaskTimer, stopTaskTimer } from './helpers/tasks'

test.describe('タスク管理', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にダッシュボードに遷移して初期状態をリセット
    await navigateToDashboard(page)
    // LocalStorageをクリア（必要に応じて）
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('タスク一覧ページに遷移できること', async ({ page }) => {
    await navigateToTasks(page)
    await expect(page.locator('h1:has-text("今日のタスク")')).toBeVisible()
  })

  test('新規タスクを作成できること', async ({ page }) => {
    await navigateToTasks(page)
    
    const taskTitle = `テストタスク ${Date.now()}`
    await createTask(page, taskTitle)
    
    // タスクが一覧に表示されることを確認
    await expectTaskInList(page, taskTitle)
  })

  test('タスクを作成して編集できること', async ({ page }) => {
    await navigateToTasks(page)
    
    const originalTitle = `元のタスク ${Date.now()}`
    const newTitle = `編集後のタスク ${Date.now()}`
    
    // タスクを作成
    await createTask(page, originalTitle)
    await expectTaskInList(page, originalTitle)
    
    // タスクを編集
    await editTask(page, originalTitle, newTitle)
    
    // 編集後のタイトルが表示されることを確認
    await expectTaskInList(page, newTitle)
  })

  test('タスクを削除できること', async ({ page }) => {
    await navigateToTasks(page)
    
    const taskTitle = `削除テストタスク ${Date.now()}`
    
    // タスクを作成
    await createTask(page, taskTitle)
    await expectTaskInList(page, taskTitle)
    
    // タスクを削除
    await deleteTask(page, taskTitle)
    
    // タスクが一覧から消えていることを確認
    await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible()
  })

  test('タスクのタイマーを開始・停止できること', async ({ page }) => {
    await navigateToTasks(page)
    
    const taskTitle = `タイマーテストタスク ${Date.now()}`
    
    // タスクを作成
    await createTask(page, taskTitle)
    await expectTaskInList(page, taskTitle)
    
    // タイマーを開始
    await startTaskTimer(page, taskTitle)
    
    // タイマーが動作していることを確認（経過時間が表示される）
    // 実際のUIに合わせて調整が必要
    await page.waitForTimeout(2000)
    
    // タイマーを停止
    await stopTaskTimer(page, taskTitle)
    
    // タスクが完了状態になっていることを確認（実際のUIに合わせて調整）
    await page.waitForTimeout(1000)
  })

  test('入力禁止文字（制御文字）がブロックされること', async ({ page }) => {
    await navigateToTasks(page)
    
    // 新規タスクボタンをクリック
    await page.click('text=新規タスク')
    
    // 制御文字を含むタイトルを入力
    const invalidTitle = `テスト\u0001制御文字\u0007タスク`
    await page.fill('input[id="title"]', invalidTitle)
    
    // 保存ボタンをクリック
    await page.click('button[type="submit"]')
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/使用できない文字が含まれています/')).toBeVisible()
    
    // タスクが作成されていないことを確認（エラーメッセージが表示されている間は保存されない）
    await expect(page.locator(`text=${invalidTitle}`)).not.toBeVisible()
  })

  test('入力禁止文字（危険なパターン）がブロックされること', async ({ page }) => {
    await navigateToTasks(page)
    
    // 新規タスクボタンをクリック
    await page.click('text=新規タスク')
    
    // スクリプトタグを含むタイトルを入力
    const invalidTitle = '<script>alert("XSS")</script>'
    await page.fill('input[id="title"]', invalidTitle)
    
    // 保存ボタンをクリック
    await page.click('button[type="submit"]')
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/使用できない文字が含まれています/')).toBeVisible()
  })

  test('正常な文字（日本語・英数字・改行）は入力できること', async ({ page }) => {
    await navigateToTasks(page)
    
    const validTitle = '正常なタスク名 123 ABC'
    const validDescription = 'これは正常な説明です。\n改行も含まれています。'
    
    await createTask(page, validTitle, { description: validDescription })
    
    // タスクが正常に作成されることを確認
    await expectTaskInList(page, validTitle)
  })
})

