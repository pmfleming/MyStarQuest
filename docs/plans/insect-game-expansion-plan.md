# Animals and Insects game expansion

Status: implemented, 5 September 2026. The Insects game has 31 creatures (30 insects plus the user-requested tarantula), an image-only Animals / Insects selector at the standard height and spacing, and four clue cards. Only SPECIAL has a princess-bear alternative. See `docs/assets/insect-content-notes.md` for content decisions and asset provenance.

## Agreed direction

Add an Animals / Insects picture selector above Learn / 1 Player / 2 Players. Preserve the existing game modes, rewards, and four-card layout. Default to Animals. Insects use HOME, FOOD, LOOKS, and SPECIAL. The audience is a five-year-old.

Expand the original eight insects to a proposed collection of 30, drawing on familiar garden, pond, and household insects in Ireland, the Netherlands, and Taiwan. The collection is a union of regional experiences, not a claim that every insect is common in all three countries. Country filters are not part of this version.

## Proposed collection

The original eight remain:

1. Ant
2. Honeybee
3. Butterfly
4. Ladybird
5. Grasshopper
6. Dragonfly
7. Stick insect
8. Stag beetle

Add these 18 garden, pond, and household insects, with representative species chosen from the three countries:

9. Bumblebee
10. Moth
11. Wasp
12. Hoverfly
13. Housefly
14. Mosquito
15. Crane fly
16. Earwig
17. Shieldbug
18. Damselfly
19. Cricket
20. Water strider
21. Aphid
22. Lacewing
23. Diving beetle
24. Fruit fly
25. Silverfish
26. Cockroach

Add four especially useful Taiwan connections:

27. Cicada
28. Firefly
29. Praying mantis
30. Rhinoceros beetle

Follow-up: move Tarantula from Animals into this collection as entry 31. It remains an arachnid in the content data, with Burrow, Insects, Eight hairy legs, and Make silk clues. Supply a new eight-legged portrait, silk-lining ability illustration, and matching princess-bear alternative, all with transparent backgrounds. This is an explicitly requested game grouping rather than an addition to the regional insect list.

Regional selection priorities:

- Ireland: common pollinators and garden insects, including bumblebees, hoverflies, butterflies, moths, and ladybirds.
- Netherlands: garden insects plus pond and ditch wildlife, particularly dragonflies, damselflies, and water striders.
- Taiwan: retain the everyday insects and add cicadas, seasonal fireflies, mantises, and rhinoceros beetles; cockroaches are also relevant to everyday recognition.
- Stick insects and stag beetles remain interesting members of the original set, but must not be described as common Irish garden insects. Firefly encounters depend on habitat and season.

These are child-facing group names. Before artwork production, choose a representative species and life stage for each entry and verify its regional occurrence and four facts. This avoids depicting one species while teaching facts that only apply to another. Do not add scientific names to the main child-facing cards.

## Four categories

| Card    | Child's question          | Content                                                                                                                |
| ------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| HOME    | Where can I find it?      | One recognisable place: garden plants, grass, pond, trees, soil, or an indoor hiding place. This need not be its nest. |
| FOOD    | What does it eat?         | One simple, accurate food example for the illustrated life stage.                                                      |
| LOOKS   | What does it look like?   | A useful identifying feature: pattern, shape, antennae, wings, or legs.                                                |
| SPECIAL | What is special about it? | A distinctive behaviour or capability, preferably different from its appearance clue.                                  |

Use a large picture and a short phrase. Store an optional short explanatory sentence for an adult to read. Keep appearances and behaviour distinct; avoid generic facts such as 'can fly' across most of the collection.

Use adult insects for the initial collection. Caterpillars can appear in butterfly life-cycle teaching later, rather than being presented as an unrelated insect type. Spiders, snails, worms, and woodlice do not belong in the Insects collection.

## Image scope

Implementation detail: LOOKS uses a magnified detail of each custom portrait, positioned on the identifying feature. It has no alternative version.

Every insect receives a custom full-body portrait and a custom SPECIAL image showing that insect performing its ability. The SPECIAL card alone has a second image: **the existing princess bear performing the same ability**, matching the animal game.

| Image/card | Required artwork                                                   | Second version?                                |
| ---------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| Portrait   | A clear custom illustration of the insect                          | No                                             |
| HOME       | A recognisable habitat scene                                       | No                                             |
| FOOD       | A clear illustration of the selected food                          | No                                             |
| LOOKS      | A feature-focused illustration of the identifying pattern or shape | No                                             |
| SPECIAL    | The insect performing its ability                                  | Yes: princess bear performing the same ability |

For 30 insects, plan **30 custom portraits and 30 custom insect-ability scenes**, plus the HOME, FOOD, and LOOKS illustrations and the princess-bear ability bank. Reuse suitable habitat and food images across entries, as the animal game does. Final additional asset counts follow from the fact matrix. This replaces the earlier 150-custom-image proposal and four-category generic bank.

