export const celebrateSuccess = () => {
  void import('canvas-confetti')
    .then(({ default: confetti }) => {
      return confetti({
        particleCount: 120,
        spread: 65,
        origin: { y: 0.7 },
        scalar: 0.9,
      })
    })
    .catch(() => undefined)

  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.([80, 40, 80])
  }
}
