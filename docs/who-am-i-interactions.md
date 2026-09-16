# Who am I interactions

Animals, insects, dinosaurs and Teeniepings use the same picture gestures in both themes.

| Target                                         | Single click / tap                                | Double click                          |
| ---------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Learning portrait with a real picture          | Switch cartoon / real picture                     | Enlarge / restore the current picture |
| Learning portrait without an alternate picture | No change                                         | Enlarge / restore                     |
| Learning ability clue                          | Switch creature / generic mascot                  | Enlarge / restore the current clue    |
| Other clue cards                               | No change                                         | Enlarge / restore                     |
| Two-player portrait                            | Hide / reveal the answer and its specific ability | Enlarge / restore without revealing   |
| Answer choices and navigation controls         | Select the answer or perform the action           | No separate double-click action       |

Enter or Space activates a picture's single-click action; on pictures without that action it toggles enlargement. Z toggles enlargement and Escape restores normal size. Single pointer actions wait briefly to distinguish a double-click. Pending actions are cancelled on navigation and unmount. Enlarging never changes the selected picture or reveals a hidden answer.

Picture gestures are centralized in `usePictureGestures.ts`; all portraits use `PicturePortrait.tsx`. Fact cards retain their shared in-grid enlargement, while portraits grow within the page.
