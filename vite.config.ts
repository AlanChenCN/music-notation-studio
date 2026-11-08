import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const localFile = (name: string) => fileURLToPath(new URL(`./.cert/${name}`, import.meta.url))
const keyPath = localFile('server-key.pem')
const certificatePath = localFile('server.pem')
const https = process.env.MNS_HTTP_ONLY !== '1' && existsSync(keyPath) && existsSync(certificatePath)
  ? { key: readFileSync(keyPath), cert: readFileSync(certificatePath) }
  : undefined

const downloadCertificate = (_request: IncomingMessage, response: ServerResponse) => {
    const path = localFile('local-ca.cer')
    if (!existsSync(path)) { response.statusCode = 404; response.end('Certificate not generated.'); return }
    response.setHeader('Content-Type', 'application/x-x509-ca-cert')
    response.setHeader('Content-Disposition', 'attachment; filename="Local-Development-CA.cer"')
    response.end(readFileSync(path))
}
const certificateDownload: Plugin = {
  name: 'local-certificate-download',
  configureServer(server) { server.middlewares.use('/local-ca.cer', downloadCertificate) },
  configurePreviewServer(server) { server.middlewares.use('/local-ca.cer', downloadCertificate) },
}

export default defineConfig({
  plugins: [react(), certificateDownload],
  server: { host: '0.0.0.0', port: 8120, strictPort: true, https,
    fs: { deny: ['**/.cert/**', '.env', '.env.*', '*.{crt,pem,key,pfx,p12}', '**/.git/**'] },
  },
  preview: { host: '0.0.0.0', port: 8120, strictPort: true, https },
})
