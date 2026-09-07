import {
  createContext,
  useContext,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from 'react'

// Each action card owns its artwork; embedded activities can reflect their current selection.
export const PrimaryActionImageContext = createContext<Dispatch<
  SetStateAction<string | null>
> | null>(null)

export function usePrimaryActionImage(image: string | null) {
  const setImage = useContext(PrimaryActionImageContext)
  useEffect(() => {
    setImage?.(image)
    return () => setImage?.(null)
  }, [image, setImage])
}
