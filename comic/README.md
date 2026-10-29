# Sea friends action comic

A separate desktop-browser comic reader. The cover is followed by 47 wordless
panels illustrating the author's opening: Odette eats poffertjes by the sea,
feels drawn to the water, jumps in and becomes a mermaid, meets her friends,
plays with them while Doremi sings and plays guitar, and travels with them to
a distant castle. After the friends enter, two little floating helpers make ice
creams in the castle kitchen. Two more helpers zoom through the hall, dusting
and mopping at super speed. The aqua and pink heart-faced helpers happily paint
pictures to decorate the castle. The lilac helper tidies books and toys while
the other six helpers continue their chores in the background. Mermaid Odette
and Rainbow Ping greet all seven helpers, then invite them on an adventure to
discover the wonders of the sea outside the castle. They find a diamond mine
nearby, where all seven helpers help the two friends gather baskets of diamonds.
Odette uses the diamonds to create a bright, sparkling room in her castle,
filled with reflections in its diamond walls and polished floor.
At night everyone brushes their teeth and wears pyjamas. Primarina and Aquafox,
Tangy and Sweet, Eclipse and Diana, Hopping and Doremi, and mermaid Odette and
Rainbow each share a themed room with separate beds. The seven little helpers
share one cosy nursery. Everyone sleeps, ready for a new day.
Morning sunlight fills their bedrooms as everyone wakes up. All ten friends and
seven helpers then enjoy ice cream for breakfast together in the sunny castle.
Odette, Diana and Eclipse then gaze into a sparkling magic mirror, with all
seven little house helpers floating around them.
The mirror swirls pink and opens into a glowing portal as they watch.
A rushing magical current sweeps the three girls and all seven helpers into it.
They emerge outside the front doors of a sky castle among the clouds. Odette has
transformed into Angel Odette with legs and feathered wings; Eclipse and Diana
also have wings, while all seven helpers continue flying around them.
Aurora greets the visitors and apologises for bringing them to the sky, with
four unidentified figures standing behind her in shadow and mist. This reverse
view uses the supplied character images as overlays, without regenerating them.
The specific apology is recorded in accessible story metadata; the artwork stays wordless.
The mystery turns into a happy surprise: Aurora has just completed a new sky
playground and could not wait to invite her friends. She reveals its rainbow
slide, shell swings, cloud trampolines and climbing bridge, with the four
visitors now shown in full colour using their original supplied images.
Six close-up playground scenes follow, each featuring two or three friends:
Odette, Aurora and the coral helper at the slide; Eclipse, Diana and the crystal
helper at the swings; two visitors on stepping stones; two on the roundabout;
the yellow and mint-curl helpers on trampolines; and the lilac, cyan and heart
helpers crossing the rope bridge. Original character cutouts are composited
over new empty scenery plates without regenerating the character artwork.
Dingdong then arrives to invite Odette, Aurora and Eclipse to space. The three
friends put on matching yellow spacesuits, cat-ear helmets and rocket packs.
These two panels are newly illustrated scenes with natural gestures and
consistent lighting. Dingdong helps secure Aurora's back-mounted rocket pack,
Odette adjusts her helmet, and Eclipse checks her wrist control. Each pack is
attached behind the body with visible shoulder straps, matching Dingdong's design.

From the repository root:

```sh
npm run dev:comic
npm run build:comic
npm run preview:comic
```

You can also run `npm run dev`, `npm run build`, or `npm run preview` directly
inside `comic/`, which has its own package and Vite configuration. The tools are
provided by the parent repository's installed dependencies; run `npm install`
at the repository root when setting up a fresh checkout.

| Application     | Source / configuration            | Build output                   | Local address          |
| --------------- | --------------------------------- | ------------------------------ | ---------------------- |
| Main app        | `src/`, root `vite.config.ts`     | `dist/`                        | http://127.0.0.1:5173/ |
| Comic website   | `comic/`, `comic/vite.config.ts`  | `comic/dist/`                  | http://127.0.0.1:5174/ |
| Android wrapper | `android/`, `capacitor.config.ts` | Packages the main `dist/` only | Native app             |

Run `npm run dev` in one terminal at the repository root and `npm run dev:comic`
in another to access both websites simultaneously. Each server uses a fixed,
different port and fails clearly if that port is occupied instead of silently
moving onto the other website's address. The comic has a separate Vite cache
at `node_modules/.vite-comic`; rebuilding it only clears `comic/dist/`.
Different local origins also keep the main app's service worker and browser
storage separate from the comic.

The comic is website-only, with an image-only desktop book presentation.
There is no phone-specific layout, Android wrapper, login or service worker.
Production preview uses http://127.0.0.1:4174/. Public hosting is not configured;
the main app's Firebase hosting configuration remains separate.

## Shared artwork

The main MyStarQuest app also includes this story under Tests → Stories.
Its integrated reader fills the screen, preserves artwork proportions on white,
and provides page scrubbing and a return button. Phones use a landscape canvas
with controls revealed from the bottom; Android locks to landscape while reading.

The reader imports the original assets directly from `../src/assets/teenie/`
and `../src/assets/comic/`. Vite packages
only the imported files into the standalone website build. Shared source assets
are not duplicated into the comic source tree. It does not import the core app's
components, Firebase initialization, Capacitor, or global styling.

## Adding the author's story

Edit the shared story in `../src/data/stories/seaFriends.ts`, re-exported by
`src/story.ts`. Each panel provides a unique ID, an accessible label,
image import, descriptive alt text, color tone, framing (`poster` or `character`),
aspect ratio, maximum width and optional subtle zoom. Array order defines reading order; the first
image is the cover. The story uses portrait, landscape and square panels.
Full scene illustrations use `poster` framing, which preserves the entire image.

The space journey continues with the golden star planet and Dingdong, Odette,
Aurora and Eclipse flying toward it with back-mounted rocket packs. These two
wordless panels follow the matching-spacesuits scene. Their generation prompts
are recorded in `../docs/assets/comic-star-planet-prompts.json`.

Only images, black panel outlines and white page margins are visible. There are
no headings, captions, toolbars, thumbnails, counters or on-screen controls.
Click the right portion of the page to advance, or the left portion to go back.
Right/left arrows and Page Down/Up also turn panels; Home returns to the cover,
End reaches the final panel, and Space advances. Invisible page-turn buttons
remain keyboard-accessible, with focus outlines and screen-reader labels.

Each panel stays until the reader turns the page. Images crossfade while the
outline smoothly changes dimensions, preserving white space around different
panel proportions. Selected scenes slowly zoom by 1.2%; character cutouts can
gently drift. System reduced-motion
preferences disable all transitions and movement. Navigation stops at each end.

No hosting or publication is configured yet; `comic/dist/` can be deployed as a
standalone static website without an Android app or the core website server.
