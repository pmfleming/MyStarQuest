export const getChoiceFeedbackAnimationStyles = (prefix: string) => `
  @keyframes ${prefix}-pop {
    0% { transform: scale(0.88); }
    70% { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
  @keyframes ${prefix}-fly-away {
    0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
    70% { transform: translateY(-44px) rotate(18deg) scale(0.8); opacity: 0.7; }
    100% { transform: translateY(-84px) rotate(28deg) scale(0.3); opacity: 0; }
  }
`

export const getActivityFeedbackAnimationStyles = (prefix: string) => `
  @keyframes ${prefix}-pop-in {
    0% { transform: scale(0); }
    100% { transform: scale(1); }
  }
  @keyframes ${prefix}-shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
  }
  @keyframes ${prefix}-slide-in-right {
    0% { transform: translateX(28px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
`
