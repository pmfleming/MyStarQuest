import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../ui/tokens'
import StepperButton from '../StepperButton'
import {
  clockGeometry,
  explorerUi,
} from '../../data/dayNightExplorer/dayNightExplorer.constants'
import AnalogClockFace from './AnalogClockFace'
import DigitalClockDisplay from './DigitalClockDisplay'

type ClockHandId = 'hour' | 'minute' | 'second'

type ExplorerClockPanelProps = {
  theme: Theme
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

const ExplorerClockPanel = ({
  theme,
  activityImage,
  explorerBackdropColor,
  explorerBaseBackgroundImage,
  explorerOverlayBackgroundImage,
  overlayOpacity,
  isDragging,
  handTransition,
  hourAngle,
  minuteAngle,
  secondAngle,
  hoursLabel,
  minutesLabel,
  seconds,
  ampm,
  svgRef,
  hourHandRef,
  minuteHandRef,
  secondHandRef,
  onPointerDown,
  onAdjust,
}: ExplorerClockPanelProps) => {
  const controlHeight = explorerUi.globeCanvasSize
  const digitalClockGap = 0
  const digitalClockTop =
    controlHeight + digitalClockGap - explorerUi.digitalClockBottomInset
  const digitalClockCenterY =
    digitalClockTop + explorerUi.digitalClockAreaHeight / 2
  const controlPanelHeight =
    controlHeight + digitalClockGap + explorerUi.digitalClockAreaHeight

  const imageLayers = [
    {
      key: 'base',
      image: explorerBaseBackgroundImage,
      opacity: 0.5,
      zIndex: 3,
    },
    {
      key: 'overlay',
      image: explorerOverlayBackgroundImage,
      opacity: overlayOpacity * 0.5,
      zIndex: 4,
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
            background: explorerBackdropColor,
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
          {activityImage ? (
            <img
              src={activityImage}
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

        <AnalogClockFace
          theme={theme}
          isDragging={isDragging}
          handTransition={handTransition}
          hourAngle={hourAngle}
          minuteAngle={minuteAngle}
          secondAngle={secondAngle}
          svgRef={svgRef}
          hourHandRef={hourHandRef}
          minuteHandRef={minuteHandRef}
          secondHandRef={secondHandRef}
          onPointerDown={onPointerDown}
        />

        <StepperButton
          theme={theme}
          direction="prev"
          onClick={() => onAdjust(-15)}
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
          onClick={() => onAdjust(15)}
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

        <DigitalClockDisplay
          theme={theme}
          hoursLabel={hoursLabel}
          minutesLabel={minutesLabel}
          seconds={seconds}
          ampm={ampm}
          top={digitalClockTop}
          height={explorerUi.digitalClockAreaHeight}
        />
      </div>
    </div>
  )
}

export default ExplorerClockPanel
