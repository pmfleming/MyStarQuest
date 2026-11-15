import { storyImage } from './storyLayerScene'
import {
  dinosaurFlightAsset,
  dinosaurFlightLayoutFor,
  dinosaurFlightLayouts,
  placeFlightActor,
  type FlightPlacement,
} from './storyDinosaurFlightAssets'

type Animate = (
  element: Element,
  keys: Keyframe[],
  options?: KeyframeAnimationOptions
) => Animation

/** Carry all three mounted friends across the changing landscape between pages. */
export function buildDinosaurFlightBridge(
  artwork: HTMLElement,
  fromId: string,
  toId: string
) {
  const from = dinosaurFlightLayoutFor(fromId)!
  const to = dinosaurFlightLayoutFor(toId)!
  const destination = to.mode === 'takeoff' ? dinosaurFlightLayouts[0]! : to
  const members = [
    { id: 'odette', start: from.rider, end: destination.rider },
    ...from.companions.map((companion) => ({
      id: companion.id,
      start: companion,
      end: destination.companions.find((member) => member.id === companion.id)!,
    })),
  ].map((member) => {
    const actor = document.createElement('div')
    actor.className = 'dinosaur-flight-rider dinosaur-flight-bridge-rider'
    actor.dataset.rider = member.id
    placeFlightActor(actor, member.start)
    actor.append(
      storyImage(
        dinosaurFlightAsset(
          member.id === 'odette'
            ? to.mode === 'boarding'
              ? 'boarding'
              : to.mode === 'tour'
                ? 'riding-lookdown'
                : 'riding'
            : `${member.id}-riding`
        ),
        'dinosaur-flight-rider-sprite'
      )
    )
    artwork.append(actor)
    return { ...member, actor }
  })
  const cloud = document.createElement('div')
  cloud.className = 'dinosaur-flight-transition-cloud'
  artwork.append(cloud)
  const position = (place: FlightPlacement) => ({
    left: `${place.x}%`,
    bottom: `${100 - place.bottom}%`,
    width: `${place.width}%`,
  })
  return {
    source: dinosaurFlightAsset(`${from.id}-landscape`),
    target: dinosaurFlightAsset(`${to.id}-landscape`),
    play(source: HTMLImageElement, target: HTMLImageElement, animate: Animate) {
      animate(source, [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.08) translate(2%, 2%)' },
      ])
      animate(target, [
        { opacity: 0, transform: 'scale(1.06) translate(-2%, -1%)' },
        { opacity: 1, transform: 'none', offset: 0.85 },
        { opacity: 1, transform: 'none' },
      ])
      for (const member of members) {
        animate(
          member.actor,
          [
            {
              ...position(member.start),
              transform: 'translateX(-50%) rotate(0deg)',
            },
            {
              ...position({
                x: (member.start.x + member.end.x) / 2 - 3,
                bottom: (member.start.bottom + member.end.bottom) / 2 - 4,
                width: (member.start.width + member.end.width) / 2,
              }),
              transform: 'translateX(-50%) rotate(-8deg)',
              offset: 0.5,
            },
            {
              ...position(member.end),
              transform: 'translateX(-50%) rotate(0deg)',
            },
          ],
          { easing: 'ease-in-out' }
        )
      }
      animate(cloud, [
        { transform: 'translateX(120%)', opacity: 0 },
        { transform: 'translateX(5%)', opacity: 0.6, offset: 0.5 },
        { transform: 'translateX(-120%)', opacity: 0 },
      ])
    },
  }
}
