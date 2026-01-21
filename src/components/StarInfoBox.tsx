import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'

type StarInfoBoxProps = {
  theme: Theme
  totalStars: number
}

const StarInfoBox = ({ theme, totalStars }: StarInfoBoxProps) => (
  <section
    className="relative z-10 transform rounded-3xl p-6 text-center transition-transform hover:scale-[1.02]"
    style={{
      backgroundColor: theme.colors.surface,
      boxShadow: `0 8px 0 ${theme.colors.accent}, 0 10px 30px -10px ${theme.colors.primary}40`,
      border: `5px solid ${theme.colors.primary}`,
      marginBottom: `${uiTokens.singleVerticalSpace}px`,
    }}
  >
    <h2 className="mb-2 text-sm font-semibold tracking-[3px] uppercase opacity-70">
      Your Stars
    </h2>
    <div className="flex items-center justify-center gap-3">
      <span className="star-bounce text-[56px]">⭐</span>
      <span
        style={{
          fontSize: '72px',
          fontWeight: 900,
          lineHeight: 1,
          color: theme.colors.primary,
          fontFamily: theme.fonts.heading,
          textShadow:
            theme.id === 'space'
              ? `0 0 20px ${theme.colors.primary}80`
              : `2px 2px 0px ${theme.colors.accent}`,
        }}
      >
        {totalStars}
      </span>
    </div>
  </section>
)

export default StarInfoBox
