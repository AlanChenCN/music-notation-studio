import { expect, test } from '@playwright/test'

test('出题策略、快捷音域及旧配置迁移', async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 })
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('mns.practice.v1', JSON.stringify({ clef: 'treble', low: 60, high: 72, pool: 'white', length: 16, bpm: 80, labels: false })))
  await page.reload()
  await page.getByRole('button', { name: /^专项训练/ }).click()
  await page.getByRole('button', { name: /自由速度/ }).click()
  await page.getByRole('button', { name: '练习配置', exact: true }).click()
  await expect(page.getByRole('combobox', { name: '出题策略', exact: true })).toHaveValue('random')
  await page.getByRole('combobox', { name: '出题策略', exact: true }).selectOption('leaps')
  await page.getByRole('combobox', { name: '快捷音域', exact: true }).selectOption('bass')
  await expect(page.getByRole('combobox', { name: '谱表', exact: true })).toHaveValue('bass')
  await expect(page.getByRole('combobox', { name: '最低音', exact: true })).toHaveValue('48')
  await page.getByRole('combobox', { name: '最高音', exact: true }).selectOption('50')
  await expect(page.getByRole('combobox', { name: '快捷音域', exact: true })).toHaveValue('custom')
  await page.getByRole('button', { name: '应用并生成新题' }).click()
  await expect(page.getByRole('alert')).toContainText('无法进行跳进')
  await page.getByRole('combobox', { name: '快捷音域', exact: true }).selectOption('central')
  await page.getByRole('button', { name: '应用并生成新题' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: /^专项训练/ }).click()
  await page.getByRole('button', { name: /自由速度/ }).click()
  await page.getByRole('button', { name: '练习配置', exact: true }).click()
  await expect(page.getByRole('combobox', { name: '出题策略', exact: true })).toHaveValue('leaps')
  await expect(page.getByRole('combobox', { name: '快捷音域', exact: true })).toHaveValue('central')
  await page.screenshot({ path: 'test-results/strategy-phone.png' })
})

