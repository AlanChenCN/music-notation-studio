import { chromium } from '@playwright/test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Piano } from 'lucide-react'

// Opaque square artwork: the device applies its own home-screen corner mask.
const piano = renderToStaticMarkup(createElement(Piano, { x: 10, y: 8, width: 44, height: 44, color: 'white', strokeWidth: 2 }))
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7652df"/>${piano}</svg>`
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  for (const [size, file] of [[180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${svg}`)
    await page.screenshot({ path: `public/${file}` })
  }
} finally { await browser.close() }
