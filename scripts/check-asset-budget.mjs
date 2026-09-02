import { readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ASSET_BUDGET_BYTES = 95 * 1024 * 1024
const assetDirectory = fileURLToPath(new URL('../dist/assets/', import.meta.url))

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? collectFiles(entryPath) : entryPath
    })
  )
  return files.flat()
}

const formatMiB = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`

const files = await collectFiles(assetDirectory)
const sizes = await Promise.all(
  files.map(async (file) => ({ file, bytes: (await stat(file)).size }))
)
const totalBytes = sizes.reduce((total, asset) => total + asset.bytes, 0)

if (totalBytes > ASSET_BUDGET_BYTES) {
  const largestAssets = sizes
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 10)
    .map(
      ({ file, bytes }) =>
        `  ${formatMiB(bytes)}  ${path.relative(assetDirectory, file)}`
    )
    .join('\n')

  console.error(
    `Production assets use ${formatMiB(totalBytes)}, exceeding the ${formatMiB(ASSET_BUDGET_BYTES)} budget.\nLargest assets:\n${largestAssets}`
  )
  process.exitCode = 1
} else {
  console.log(
    `Production asset budget passed: ${formatMiB(totalBytes)} / ${formatMiB(ASSET_BUDGET_BYTES)}`
  )
}
