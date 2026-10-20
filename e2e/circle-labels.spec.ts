import { expect, test } from '@playwright/test'

test.describe('ciclo das quintas e das quartas', () => {
  test('mantém F#/Gb, B e Db legíveis em viewport móvel e desktop', async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport)

      for (const route of ['#/ciclo-das-quintas', '#/ciclo-das-quartas']) {
        await page.goto(`/${route}`)

        const enharmonic = page.getByRole('button', { name: 'F#/Gb, 6 sustenidos ou 6 bemóis' })
        const neighbors = [
          page.getByRole('button', { name: /^B maior/ }),
          page.getByRole('button', { name: /^Db maior/ }),
        ]
        const boxes = await Promise.all([enharmonic, ...neighbors].map((button) => button.boundingBox()))

        expect(boxes.every((box) => box !== null)).toBe(true)
        for (let index = 1; index < boxes.length; index += 1) {
          const first = boxes[0]!
          const next = boxes[index]!
          const overlapsHorizontally =
            Math.min(first.x + first.width, next.x + next.width) > Math.max(first.x, next.x)
          const overlapsVertically =
            Math.min(first.y + first.height, next.y + next.height) > Math.max(first.y, next.y)

          expect(overlapsHorizontally && overlapsVertically).toBe(false)
        }
      }
    }
  })

  test('mantém seleção por teclado e alternância para Gb maior', async ({ page }) => {
    await page.goto('/#/ciclo-das-quintas')
    const cMajor = page.getByRole('button', { name: /^C maior/ })
    await cMajor.focus()
    await page.keyboard.press('ArrowRight')

    const gMajor = page.getByRole('button', { name: /^G maior/ })
    await expect(gMajor).toBeFocused()
    await expect(gMajor).toHaveAttribute('aria-pressed', 'true')

    const enharmonic = page.getByRole('button', { name: 'F#/Gb, 6 sustenidos ou 6 bemóis' })
    await enharmonic.click()
    await expect(enharmonic).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Mostrar como Gb maior' }).click()
    await expect(page.getByRole('heading', { name: 'Gb maior' })).toBeVisible()
  })
})
