# Fix highlight running ahead of the voice

The word highlight currently drifts ahead of the audio. The highlight is driven by a timing estimate that starts the moment playback is requested, so it ignores the delay before the voice actually starts and moves faster than real speech, especially with longer words and sentence punctuation.

## What changes

1. **Start the highlight only when the voice starts.** Instead of scheduling word timers immediately, wait for the speech engine's real start event, then schedule from that moment (with a small safety delay). No word is highlighted before the first sound.

2. **Slow the per-word pacing to match real speech.** Recalibrate the estimate: longer per-character time, a higher minimum per word, and scaling by the selected playback speed. Timing is tuned so the highlight lands slightly behind rather than ahead — trailing reads as natural, leading reads as broken.

3. **Add pauses at punctuation.** Extra delay after commas, and a longer pause after sentence-ending marks (. ! ?) and after a dash or colon, so the highlight waits like the voice does.

4. **Anchor to real progress when available.** When the browser does emit word boundary events, keep using them as the source of truth, but also use them to correct the estimated pace for the remaining words instead of discarding the fallback outright.

5. **Small breathing room between dialogue lines** during "play all", so the highlight does not jump to the next line before the voice moves on.

## Technical notes

- All timing work stays in `useGermanVoice` in `src/lib/speech.ts`: move the `setTimeout` scheduling into the utterance `onstart` handler, add punctuation-aware gaps to the elapsed accumulator, and use boundary events to rescale remaining timers.
- `src/components/exercise-card.tsx` is unchanged apart from the inter-line gap in the full-dialogue playback path.
