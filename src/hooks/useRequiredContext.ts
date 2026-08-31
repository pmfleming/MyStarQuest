import { useContext, type Context } from 'react'

export const useRequiredContext = <T>(
  context: Context<T | undefined>,
  hookName: string,
  providerName: string
) => {
  const value = useContext(context)
  if (value === undefined) {
    throw new Error(`${hookName} must be used within a ${providerName}`)
  }
  return value
}
