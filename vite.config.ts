import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Cloudflare Pagesでは通常ベースパスは不要
  // GitHub Pagesを使用する場合は '/MYTTC2/' を使用
  // Cloudflare Pagesでは自動的に CF_PAGES=1 が設定される
  base: process.env.CF_PAGES === '1' || process.env.CF_PAGES_URL ? '/' : (process.env.NODE_ENV === 'production' ? '/MYTTC2/' : '/'),
  build: {
    outDir: 'dist',
  },
})

