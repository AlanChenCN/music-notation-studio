import { defineConfig } from '@playwright/test'
import process from 'node:process'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:5174', headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: true, env: { MNS_HTTP_ONLY: '1' } },
})
