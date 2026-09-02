import { test, expect } from '@playwright/test'

test('redirects unauthenticated visitors to an actionable sign-in page', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Sign in to MyStarQuest' })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Google Account' })
  ).toBeEnabled()
})