for (const viewport of [{ width: 1024, height: 768 }, { width: 1180, height: 820 }, { width: 844, height: 390 }, { width: 667, height: 375 }, { width: 568, height: 320 }]) {
  test(`横屏布局与弹窗 ${viewport.width}×${viewport.height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.locator('.home-modules .module-card')).toHaveCount(4)
    await page.screenshot({ path: `test-results/home-${viewport.width}.png` })
    for (const card of await page.locator('.mode-card').all()) {
      const box = (await card.boundingBox())!
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
    }
    await page.getByRole('button', { name: /^专项训练/ }).click()
    await page.getByRole('button', { name: /自由速度/ }).click()
    await page.getByRole('button', { name: '练习配置', exact: true }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    const before = await modal.boundingBox()
    await page.screenshot({ path: `test-results/config-${viewport.width}.png` })
    await page.getByRole('combobox', { name: '最低音', exact: true }).selectOption('60')
    await page.getByRole('combobox', { name: '最高音', exact: true }).selectOption('60')
    await page.getByRole('button', { name: '应用并生成新题' }).click()
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.keyboard.down('a')
    await expect(page.locator('.score-feedback')).toContainText('松键后继续')
    await expect(page.locator('.practice-progress')).toContainText('第 1 / 16 音')
    await page.keyboard.up('a')
    await expect(page.locator('.practice-progress')).toContainText('第 2 / 16 音')
    await page.getByRole('button', { name: '触控试弹' }).click()
    await page.getByRole('button', { name: 'C4', exact: true }).click()
    await expect(page.locator('.practice-progress')).toContainText('第 3 / 16 音')
    await page.getByRole('button', { name: '通用设置' }).click()
    const after = await modal.boundingBox()
    expect(after!.height).toBe(before!.height)
    expect(after!.width).toBe(before!.width)
    await page.getByRole('combobox', { name: '外观', exact: true }).selectOption('dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const scroll = await page.evaluate(() => ({ document: document.documentElement.scrollHeight, viewport: innerHeight, body: document.body.scrollHeight, cardScroll: document.querySelector('.modal-body')!.scrollHeight, cardHeight: document.querySelector('.modal-body')!.clientHeight }))
    expect(scroll.document).toBe(scroll.viewport)
    expect(scroll.body).toBe(scroll.viewport)
    const modalBox = (await modal.boundingBox())!
    expect(modalBox.y).toBeGreaterThanOrEqual(0)
    expect(modalBox.y + modalBox.height).toBeLessThanOrEqual(viewport.height)
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
    const footer = (await page.locator('.transport').boundingBox())!
    const staff = (await page.locator('.staff').boundingBox())!
    expect(footer.y + footer.height).toBeLessThanOrEqual(viewport.height)
    expect(staff.height).toBeGreaterThan(40)
    await expect.poll(() => page.locator('.app-shell').evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
    await page.screenshot({ path: `test-results/practice-${viewport.width}.png` })
    expect(errors).toEqual([])
  })
}

test('识谱完成、配置恢复和竖屏暂停', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')
  await page.getByRole('button', { name: /^专项训练/ }).click()
  await page.getByRole('button', { name: /自由速度/ }).click()
  await page.getByRole('button', { name: '练习配置', exact: true }).click()
  await page.getByRole('combobox', { name: '最低音', exact: true }).selectOption('60')
  await page.getByRole('combobox', { name: '最高音', exact: true }).selectOption('60')
  await page.getByRole('combobox', { name: '练习长度', exact: true }).selectOption('8')
  await page.getByRole('button', { name: '应用并生成新题' }).click()
  await page.getByRole('button', { name: '开始练习', exact: true }).click()
  for (let i = 0; i < 8; i++) await page.keyboard.press('a')
  await expect(page.locator('.score-feedback')).toContainText('命中 8/8')
  await page.reload()
  await page.getByRole('button', { name: /^专项训练/ }).click()
  await page.getByRole('button', { name: /自由速度/ }).click()
  await expect(page.locator('.score-meta')).toContainText('C4–C4')
  await page.getByRole('button', { name: '开始练习', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: '请横屏使用' })).toBeVisible()
  await page.setViewportSize({ width: 844, height: 390 })
  await expect(page.getByRole('button', { name: '继续练习' })).toBeVisible()
})

test('跟弹预备与自动结算', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')
  await page.getByRole('button', { name: /^专项训练/ }).click()
  await page.getByRole('button', { name: /固定速度/ }).click()
  await page.getByRole('button', { name: '练习配置', exact: true }).click()
  await page.getByRole('combobox', { name: '最低音', exact: true }).selectOption('60')
  await page.getByRole('combobox', { name: '最高音', exact: true }).selectOption('60')
  await page.getByRole('spinbutton', { name: '速度 BPM', exact: true }).fill('180')
  await page.getByRole('combobox', { name: '练习长度', exact: true }).selectOption('8')
  await page.getByRole('button', { name: '应用并生成新题' }).click()
  await page.getByRole('button', { name: '开始练习', exact: true }).click()
  await expect(page.locator('.score-feedback')).toContainText('空白小节')
  await expect(page.locator('.play-axis')).toBeAttached()
  const axis = page.locator('.play-axis')
  const anchor = Number(await axis.getAttribute('x1'))
  expect(anchor).toBeGreaterThan(100)
  const secondBar = page.locator('.measure-boundary').nth(1).locator('.barline')
  const before = Number(await secondBar.getAttribute('x1'))
  await expect.poll(async () => Number(await secondBar.getAttribute('x1'))).toBeLessThan(before - 20)
  expect(Number(await axis.getAttribute('x1'))).toBe(anchor)
  await expect(page.locator('.practice-progress')).toContainText('本轮完成', { timeout: 8000 })
  await expect(page.locator('.score-feedback')).toContainText('漏音 8')
})

test('识谱推进平滑移动，减少动态效果时直接定位', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    if (!localStorage.getItem('mns.practice.v1')) localStorage.setItem('mns.practice.v1', JSON.stringify({ clef: 'treble', low: 60, high: 60, pool: 'white', length: 16, bpm: 80, labels: false }))
  })
  await page.goto('/')
  await page.getByRole('button', { name: /^专项训练/ }).click()
  await page.getByRole('button', { name: /自由速度/ }).click()
  await page.getByRole('button', { name: '开始练习', exact: true }).click()
  const track = page.locator('.reading-note-track')
  const before = await track.locator('.score-note').nth(1).boundingBox()
  await page.keyboard.press('a')
  const moving = await track.evaluate(async element => {
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    return { running: element.getAnimations().some(animation => animation.playState === 'running'), x: new DOMMatrix(getComputedStyle(element).transform).m41 }
  })
  expect(moving.running).toBe(true)
  expect(moving.x).toBeLessThan(0)
  await expect.poll(() => track.evaluate(element => element.getAnimations().length)).toBe(0)
  const after = await track.locator('.score-note').nth(1).boundingBox()
  expect(after!.x).toBeLessThan(before!.x - 60)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.keyboard.press('a')
  await expect(track).toHaveCSS('transition-duration', '0s')
  expect(await track.evaluate(element => element.getAnimations().length)).toBe(0)
  await expect(page.locator('.practice-progress')).toContainText('第 3 / 16 音')
  await expect(page.locator('.measure-boundary')).toHaveCount(5)
  await expect(page.locator('.final-barline')).toHaveCount(1)
  await expect(page.locator('.note-label')).toHaveCount(0)
  await page.getByRole('checkbox', { name: '音名', exact: true }).check()
  await expect(page.locator('.note-label')).toHaveCount(16)
  await expect(page.locator('.note-label').first()).toHaveText('C4')
  await expect(page.locator('.practice-progress')).toContainText('第 3 / 16 音')
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: /^专项训练/ }).click()
  await page.getByRole('button', { name: /自由速度/ }).click()
  await expect(page.getByRole('checkbox', { name: '音名', exact: true })).toBeChecked()
  await page.getByRole('checkbox', { name: '音名', exact: true }).uncheck()
  await expect(page.locator('.note-label')).toHaveCount(0)
})

test('横屏四模块都能打开对应的练习内容', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 })
  await page.goto('/')
  const entries = [
    { module: '进阶课程', item: '第 3 课 · 长短音与休止', action: '开始 / 继续' },
    { module: '专项训练', item: '双手配合', action: '开始 / 继续' },
    { module: '钢琴曲库', item: '两只老虎', action: '练习跟弹' },
  ]
  for (const entry of entries) {
    await page.locator('.home-modules').getByRole('button', { name: new RegExp('^' + entry.module) }).click()
    const catalog = page.getByRole('dialog')
    await expect(catalog.getByText(/应用配置会生成新短谱|快捷音域|出题策略/)).toHaveCount(0)
    await catalog.getByRole('button', { name: entry.item, exact: true }).click()
    await expect(page.getByRole('button', { name: entry.action, exact: true })).toBeEnabled()
    await page.getByRole('main').getByRole('button', { name: '返回主页' }).click()
  }
})

test('蓝牙试奏发送中央 C 的按下和松开消息', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.addInitScript(() => {
    const packets: number[][] = []
    Object.defineProperty(window, 'testMidiPackets', { value: packets })
    const characteristic = Object.assign(new EventTarget(), {
      properties: { writeWithoutResponse: true, write: false },
      startNotifications: async () => undefined,
      writeValueWithoutResponse: async (packet: Uint8Array) => { packets.push([...packet]) },
    })
    const device = Object.assign(new EventTarget(), {
      name: '测试电钢琴',
      gatt: { connect: async () => ({ getPrimaryService: async () => ({ getCharacteristic: async () => characteristic }) }) },
    })
    Object.defineProperty(navigator, 'bluetooth', { value: { requestDevice: async () => device } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'MIDI', exact: false }).first().click()
  await page.getByRole('button', { name: /^连接蓝牙 MIDI/ }).click()
  await page.getByRole('button', { name: '试奏中央 C' }).click()
  await expect(page.getByText('中央 C 指令已发送，请确认电钢琴是否发声。')).toBeVisible()
  const packets = await page.evaluate(() => Reflect.get(window, 'testMidiPackets') as number[][])
  expect(packets.map(packet => packet.slice(2))).toEqual([[0x90, 60, 48], [0x80, 60, 0]])
  expect(packets.every(packet => packet.length === 5 && packet[0] >= 128 && packet[0] < 192 && packet[1] >= 128)).toBe(true)
})

test('个人乐谱导入后可编辑，刷新后仍能打开练习', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')
  await page.getByRole('button', { name: '我的乐谱' }).click()
  const score = {
    version: 1, title: '导入测试短谱', meter: { numerator: 4, denominator: 4 },
    tempo: { quarterBpm: 60 }, keySignature: 0, measures: 1,
    voices: [{ id: 'upper', clef: 'treble', events: [
      { id: 'whole', start: 0, kind: 'notes', duration: { denominator: 1 }, notes: [{ id: 'c', pitch: { step: 'C', alter: 0, octave: 4 } }] },
    ] }],
  }
  const file = page.getByLabel('导入乐谱 JSON')
  await file.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') })
  await expect(page.getByRole('alert')).toBeVisible()
  await file.setInputFiles({ name: 'score.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(score)) })
  await expect(page.getByText(score.title, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '编辑 ' + score.title }).click()
  await page.getByRole('textbox', { name: '乐谱 JSON' }).fill(JSON.stringify({ ...score, title: '已编辑短谱' }))
  await page.getByRole('button', { name: '保存乐谱' }).click()
  await page.reload()
  await page.getByRole('button', { name: '我的乐谱' }).click()
  await page.getByRole('button', { name: /^已编辑短谱/ }).click()
  await page.getByRole('button', { name: '练习识谱' }).click()
  await page.getByRole('button', { name: '开始 / 继续' }).click()
  await page.keyboard.press('a')
  await expect(page.locator('.score-feedback')).toHaveText('本轮完成')
})
