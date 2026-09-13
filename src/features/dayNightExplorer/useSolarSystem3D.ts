import { useCallback, useEffect, useRef, useState } from 'react'
import SolarSystem3DManager, {
  type SolarSystemSceneState,
} from './SolarSystem3DManager'

const useSolarSystem3D = (sceneState: SolarSystemSceneState) => {
  const [globeReady, setGlobeReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const managerRef = useRef<SolarSystem3DManager>(null)
  const initialSceneStateRef = useRef(sceneState)

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    const manager = new SolarSystem3DManager(
      canvasRef.current,
      initialSceneStateRef.current
    )
    managerRef.current = manager
    setGlobeReady(true)

    return () => {
      manager.dispose()
      managerRef.current = null
      setGlobeReady(false)
    }
  }, [])

  const updateSceneState = useCallback(
    (nextSceneState: SolarSystemSceneState) => {
      managerRef.current?.setSceneState(nextSceneState)
    },
    []
  )

  useEffect(() => {
    managerRef.current?.setSceneState(sceneState)
  }, [sceneState])

  return {
    canvasRef,
    globeReady,
    updateSceneState,
  }
}

export default useSolarSystem3D
