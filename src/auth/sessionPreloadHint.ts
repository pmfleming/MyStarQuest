const KEY = 'msq:preload-saved-session'

// This hint contains no account data and never authorizes rendering or queries.
// A stale hint only causes an unnecessary code download; Auth remains the gate.
export function hasSessionPreloadHint() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function rememberSessionForPreload(signedIn: boolean) {
  try {
    if (signedIn) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    // Storage can be unavailable. Preloading is only an optimization.
  }
}
