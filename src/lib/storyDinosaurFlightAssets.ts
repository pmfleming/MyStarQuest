import layout from '../data/stories/dinosaurFlightLayout.json'

export type FlightPlacement = { x: number; bottom: number; width: number }
export type FlightVisitor = FlightPlacement & {
  id: string
  motion: 'browse' | 'walk' | 'slither' | 'float' | 'swim' | 'fly'
  flip?: boolean
}
export type DinosaurFlightLayout = {
  id: string
  label: string
  alt: string
  mode: 'boarding' | 'takeoff' | 'tour'
  background: string
  rider: FlightPlacement
  companions: (FlightPlacement & { id: string })[]
  visitors: FlightVisitor[]
}

export const dinosaurFlightLayouts = layout as DinosaurFlightLayout[]
const layers = import.meta.glob(
  '../assets/comic/layers/rainbowasaurus-flight/*.webp',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>

export function dinosaurFlightAsset(name: string) {
  return layers[`../assets/comic/layers/rainbowasaurus-flight/${name}.webp`]!
}

export function dinosaurFlightLayoutFor(id: string) {
  return dinosaurFlightLayouts.find((scene) => scene.id === id)
}

export function placeFlightActor(element: HTMLElement, place: FlightPlacement) {
  element.style.left = `${place.x}%`
  element.style.bottom = `${100 - place.bottom}%`
  element.style.width = `${place.width}%`
}
