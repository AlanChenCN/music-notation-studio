import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

// Only the public certificate is served, never arbitrary files or private keys.
const certificate = readFileSync(new URL('../.cert/local-ca.cer', import.meta.url))
const page = Buffer.from(`<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>本地开发证书</title>
<style>body{margin:0;background:#f3f0ff;color:#28223e;font:17px/1.7 system-ui,sans-serif;padding:32px 20px}main{max-width:520px;margin:5vh auto;background:white;border-radius:24px;padding:28px}h1{font-size:28px;margin:0}a{display:block;text-align:center;background:#7048e8;color:white;padding:14px;border-radius:14px;text-decoration:none;font-weight:700}small{color:#665e78}li{margin:12px 0}ol{padding-left:24px}</style>
<main><h1>本地开发 HTTPS 证书</h1><p>Local Development CA</p><p>安装一次，可用于由此 CA 签发证书的多个本地开发项目与端口。</p>
<a href="/local-ca.cer">下载根证书</a>
<ol><li>用 Safari 下载并允许描述文件。</li><li>设置 → 通用 → VPN 与设备管理，安装下载的描述文件。</li><li>设置 → 通用 → 关于本机 → 证书信任设置，完全信任 Local Development CA。</li></ol>
<small>本页面仅提供公开根证书。证书名称已更新，之前安装过旧版的设备需安装并信任新版证书。</small></main></html>`)
createServer((request, response) => {
  const path = request.url?.split('?')[0]
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end()
    return
  }
  const home = path === '/'
  if (!home && path !== '/local-ca.cer') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(request.method === 'HEAD' ? undefined : '未找到。请打开首页下载证书。')
    return
  }
  const body = home ? page : certificate
  response.writeHead(200, {
    'Content-Type': home ? 'text/html; charset=utf-8' : 'application/x-x509-ca-cert',
    ...(home ? {} : { 'Content-Disposition': 'attachment; filename="Local-Development-CA.cer"' }),
    'Cache-Control': 'no-store',
    'Content-Length': body.length,
  })
  response.end(request.method === 'HEAD' ? undefined : body)
}).listen(8888, '0.0.0.0', () => console.log('Certificate download page: http://<LAN-IP>:8888/'))
