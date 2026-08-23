# Re-tune highlight timing to match the voice

The last pass slowed the fallback pacing too much, so the highlight now trails behind the audio. This is a calibration change to the same timing logic — no structural rework.

## What changes

1. **Faster base pace.** The current estimate charges roughly 150 ms per word plus 95 ms per character, which is far slower than real German TTS (~12-14 characters per second at normal speed). Recalibrate to a character-rate model close to actual speech, with a small per-word overhead instead of a large one.

2. **Shorter punctuation pauses.** Sentence-end, clause, and comma pauses drop to realistic values (roughly a third of the current ones) so the highlight does not stall between sentences.

3. **Remove the artificial lead-in delay** added at speech start; highlighting begins with the first word.

4. **Trust real boundary events fully.** When the browser reports word boundaries, the highlight follows them exactly and the estimate for remaining words is rescaled from measured progress — no added lag on top.

5. **Verify against the running app.** Drive the food lesson dialogue in a headless browser with an instrumented speech engine, log highlight timestamps against word-start times, and adjust the constants until the highlight sits within roughly a tenth of a second of each word rather than lagging.

## Technical notes

- All edits are to the `stepAfter` constants, the punctuation gap values, and the `onstart` scheduling offset inside `useGermanVoice` in `src/lib/speech.ts`.
- No component or data changes.
