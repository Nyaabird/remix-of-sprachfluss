import { useCallback, useEffect, useRef, useState } from "react";

type SpeakOptions = { rate?: number };

export type SpeechMark = { text: string; charIndex: number; charLength: number };

export function useGermanVoice() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [mark, setMark] = useState<SpeechMark | null>(null);
  // Guards against events from a cancelled utterance clearing the new one's state.
  const tokenRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  }, []);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return clearTimers;
  }, [clearTimers]);

  const speak = useCallback(
    (text: string, { rate = 1 }: SpeakOptions = {}) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const token = ++tokenRef.current;
      clearTimers();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.rate = rate;
      const german = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("de"));
      if (german) utterance.voice = german;

      // Some WebKit and mobile voices never emit `boundary` events, so we keep a
      // timing estimate as a fallback, calibrated to real speaking pace. Real
      // boundary events always win and also rescale the remaining estimate.

      const words = Array.from(text.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’.-]*/gu)).map(
        (word) => ({
          charIndex: word.index,
          charLength: word[0].length,
        }),
      );
      const safeRate = Math.max(0.5, Math.min(rate, 2));

      // Duration of a word plus any pause implied by the punctuation after it.
      // Calibrated to real German TTS: roughly 13-14 characters per second at
      // rate 1, with a small per-word overhead.
      const stepAfter = (index: number) => {
        const word = words[index];
        if (!word) return 0;
        let ms = 55 + word.charLength * 70;
        const next = words[index + 1];
        const gap = text.slice(
          word.charIndex + word.charLength,
          next ? next.charIndex : text.length,
        );
        if (/[.!?…]/.test(gap)) ms += 150;
        else if (/[—–:;]/.test(gap)) ms += 90;
        else if (/,/.test(gap)) ms += 60;
        return ms / safeRate;
      };

      // Schedules the highlight for `from` onwards, `base` ms from now.
      const schedule = (from: number, base: number, scale: number) => {
        let elapsed = base;
        for (let i = from; i < words.length; i += 1) {
          const word = words[i]!;
          const at = elapsed;
          timerRef.current.push(
            setTimeout(() => {
              if (token === tokenRef.current) setMark({ text, ...word });
            }, at),
          );
          elapsed += stepAfter(i) * scale;
        }
      };

      let started = 0;
      let receivedBoundary = false;
      setSpeaking(true);
      setMark(null);

      utterance.onstart = () => {
        if (token !== tokenRef.current) return;
        started = Date.now();
        setSpeaking(true);
        if (!receivedBoundary) {
          clearTimers();
          schedule(0, 0, 1);
        }
      };
      utterance.onboundary = (event) => {
        if (token !== tokenRef.current) return;
        receivedBoundary = true;
        clearTimers();
        const charIndex = event.charIndex ?? 0;
        const charLength = event.charLength ?? 0;
        let index = words.findIndex(
          (word) => charIndex >= word.charIndex && charIndex < word.charIndex + word.charLength,
        );
        if (index === -1) index = words.findIndex((word) => word.charIndex >= charIndex);
        if (index === -1) {
          if (charLength > 0) setMark({ text, charIndex, charLength });
          return;
        }
        const word = words[index]!;
        setMark({ text, ...word });

        // Use real progress to rescale the estimate, then keep the fallback
        // running for the remaining words in case boundaries stop arriving.
        let scale = 1;
        if (started && index > 0) {
          let estimated = 0;
          for (let i = 0; i < index; i += 1) estimated += stepAfter(i);
          const actual = Date.now() - started;
          if (estimated > 0 && actual > 0) scale = Math.min(2.5, Math.max(0.6, actual / estimated));
        }
        schedule(index + 1, stepAfter(index) * scale, scale);
      };
      utterance.onend = () => {
        if (token !== tokenRef.current) return;
        clearTimers();
        setSpeaking(false);
        setMark(null);
      };
      utterance.onerror = () => {
        if (token !== tokenRef.current) return;
        clearTimers();
        setSpeaking(false);
        setMark(null);
      };
      window.speechSynthesis.speak(utterance);
    },
    [clearTimers],
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      tokenRef.current += 1;
      clearTimers();
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setMark(null);
    }
  }, [clearTimers]);

  return { speak, stop, supported, speaking, mark };
}

type RecognitionResult = { transcript: string };

export function useSpeechInput() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    setSupported(Boolean(w["SpeechRecognition"] || w["webkitSpeechRecognition"]));
  }, []);

  const listen = useCallback(async (): Promise<RecognitionResult | null> => {
    if (typeof window === "undefined") return null;
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w["SpeechRecognition"] || w["webkitSpeechRecognition"]) as
      | (new () => {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
          start: () => void;
          stop: () => void;
          onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
        })
      | undefined;
    if (!Ctor) return null;

    return new Promise((resolve) => {
      const recognition = new Ctor();
      recognition.lang = "de-DE";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      let settled = false;
      setListening(true);
      recognition.onresult = (event) => {
        settled = true;
        resolve({ transcript: event.results[0][0].transcript });
      };
      recognition.onerror = () => {
        if (!settled) resolve(null);
        settled = true;
      };
      recognition.onend = () => {
        setListening(false);
        if (!settled) resolve(null);
      };
      recognition.start();
    });
  }, []);

  return { listen, listening, supported };
}
