import './style.css'
import { story } from './story'

const app = document.querySelector<HTMLDivElement>('#app')!
const book = document.createElement('main')
book.className = 'comic-book'
book.setAttribute('aria-label', 'Sea friends comic book')
const frame = document.createElement('div')
frame.className = 'panel-frame'
const pictures = story.panels.map((panel, index) => {
  const picture = document.createElement('figure')
  picture.className = `picture tone-${panel.tone}`
  picture.dataset.framing = panel.framing
  picture.dataset.motion = panel.motion ?? 'still'
  picture.setAttribute('aria-hidden', String(index !== 0))
  const image = document.createElement('img')
  image.src = panel.image
  image.alt = panel.alt
  image.draggable = false
  if (index === 0) image.fetchPriority = 'high'
  picture.append(image)
  frame.append(picture)
  return picture
})
const previous = document.createElement('button')
previous.className = 'turn-page turn-back'
previous.setAttribute('aria-label', 'Previous panel')
const next = document.createElement('button')
next.className = 'turn-page turn-forward'
next.setAttribute('aria-label', 'Open the comic')
const announcement = document.createElement('span')
announcement.className = 'screen-reader-only'
announcement.setAttribute('role', 'status')
book.append(frame, previous, next, announcement)
app.append(book)
let current = 0

function showPanel(index: number) {
  const destination = Math.max(0, Math.min(index, story.panels.length - 1))
  const panel = story.panels[destination]!
  current = destination
  frame.style.setProperty('--ratio', String(panel.aspectRatio))
  frame.style.setProperty('--panel-width', `${panel.maxWidth}px`)
  book.classList.toggle('cover', current === 0)
  pictures.forEach((picture, i) => {
    picture.classList.toggle('active', i === current)
    picture.setAttribute('aria-hidden', String(i !== current))
  })
  // Keep focused controls in the tab order even at a boundary.
  previous.setAttribute('aria-disabled', String(current === 0))
  next.setAttribute(
    'aria-disabled',
    String(current === story.panels.length - 1)
  )
  next.setAttribute(
    'aria-label',
    current === 0 ? 'Open the comic' : 'Next panel'
  )
  announcement.textContent =
    current === 0
      ? 'Cover'
      : `Panel ${current} of ${story.panels.length - 1}: ${panel.label}`
}
previous.addEventListener('click', () => showPanel(current - 1))
next.addEventListener('click', () => showPanel(current + 1))
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault()
    showPanel(current + 1)
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault()
    showPanel(current - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    showPanel(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    showPanel(story.panels.length - 1)
  } else if (
    event.key === ' ' &&
    !(event.target instanceof HTMLButtonElement)
  ) {
    event.preventDefault()
    showPanel(current + 1)
  }
})
showPanel(0)
