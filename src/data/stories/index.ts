import { story, type Panel } from './seaFriends'

export type Story = {
  id: string
  title: string
  panels: Panel[]
}

export const stories: Story[] = [{ id: 'sea-friends', ...story }]
