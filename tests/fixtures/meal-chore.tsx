import { createRoot } from 'react-dom/client'
import MealChoreFixture from './MealChoreFixture'
import '../../src/index.css'
const themeId =
  new URLSearchParams(location.search).get('theme') === 'princess'
    ? 'princess'
    : 'teenie'
createRoot(document.getElementById('root')!).render(
  <MealChoreFixture themeId={themeId} />
)
