import { Line, Mesh, Points, Sprite, type Object3D } from 'three'
import type { BufferGeometry, Material } from 'three'

// Textures are owned/disposed separately by the scene manager. Sprite's quad
// geometry is shared internally by Three.js rather than allocated by our scene.
export const disposeSceneObject = (object: Object3D) => {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()

  object.traverse((node) => {
    if (
      node instanceof Mesh ||
      node instanceof Line ||
      node instanceof Points
    ) {
      geometries.add(node.geometry)
    } else if (!(node instanceof Sprite)) {
      return
    }

    const entries = Array.isArray(node.material)
      ? node.material
      : [node.material]
    entries.forEach((material) => materials.add(material))
  })

  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}
