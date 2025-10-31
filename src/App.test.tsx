import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./firebase', () => ({
  auth: {},
}))

vi.mock('firebase/auth', async () => {
  const actual =
    await vi.importActual<typeof import('firebase/auth')>('firebase/auth')

  return {
    ...actual,
    onAuthStateChanged: vi.fn((_auth, callback: (user: unknown) => void) => {
      callback(null)
      return vi.fn()
    }),
    GoogleAuthProvider: class {},
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  }
})

describe('App', () => {
  it('renders the login page when the user is unauthenticated', async () => {
    render(<App />)

    expect(
      await screen.findByRole('button', { name: /sign in with google/i })
    ).toBeInTheDocument()
  })
})
