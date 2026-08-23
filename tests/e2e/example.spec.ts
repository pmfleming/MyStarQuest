import { test, expect } from '@playwright/test'

test('redirects unauthenticated visitors to sign in', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Sign in to MyStarQuest' })
  ).toBeVisible()
})

test('shows the Google sign-in action', async ({ page }) => {
  await page.goto('/login')

  await expect(
    page.getByRole('button', { name: 'Google Account' })
  ).toBeEnabled()
})
