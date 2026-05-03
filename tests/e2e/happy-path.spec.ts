import { test, expect } from '@playwright/test'

const FAKE_REPLY = 'I was at my studio in Hackney. All evening. Working on a piece.'

test.describe('happy path: briefing → interrogate → accuse → win', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
		await page.evaluate(() => localStorage.clear())
		await page.reload()
	})

	// Skipped during Weekend 3 transition. Step 5 will re-enable this test against Henry.
	test.skip('player can solve the case end-to-end', async ({ page }) => {
		await page.route('**/api/interrogate', async (route) => {
			await route.fulfill({
				status: 200,
				headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				body: FAKE_REPLY
			})
		})

		await expect(
			page.getByRole('heading', { name: /the gallery closing/i })
		).toBeVisible()
		const beginButton = page.getByRole('button', { name: /begin investigation/i })
		await expect(beginButton).toBeVisible()

		await beginButton.click()

		const accuseButton = page.getByRole('button', { name: /^accuse$/i })
		await expect(accuseButton).toBeVisible()

		const input = page.getByRole('textbox', { name: /question for the suspect/i })
		await input.fill('Where were you Tuesday evening?')
		await input.press('Enter')

		await expect(page.getByText(/working on a piece/i)).toBeVisible({ timeout: 5000 })

		await accuseButton.click()
		const dialog = page.getByRole('dialog')
		await expect(dialog).toBeVisible()

		await dialog.getByRole('radio', { name: /marcus/i }).click()

		const evidence = dialog.getByPlaceholder(/what evidence convinces you/i)
		await evidence.fill('the witness saw his car at the gallery at 21:30')

		await dialog.getByRole('button', { name: /submit accusation/i }).click()

		await expect(
			page.getByRole('heading', { name: /case closed/i })
		).toBeVisible()
		await expect(page.getByText(/you found the murderer/i)).toBeVisible()
		await expect(page.getByText(/questions asked:\s*1/i)).toBeVisible()

		await page.getByRole('button', { name: /new investigation/i }).click()
		await expect(
			page.getByRole('button', { name: /begin investigation/i })
		).toBeVisible()
	})
})
