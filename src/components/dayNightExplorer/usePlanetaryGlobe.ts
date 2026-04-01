import { useEffect, useRef, useState } from 'react'
import type { SunPosition } from '../../lib/solar'
import { explorerUi } from '../../lib/dayNightExplorer/dayNightExplorer.constants'
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
  sunPosition: SunPosition,
  isDragging: boolean
) => {
  const [globeReady, setGlobeReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countriesGeoRef = useRef<any>(null)
  const pingsRef = useRef<Ping[]>([])
  const lastPingTimesRef = useRef<Record<string, number>>({})
  const requestRef = useRef<number>(null!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectionRef = useRef<any>(null)

  // Cache these for the render loop
  const sunPositionRef = useRef(sunPosition)
  const renderSceneRef = useRef(renderScene)
  const isDraggingRef = useRef(isDragging)
  sunPositionRef.current = sunPosition
  renderSceneRef.current = renderScene
  isDraggingRef.current = isDragging

  useEffect(() => {
    // Initialize pings with staggering (so they don't fire all at once)
    const now = Date.now()
    EXPLORER_CITY_OPTIONS.forEach((city, index) => {
      lastPingTimesRef.current[city.id] = now - 1000 + index * 333
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    ensureGlobeScripts().then(async () => {
      if (cancelled || !canvasRef.current) return

      const d3 = window.d3
      const topojson = window.topojson

      // 1. Load World Data (Local 2024 Modern)
      try {
        const world = await d3.json('/data/world-50m-2024.json')
        landRef.current = topojson.feature(world, world.objects.land)
        countriesGeoRef.current = topojson.feature(
          world,
          world.objects.countries
        )
      } catch (error) {
        console.error(
          'Failed to load local map data, falling back to CDN',
          error
        )
        const world = await d3.json(
          'https://cdn.jsdelivr.net/npm/visionscarto-world-atlas@1/world/50m.json'
        )
        landRef.current = topojson.feature(world, world.objects.land)
        countriesGeoRef.current = topojson.feature(
          world,
          world.objects.countries
        )
      }

      // 2. Setup Projection
      const width = canvasRef.current.width
      const height = canvasRef.current.height
      const projection = d3
        .geoOrthographic()
        .scale(width * 0.49)
        .translate([width / 2, height / 2])
        .precision(0.1)

      projectionRef.current = projection

      // 3. Setup Drag
      const canvas = d3.select(canvasRef.current)
      canvas.call(
        d3.drag().on('drag', (event: { dx: number; dy: number }) => {
          const rotate = projection.rotate()
          const k = 75 / projection.scale()
          projection.rotate([
            rotate[0] + event.dx * k,
            rotate[1] - event.dy * k,
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

    const render = () => {
      if (!canvasRef.current) return
      const width = canvasRef.current.width
      const height = canvasRef.current.height
      context.clearRect(0, 0, width, height)

      // Update rotation from props if not dragging
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

      // 3. Draw Countries (Borders)
      if (countriesGeoRef.current) {
        context.beginPath()
        path(countriesGeoRef.current)
        context.strokeStyle = 'rgba(255, 255, 255, 0.25)'
        context.lineWidth = 0.5
        context.stroke()
      }

      // 4. Night Overlay
      drawNightOverlay({
        context,
        path,
        sunLongitude: sunPositionRef.current.longitude,
        sunLatitude: sunPositionRef.current.latitude,
      })

      // 5. City Indicators (Stationary Only)
      if (!isDraggingRef.current) {
        const now = Date.now()
        const width = canvasRef.current.width

        // 5a. Add new pings (staggered robust pulse)
        EXPLORER_CITY_OPTIONS.forEach((city) => {
          const lastPing = lastPingTimesRef.current[city.id] || 0
          if (now - lastPing > 1000) {
            pingsRef.current.push({
              lon: city.location.longitude,
              lat: city.location.latitude,
              color: city.color,
              radius: 0,
              opacity: 1,
              startTime: now,
              ttl: city.ttl,
            })
            lastPingTimesRef.current[city.id] = now
          }
        })

        // 5b. Static City Anchors
        EXPLORER_CITY_OPTIONS.forEach((city) => {
          const coords = projection([
            city.location.longitude,
            city.location.latitude,
          ])
          if (coords) {
            const gdistance = d3.geoDistance(
              [city.location.longitude, city.location.latitude],
              projection.invert([width / 2, height / 2])
            )
            if (gdistance < Math.PI / 2) {
              context.beginPath()
              context.arc(coords[0], coords[1], 3, 0, Math.PI * 2)
              context.fillStyle = city.color
              context.fill()
              context.strokeStyle = 'white'
              context.lineWidth = 1
              context.stroke()
            }
          }
        })

        // 5c. Animated Pings
        pingsRef.current = pingsRef.current.filter(
          (p) => now - p.startTime < p.ttl
        )
        pingsRef.current.forEach((p) => {
          const progress = (now - p.startTime) / p.ttl
          p.radius = (progress * width) / 15
          p.opacity = 1 - progress

          const coords = projection([p.lon, p.lat])
          if (coords) {
            const gdistance = d3.geoDistance(
              [p.lon, p.lat],
              projection.invert([width / 2, height / 2])
            )
            if (gdistance < Math.PI / 2) {
              context.save()
              context.beginPath()
              context.arc(coords[0], coords[1], p.radius, 0, Math.PI * 2)
              context.strokeStyle = p.color
              context.lineWidth = 2.5
              context.globalAlpha = p.opacity
              context.shadowBlur = 10
              context.shadowColor = p.color
              context.stroke()
              context.restore()
            }
          }
        })
      }

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
    sunPositionRef,
    renderSceneRef,
  }
}

export default usePlanetaryGlobe
