import type { CSSProperties, ReactNode } from 'react'

const popInAnimation = (name: string, delay: number) =>
  `${name} 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${delay}s both`

type MathCounterProps = {
  src: string
  size: number
  delay: number
  animationName: string
  alt?: string
  style?: CSSProperties
}

export function MathCounter({
  src,
  size,
  delay,
  animationName,
  alt = '',
  style,
}: MathCounterProps) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        animation: popInAnimation(animationName, delay),
        ...style,
      }}
    />
  )
}

type EmptyCounterHintProps = {
  color: string
  fontFamily: string
}

export function EmptyCounterHint({ color, fontFamily }: EmptyCounterHintProps) {
  return (
    <span
      style={{
        color,
        opacity: 0.3,
        fontStyle: 'italic',
        fontFamily,
        fontSize: 14,
      }}
    >
      ?
    </span>
  )
}

type TenRodProps = {
  src: string
  counterSize: number
  delay: number
  animationName: string
  borderColor: string
  gap?: number
  children?: ReactNode
}

export function TenRod({
  src,
  counterSize,
  delay,
  animationName,
  borderColor,
  gap = 1,
  children,
}: TenRodProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        background: `${borderColor}22`,
        padding: 2,
        gap,
        animation: popInAnimation(animationName, delay),
      }}
      aria-hidden="true"
    >
      {Array.from({ length: 10 }).map((_, index) => (
        <img
          key={index}
          src={src}
          alt=""
          style={{
            width: counterSize,
            height: counterSize,
            objectFit: 'contain',
          }}
        />
      ))}
      {children}
    </div>
  )
}
