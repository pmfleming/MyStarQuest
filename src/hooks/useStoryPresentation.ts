import { useCallback, useEffect, useRef, useState } from 'react'
import { enterStoryPresentation } from '../lib/storyPresentation'
import {
  animateStorySurface,
  captureStoryOpeningFrame,
  currentStorySurface,
  type StoryOpeningFrame,
  type StorySurfaceTransition,
} from '../lib/storyMotion'

export function useStoryPresentation({
  openingFrame,
  onClose,
}: {
  openingFrame?: StoryOpeningFrame | null
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const opening = useRef<StorySurfaceTransition | null>(null)
  const closing = useRef<StorySurfaceTransition | null>(null)
  const closingRequested = useRef(false)
  const [isClosing, setClosing] = useState(false)

  const close = useCallback(() => {
    if (closingRequested.current) return
    closingRequested.current = true
    const dialog = dialogRef.current
    if (!dialog?.open) {
      onClose()
      return
    }
    const bounds = currentStorySurface(dialog)
    opening.current?.cancel()
    opening.current = null
    setClosing(true)
    dialog.dataset.storyOpening = 'false'
    dialog.dataset.storyClosing = 'true'
    const target = openingFrame?.source?.isConnected
      ? captureStoryOpeningFrame(openingFrame.source)
      : (openingFrame ?? captureStoryOpeningFrame(null))
    const transition = animateStorySurface(dialog, target, 'close', bounds)
    if (!transition) {
      onClose()
      return
    }
    closing.current = transition
    const finish = () => {
      if (closing.current === transition) onClose()
    }
    void transition.finished.then(finish, finish)
  }, [onClose, openingFrame])

  useEffect(() => {
    const dialog = dialogRef.current!
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    let disposed = false
    // Wait out StrictMode replay, then put the modal above the fullscreen layer.
    const presentation = Promise.resolve()
      .then(() => (disposed ? null : enterStoryPresentation()))
      .then((exit) => {
        if (exit && !disposed) {
          dialog.showModal()
          const transition = animateStorySurface(
            dialog,
            openingFrame ?? captureStoryOpeningFrame(null),
            'open'
          )
          opening.current = transition
          dialog.dataset.storyOpening = String(Boolean(transition))
          if (transition)
            void transition.finished.then(
              () => {
                if (disposed || opening.current !== transition) return
                dialog.dataset.storyOpening = 'false'
                transition.cancel()
                opening.current = null
              },
              () => {}
            )
        }
        return exit
      })
    let removeBackListener: (() => void) | undefined
    void import('@capacitor/core').then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform() || disposed) return
      const { App } = await import('@capacitor/app')
      if (disposed) return
      const listener = await App.addListener('backButton', close)
      if (disposed) void listener.remove()
      else
        removeBackListener = () => {
          void listener.remove()
        }
    })
    return () => {
      disposed = true
      const closingTransition = closing.current
      closing.current = null
      closingTransition?.cancel()
      opening.current?.cancel()
      opening.current = null
      removeBackListener?.()
      dialog.close()
      document.body.style.overflow = previousOverflow
      void presentation.then((exit) => exit?.())
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [close, openingFrame])
  return { dialogRef, close, isClosing }
}
