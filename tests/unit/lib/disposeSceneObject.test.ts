import {
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
} from 'three'
import { expect, it, vi } from 'vitest'
import { disposeSceneObject } from '../../../src/lib/dayNightExplorer/disposeSceneObject'

it('releases owned resources for meshes, starfields, ticks and labels exactly once', () => {
  const group = new Group()
  const sharedGeometry = new BufferGeometry()
  const sharedMaterial = new MeshBasicMaterial()
  const starGeometry = new BufferGeometry()
  const starMaterial = new PointsMaterial()
  const tickGeometry = new BufferGeometry()
  const tickMaterial = new LineBasicMaterial()
  const labelMaterial = new SpriteMaterial()
  const label = new Sprite(labelMaterial)

  group.add(
    new Mesh(sharedGeometry, [sharedMaterial, sharedMaterial]),
    new Mesh(sharedGeometry, sharedMaterial),
    new Points(starGeometry, starMaterial),
    new Line(tickGeometry, tickMaterial),
    label
  )
  const owned = [
    sharedGeometry,
    sharedMaterial,
    starGeometry,
    starMaterial,
    tickGeometry,
    tickMaterial,
    labelMaterial,
  ].map((resource) => vi.spyOn(resource, 'dispose'))
  const internalSpriteGeometry = vi.spyOn(label.geometry, 'dispose')

  disposeSceneObject(group)

  owned.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce())
  expect(internalSpriteGeometry).not.toHaveBeenCalled()
  vi.restoreAllMocks()
})

it('releases the shared sprite quad once when the entire scene is destroyed', () => {
  const group = new Group()
  const first = new Sprite(new SpriteMaterial())
  const second = new Sprite(new SpriteMaterial())
  group.add(first, second)
  expect(first.geometry).toBe(second.geometry)
  const dispose = vi.spyOn(first.geometry, 'dispose')
  disposeSceneObject(group, true)
  expect(dispose).toHaveBeenCalledOnce()
  vi.restoreAllMocks()
})
