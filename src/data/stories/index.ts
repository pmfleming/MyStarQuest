import { story, type Chapter, type Panel } from './seaFriends'

export type Story = {
  id: string
  title: string
  panels: Panel[]
  chapters?: Chapter[]
}

export const stories: Story[] = [{ id: 'sea-friends', ...story }]
