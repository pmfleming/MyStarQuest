export type NamedAsset = {
  name: string
  image: string
}

export const createAssetResolver =
  (
    modules: Record<string, string>,
    prefix: string,
    errorLabel: string,
    suffix = ''
  ) =>
  (path: string): string => {
    const image = modules[`${prefix}${path}${suffix}`]
    if (!image) throw new Error(`${errorLabel}: ${path}`)
    return image
  }

export const createAssetCatalog = (
  modules: Record<string, string>,
  normalizeName: (name: string) => string = (name) => name
) => {
  const assets = Object.entries(modules)
    .map(([path, image]) => ({
      name: normalizeName(
        path
          .split('/')
          .pop()
          ?.replace(/\.[^.]+$/, '') ?? path
      ),
      image,
    }))
    .sort((left, right) => left.name.localeCompare(right.name))

  return {
    assets,
    byName: new Map(assets.map(({ name, image }) => [name, image])),
  }
}
