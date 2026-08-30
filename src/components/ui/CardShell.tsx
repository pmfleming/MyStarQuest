import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'

type CardShellProps = {
  theme: Theme
  header?: ReactNode
  body?: ReactNode
  status?: ReactNode
  footer?: ReactNode
  variant?: 'default' | 'highlighted' | 'editing' | 'add'
  className?: string
  style?: CSSProperties
  ariaBusy?: boolean
}

const hasContent = (content: ReactNode) =>
  content !== undefined && content !== null && content !== false

const CardRegion = ({
  name,
  children,
}: {
  name: 'header' | 'body' | 'status' | 'footer'
  children: ReactNode
}) => (
  <div
    data-card-region={name}
    style={{
      minWidth: 0,
      ...(name === 'header'
        ? {
            minHeight: `${uiTokens.listActionHeight}px`,
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
          }
        : {}),
    }}
  >
    {children}
  </div>
)

const CardShell = forwardRef<HTMLElement, CardShellProps>(function CardShell(
  {
    theme,
    header,
    body,
    status,
    footer,
    variant = 'default',
    className = '',
    style,
    ariaBusy,
  }: CardShellProps,
  ref
) {
  const isHighlighted = variant === 'highlighted'
  const isEditing = variant === 'editing'
  const isAdd = variant === 'add'
  const isDarkTheme = theme.id === 'space'

  const baseStyle: CSSProperties = {
    width: '100%',
    maxWidth: `${uiTokens.contentMaxWidth}px`,
    boxSizing: 'border-box',
    borderRadius: `${uiTokens.listItemRadius}px`,
    padding: `${uiTokens.listItemPadding}px`,
    borderWidth: `${uiTokens.listItemBorderWidth}px`,
    borderStyle: isAdd ? 'dashed' : 'solid',
    borderColor:
      isEditing || isAdd ? theme.colors.primary : theme.colors.surface,
    background: isHighlighted
      ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
      : theme.colors.surface,
    color: isHighlighted ? (isDarkTheme ? '#000' : '#FFF') : theme.colors.text,
    boxShadow:
      isEditing || isAdd
        ? `0 10px 20px -5px ${theme.colors.primary}20`
        : `0 10px 20px -5px ${theme.colors.primary}30, 0 6px 0 ${theme.colors.surface}66 inset`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${uiTokens.panelStackGap}px`,
    contentVisibility: 'auto',
    containIntrinsicSize: 'auto 420px',
    ...style,
  }

  return (
    <article
      ref={ref}
      className={className}
      style={baseStyle}
      data-card-shell="true"
      data-card-variant={variant}
      aria-busy={ariaBusy || undefined}
    >
      {hasContent(header) && <CardRegion name="header">{header}</CardRegion>}
      {hasContent(body) && <CardRegion name="body">{body}</CardRegion>}
      {hasContent(status) && <CardRegion name="status">{status}</CardRegion>}
      {hasContent(footer) && <CardRegion name="footer">{footer}</CardRegion>}
    </article>
  )
})

export default CardShell
