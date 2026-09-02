# Expand the curriculum to 48 lessons

The existing database already holds the first 8 lessons (order_index 1-8). We will add the remaining 40 lessons so the curriculum reaches 48 lessons total: A1 lessons 9-28 and A2 lessons 29-48.

## What already exists

- `scripts/seed/a1.ts` contains 20 new A1 lessons (colours-clothing through a1-recap) ready to be migrated.
- There is no A2 seed file yet, so we will create one with 20 A2 lessons covering Perfekt, Präteritum, dative, two-way prepositions, comparatives, subordinate clauses, future, reflexive verbs, Konjunktiv II politeness, work/email, appointments, renting, banking, describing people, storytelling, opinions, news/media, culture/traditions, and an A2 recap.

## Steps

1. **Create A2 seed content** (`scripts/seed/a2.ts`)
   - 20 lessons matching the topics from the approved plan.
   - Each lesson follows the same shape as `a1.ts`: dialogue, reading, pronunciation, fill-blanks, word-order, vocabulary matching, pragmatics choice, and writing prompt.
   - Every exercise carries the correct dimension, skill, phase, type, and teaching explanation.

2. **Generate migration SQL**
   - Convert both `scripts/seed/a1.ts` and `scripts/seed/a2.ts` into Supabase migration files.
   - Each migration inserts rows into `lessons` and `exercises` using literal INSERT statements.
   - Lessons use order_index 9-28 for A1 and 29-48 for A2.
   - Exercises use sequential order_index values per lesson and reference the inserted lesson IDs.
   - No schema changes are needed; the existing tables and enums already cover everything.

3. **Update the lessons page** (`src/routes/lessons.tsx`)
   - Group the lesson cards by level: an A1 section followed by an A2 section.
   - Update the route head metadata to describe the 48-lesson curriculum.
   - Keep progress bars and completion checks working.

4. **Verify**
   - Run the migrations against Lovable Cloud.
   - Type-check the frontend changes.
   - Spot-check a few lessons in the preview to confirm they render with exercises grouped correctly.
