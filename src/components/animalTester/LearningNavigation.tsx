import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { uiTokens } from '../../tokens'
import ActionButton from '../ui/ActionButton'
import type { ActivityChoreProps } from '../ui/ActivityControls'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const VISIBLE_LETTERS = 8
const keyboardTargets = new Map<string, (index: number) => number>([
  ['Home', () => 0],
  ['End', () => ALPHABET.length - 1],
  ['ArrowLeft', (index) => Math.max(0, index - 1)],
  ['ArrowRight', (index) => Math.min(ALPHABET.length - 1, index + 1)],
])
const clampStart = (index: number) =>
  Math.max(0, Math.min(ALPHABET.length - VISIBLE_LETTERS, index))

const NavigationArrow = ({ direction }: { direction: 'previous' | 'next' }) => (
  <svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true">
    <path
      d={direction === 'previous' ? 'M30 10 16 24l14 14' : 'm18 10 14 14-14 14'}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

type LearningNavigationProps = {
  creatureName: string
  currentLetter: string
  availableLetters: string[]
  theme: ActivityChoreProps['theme']
  canGoPrevious: boolean
  isLastAnimal: boolean
  onPrevious: () => void
  onNext: () => void
  onSelectLetter: (letter: string) => void
}

export default function LearningNavigation({
  creatureName,
  currentLetter,
  availableLetters,
  theme,
  canGoPrevious,
  isLastAnimal,
  onPrevious,
  onNext,
  onSelectLetter,
}: LearningNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [start, setStart] = useState(0)
  const navigation = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const focusLetter = useRef<string | null>(null)
  const restoreOpenerFocus = useRef(false)
  const suppressClick = useRef(false)
  const drag = useRef<{
    pointerId: number
    x: number
    y: number
    start: number
  } | null>(null)
  const stripId = useId()

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false)
    drag.current = null
    restoreOpenerFocus.current = restoreFocus
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !navigation.current?.contains(event.target)
      )
        close(false)
    }
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    const letters = strip.current
    const browse = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaX || event.deltaY
      if (delta) setStart((previous) => clampStart(previous + Math.sign(delta)))
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    letters?.addEventListener('wheel', browse, { passive: false })
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
      letters?.removeEventListener('wheel', browse)
    }
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen && restoreOpenerFocus.current) {
      opener.current?.focus()
      restoreOpenerFocus.current = false
    }
    if (!isOpen || !focusLetter.current) return
    strip.current
      ?.querySelector<HTMLButtonElement>(
        `[data-letter="${focusLetter.current}"]`
      )
      ?.focus({ preventScroll: true })
    focusLetter.current = null
  }, [isOpen, start])

  const browseWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const targetForKey = keyboardTargets.get(event.key)
    if (!targetForKey) return
    event.preventDefault()
    const focused =
      event.target instanceof HTMLElement
        ? event.target.dataset.letter
        : undefined
    const index = ALPHABET.indexOf(focused ?? currentLetter)
    const target = targetForKey(index)
    const letter = ALPHABET.charAt(target)
    if (target < start || target >= start + VISIBLE_LETTERS) {
      focusLetter.current = letter
      setStart(
        clampStart(target < start ? target : target - VISIBLE_LETTERS + 1)
      )
    } else {
      strip.current
        ?.querySelector<HTMLButtonElement>(`[data-letter="${letter}"]`)
        ?.focus()
    }
  }

  const style: CSSProperties & Record<`--animal-nav-${string}`, string> = {
    '--animal-nav-primary': theme.colors.primary,
    '--animal-nav-accent': theme.colors.accent,
    '--animal-nav-surface': theme.colors.surface,
    '--animal-nav-text': theme.colors.text,
    '--animal-nav-height': `${uiTokens.listActionHeight}px`,
    '--animal-nav-gap': `${uiTokens.actionRowGap}px`,
    fontFamily: theme.fonts.heading,
  }

  return (
    <div
      ref={navigation}
      className="activity-inline-action-row animal-learning-navigation"
      data-expanded={isOpen}
      style={style}
      onBlur={(event) => {
        if (
          isOpen &&
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          close(false)
        }
      }}
    >
      {(['previous', 'next'] as const).map((direction) => (
        <div
          key={direction}
          className={`animal-learning-arrow animal-learning-arrow-${direction}`}
          inert={isOpen}
        >
          <ActionButton
            label={
              direction === 'previous'
                ? `Previous ${creatureName}`
                : isLastAnimal
                  ? 'Finish learning'
                  : `Next ${creatureName}`
            }
            icon={null}
            theme={theme}
            color={theme.colors.primary}
            onClick={direction === 'previous' ? onPrevious : onNext}
            disabled={direction === 'previous' && !canGoPrevious}
            hideArrow
            content={<NavigationArrow direction={direction} />}
            styleOverride={{
              minHeight: uiTokens.listActionHeight,
              height: uiTokens.listActionHeight,
              margin: 0,
              padding: 0,
              justifyContent: 'center',
            }}
          />
        </div>
      ))}
      <div className="animal-letter-expander">
        <button
          ref={opener}
          type="button"
          className="animal-letter-opener"
          aria-label="Choose starting letter"
          aria-controls={stripId}
          aria-expanded={isOpen}
          onClick={() => {
            setStart(clampStart(ALPHABET.indexOf(currentLetter) - 4))
            focusLetter.current = currentLetter
            suppressClick.current = false
            setIsOpen(true)
          }}
          inert={isOpen}
        >
          {currentLetter}
        </button>
        <div
          id={stripId}
          ref={strip}
          className="animal-letter-strip"
          role="group"
          aria-label="Starting letters"
          aria-description="Swipe left or right, scroll, or use arrow keys to browse. Select a letter to jump. Escape closes."
          inert={!isOpen}
          onKeyDown={browseWithKeyboard}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            suppressClick.current = false
            drag.current = {
              pointerId: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              start,
            }
          }}
          onPointerMove={(event) => {
            const gesture = drag.current
            if (!gesture || gesture.pointerId !== event.pointerId) return
            const dx = event.clientX - gesture.x
            const dy = event.clientY - gesture.y
            if (!suppressClick.current) {
              if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
                drag.current = null
                return
              }
              if (Math.abs(dx) <= 8) return
              suppressClick.current = true
              event.currentTarget.setPointerCapture(event.pointerId)
            }
            const letterWidth =
              event.currentTarget.clientWidth / VISIBLE_LETTERS
            if (letterWidth > 0) {
              setStart(clampStart(gesture.start - Math.round(dx / letterWidth)))
            }
          }}
          onPointerUp={() => {
            drag.current = null
          }}
          onPointerCancel={() => {
            drag.current = null
            suppressClick.current = true
          }}
        >
          {ALPHABET.slice(start, start + VISIBLE_LETTERS)
            .split('')
            .map((letter) => {
              const available = availableLetters.includes(letter)
              return (
                <button
                  key={letter}
                  type="button"
                  data-letter={letter}
                  aria-label={`Jump to ${letter}`}
                  aria-pressed={letter === currentLetter}
                  aria-disabled={!available}
                  onClick={(event) => {
                    if (
                      !available ||
                      (event.detail !== 0 && suppressClick.current)
                    )
                      return
                    onSelectLetter(letter)
                    close()
                  }}
                >
                  {letter}
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}
