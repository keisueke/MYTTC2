import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2Eテスト設定
 * 
 * 主要3ブラウザ（Chromium / Firefox / WebKit）でテストを実行します。
 * テスト実行時は自動で開発サーバーが起動・停止されます。
 */
export default defineConfig({
  // テストファイルの場所
  testDir: './tests/e2e',
  
  // テストのタイムアウト（30秒）
  timeout: 30 * 1000,
  
  // テストの期待値（expect）のタイムアウト（5秒）
  expect: {
    timeout: 5 * 1000,
  },
  
  // テストを並列実行するかどうか
  fullyParallel: true,
  
  // CI環境では失敗したテストを再実行しない
  forbidOnly: !!process.env.CI,
  
  // CI環境では失敗したテストを再実行する
  retries: process.env.CI ? 2 : 0,
  
  // 並列実行するワーカー数
  workers: process.env.CI ? 1 : undefined,
  
  // レポーター設定
  reporter: 'html',
  
  // 共有設定
  use: {
    // ベースURL（開発サーバーのURL）
    baseURL: 'http://localhost:4173',
    
    // アクション（クリック、入力など）のタイムアウト
    actionTimeout: 10 * 1000,
    
    // ナビゲーションのタイムアウト
    navigationTimeout: 30 * 1000,
    
    // スクリーンショットを撮るタイミング
    screenshot: 'only-on-failure',
    
    // 動画を録画するタイミング
    video: 'retain-on-failure',
    
    // トレースを記録するタイミング
    trace: 'on-first-retry',
  },

  // テスト用の開発サーバー設定
  webServer: {
    // 開発サーバーを起動するコマンド
    command: 'npm run preview',
    // サーバーが起動したと判断するURL
    url: 'http://localhost:4173',
    // サーバー起動のタイムアウト（60秒）
    timeout: 60 * 1000,
    // サーバーが起動するまで待機する間隔（1秒）
    reuseExistingServer: !process.env.CI,
  },

  // テストを実行するブラウザ
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})

