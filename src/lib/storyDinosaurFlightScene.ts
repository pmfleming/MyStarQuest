import { createStoryLayerScene, storyImage } from './storyLayerScene'
import {
  dinosaurFlightAsset,
  dinosaurFlightLayoutFor,
  dinosaurFlightLayouts,
  placeFlightActor,
} from './storyDinosaurFlightAssets'
import './storyDinosaurFlightScene.css'

export function createDinosaurFlightScene(host: HTMLElement) {
  return createStoryLayerScene(host, {
    className: 'dinosaur-flight-scene',
    panelIds: dinosaurFlightLayouts.map((scene) => scene.id),
    entrance: 'flying',
    build(stage, id) {
      const scene = dinosaurFlightLayoutFor(id)!
      stage.dataset.mode = scene.mode
      stage.dataset.habitat = scene.background
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
        actor.style.setProperty('--visitor-delay', `${-i * 1.7}s`)
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
        actor.dataset.mount =
          member.id === 'odette' ? 'princess-rainbowasaurus' : 'digosaurus'
        placeFlightActor(actor, member)
        actor.style.setProperty('--flight-delay', `${-i * 1.3}s`)
        actor.style.setProperty('--home-x', `${member.x}%`)
        actor.style.setProperty('--home-bottom', `${100 - member.bottom}%`)
        actor.style.setProperty('--home-width', `${member.width}%`)
        const start =
          member.id === 'odette'
            ? launch.rider
            : launch.companions.find((c) => c.id === member.id)!
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
    },
  })
}
