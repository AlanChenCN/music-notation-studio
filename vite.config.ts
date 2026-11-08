import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'

const https = existsSync('.cert/lan-key.pem') && existsSync('.cert/lan-cert.pem')
  ? { key: readFileSync('.cert/lan-key.pem'), cert: readFileSync('.cert/lan-cert.pem') }
  : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 8120, strictPort: true, https },
  preview: { host: '0.0.0.0', port: 8120, strictPort: true, https },
})
