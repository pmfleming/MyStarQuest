import type { Story } from '../data/stories'

export function getStoryChapters(story: Pick<Story, 'chapters' | 'panels'>) {
  return (story.chapters ?? []).flatMap((chapter) => {
    const page = story.panels.findIndex((panel) => panel.id === chapter.panelId)
    return page < 0
      ? []
      : [
          {
            ...chapter,
            page,
            image: chapter.image ?? story.panels[page]!.image,
          },
        ]
  })
}

export function currentStoryChapter(
  chapters: ReturnType<typeof getStoryChapters>,
  page: number
) {
  return (
    chapters.filter((chapter) => chapter.page <= page).at(-1) ?? chapters[0]
  )
}
