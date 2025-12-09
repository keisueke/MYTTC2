import { Page, expect } from '@playwright/test'

/**
 * タスク操作のヘルパー関数
 */

/**
 * 新規タスクを作成
 */
export async function createTask(
  page: Page,
  title: string,
  options?: {
    description?: string
    project?: string
    mode?: string
    tags?: string[]
  }
) {
  // 新規タスクボタンをクリック
  await page.click('text=新規タスク')
  
  // タイトルを入力
  await page.fill('input[id="title"]', title)
  
  // 説明を入力（指定がある場合）
  if (options?.description) {
    await page.fill('textarea[id="description"]', options.description)
  }
  
  // プロジェクトを選択（指定がある場合）
  if (options?.project) {
    await page.selectOption('select[id="projectId"]', { label: options.project })
  }
  
  // モードを選択（指定がある場合）
  if (options?.mode) {
    await page.selectOption('select[id="modeId"]', { label: options.mode })
  }
  
  // タグを選択（指定がある場合）
  if (options?.tags && options.tags.length > 0) {
    for (const tag of options.tags) {
      await page.click(`text=${tag}`)
    }
  }
  
  // 保存ボタンをクリック
  await page.click('button[type="submit"]')
  
  // タスクが作成されるまで待機
  await page.waitForTimeout(500)
}

/**
 * タスクが一覧に表示されていることを確認
 */
export async function expectTaskInList(page: Page, title: string) {
  await expect(page.locator(`text=${title}`).first()).toBeVisible()
}

/**
 * タスクを編集
 */
export async function editTask(page: Page, currentTitle: string, newTitle: string) {
  // タスクの編集ボタンをクリック（タイトルを右クリックしてコンテキストメニューを開く、または編集アイコンをクリック）
  // 実際のUIに合わせて調整が必要
  const taskItem = page.locator(`text=${currentTitle}`).first()
  await taskItem.hover()
  // 編集ボタンやメニューを探す（実際のUIに合わせて調整）
  await page.click('button:has-text("編集")', { timeout: 5000 }).catch(() => {
    // 編集ボタンが見つからない場合は、タスクをクリックして編集フォームを開く
    taskItem.click()
  })
  
  // タイトルを更新
  await page.fill('input[id="title"]', newTitle)
  
  // 保存ボタンをクリック
  await page.click('button[type="submit"]')
  
  await page.waitForTimeout(500)
}

/**
 * タスクを削除
 */
export async function deleteTask(page: Page, title: string) {
  const taskItem = page.locator(`text=${title}`).first()
  await taskItem.hover()
  
  // 削除ボタンをクリック（実際のUIに合わせて調整）
  await page.click('button:has-text("削除")', { timeout: 5000 }).catch(() => {
    // 削除ボタンが見つからない場合は、コンテキストメニューから削除
    page.keyboard.press('Delete')
  })
  
  // 確認ダイアログでOKをクリック
  page.on('dialog', dialog => dialog.accept())
  
  await page.waitForTimeout(500)
}

/**
 * タスクのタイマーを開始
 */
export async function startTaskTimer(page: Page, title: string) {
  const taskItem = page.locator(`text=${title}`).first()
  await taskItem.hover()
  
  // タイマー開始ボタンをクリック（実際のUIに合わせて調整）
  await page.click('button:has-text("開始")', { timeout: 5000 })
  
  await page.waitForTimeout(1000)
}

/**
 * タスクのタイマーを停止
 */
export async function stopTaskTimer(page: Page, title: string) {
  const taskItem = page.locator(`text=${title}`).first()
  await taskItem.hover()
  
  // タイマー停止ボタンをクリック（実際のUIに合わせて調整）
  await page.click('button:has-text("停止")', { timeout: 5000 })
  
  await page.waitForTimeout(1000)
}

