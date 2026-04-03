import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { explorerUi } from '../../lib/dayNightExplorer/dayNightExplorer.constants'
import {
  getClockAngles,
  normalizeExactTime,
  normalizeMinutes,
} from '../../lib/dayNightExplorer/dayNightExplorerMath'

type ClockHandId = 'hour' | 'minute' | 'second'

type ClockTime = {
  totalMinutes: number
  seconds: number
}

type UseExplorerClockOptions = {
  initialMinutes: number
  initialSeconds: number
  onUpdate?: (minutes: number, seconds: number) => void
}

const DEFAULT_HAND_TRANSITION =
  'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)'

const useExplorerClock = ({
  initialMinutes,
  initialSeconds,
  onUpdate,
}: UseExplorerClockOptions) => {
  const [minutes, setMinutes] = useState(initialMinutes)
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isDragging, setIsDragging] = useState(false)

  const minutesRef = useRef(minutes)
  minutesRef.current = minutes

  const svgRef = useRef<SVGSVGElement>(null)
  const hourHandRef = useRef<SVGGElement>(null)
  const minuteHandRef = useRef<SVGGElement>(null)
  const secondHandRef = useRef<SVGGElement>(null)

  const digitalHourRef = useRef<HTMLSpanElement>(null)
  const digitalMinuteRef = useRef<HTMLSpanElement>(null)
  const digitalSecondRef = useRef<HTMLSpanElement>(null)
  const digitalAmpmRef = useRef<HTMLSpanElement>(null)

  const activeHandRef = useRef<ClockHandId | null>(null)
  const lastAngleRef = useRef(0)
  const exactMinutesRef = useRef(minutes)
  const exactSecondsRef = useRef(seconds)
  const lastRenderedSecondRef = useRef(seconds)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const lastDragCommitRef = useRef(0)

  const applyHandTransforms = useCallback(
    (nextMinutes: number, nextSeconds: number) => {
      const { minuteAngle, hourAngle, secondAngle } = getClockAngles(
        normalizeMinutes(nextMinutes),
        nextSeconds
      )

      if (hourHandRef.current) {
        hourHandRef.current.style.transform = `rotate(${hourAngle}deg)`
      }
      if (minuteHandRef.current) {
        minuteHandRef.current.style.transform = `rotate(${minuteAngle}deg)`
      }
      if (secondHandRef.current) {
        const previousSecond = lastRenderedSecondRef.current
        const shouldAnimateSecondHand =
          !activeHandRef.current &&
          nextSeconds > previousSecond &&
          nextSeconds - previousSecond <= 1

        secondHandRef.current.style.transition = shouldAnimateSecondHand
          ? DEFAULT_HAND_TRANSITION
          : 'none'
        secondHandRef.current.style.transform = `rotate(${secondAngle}deg)`
        lastRenderedSecondRef.current = nextSeconds
      }

      // External callback for unthrottled visual updates (e.g. globe)
      onUpdate?.(nextMinutes, nextSeconds)
    },
    [onUpdate]
  )

  const commitExplorerTime = useCallback(
    (
      nextMinutes: number,
      nextSeconds: number,
      options?: { force?: boolean }
    ) => {
      const normalized = normalizeExactTime(nextMinutes, nextSeconds)
      exactMinutesRef.current = normalized.minutes
      exactSecondsRef.current = normalized.seconds

      const now = performance.now()
      if (
        !options?.force &&
        now - lastDragCommitRef.current < explorerUi.dragCommitIntervalMs
      ) {
        return normalized
      }

      lastDragCommitRef.current = now
      minutesRef.current = normalized.minutes
      setMinutes(normalized.minutes)
      setSeconds(normalized.seconds)
      return normalized
    },
    []
  )

  const adjustMinutes = useCallback((delta: number) => {
    setMinutes((previousMinutes) => {
      const nextMinutes = previousMinutes + delta
      minutesRef.current = nextMinutes
      exactMinutesRef.current = nextMinutes
      return nextMinutes
    })
  }, [])

  const syncClockTime = useCallback(
    (clockTime: ClockTime) => {
      minutesRef.current = clockTime.totalMinutes
      exactMinutesRef.current = clockTime.totalMinutes
      exactSecondsRef.current = clockTime.seconds
      applyHandTransforms(clockTime.totalMinutes, clockTime.seconds)
      setMinutes(clockTime.totalMinutes)
      setSeconds(clockTime.seconds)
    },
    [applyHandTransforms]
  )

  useEffect(() => {
    exactSecondsRef.current = seconds
  }, [seconds])

  useEffect(() => {
    applyHandTransforms(minutes, seconds)
  }, [applyHandTransforms, minutes, seconds])

  useEffect(() => {
    const timer = setInterval(() => {
      if (activeHandRef.current) {
        return
      }

      const normalized = normalizeExactTime(
        exactMinutesRef.current,
        exactSecondsRef.current + 1
      )

      exactMinutesRef.current = normalized.minutes
      exactSecondsRef.current = normalized.seconds
      minutesRef.current = normalized.minutes
      setMinutes(normalized.minutes)
      setSeconds(normalized.seconds)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) {
      return 0
    }

    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = clientX - centerX
    const y = clientY - centerY

    let degrees = (Math.atan2(y, x) * 180) / Math.PI
    degrees += 90
    if (degrees < 0) {
      degrees += 360
    }

    return degrees
  }, [])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<SVGGElement>, hand: ClockHandId) => {
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      setIsDragging(true)
      activeHandRef.current = hand
      exactMinutesRef.current = minutesRef.current
      exactSecondsRef.current = seconds
      lastDragCommitRef.current = 0
      lastAngleRef.current = getAngle(event.clientX, event.clientY)
    },
    [getAngle, seconds]
  )

  useEffect(() => {
    const processUpdate = () => {
      if (!activeHandRef.current || !pendingUpdateRef.current) {
        rafIdRef.current = null
        return
      }

      const { x, y } = pendingUpdateRef.current
      const currentAngle = getAngle(x, y)
      let deltaAngle = currentAngle - lastAngleRef.current

      if (deltaAngle > 180) {
        deltaAngle -= 360
      }
      if (deltaAngle < -180) {
        deltaAngle += 360
      }

      let nextMinutes = exactMinutesRef.current
      let nextSeconds = exactSecondsRef.current

      if (activeHandRef.current === 'second') {
        nextSeconds += deltaAngle / 6
      } else {
        let deltaMinutes = 0
        if (activeHandRef.current === 'minute') {
          deltaMinutes = deltaAngle / 6
        }
        if (activeHandRef.current === 'hour') {
          deltaMinutes = deltaAngle * 2
        }
        nextMinutes += deltaMinutes
      }

      const normalized = normalizeExactTime(nextMinutes, nextSeconds)
      exactMinutesRef.current = normalized.minutes
      exactSecondsRef.current = normalized.seconds
      applyHandTransforms(normalized.minutes, normalized.seconds)
      commitExplorerTime(normalized.minutes, normalized.seconds)

      lastAngleRef.current = currentAngle
      pendingUpdateRef.current = null
      rafIdRef.current = requestAnimationFrame(processUpdate)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!activeHandRef.current) {
        return
      }

      pendingUpdateRef.current = { x: event.clientX, y: event.clientY }
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(processUpdate)
      }
    }

    const handlePointerUp = () => {
      commitExplorerTime(exactMinutesRef.current, exactSecondsRef.current, {
        force: true,
      })
      setIsDragging(false)
      activeHandRef.current = null
      pendingUpdateRef.current = null
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [applyHandTransforms, commitExplorerTime, getAngle, isDragging])

  return {
    minutes,
    seconds,
    isDragging,
    handTransition: isDragging ? 'none' : DEFAULT_HAND_TRANSITION,
    ...getClockAngles(minutes, seconds),
    svgRef,
    hourHandRef,
    minuteHandRef,
    secondHandRef,
    digitalHourRef,
    digitalMinuteRef,
    digitalSecondRef,
    digitalAmpmRef,
    handlePointerDown,
    adjustMinutes,
    syncClockTime,
  }
}

export default useExplorerClock
