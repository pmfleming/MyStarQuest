import type { CSSProperties } from 'react'

export const getStepperEdgePositionStyle = (
  direction: 'prev' | 'next'
): CSSProperties => ({
  position: 'absolute',
  [direction === 'prev' ? 'left' : 'right']: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 3,
})
