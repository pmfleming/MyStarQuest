import { useEffect, useRef, useState } from 'react'
import type { SunPosition } from '../../lib/solar'
import { clockGeometry } from '../../data/dayNightExplorer/dayNightExplorer.constants'
import {
  drawNightOverlay,
  type ExplorerRenderScene,
} from '../../data/dayNightExplorer/dayNightExplorerMath'
import { EXPLORER_CITY_OPTIONS } from '../../data/dayNightExplorer/dayNightExplorerOptions'
import { explorerUi } from '../../data/dayNightExplorer/dayNightExplorer.constants'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    d3: any
    topojson: any
    planetaryjs: any
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const scriptPromises: Record<string, Promise<void> | undefined> = {}

const loadScript = (src: string): Promise<void> => {
  const cached = scriptPromises[src]
  if (cached) {
    return cached
  }

  const promise = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const scriptElement = document.createElement('script')
    scriptElement.src = src
    scriptElement.async = false
    scriptElement.onload = () => resolve()
    scriptElement.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(scriptElement)
  })

  scriptPromises[src] = promise
  return promise
}

const ensureGlobeScripts = async () => {
  for (const script of explorerUi.scripts) {
    await loadScript(script)
  }
}

const usePlanetaryGlobe = (
  renderScene: ExplorerRenderScene,
  sunPosition: SunPosition
) => {
  const [globeReady, setGlobeReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planetRef = useRef<any>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sunPositionRef = useRef(sunPosition)
  const renderSceneRef = useRef(renderScene)

  sunPositionRef.current = sunPosition
  renderSceneRef.current = renderScene

  useEffect(() => {
    let cancelled = false

    ensureGlobeScripts().then(() => {
      if (cancelled || !canvasRef.current) {
        return
      }

      const pjs = window.planetaryjs
      const planet = pjs.planet()

      planet.loadPlugin(
        pjs.plugins.earth({
          topojson: {
            file: 'https://unpkg.com/world-atlas@1.1.4/world/110m.json',
          },
          oceans: { fill: '#1e3799' },
          land: { fill: '#2ed573' },
          borders: { stroke: '#1e3799', strokeWidth: 0.5 },
        })
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      planet.loadPlugin(function (pl: any) {
        pl.onDraw(function () {
          const currentSunPosition = sunPositionRef.current
          const currentRenderScene = renderSceneRef.current

          pl.projection.rotate([
            -currentRenderScene.viewLongitude,
            -currentRenderScene.viewLatitude,
            0,
          ])

          const [translateX, translateY] = pl.projection.translate()
          const globeRadius = pl.projection.scale()

          drawNightOverlay({
            context: pl.context,
            centerX: translateX,
            centerY: translateY,
            radius: globeRadius,
            centerLongitude: currentRenderScene.overlayCenterLongitude,
            centerLatitude: currentRenderScene.overlayCenterLatitude,
            sunLongitude: currentSunPosition.longitude,
            sunLatitude: currentSunPosition.latitude,
          })
        })
      })

      planet.loadPlugin(pjs.plugins.pings())
      planet.loadPlugin(
        pjs.plugins.drag({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onDragStart: function (this: any) {
            this.plugins.drag.originalRotation = planet.projection.rotate()
          },
        })
      )

      planet.projection
        .scale(clockGeometry.projectionScale)
        .translate([clockGeometry.size / 2, clockGeometry.size / 2])

      planet.draw(canvasRef.current)
      planetRef.current = planet

      pingIntervalRef.current = setInterval(() => {
        EXPLORER_CITY_OPTIONS.forEach((city) => {
          planet.plugins.pings.add(
            city.location.longitude,
            city.location.latitude,
            {
              color: city.color,
              ttl: city.ttl,
              angle: city.angle,
              strokeWidth: city.strokeWidth,
            }
          )
        })
      }, 1000)

      setGlobeReady(true)
    })

    return () => {
      cancelled = true
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
      if (planetRef.current) {
        planetRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (!planetRef.current || !canvasRef.current) {
      return
    }

    const planet = planetRef.current
    planet.stop()
    planet.draw(canvasRef.current)

    return () => {
      planet.stop()
    }
  }, [
    renderScene.overlayCenterLatitude,
    renderScene.overlayCenterLongitude,
    renderScene.viewLatitude,
    renderScene.viewLongitude,
    sunPosition.latitude,
    sunPosition.longitude,
  ])

  return {
    canvasRef,
    globeReady,
  }
}

export default usePlanetaryGlobe
