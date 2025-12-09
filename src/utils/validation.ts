/**
 * 入力値のバリデーション関数
 * 制御文字やインジェクション攻撃を防ぐための検証を行う
 */

/**
 * バリデーション結果
 */
export interface ValidationResult {
  valid: boolean
  invalidChars: string[]
  errorMessage?: string
}

/**
 * 許可する制御文字（改行、タブなど通常必要なもの）
 */
const ALLOWED_CONTROL_CHARS = new Set([
  '\n', // 改行（LF）
  '\r', // 改行（CR）
  '\t', // タブ
])

/**
 * 禁止する制御文字の範囲
 * - \u0000-\u001F: C0制御文字（改行・タブを除く）
 * - \u007F: DEL文字
 * - \u0080-\u009F: C1制御文字
 */
const FORBIDDEN_CONTROL_CHAR_RANGES = [
  { start: 0x0000, end: 0x001F }, // C0制御文字
  { start: 0x007F, end: 0x007F }, // DEL文字
  { start: 0x0080, end: 0x009F }, // C1制御文字
]

/**
 * インジェクション攻撃に関連する危険な文字パターン
 * 将来的にDB接続する際のSQLインジェクション対策としても有効
 */
const DANGEROUS_PATTERNS = [
  /<script[^>]*>/i, // スクリプトタグ
  /javascript:/i,   // JavaScriptプロトコル
  /on\w+\s*=/i,     // イベントハンドラ（onclick等）
  /['";\\]/g,       // SQLインジェクションに関連する文字（シングルクォート、ダブルクォート、セミコロン、バックスラッシュ）
]

/**
 * 制御文字が禁止されているかチェック
 */
function isForbiddenControlChar(char: string): boolean {
  // 許可された制御文字は除外
  if (ALLOWED_CONTROL_CHARS.has(char)) {
    return false
  }

  const codePoint = char.codePointAt(0)
  if (codePoint === undefined) {
    return false
  }

  // 禁止範囲内かチェック
  for (const range of FORBIDDEN_CONTROL_CHAR_RANGES) {
    if (codePoint >= range.start && codePoint <= range.end) {
      return true
    }
  }

  return false
}

/**
 * 危険なパターンが含まれているかチェック
 */
function containsDangerousPattern(text: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(text))
}

/**
 * テキスト入力のバリデーション
 * 制御文字とインジェクション攻撃のパターンをチェック
 * 
 * @param input 検証するテキスト
 * @param fieldName フィールド名（エラーメッセージ用、オプション）
 * @returns バリデーション結果
 */
export function validateTextInput(
  input: string,
  fieldName?: string
): ValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      valid: true, // 空文字列やnullは別のバリデーションで処理
      invalidChars: [],
    }
  }

  const invalidChars: string[] = []
  const fieldLabel = fieldName ? `${fieldName}に` : ''

  // 制御文字をチェック
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (isForbiddenControlChar(char)) {
      const codePoint = char.codePointAt(0) || 0
      // 制御文字の種類を識別
      let charType = '制御文字'
      if (codePoint >= 0x0000 && codePoint <= 0x001F) {
        charType = 'C0制御文字'
      } else if (codePoint === 0x007F) {
        charType = 'DEL文字'
      } else if (codePoint >= 0x0080 && codePoint <= 0x009F) {
        charType = 'C1制御文字'
      }
      
      if (!invalidChars.includes(charType)) {
        invalidChars.push(charType)
      }
    }
  }

  // 危険なパターンをチェック
  if (containsDangerousPattern(input)) {
    invalidChars.push('危険な文字パターン')
  }

  if (invalidChars.length > 0) {
    const charList = invalidChars.join('、')
    return {
      valid: false,
      invalidChars,
      errorMessage: `${fieldLabel}使用できない文字が含まれています: ${charList}`,
    }
  }

  return {
    valid: true,
    invalidChars: [],
  }
}

/**
 * 複数のテキストフィールドを一括でバリデーション
 * 
 * @param fields フィールド名と値のマップ
 * @returns エラーメッセージのマップ（フィールド名 -> エラーメッセージ）
 */
export function validateMultipleFields(
  fields: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const [fieldName, value] of Object.entries(fields)) {
    if (value) {
      const result = validateTextInput(value, fieldName)
      if (!result.valid && result.errorMessage) {
        errors[fieldName] = result.errorMessage
      }
    }
  }

  return errors
}

/**
 * テキストをサニタイズ（制御文字を削除）
 * 注意: これは最終防衛線として使用するもので、通常はバリデーションでブロックする
 * 
 * @param input サニタイズするテキスト
 * @returns サニタイズされたテキスト
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  let sanitized = ''
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (!isForbiddenControlChar(char)) {
      sanitized += char
    }
  }

  // 危険なパターンを削除（簡易的な処理）
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  return sanitized
}

