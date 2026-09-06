import { createContext } from 'react'

// Lists know which overview is initially visible; image components do not.
export const ImageLoadingContext = createContext<'eager' | 'lazy'>('lazy')
