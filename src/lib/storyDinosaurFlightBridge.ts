import { buildDinosaurFlightStage } from './storyDinosaurFlightScene'
import { snapshotStoryScene } from './storySceneSnapshot'

type Animate = (
  element: Element,
  keys: Keyframe[],
  options?: KeyframeAnimationOptions
) => Animation

/** Fly the visible party into the exact scene that will remain after the turn. */
export function buildDinosaurFlightBridge(
  artwork: HTMLElement,
  fromId: string,
  toId: string,
  previous?: HTMLElement
) {
  const scene = (id: string) => {
    const stage = document.createElement('div')
    stage.className = 'dinosaur-flight-scene ready dinosaur-flight-bridge-scene'
    buildDinosaurFlightStage(stage, id)
    return stage
  }
  const source = (previous && snapshotStoryScene(previous)) || scene(fromId)
  source.classList.add('dinosaur-flight-bridge-scene')
  const target = scene(toId)
  target.style.opacity = '0'
  artwork.append(source, target)

  return {
    play(animate: Animate) {
      // Keep the scenery in front of the carried actors, not flattened below them.
      for (const depth of ['air', 'foreground']) {
        const outgoing = source.querySelector<HTMLElement>(
          `:scope > .dinosaur-depth-${depth}`
        )
        const incoming = target.querySelector<HTMLElement>(
          `:scope > .dinosaur-depth-${depth}`
        )
        if (outgoing) {
          artwork.append(outgoing)
          animate(outgoing, [
            { opacity: 1 },
            { opacity: 0, offset: 0.8 },
            { opacity: 0 },
          ])
        }
        if (incoming) {
          artwork.append(incoming)
          animate(incoming, [
            { opacity: 0 },
            { opacity: 1, offset: 0.8 },
            { opacity: 1 },
          ])
        }
      }
      // Keep an opaque landscape underneath the incoming one throughout the dissolve.
      animate(target, [
        { opacity: 0 },
        { opacity: 1, offset: 0.8 },
        { opacity: 1 },
      ])
      const startRiders = [
        ...source.querySelectorAll<HTMLElement>('.dinosaur-flight-rider'),
      ]
      for (const start of startRiders) {
        const end = target.querySelector<HTMLElement>(
          `[data-rider="${start.dataset.rider}"]`
        )!
        const startStyle = getComputedStyle(start)
        const endStyle = getComputedStyle(end)
        const startPose = {
          left: startStyle.left,
          bottom: startStyle.bottom,
          width: startStyle.width,
          height: startStyle.height,
          transform: startStyle.transform,
        }
        const endPose = {
          left: endStyle.left,
          bottom: endStyle.bottom,
          width: endStyle.width,
          height: endStyle.height,
          transform: endStyle.transform,
        }
        // Extract the current pose before fading the scenery; both poses travel together.
        const carrier = document.createElement('div')
        carrier.className = 'dinosaur-flight-rider dinosaur-flight-bridge-rider'
        carrier.dataset.rider = start.dataset.rider
        carrier.style.zIndex = start.dataset.rider === 'odette' ? '5' : '3'
        Object.assign(carrier.style, startPose)
        const oldSprite = start.firstElementChild as HTMLElement
        const newSprite = end.firstElementChild as HTMLElement
        const oldTransform = getComputedStyle(oldSprite).transform
        carrier.append(newSprite, oldSprite)
        newSprite.style.position = 'absolute'
        newSprite.style.inset = 'auto 0 0'
        oldSprite.style.position = 'absolute'
        oldSprite.style.inset = 'auto 0 0'
        oldSprite.style.width = '100%'
        oldSprite.style.height = 'auto'
        oldSprite.style.animation = 'none'
        oldSprite.style.transform = oldTransform
        start.remove()
        end.remove()
        artwork.append(carrier)
        const middle = Object.fromEntries(
          (['left', 'bottom', 'width', 'height'] as const).map((key) => [
            key,
            `${
              (parseFloat(startPose[key]) + parseFloat(endPose[key])) / 2 +
              (key === 'bottom' ? artwork.clientHeight * 0.025 : 0)
            }px`,
          ])
        )
        animate(
          carrier,
          [
            startPose,
            {
              ...middle,
              transform: 'translateX(-50%) rotate(-3deg)',
              offset: 0.5,
            },
            endPose,
          ],
          { easing: 'ease-in-out' }
        )
        animate(newSprite, [
          { opacity: 0 },
          { opacity: 1, offset: 0.8 },
          { opacity: 1 },
        ])
        animate(oldSprite, [
          { opacity: 1, transform: oldTransform },
          { opacity: 0, transform: 'none', offset: 0.8 },
          { opacity: 0, transform: 'none' },
        ])
      }
    },
  }
}
