import { createStoryLayerScene, storyImage } from './storyLayerScene'
import {
  dinosaurFlightAsset,
  dinosaurFlightLayoutFor,
  dinosaurFlightLayouts,
  placeFlightActor,
} from './storyDinosaurFlightAssets'
import './storyDinosaurFlightScene.css'
import { createDinosaurDepth } from './storyDinosaurDepth'

export function createDinosaurFlightScene(host: HTMLElement) {
  return createStoryLayerScene(host, {
    className: 'dinosaur-flight-scene',
    panelIds: dinosaurFlightLayouts.map((scene) => scene.id),
    entrance: 'flying',
    build: buildDinosaurFlightStage,
  })
}

/** The page and its transition use the very same scenery, lighting and actors. */
export function buildDinosaurFlightStage(stage: HTMLElement, id: string) {
  const scene = dinosaurFlightLayoutFor(id)!
  stage.dataset.mode = scene.mode
  stage.dataset.habitat = scene.background
  const depth = createDinosaurDepth(scene.background)
  const world = document.createElement('div')
  world.className = 'dinosaur-flight-world'
  world.append(
    storyImage(
      dinosaurFlightAsset(scene.background),
      'dinosaur-flight-background'
    )
  )
  scene.visitors.forEach((visitor, i) => {
    const actor = document.createElement('div')
    actor.className = `dinosaur-flight-visitor visitor-${visitor.motion}`
    actor.dataset.dinosaur = visitor.id
    actor.dataset.depth = visitor.bottom < 85 ? 'distant' : 'near'
    actor.style.zIndex = visitor.bottom < 85 ? '1' : '3'
    actor.style.setProperty('--visitor-delay', `${i * 0.4}s`)
    placeFlightActor(actor, visitor)
    const specimen = document.createElement('div')
    specimen.className = 'dinosaur-flight-specimen'
    if (visitor.flip) specimen.style.transform = 'scaleX(-1)'
    specimen.append(
      storyImage(
        dinosaurFlightAsset(`dinosaur-${visitor.id}`),
        'dinosaur-flight-dinosaur'
      )
    )
    actor.append(specimen)
    world.append(actor)
  })
  world.append(depth.midground)
  stage.append(world)
  const mist = document.createElement('div')
  mist.className = 'dinosaur-flight-mist'
  stage.append(mist)
  const launch = dinosaurFlightLayouts[0]!
  const party = [
    ...scene.companions.map((companion) => ({
      ...companion,
      sprite: `${companion.id}-riding`,
    })),
    {
      ...scene.rider,
      id: 'odette',
      sprite:
        scene.mode === 'boarding'
          ? 'boarding'
          : scene.mode === 'tour'
            ? 'riding-lookdown'
            : 'riding',
    },
  ]
  party.forEach((member, i) => {
    const actor = document.createElement('div')
    actor.className = 'dinosaur-flight-rider'
    actor.dataset.rider = member.id
    actor.style.zIndex = member.id === 'odette' ? '5' : '3'
    actor.dataset.mount =
      member.id === 'odette' ? 'princess-rainbowasaurus' : 'digosaurus'
    placeFlightActor(actor, member)
    actor.style.setProperty('--flight-delay', `${i * 0.3}s`)
    actor.style.setProperty('--home-x', `${member.x}%`)
    actor.style.setProperty('--home-bottom', `${100 - member.bottom}%`)
    actor.style.setProperty('--home-width', `${member.width}%`)
    const start =
      member.id === 'odette'
        ? launch.rider
        : launch.companions.find((c) => c.id === member.id)!
    if (scene.mode !== 'tour') {
      const shadow = document.createElement('div')
      shadow.className = 'dinosaur-flight-launch-shadow'
      placeFlightActor(shadow, { ...start, width: start.width * 0.65 })
      world.append(shadow)
    }
    actor.style.setProperty('--launch-x', `${start.x}%`)
    actor.style.setProperty('--launch-bottom', `${100 - start.bottom}%`)
    actor.style.setProperty('--launch-width', `${start.width}%`)
    actor.append(
      storyImage(
        dinosaurFlightAsset(member.sprite),
        'dinosaur-flight-rider-sprite'
      )
    )
    stage.append(actor)
  })
  if (scene.mode !== 'boarding') stage.append(depth.air)
  stage.append(depth.foreground)
}