Every insect must have a matching princess-bear ability alternative. Where two insects have exactly the same ability, they may share a bear image keyed by that ability. Existing insect and princess-bear art can be reused only after checking its accuracy and style; do not automatically count it as finished.

Example pairs: grasshopper jumping / princess bear jumping; ant carrying a heavy load / princess bear carrying a heavy load; stick insect hiding among twigs / princess bear camouflaging among twigs. The bear must demonstrate the same action, rather than hold a picture of the insect or merely stand beside it.

HOME and FOOD should show the setting and food without a full answer insect. LOOKS should emphasise a distinguishing feature rather than repeat the full portrait. These three cards have one illustration each and stay the same when SPECIAL switches versions.

Use the existing animal illustration style and the exact existing princess-bear character as references. Keep actual insect anatomy, antennae, and relevant features accurate; use friendly presentation and uncluttered scenes. There is one common insect art set, rather than a separate set for every app theme. Follow the existing princess-bear fallback across themes.

Keep words out of generated image pixels; render labels in the app. Use consistent composition, generous crop margins, and assets that remain legible at the existing card and answer-button sizes.

## Game behaviour

- Learn: show the portrait and four clues. Only SPECIAL toggles between the insect and princess-bear ability images, matching the current animal ability-card toggle.
- 1 Player, Easy: SPECIAL shows the insect performing its ability, following the existing easy animal mode. All three answer choices come from the selected collection.
- 1 Player, Hard: SPECIAL shows the princess bear performing that ability. HOME, FOOD, and LOOKS retain their single images.
- 2 Players: hiding the portrait switches SPECIAL to the princess bear; revealing restores the insect ability image. The other three clue images stay the same.
- Reveal clues in HOME, FOOD, LOOKS, SPECIAL order in solo mode, preserving the existing reveal timing initially.
- Choose answer alternatives whose full clue combinations are distinguishable. Avoid relying on reading to distinguish visually similar insects; honeybee/bumblebee/hoverfly and dragonfly/damselfly need particular review.
- Keep sessions short with the existing question count. A larger collection does not require a longer game.
- Keep the collection selector visible at the top; disable changing it during a scored round. In Learn, changing collection returns to its first entry and resets the SPECIAL toggle.

## Implementation sequence

1. Complete a 30-row content and art matrix: child-facing name, representative species, stage/sex where relevant, regional evidence, four phrases, four explanatory facts, image prompts, and one princess-bear ability asset key.
2. Review existing portrait, clue, and princess-bear art. Prepare a style reference and one complete insect image set with its bear ability alternative, then check it in the actual card layout before producing the remaining assets. This is a visual QA step, not an additional permission gate.
3. Produce and inspect all custom images and the deduplicated princess-bear ability bank. Verify each portrait and ability scene depicts the same insect, and each bear performs the matching action without revealing the insect's identity.
4. Make the current four-card rendering collection-aware. Add insect data and asset catalogs, reusable clue definitions, and a collection selector using the existing segmented control.
5. Move the existing ant, bee, and butterfly game entries into Insects without deleting shared art used elsewhere. Preserve other activities using the existing asset catalog.
6. Verify complete asset coverage, same-collection answer choices, clue toggles, hidden-answer behaviour, collection switching/reset, rewards, and existing animal gameplay. Inspect phone layouts and image loading with the larger asset collection.

## Research basis and limits

These sources support the regional selection direction. The complete 30-entry, species-level fact check is a planned content-production step; the shortlist is not a verified distribution checklist.

- [Ireland: bee and hoverfly species accounts](https://biodiversityireland.ie/updated-species-accounts-for-all-97-irish-bees-180-irish-hoverflies/).
- [Ireland: common bumblebee monitoring](https://biodiversityireland.ie/surveys/bumblebee-monitoring-scheme/).
- [Ireland: garden butterfly monitoring](https://biodiversityireland.ie/surveys/garden-butterfly-monitoring-scheme/).
- [Netherlands: Naturalis garden bee-count resources](https://www.naturalis.nl/lang-leve/lang-leve-wilde-bij).
- [Netherlands: dragonflies and damselflies](https://www.natuurmonumenten.nl/dieren/libellen).
- [Taiwan: seasonal insect and firefly encounters](https://www.taiwan.nps.gov.tw/home/en-us/NP_Quarterly/31698/9465).
- [Taipei Zoo: rhinoceros beetles, tree sap, seasonality, and male/female differences](https://www.zoo.gov.taipei/News_Content.aspx?n=BD065B2FA7782989&s=5BAE3FE572AA2B0F&sms=72544237BBE4C5F6).
- [Taipei Zoo: dragonfly and damselfly teaching](https://www.zoo.gov.tw/2021Dragonfly/introducing.html).
- [Taiwan National Museum of Natural Science: household arthropod exhibition](https://web3.nmns.edu.tw/Exhibits/107/dobug/learning.html). This exhibition also includes non-insects; only appropriate insect entries inform this plan.
