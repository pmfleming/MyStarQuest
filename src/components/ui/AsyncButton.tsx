import type { ComponentPropsWithRef, MouseEvent } from 'react'
import { useAsyncAction } from './useAsyncAction'

type AsyncButtonProps = Omit<ComponentPropsWithRef<'button'>, 'onClick'> & {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<void>
}

/** Owns promise settlement at the DOM boundary; clicking again retries failures. */
export const AsyncButton = ({
  onClick,
  disabled,
  ...props
}: AsyncButtonProps) => {
  const { pendingAction, actionError, runAction } = useAsyncAction<'click'>()
  return (
    <>
      <button
        {...props}
        disabled={disabled || pendingAction !== null}
        aria-busy={pendingAction !== null || props['aria-busy']}
        onClick={(event) => {
          void runAction(props['aria-label'] ?? 'Action', 'click', () =>
            onClick?.(event)
          )
        }}
      />
      {actionError && <p role="alert">{actionError}</p>}
    </>
  )
}
