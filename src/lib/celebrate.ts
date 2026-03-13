import confetti from 'canvas-confetti'

export const celebrateSuccess = () => {
  confetti({
    particleCount: 120,
    spread: 65,
    origin: { y: 0.7 },
    scalar: 0.9,
  })

  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.([80, 40, 80])
  }
}
