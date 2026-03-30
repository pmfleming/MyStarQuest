import { useEffect, useRef, useState } from 'react'
import type { SunPosition } from '../../lib/solar'
import { clockGeometry, explorerUi } from '../../lib/dayNightExplorer/dayNightExplorer.constants'
import {
  drawNightOverlay,
  type ExplorerRenderScene,
} from '../../lib/dayNightExplorer/dayNightExplorerMath'
import { EXPLORER_CITY_OPTIONS } from '../../lib/dayNightExplorer/dayNightExplorerOptions'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    d3: any
    topojson: any
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

type Ping = {
  lon: number
  lat: number
  color: string
  radius: number
  opacity: number
  startTime: number
  ttl: number
}

const usePlanetaryGlobe = (
  renderScene: ExplorerRenderScene,
  sunPosition: SunPosition
) => {
  const [globeReady, setGlobeReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landRef = useRef<any>(null)
  const pingsRef = useRef<Ping[]>([])
  const requestRef = useRef<number>(null!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectionRef = useRef<any>(null)
  
  // Cache these for the render loop
  const sunPositionRef = useRef(sunPosition)
  const renderSceneRef = useRef(renderScene)
  sunPositionRef.current = sunPosition
  renderSceneRef.current = renderScene

  useEffect(() => {
    let cancelled = false

    ensureGlobeScripts().then(async () => {
      if (cancelled || !canvasRef.current) return

      const d3 = window.d3
      const topojson = window.topojson

      // 1. Load World Data
      const world = await d3.json('https://unpkg.com/world-atlas@1.1.4/world/110m.json')
      landRef.current = topojson.feature(world, world.objects.land)

      // 2. Setup Projection
      const projection = d3.geoOrthographic()
        .scale(clockGeometry.projectionScale)
        .translate([clockGeometry.size / 2, clockGeometry.size / 2])
        .precision(0.1)
      
      projectionRef.current = projection

      // 3. Setup Drag
      const canvas = d3.select(canvasRef.current)
      canvas.call(d3.drag()
        .on('drag', (event: any) => {
          const rotate = projection.rotate()
          const k = 75 / projection.scale()
          projection.rotate([
            rotate[0] + event.dx * k,
            rotate[1] - event.dy * k
          ])
        })
      )

      setGlobeReady(true)
    })

    return () => {
      cancelled = true
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  // Render Loop
  useEffect(() => {
    if (!globeReady || !canvasRef.current || !landRef.current) return

    const d3 = window.d3
    const context = canvasRef.current.getContext('2d')
    if (!context) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projection = projectionRef.current as any
    const path = d3.geoPath(projection, context)

    const render = (time: number) => {
      context.clearRect(0, 0, clockGeometry.size, clockGeometry.size)

      // Update rotation from props if not dragging
      // (In this simple version, props always override drag unless we add a dragging state)
      projection.rotate(renderSceneRef.current.rotation)

      // 1. Fill Water (Sphere)
      context.beginPath()
      path({ type: 'Sphere' })
      context.fillStyle = '#1e3799'
      context.fill()

      // 2. Draw Land
      context.beginPath()
      path(landRef.current)
      context.fillStyle = '#2ed573'
      context.fill()

      // 3. Draw Borders
      context.beginPath()
      path(landRef.current)
      context.strokeStyle = '#1e3799'
      context.lineWidth = 0.5
      context.stroke()

      // 4. Night Overlay
      drawNightOverlay({
        context,
        path,
        sunLongitude: sunPositionRef.current.longitude,
        sunLatitude: sunPositionRef.current.latitude
      })

      // 5. Pings
      const now = Date.now()
      // Add new pings every second
      if (time % 1000 < 20) { // rough 1s interval check
         EXPLORER_CITY_OPTIONS.forEach(city => {
            pingsRef.current.push({
                lon: city.location.longitude,
                lat: city.location.latitude,
                color: city.color,
                radius: 0,
                opacity: 1,
                startTime: now,
                ttl: city.ttl
            })
         })
      }

      // Update and Draw Pings
      pingsRef.current = pingsRef.current.filter(p => now - p.startTime < p.ttl)
      pingsRef.current.forEach(p => {
        const progress = (now - p.startTime) / p.ttl
        p.radius = progress * 15
        p.opacity = 1 - progress

        const coords = projection([p.lon, p.lat])
        if (coords) {
          // Check if point is on the visible hemisphere
          const gdistance = d3.geoDistance([p.lon, p.lat], projection.invert([clockGeometry.size/2, clockGeometry.size/2]))
          if (gdistance < Math.PI / 2) {
            context.beginPath()
            context.arc(coords[0], coords[1], p.radius, 0, Math.PI * 2)
            context.strokeStyle = p.color
            context.globalAlpha = p.opacity
            context.stroke()
            context.globalAlpha = 1
          }
        }
      })

      requestRef.current = requestAnimationFrame(render)
    }

    requestRef.current = requestAnimationFrame(render)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [globeReady])

  return {
    canvasRef,
    globeReady,
  }
}

export default usePlanetaryGlobe
