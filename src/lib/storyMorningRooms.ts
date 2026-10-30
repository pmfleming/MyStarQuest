import './storyMorningRooms.css'
import odette from '../assets/comic/opening/morning-rooms/odette-rainbow.png'
import primarina from '../assets/comic/opening/morning-rooms/primarina-aquafox.png'
import tangy from '../assets/comic/opening/morning-rooms/tangy-sweet.png'
import eclipse from '../assets/comic/opening/morning-rooms/eclipse-diana.png'
import hopping from '../assets/comic/opening/morning-rooms/hopping-doremi.png'
import helpers from '../assets/comic/opening/morning-rooms/little-helpers.png'

export const morningPanelId = '31a-morning-wake-up'

export function createMorningRooms(picture: HTMLElement) {
  picture.classList.add('morning-rooms-panel')
  const grid = document.createElement('div')
  grid.className = 'morning-rooms'
  const rooms = [
    [odette, 'Odette and Rainbow waking up'],
    [primarina, 'Primarina and Aquafox waking up'],
    [tangy, 'Tangy and Sweet waking up'],
    [eclipse, 'Eclipse and Diana waking up'],
    [hopping, 'Hopping and Doremi waking up'],
    [helpers, 'All seven little helpers waking up together'],
  ] as const
  for (const [src, alt] of rooms) {
    const room = document.createElement('div')
    room.className = 'morning-room'
    const image = document.createElement('img')
    image.decoding = 'async'
    image.fetchPriority = 'low'
    image.src = src
    image.alt = alt
    image.draggable = false
    room.append(image)
    grid.append(room)
  }
  let disposed = false
  picture.append(grid)
  void Promise.all(
    [...grid.querySelectorAll('img')].map((image) => image.decode())
  )
    .then(() => {
      if (!disposed) grid.classList.add('ready')
    })
    .catch(() => {})
  return {
    dispose() {
      disposed = true
      grid.remove()
      picture.classList.remove('morning-rooms-panel')
    },
  }
}
