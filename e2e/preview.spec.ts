import { expect, test } from '@playwright/test'

test('圆润符号保留独立符尾、部分连梁与精确连接', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 })
  await page.goto('/')
  await page.getByRole('button', { name: '谱例预览' }).click()
  await expect(page.locator('.preview-paper svg')).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/music/engraving.ts'
    const { drawScore } = await import(/* @vite-ignore */ path)
    const note = (id: string, start: number, denominator: number, octave: number) => ({ id, start, kind: 'notes', duration: { denominator }, notes: [{ id: `${id}-n`, pitch: { step: 'C', alter: 0, octave } }] })
    const rest = (id: string, start: number, denominator: number) => ({ id, start, kind: 'rest', duration: { denominator } })
    drawScore(document.querySelector('.preview-paper'), {
      version: 1, title: '符尾与部分连梁回归', meter: { numerator: 4, denominator: 4 }, tempo: { quarterBpm: 80 }, keySignature: 0, measures: 1,
      voices: [{ id: 'test', clef: 'treble', events: [note('up', 0, 8, 4), rest('r1', 4, 8), note('down', 8, 16, 6), rest('r2', 10, 16), note('b1', 12, 16, 4), note('b2', 14, 16, 4), note('b3', 16, 8, 4), note('b4', 20, 16, 4), note('b5', 22, 16, 4), rest('r3', 24, 4)] }],
    }, false, 480, 1000)
  })
  await expect(page.locator('[data-event-id="up"] .rounded-flag path')).toHaveCount(1)
  await expect(page.locator('[data-event-id="down"] .rounded-flag path')).toHaveCount(2)
  await expect(page.locator('.rounded-rest')).toHaveCount(3)
  await expect(page.locator('.vf-flag,.vf-beam,.vf-stem')).toHaveCount(0)
  expect(await page.locator('.rounded-beam path').count()).toBeGreaterThan(2)
  const geometry = await page.locator('[data-event-id="up"]').evaluate(element => {
    const head = element.querySelector('ellipse')!, stem = element.querySelector('.rounded-stem')!
    const number = (el: Element, key: string) => Number(el.getAttribute(key))
    const dx = number(stem, 'x1') - number(head, 'cx'), dy = number(stem, 'y1') - number(head, 'cy')
    const angle = -12 * Math.PI / 180, a = number(head, 'rx'), b = number(head, 'ry')
    const localX = dx * Math.cos(angle) + dy * Math.sin(angle), localY = -dx * Math.sin(angle) + dy * Math.cos(angle)
    const flag = element.querySelector('.rounded-flag path:last-child') as SVGGraphicsElement
    return { ellipse: localX ** 2 / a ** 2 + localY ** 2 / b ** 2, radius: a, lines: [...element.querySelectorAll('.rounded-flag path,.rounded-stem')].map(mark => ({ width: getComputedStyle(mark).strokeWidth, cap: getComputedStyle(mark).strokeLinecap })), commands: flag.getAttribute('d') }
  })
  expect(geometry.ellipse).toBeCloseTo(1, 6)
  expect(geometry.radius).toBe(8)
  expect(geometry.commands).toBe('M0 0 L16 9')
  expect(geometry.lines.every(line => line.width === '3px' && line.cap === 'round')).toBe(true)
  const beams = await page.locator('.rounded-beam path').evaluateAll(elements => elements.map(element => ({ width: getComputedStyle(element).strokeWidth, cap: getComputedStyle(element).strokeLinecap })))
  expect(beams.every(line => line.width === '3px' && line.cap === 'round')).toBe(true)
  const feedback = await page.locator('[data-event-id="b1"]').evaluate(element => {
    const beam = element.querySelector('.rounded-beam')!, path = beam.querySelector('path')!
    const stemX = Number(element.querySelector('.rounded-stem')!.getAttribute('x1'))
    const left = Number((beam as SVGElement).dataset.left)
    ;(element as SVGElement).style.color = 'rgb(12, 180, 90)'
    const green = getComputedStyle(path).stroke
    ;(element as SVGElement).style.color = 'rgb(210, 40, 50)'
    const red = getComputedStyle(path).stroke
    ;(element as SVGElement).style.removeProperty('color')
    const head = element.querySelector('ellipse')!, ledger = element.querySelector('.rounded-ledger')!
    const cx = Number(head.getAttribute('cx')), rx = Number(head.getAttribute('rx'))
    return { green, red, edge: stemX - left, ledgerLeft: cx - rx - Number(ledger.getAttribute('x1')), ledgerRight: Number(ledger.getAttribute('x2')) - cx - rx }
  })
  expect(feedback.green).toBe('rgb(12, 180, 90)')
  expect(feedback.red).toBe('rgb(210, 40, 50)')
  expect(feedback.edge).toBe(1.5)
  expect(feedback.ledgerLeft).toBeGreaterThanOrEqual(5)
  expect(feedback.ledgerRight).toBeGreaterThanOrEqual(5)
  await page.screenshot({ path: 'test-results/notation-light.png' })
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  await page.screenshot({ path: 'test-results/notation-dark.png' })
})

