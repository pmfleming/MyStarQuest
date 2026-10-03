export function invitationPath(link: string) {
  try {
    const url = new URL(link)
    const configured = import.meta.env.VITE_INVITATION_APP_URL as
      string | undefined
    const allowed = new Set([
      window.location.origin,
      'https://mystarquest-1b6f8.web.app',
      'https://mystarquest-1b6f8.firebaseapp.com',
      ...(configured ? [new URL(configured).origin] : []),
    ])
    if (
      url.protocol !== 'https:' ||
      !allowed.has(url.origin) ||
      !/^\/invite\/[a-f0-9]{64}$/.test(url.pathname) ||
      !/^#[A-Za-z0-9_-]{30,150}$/.test(url.hash)
    )
      return null
    return url.pathname + url.hash
  } catch {
    return null
  }
}
