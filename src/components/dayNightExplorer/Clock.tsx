import {
  useMemo,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import hourHandSvg from '../../assets/clock/hourhand.svg'
import minuteHandSvg from '../../assets/clock/minutehand.svg'
import pivotSvg from '../../assets/clock/pivot.svg'
import secondHandSvg from '../../assets/clock/secondhand.svg'
import StepperButton from '../ui/StepperButton'
import {
  clockGeometry,
  explorerUi,
} from '../../lib/dayNightExplorer/dayNightExplorer.constants'
import {
  lerpPoint,
  roundedRectPerimeterPoint,
} from '../../lib/dayNightExplorer/dayNightExplorerMath'

type ClockHandId = 'hour' | 'minute' | 'second'

export type ClockViewModel = {
  activityImage: string | null
  explorerBackdropColor: string
  explorerBaseBackgroundImage: string | null
  explorerOverlayBackgroundImage: string | null
  overlayOpacity: number
  isDragging: boolean
  handTransition: string
  hourAngle: number
  minuteAngle: number
  secondAngle: number
  hoursLabel: string
  minutesLabel: string
  seconds: number
  ampm: string
  svgRef: RefObject<SVGSVGElement | null>
  hourHandRef: RefObject<SVGGElement | null>
  minuteHandRef: RefObject<SVGGElement | null>
  secondHandRef: RefObject<SVGGElement | null>
  onPointerDown: (
    event: ReactPointerEvent<SVGGElement>,
    hand: ClockHandId
  ) => void
  onAdjust: (delta: number) => void
}

type ClockProps = {
  theme: Theme
  clock: ClockViewModel
}

const Clock = ({ theme, clock }: ClockProps) => {
  const controlHeight = explorerUi.globeCanvasSize
  const digitalClockGap = 0
  const digitalClockTop =
    controlHeight + digitalClockGap - explorerUi.digitalClockBottomInset
  const digitalClockCenterY =
    digitalClockTop + explorerUi.digitalClockAreaHeight / 2
  const controlPanelHeight = explorerUi.clockPanelHeight

  const imageLayers = [
    {
      key: 'base',
      image: clock.explorerBaseBackgroundImage,
      opacity: 0.5,
      zIndex: 3,
    },
    {
      key: 'overlay',
      image: clock.explorerOverlayBackgroundImage,
      opacity: clock.overlayOpacity * 0.5,
      zIndex: 4,
    },
  ]

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

  const outerMinuteLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const labelValue = (index + 1) * 5
        const label = labelValue === 60 ? '60' : String(labelValue)
        const position = lerpPoint(
          roundedRectPerimeterPoint(
            (index + 1) / 12,
            explorerUi.clockFaceWidth - clockGeometry.edgeInset,
            clockGeometry.faceHeight - clockGeometry.edgeInset,
            explorerUi.clockFaceRadius - clockGeometry.faceRadiusInset
          ),
          { x: clockGeometry.cx, y: clockGeometry.cy },
          0.04
        )

        return (
          <text
            key={label}
            x={position.x}
            y={position.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={clockGeometry.numberFontSize * 0.56}
            fontWeight="bold"
            fill={theme.colors.text}
            fontFamily={theme.fonts.heading}
            style={{
              pointerEvents: 'none',
              opacity: 0.88,
              textShadow: '0 1px 2px rgba(255,255,255,0.65)',
            }}
          >
            {label}
          </text>
        )
      }),
    [theme.colors.text, theme.fonts.heading]
  )

  const handConfigs = [
    {
      id: 'hour' as const,
      ref: clock.hourHandRef,
      angle: clock.hourAngle,
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
      ref: clock.minuteHandRef,
      angle: clock.minuteAngle,
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
      ref: clock.secondHandRef,
      angle: clock.secondAngle,
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
    <div
      data-no-drag-scroll="true"
      style={{
        width: '100%',
        maxWidth: uiTokens.contentMaxWidth,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: explorerUi.explorerGap,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          width: '100%',
          height: controlPanelHeight,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: explorerUi.clockFaceRadius,
            background: theme.colors.surface,
            border: `${uiTokens.listItemBorderWidth}px solid ${theme.colors.accent}`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: controlHeight,
            borderTopLeftRadius: explorerUi.clockFaceRadius,
            borderTopRightRadius: explorerUi.clockFaceRadius,
            background: clock.explorerBackdropColor,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {imageLayers.map((layer) =>
          layer.image ? (
            <div
              key={layer.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: controlHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: layer.zIndex,
                pointerEvents: 'none',
              }}
            >
              <img
                src={layer.image}
                alt=""
                aria-hidden="true"
                style={{
                  width: '100%',
                  height: controlHeight,
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  borderTopLeftRadius: explorerUi.clockFaceRadius,
                  borderTopRightRadius: explorerUi.clockFaceRadius,
                  opacity: layer.opacity,
                }}
              />
            </div>
          ) : null
        )}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: controlHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        >
          {clock.activityImage ? (
            <img
              src={clock.activityImage}
              alt="Activity"
              style={{
                width: clockGeometry.activityImageWidth,
                height: controlHeight,
                objectFit: 'contain',
                objectPosition: 'center center',
              }}
            />
          ) : null}
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
            {hourNumbers}
            {outerMinuteLabels}
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
            ref={clock.svgRef}
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
                className="dne-clock-hand"
                onPointerDown={(event) => clock.onPointerDown(event, hand.id)}
                style={{
                  transformOrigin: `${clockGeometry.cx}px ${clockGeometry.cy}px`,
                  transform: `rotate(${hand.angle}deg)`,
                  transition: clock.handTransition,
                  filter: clock.isDragging ? 'none' : clockGeometry.handShadow,
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
                filter: clock.isDragging ? 'none' : clockGeometry.handShadow,
              }}
            />
          </svg>
        </div>

        <StepperButton
          theme={theme}
          direction="prev"
          onClick={() => clock.onAdjust(-15)}
          ariaLabel="Subtract 15 minutes"
          className="dne-btn dne-btn--prev"
          style={{
            position: 'absolute',
            left: explorerUi.stepperInset,
            top: digitalClockCenterY,
            transform: 'translate(-50%, -50%)',
            zIndex: 9,
          }}
        />

        <StepperButton
          theme={theme}
          direction="next"
          onClick={() => clock.onAdjust(15)}
          ariaLabel="Add 15 minutes"
          className="dne-btn dne-btn--next"
          style={{
            position: 'absolute',
            right: explorerUi.stepperInset,
            top: digitalClockCenterY,
            transform: 'translate(50%, -50%)',
            zIndex: 9,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: digitalClockTop,
            height: explorerUi.digitalClockAreaHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: explorerUi.digitalClockTextGap,
            paddingBottom: explorerUi.digitalClockBottomInset,
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 8,
          }}
        >
          <span
            style={{
              fontSize: clockGeometry.digitalClockTimeFontSize,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              lineHeight: 1,
            }}
          >
            {clock.hoursLabel}
          </span>
          <span
            style={{
              fontSize: clockGeometry.digitalClockSeparatorFontSize,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              opacity: 0.55,
              lineHeight: 1,
            }}
          >
            :
          </span>
          <span
            style={{
              fontSize: clockGeometry.digitalClockTimeFontSize,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              lineHeight: 1,
            }}
          >
            {clock.minutesLabel}
          </span>
          <span
            style={{
              fontSize: clockGeometry.digitalClockSeparatorFontSize,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              opacity: 0.55,
              lineHeight: 1,
            }}
          >
            :
          </span>
          <span
            style={{
              fontSize: clockGeometry.digitalClockTimeFontSize,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              opacity: 0.88,
              textShadow: '0 1px 2px rgba(255,255,255,0.35)',
              lineHeight: 1,
            }}
          >
            {String(Math.floor(clock.seconds)).padStart(2, '0')}
          </span>
          <span
            style={{
              fontSize: clockGeometry.digitalClockAmpmFontSize,
              fontWeight: 700,
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
              marginLeft: explorerUi.digitalClockAmpmMargin,
              textShadow: '0 1px 2px rgba(255,255,255,0.35)',
            }}
          >
            {clock.ampm}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Clock
