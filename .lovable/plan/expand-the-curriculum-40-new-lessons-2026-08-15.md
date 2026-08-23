# Expand the curriculum: 40 new lessons

Today the curriculum has 8 lessons (7 at A1, 1 at A2). This adds 40 new lessons — 20 more at A1 level and 20 more at A2 level — each with 8-10 real German exercises, bringing the app to 48 lessons.

## New A1 lessons (20)

Everyday survival topics that build on the existing seven: colours and clothing, shopping and prices, at the bakery, weather and seasons, days and months, hobbies and free time, home and rooms, furniture and household, jobs and professions, school and study, body and health, at the doctor, transport and travel, at the train station, telephone and small talk, invitations and plans, likes and dislikes, animals and pets, city and countryside, and a recap lesson mixing all A1 grammar.

Grammar focus across A1: articles and gender, plurals, present tense regular and irregular verbs, negation (nicht / kein), modal verbs (können, müssen, wollen), accusative case, possessives, separable verbs, imperative for requests.

## New A2 lessons (20)

Building on "Talking About the Past": Perfekt with sein, Präteritum of common verbs, dative case, two-way prepositions, comparatives and superlatives, subordinate clauses with weil/dass, time clauses with wenn/als, future with werden, reflexive verbs, Konjunktiv II politeness, at work and email etiquette, appointments and bureaucracy, renting a flat, banking and money, describing people and character, telling a story, opinions and disagreement, news and media, culture and traditions, and an A2 recap.

## Exercise mix per lesson

Each new lesson gets 8-10 exercises spread over the three phases, matching the existing shape:

- Input: one audio dialogue (2-4 lines of natural German) and one reading passage
- Output: pronounce, fill_blank, word_order, vocab_match, and a writing_prompt
- Feedback: pragmatics_choice plus one or two review-oriented drills

Every exercise carries its dimension (phonology / morphology / syntax / semantics / pragmatics), skill (listening / speaking / reading / writing) and a short German-teaching explanation, so the mastery radar and spaced-repetition queue keep working unchanged.

## Technical notes

- Content is added purely as database rows via migrations — literal INSERT statements for lessons and exercises. No schema change is needed; the existing `lessons`/`exercises` tables and enums already cover everything.
- New lessons continue `order_index` from 9 upward: A1 lessons 9-28, A2 lessons 29-48. The existing A2 "past" lesson stays at index 8.
- Because of the volume (roughly 360 exercise rows), the seed ships as several sequential migrations grouped by lesson batch.
- Frontend change is minimal: the lessons page description/meta text is updated to reflect the larger curriculum, and the list gets grouped by level (A1 section, A2 section) so 48 cards stay browsable.
