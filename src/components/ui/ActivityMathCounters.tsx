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
  crossedOut?: boolean
}

export function MathCounter({
  src,
  size,
  delay,
  animationName,
  alt = '',
  style,
  crossedOut = false,
}: MathCounterProps) {
  const counter = (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        animation: popInAnimation(animationName, delay),
        ...(crossedOut && { opacity: 0.4, position: 'relative' }),
        ...style,
      }}
    />
  )
  if (!crossedOut) return counter
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {counter}
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        ❌
      </span>
    </div>
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

type CounterGroupProps = {
  count: number
  color: string
  fontFamily: string
  style: CSSProperties
  children: (index: number) => ReactNode
}

export function CounterGroup({
  count,
  color,
  fontFamily,
  style,
  children,
}: CounterGroupProps) {
  return (
    <div style={style} aria-hidden="true">
      {count === 0 ? (
        <EmptyCounterHint color={color} fontFamily={fontFamily} />
      ) : (
        Array.from({ length: count }, (_, index) => children(index))
      )}
    </div>
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
