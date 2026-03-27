import {
  useMemo,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import hourHandSvg from '../../assets/clock/hourhand.svg'
import minuteHandSvg from '../../assets/clock/minutehand.svg'
import pivotSvg from '../../assets/clock/pivot.svg'
import secondHandSvg from '../../assets/clock/secondhand.svg'
import {
  clockGeometry,
  explorerUi,
} from '../../data/dayNightExplorer/dayNightExplorer.constants'
import {
  lerpPoint,
  roundedRectPerimeterPoint,
} from '../../data/dayNightExplorer/dayNightExplorerMath'

type ClockHandId = 'hour' | 'minute' | 'second'

type AnalogClockFaceProps = {
  theme: Theme
  isDragging: boolean
  handTransition: string
  hourAngle: number
  minuteAngle: number
  secondAngle: number
  svgRef: RefObject<SVGSVGElement | null>
  hourHandRef: RefObject<SVGGElement | null>
  minuteHandRef: RefObject<SVGGElement | null>
  secondHandRef: RefObject<SVGGElement | null>
  onPointerDown: (
    event: ReactPointerEvent<SVGGElement>,
    hand: ClockHandId
  ) => void
}

const AnalogClockFace = ({
  theme,
  isDragging,
  handTransition,
  hourAngle,
  minuteAngle,
  secondAngle,
  svgRef,
  hourHandRef,
  minuteHandRef,
  secondHandRef,
  onPointerDown,
}: AnalogClockFaceProps) => {
  const hourNumbers = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const hour = index + 1
        const position = lerpPoint(
          roundedRectPerimeterPoint(
            hour / 12,
            explorerUi.clockFaceWidth - clockGeometry.numberInset,
            clockGeometry.faceHeight - clockGeometry.numberInset,
            explorerUi.clockFaceRadius - clockGeometry.numberRadiusInset
          ),
          { x: clockGeometry.cx, y: clockGeometry.cy },
          explorerUi.clockNumberLerp
        )

        return (
          <text
            key={hour}
            x={position.x}
            y={position.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={clockGeometry.numberFontSize}
            fontWeight="bold"
            fill={theme.colors.text}
            fontFamily={theme.fonts.heading}
            style={{
              pointerEvents: 'none',
              textShadow: '0 1px 2px rgba(255,255,255,0.65)',
            }}
          >
            {hour}
          </text>
        )
      }),
    [theme.colors.text, theme.fonts.heading]
  )

  const tickMarks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, index) => {
        const isHourTick = index % 5 === 0
        const outer = roundedRectPerimeterPoint(
          index / 60,
          explorerUi.clockFaceWidth - clockGeometry.edgeInset,
          clockGeometry.faceHeight - clockGeometry.edgeInset,
          explorerUi.clockFaceRadius - clockGeometry.faceRadiusInset
        )
        const inner = lerpPoint(
          outer,
          { x: clockGeometry.cx, y: clockGeometry.cy },
          isHourTick
            ? explorerUi.clockHourTickLerp
            : explorerUi.clockMinuteTickLerp
        )

        return (
          <line
            key={index}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={isHourTick ? '#333' : '#ccc'}
            strokeWidth={
              isHourTick
                ? clockGeometry.hourTickStroke
                : clockGeometry.minuteTickStroke
            }
            strokeLinecap="round"
          />
        )
      }),
    []
  )

  const handConfigs = [
    {
      id: 'hour' as const,
      ref: hourHandRef,
      angle: hourAngle,
      image: hourHandSvg,
      width: clockGeometry.hourHandWidth,
      height: clockGeometry.hourHandHeight,
      baseRotation: clockGeometry.hourHandBaseRotation,
      hitWidth: clockGeometry.handHitHour,
      hitStartY: clockGeometry.cy,
      hitEndY: clockGeometry.cy - clockGeometry.hourHandHeight,
    },
    {
      id: 'minute' as const,
      ref: minuteHandRef,
      angle: minuteAngle,
      image: minuteHandSvg,
      width: clockGeometry.minuteHandWidth,
      height: clockGeometry.minuteHandHeight,
      baseRotation: clockGeometry.minuteHandBaseRotation,
      hitWidth: clockGeometry.handHitMinute,
      hitStartY: clockGeometry.cy,
      hitEndY: clockGeometry.cy - clockGeometry.minuteHandHeight,
    },
    {
      id: 'second' as const,
      ref: secondHandRef,
      angle: secondAngle,
      image: secondHandSvg,
      width: clockGeometry.secondHandWidth,
      height: clockGeometry.secondHandHeight,
      baseRotation: clockGeometry.secondHandBaseRotation,
      hitWidth: clockGeometry.handHitSecond,
      hitStartY: clockGeometry.cy + clockGeometry.secondHandBaseOffset,
      hitEndY: clockGeometry.cy - clockGeometry.secondHandHeight,
    },
  ]

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: explorerUi.globeCanvasSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 6,
          pointerEvents: 'none',
        }}
      >
        <svg
          width={clockGeometry.size}
          height={clockGeometry.size}
          viewBox={`0 0 ${clockGeometry.size} ${clockGeometry.size}`}
          style={{
            overflow: 'visible',
          }}
        >
          {tickMarks}
          {hourNumbers}
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: explorerUi.globeCanvasSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 7,
        }}
      >
        <svg
          ref={svgRef}
          width={clockGeometry.size}
          height={clockGeometry.size}
          viewBox={`0 0 ${clockGeometry.size} ${clockGeometry.size}`}
          style={{
            touchAction: 'none',
            overflow: 'visible',
          }}
        >
          {handConfigs.map((hand) => (
            <g
              key={hand.id}
              ref={hand.ref}
              className="clock-hand"
              onPointerDown={(event) => onPointerDown(event, hand.id)}
              style={{
                transformOrigin: `${clockGeometry.cx}px ${clockGeometry.cy}px`,
                transform: `rotate(${hand.angle}deg)`,
                transition: handTransition,
                filter: isDragging ? 'none' : clockGeometry.handShadow,
              }}
            >
              <image
                href={hand.image}
                x={clockGeometry.cx}
                y={clockGeometry.cy - hand.height}
                width={hand.width}
                height={hand.height}
                preserveAspectRatio="xMidYMid meet"
                transform={`rotate(${hand.baseRotation} ${clockGeometry.cx} ${clockGeometry.cy})`}
              />
              <line
                x1={clockGeometry.cx}
                y1={hand.hitStartY}
                x2={clockGeometry.cx}
                y2={hand.hitEndY}
                stroke="transparent"
                strokeWidth={hand.hitWidth}
                strokeLinecap="round"
              />
            </g>
          ))}

          <image
            href={pivotSvg}
            x={clockGeometry.cx - clockGeometry.pivotSize / 2}
            y={clockGeometry.cy - clockGeometry.pivotSize / 2}
            width={clockGeometry.pivotSize}
            height={clockGeometry.pivotSize}
            preserveAspectRatio="xMidYMid meet"
            style={{
              pointerEvents: 'none',
              filter: isDragging ? 'none' : clockGeometry.handShadow,
            }}
          />
        </svg>
      </div>
    </>
  )
}

export default AnalogClockFace
