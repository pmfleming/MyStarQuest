import { Line, Mesh, Points, Sprite, type Object3D } from 'three'
import { BufferGeometry, Material } from 'three'

// Textures are owned/disposed separately by the scene manager. Keep the shared
// sprite quad during label rebuilds; release its GPU buffers at scene teardown.
export const disposeSceneObject = (
  object: Object3D,
  disposeSpriteGeometry = false
) => {
  const resources = new Set<{ dispose(): void }>()

  object.traverse((node) => {
    if (!(
      node instanceof Mesh ||
      node instanceof Line ||
      node instanceof Points ||
      node instanceof Sprite
    ))
      return
    if (!(node instanceof Sprite) || disposeSpriteGeometry) {
      if (node.geometry instanceof BufferGeometry) resources.add(node.geometry)
    }
    const entries: unknown = node.material
    const addMaterial = (material: unknown) => {
      if (material instanceof Material) resources.add(material)
    }
    if (Array.isArray(entries)) entries.forEach(addMaterial)
    else addMaterial(entries)
  })

  resources.forEach((resource) => resource.dispose())
}