for (const viewport of [{ width: 1024, height: 768 }, { width: 1180, height: 820 }, { width: 844, height: 390 }, { width: 667, height: 375 }, { width: 568, height: 320 }]) {
  test(`谱例预览 ${viewport.width}×${viewport.height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.getByRole('button', { name: '谱例预览' }).click()
    await expect(page.getByRole('heading', { name: '谱例预览' })).toBeVisible()
    const selector = page.getByRole('combobox', { name: '验证谱例' })
    for (let i = 0; i < await selector.locator('option').count(); i++) {
      await selector.selectOption(String(i))
      await expect(page.locator('.preview-paper svg')).toHaveAttribute('data-score-title', await selector.locator('option:checked').textContent() as string)
      await expect(page.getByRole('button', { name: '播放游标' })).toBeEnabled()
      await expect(page.getByRole('alert')).toHaveCount(0)
      if (i === 7) {
        const anchors = await page.locator('[data-event-id^="duration-"][data-event-id$="-0"]').evaluateAll(elements => elements.map(element => Number((element as SVGElement).dataset.anchorX)))
        const widths = JSON.parse((await page.locator('.preview-paper svg').getAttribute('data-measure-widths'))!) as number[]
        expect(widths).toHaveLength(7)
        expect(widths.every(width => width === widths[0])).toBe(true)
        anchors.slice(1).forEach((x, index) => expect(x - anchors[index]).toBeCloseTo(widths[0]))
        const clearances = await page.locator('[data-event-id^="duration-"][data-event-id$="-0"] .preview-note-head').evaluateAll(heads => heads.map((head, index) => {
          const svg = (head as SVGElement).ownerSVGElement!
          const origin = 12 + Number(svg.dataset.headerWidth) + index * JSON.parse(svg.dataset.measureWidths!)[0]
          const line = new DOMPoint(origin, 0).matrixTransform(svg.getScreenCTM()!).x
          return head.getBoundingClientRect().left - line
        }))
        expect(Math.min(...clearances)).toBeGreaterThan(3)
        await page.screenshot({ path: `test-results/duration-width-${viewport.width}.png` })
      }
      const box = await page.locator('.preview-paper svg').boundingBox()
      const area = await page.locator('.preview-viewport').boundingBox()
      expect(box!.height).toBeLessThanOrEqual(area!.height)
      await page.getByRole('checkbox', { name: '音名', exact: true }).check()
      if (i !== 5) await expect(page.locator('.preview-note-label').first()).toBeVisible()
      await page.getByRole('checkbox', { name: '音名', exact: true }).uncheck()
    }
    await selector.selectOption('6')
    await expect(page.locator('[data-event-id="mc4"] .preview-note-head')).toHaveCount(1)
    const centralC = await page.locator('[data-tick="0"] .preview-note-head').evaluateAll(elements => elements.map(element => Number((element as SVGElement).dataset.pitchY)))
    expect(centralC).toHaveLength(2)
    expect(centralC[0]).toBe(centralC[1])
    await page.screenshot({ path: `test-results/middle-c-${viewport.width}.png` })
    await selector.selectOption('1')
    await expect(page.locator('[data-event-id="c1"] .vf-notehead > text')).not.toHaveCount(0)
    await selector.selectOption('4')
    await expect(page.locator('.vf-notehead > text')).toHaveCount(3)
    await selector.selectOption('0')
    await expect(page.locator('[data-tick="0"]')).toHaveCount(2)
    const timeGaps = await page.locator('[data-voice="0"][data-event-id]').evaluateAll(elements => {
      const x = new Map(elements.map(element => [element.getAttribute('data-event-id'), Number((element as SVGElement).dataset.anchorX)]))
      return [x.get('a2')! - x.get('a1')!, x.get('a3')! - x.get('a2')!, x.get('a4')! - x.get('a3')!, x.get('a7')! - x.get('a6')!, x.get('a9')! - x.get('a8')!]
    })
    expect(timeGaps[0]).toBeCloseTo(timeGaps[2] / 2)
    expect(timeGaps[1]).toBeCloseTo(timeGaps[2] / 2)
    expect(timeGaps[3]).toBeCloseTo(timeGaps[4] * 8)
    const positions = await page.locator('[data-tick="0"]').evaluateAll(elements => elements.map(element => Number((element as SVGElement).dataset.anchorX)))
    expect(positions).toHaveLength(2)
    expect(Math.abs(positions[0] - positions[1])).toBeLessThan(2)
    const later = await page.locator('[data-tick="48"]').evaluateAll(elements => elements.map(element => Number((element as SVGElement).dataset.anchorX)))
    expect(later).toHaveLength(2)
    expect(Math.abs(later[0] - later[1])).toBeLessThan(2)
    await page.getByRole('combobox', { name: '显示声部' }).selectOption('1')
    await expect(page.locator('.preview-paper svg')).toHaveAttribute('aria-label', /1 个声部/)
    await page.getByRole('checkbox', { name: '音名', exact: true }).check()
    await expect(page.locator('.preview-note-label').first()).toContainText('C3')
    await page.screenshot({ path: `test-results/preview-single-${viewport.width}.png` })
    await page.getByRole('checkbox', { name: '音名', exact: true }).uncheck()
    await page.getByRole('combobox', { name: '显示声部' }).selectOption('-1')
    await expect(page.locator('[data-tick="0"]')).toHaveCount(2)
    await page.getByRole('button', { name: '播放游标' }).click()
    await expect.poll(() => page.getByRole('slider', { name: '谱面位置' }).inputValue().then(Number)).toBeGreaterThan(0)
    await page.getByRole('button', { name: '暂停游标' }).click()
    await page.getByRole('button', { name: '回到谱例开头' }).click()
    await expect(page.getByRole('slider', { name: '谱面位置' })).toHaveValue('0')
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height)
    await page.screenshot({ path: `test-results/preview-${viewport.width}.png` })
    await page.getByRole('button', { name: '返回主页', exact: true }).last().click()
    await expect(page.getByRole('heading', { name: /从一个音符/ })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('谱例识谱通过键盘松键推进，并可返回视觉预览', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')
  await page.getByRole('button', { name: '谱例预览' }).click()
  await page.locator('.preview-selector select').selectOption({ label: '时值与宽度对照' })
  await page.getByRole('button', { name: '练习识谱' }).click()
  await page.getByRole('button', { name: '开始 / 继续' }).click()
  await page.keyboard.down('g')
  await expect(page.locator('[data-held-pitch="67"]')).toBeVisible()
  await expect(page.getByText('音已弹对，请松键')).toBeVisible()
  await page.keyboard.up('g')
  await expect(page.locator('[data-held-pitch="67"]')).toHaveCount(0)
  await expect(page.getByText('1 命中 · 0 错弹')).toBeVisible()
  await expect(page.locator('.preview-passed')).toHaveCount(1)
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  await page.getByRole('button', { name: '触控试弹' }).click()
  await expect(page.getByRole('button', { name: 'G4', exact: true })).toBeInViewport()
  await page.getByRole('button', { name: '返回预览' }).click()
  await expect(page.getByRole('button', { name: '播放游标' })).toBeVisible()
})

test('谱例跟弹从四拍预备进入计分，并在谱尾结算', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 })
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: '谱例预览' }).click()
  await page.locator('.preview-selector select').selectOption({ label: '时值与宽度对照' })
  await page.getByRole('button', { name: '练习跟弹' }).click()
  await page.getByRole('button', { name: '开始 / 继续' }).click()
  await expect(page.getByText(/^四拍预备 ·/)).toBeVisible()
  await page.keyboard.press('g')
  await expect(page.getByText('0 命中 · 0 错弹 · 0 漏弹 · 0 提前松键')).toBeVisible()
  await page.clock.fastForward(3_500)
  const axis = page.locator('.preview-fixed-axis')
  const firstNote = page.locator('[data-event-id="duration-0-0"]')
  const before = (await firstNote.boundingBox())!.x
  const anchor = (await axis.boundingBox())!.x
  await page.clock.fastForward(250)
  expect((await axis.boundingBox())!.x).toBeCloseTo(anchor)
  expect((await firstNote.boundingBox())!.x).toBeLessThan(before)
  await page.clock.fastForward(30_000)
  await expect(page.getByText('本轮完成')).toBeVisible()
  await expect(page.locator('.preview-missed').first()).toBeAttached()
  await expect(page.getByRole('button', { name: '再练一次' })).toBeInViewport()
})
