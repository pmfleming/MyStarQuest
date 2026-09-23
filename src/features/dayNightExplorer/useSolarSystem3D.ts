import { useCallback, useEffect, useRef, useState } from 'react'
import type SolarSystem3DManager from './SolarSystem3DManager'
import type { SolarSystemSceneState } from './SolarSystem3DManager'
import { markStartup } from '../../lib/startupPerformance'

const useSolarSystem3D = (
  sceneState: SolarSystemSceneState,
  enabled = true,
  onOrbitChange?: (year: number, progress: number) => void
) => {
  const [globeReady, setGlobeReady] = useState(false)
  const [globeFailed, setGlobeFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const managerRef = useRef<SolarSystem3DManager>(null)
  const latestSceneStateRef = useRef(sceneState)
  const onOrbitChangeRef = useRef(onOrbitChange)

  useEffect(() => {
    onOrbitChangeRef.current = onOrbitChange
  }, [onOrbitChange])

  useEffect(() => {
    latestSceneStateRef.current = sceneState
    managerRef.current?.setSceneState(sceneState)
  }, [sceneState])

  useEffect(() => {
    if (!enabled || !canvasRef.current) {
      return
    }

    let cancelled = false
    let manager: SolarSystem3DManager | null = null
    // Give the clock/agenda a paint before loading and constructing WebGL.
    // The canvas keeps its dimensions while its independent module loads.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        void import('./SolarSystem3DManager')
          .then(({ default: Manager }) => {
            if (cancelled || !canvasRef.current) return
            manager = new Manager(
              canvasRef.current,
              latestSceneStateRef.current,
              (year, progress) => onOrbitChangeRef.current?.(year, progress)
            )
            managerRef.current = manager
            markStartup('globe-scene-ready')
            setGlobeReady(true)
          })
          .catch((error: unknown) => {
            if (cancelled) return
            console.error('Could not initialize globe', error)
            setGlobeFailed(true)
          })
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      manager?.dispose()
      if (managerRef.current === manager) managerRef.current = null
      setGlobeReady(false)
      setGlobeFailed(false)
    }
  }, [attempt, enabled])

  const updateSceneState = useCallback(
    (nextSceneState: SolarSystemSceneState) => {
      latestSceneStateRef.current = nextSceneState
      managerRef.current?.setSceneState(nextSceneState)
    },
    []
  )

  const retryGlobe = useCallback(() => {
    setGlobeFailed(false)
    setGlobeReady(false)
    setAttempt((value) => value + 1)
  }, [])

  return {
    canvasRef,
    globeReady,
    globeFailed,
    retryGlobe,
    updateSceneState,
  }
}

export default useSolarSystem3D
