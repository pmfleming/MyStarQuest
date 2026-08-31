import type { ReactNode } from 'react'
import type { ActionConfig, ActionVariant } from './standardActionListTypes'

export const resolveActionValue = <T>(
  value: string | ReactNode | ((item: T) => string | ReactNode),
  item: T
) => (typeof value === 'function' ? value(item) : value)

export const resolveActionText = <T>(
  value: string | ((item: T) => string),
  item: T
) => (typeof value === 'function' ? value(item) : value)

export const resolveActionVariant = <T>(
  value: ActionConfig<T>['variant'],
  item: T,
  fallback: ActionVariant
): ActionVariant =>
  typeof value === 'function' ? value(item) : (value ?? fallback)

export const resolveActionBoolean = <T>(
  value: boolean | ((item: T) => boolean) | undefined,
  item: T,
  fallback = false
) => (typeof value === 'function' ? value(item) : (value ?? fallback))
