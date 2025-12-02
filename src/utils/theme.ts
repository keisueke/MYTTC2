export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'mytcc2_theme'

/**
 * 保存されたテーマを取得
 */
export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch (error) {
    console.error('Failed to load theme from localStorage:', error)
  }
  
  // デフォルトはダークモード
  return 'dark'
}

/**
 * テーマを保存
 */
export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error)
  }
}

/**
 * テーマを適用
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
}

/**
 * 初期化時にテーマを適用
 */
export function initTheme(): Theme {
  const theme = getStoredTheme()
  applyTheme(theme)
  return theme
}

