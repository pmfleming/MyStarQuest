import React from 'react'
import { createRoot } from 'react-dom/client'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import '../../src/index.css'
const theme =
  new URLSearchParams(location.search).get('theme') === 'teenie'
    ? themes.teenie
    : themes.princess
createRoot(document.getElementById('root')!).render(
  <main
    style={{
      maxWidth: 380,
      margin: '12px auto',
      padding: 8,
      background: theme.colors.bg,
    }}
  >
    <AnimalTester
      theme={theme}
      totalProblems={1}
      starReward={3}
      isRunning={true}
      onAdjustProblems={() => {}}
      onStarsChange={() => {}}
      onComplete={() => {}}
    />
  </main>
)
