import * as THREE from 'three'
import { normalizeLongitude } from '../solar'
import type {
  ExplorerCityOption,
  ExplorerFocusId,
} from './dayNightExplorerOptions'

export const latLonToVector = (
  latitude: number,
  longitude: number,
  radius: number
) => {
  const phi = THREE.MathUtils.degToRad(90 - latitude)
  const theta = THREE.MathUtils.degToRad(longitude + 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

export const buildOrbitLine = (orbitX: number, orbitY: number) => {
  const points: THREE.Vector3[] = []
  const segments = 128

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments
    const angle = Math.PI / 2 - progress * Math.PI * 2
    points.push(
      new THREE.Vector3(Math.cos(angle) * orbitX, Math.sin(angle) * orbitY, 0)
    )
  }

  return new THREE.BufferGeometry().setFromPoints(points)
}

export const getCenteredLongitude = (
  activeFocusId: ExplorerFocusId,
  cityOptions: ExplorerCityOption[],
  sunLongitude: number
) => {
  if (activeFocusId === 'earth') return normalizeLongitude(sunLongitude + 90)
  const city = cityOptions.find((entry) => entry.id === activeFocusId)
  return city?.location.longitude ?? normalizeLongitude(sunLongitude + 90)
}

export const getEarthViewRotationY = (centeredLongitude: number) =>
  THREE.MathUtils.degToRad(-(centeredLongitude + 90))

export const lerpAngle = (current: number, target: number, amount: number) => {
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current)
  )
  return current + delta * amount
}
