import { useMemo, useState } from "react";
import { Check, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGermanVoice, useSpeechInput, type SpeechMark } from "@/lib/speech";
import { normalise, type Exercise } from "@/lib/learn";

type Props = {
  exercise: Exercise;
  speed: number;
  submitted: boolean;
  onSubmit: (correct: boolean, response: string) => void;
};

function OptionList({
  options,
  chosen,
  submitted,
  answer,
  onChoose,
}: {
  options: string[];
  chosen: number | null;
  submitted: boolean;
  answer: number;
  onChoose: (index: number) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((option, index) => {
        const isChosen = chosen === index;
        const reveal = submitted && index === answer;
        const wrong = submitted && isChosen && index !== answer;
        return (
          <button
            key={option}
            type="button"
            disabled={submitted}
            onClick={() => onChoose(index)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
              reveal
                ? "border-secondary bg-secondary/15 text-cream"
                : wrong
                  ? "animate-nudge border-primary/70 bg-primary/10 text-cream"
                  : isChosen
                    ? "border-primary bg-primary/15 text-cream"
                    : "border-border bg-background/30 text-cream/85 hover:border-primary/60"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function SpeakButton({
  text,
  speed,
  label,
  onPlay,
  speaking: speakingProp,
}: {
  text: string;
  speed: number;
  label?: string;
  onPlay?: (text: string) => void;
  speaking?: boolean;
}) {
  const { speak, speaking } = useGermanVoice();
  const isSpeaking = speakingProp ?? speaking;
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => (onPlay ? onPlay(text) : speak(text, { rate: speed }))}
      className="h-9 gap-2 rounded-full border border-border px-3 text-xs text-cream/80 hover:bg-muted"
    >
      <Volume2 className={`size-4 ${isSpeaking ? "animate-pulse text-primary" : ""}`} strokeWidth={1.6} />
      {label ?? "Play"}
    </Button>
  );
}

function SpokenText({
  text,
  mark,
  offset = 0,
  className,
}: {
  text: string;
  mark: SpeechMark | null;
  offset?: number;
  className?: string;
}) {
  const tokens: { value: string; start: number }[] = [];
  const regex = /\S+|\s+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({ value: match[0], start: match.index });
  }

  return (
    <p className={className}>
      {tokens.map((token, i) => {
        const absStart = token.start + offset;
        const active =
          !!mark &&
          !/^\s+$/.test(token.value) &&
          absStart < mark.charIndex + mark.charLength &&
          mark.charIndex < absStart + token.value.length;
        return (
          <span
            key={`${token.start}-${i}`}
            data-speaking-word={active ? "true" : undefined}
            className={
              active
                ? "rounded-sm bg-primary px-0.5 text-primary-foreground shadow-sm transition-colors"
                : "transition-colors"
            }
          >
            {token.value}
          </span>
        );
      })}
    </p>
  );
}


type Content = Record<string, string>;

export function ExerciseCard({ exercise, speed, submitted, onSubmit }: Props) {
  const content = exercise.content as unknown as Content;

  switch (exercise.type) {
    case "audio_dialogue":
      return <AudioDialogue {...{ content, speed, submitted, onSubmit }} />;
    case "reading_passage":
      return <ReadingPassage {...{ content, speed, submitted, onSubmit }} />;
    case "pragmatics_choice":
      return <PragmaticsChoice {...{ content, submitted, onSubmit }} />;
    case "fill_blank":
      return <FillBlank {...{ content, submitted, onSubmit }} />;
    case "word_order":
      return <WordOrder {...{ content, submitted, onSubmit }} />;
    case "vocab_match":
      return <VocabMatch {...{ content, speed, submitted, onSubmit }} />;
    case "pronounce":
      return <Pronounce {...{ content, speed, submitted, onSubmit }} />;
    case "writing_prompt":
      return <WritingPrompt {...{ content, submitted, onSubmit }} />;
    default:
      return null;
  }
}



function AudioDialogue({
  content,
  speed,
  submitted,
  onSubmit,
}: {
  content: Content;
  speed: number;
  submitted: boolean;
  onSubmit: (c: boolean, r: string) => void;
}) {
  const lines = content["lines"] as unknown as { speaker: string; de: string; en: string }[];
  const options = content["options"] as unknown as string[];
  const answer = content["answer"] as unknown as number;
  const [chosen, setChosen] = useState<number | null>(null);
  const [shown, setShown] = useState<number[]>([]);
  // null = whole dialogue, number = that single line is playing
  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const { speak, speaking, mark } = useGermanVoice();

  const fullText = lines.map((l) => l.de).join(" ");
  const offsets: number[] = [];
  let cursor = 0;
  for (const line of lines) {
    offsets.push(cursor);
    cursor += line.de.length + 1;
  }

  const isFull = playingLine === null;

  const markFor = (line: string, index: number): SpeechMark | null => {
    if (!mark) return null;
    if (isFull) {
      if (mark.text !== fullText) return null;
      const offset = offsets[index] ?? 0;
      if (mark.charIndex >= offset && mark.charIndex < offset + line.length) return mark;
      return null;
    }
    return playingLine === index && mark.text === line ? mark : null;
  };

  const offsetFor = (index: number) => (isFull ? (offsets[index] ?? 0) : 0);


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-lg text-cream">{content["title"]}</h3>
        <SpeakButton
          text={fullText}
          speed={speed}
          label="Play dialogue"
          speaking={speaking && isFull}
          onPlay={(t) => {
            setPlayingLine(null);
            speak(t, { rate: speed });
          }}
        />
      </div>
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div key={`${line.de}-${index}`} className="rounded-xl border border-border/70 bg-background/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary/80">{line.speaker}</p>
            <SpokenText
              text={line.de}
              mark={markFor(line.de, index)}
              offset={offsetFor(index)}
              className="mt-1 font-serif text-base text-cream"
            />
            <div className="mt-2 flex items-center gap-3">
              <SpeakButton
                text={line.de}
                speed={speed}
                speaking={speaking && playingLine === index}
                onPlay={(t) => {
                  setPlayingLine(index);
                  speak(t, { rate: speed });
                }}
              />


              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-secondary hover:underline"
                onClick={() => setShown((s) => (s.includes(index) ? s.filter((i) => i !== index) : [...s, index]))}
              >
                {shown.includes(index) ? "Hide translation" : "Show translation"}
              </button>
            </div>
            {shown.includes(index) && (
              <p className="mt-2 animate-pop text-sm text-secondary/90">{line.en}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-cream/90">{content["question"]}</p>
      <OptionList options={options} chosen={chosen} submitted={submitted} answer={answer} onChoose={setChosen} />
      {!submitted && (
        <Button
          className="rounded-xl"
          disabled={chosen === null}
          onClick={() => onSubmit(chosen === answer, options[chosen ?? 0] ?? "")}
        >
          Check answer
        </Button>
      )}
    </div>
  );
}

function ReadingPassage({
  content,
  speed,
  submitted,
  onSubmit,
}: {
  content: Content;
  speed: number;
  submitted: boolean;
  onSubmit: (c: boolean, r: string) => void;
}) {
  const options = content["options"] as unknown as string[];
  const answer = content["answer"] as unknown as number;
  const [chosen, setChosen] = useState<number | null>(null);
  const [translated, setTranslated] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-lg text-cream">{content["title"]}</h3>
        <SpeakButton text={content["text_de"] ?? ""} speed={speed} label="Read aloud" />
      </div>
      <p className="rounded-xl border border-border/70 bg-background/30 p-5 font-serif text-lg leading-relaxed text-cream">
        {content["text_de"]}
      </p>
      <button
        type="button"
        className="text-xs text-muted-foreground underline-offset-4 hover:text-secondary hover:underline"
        onClick={() => setTranslated((t) => !t)}
      >
        {translated ? "Hide translation" : "Show translation"}
      </button>
      {translated && <p className="animate-pop text-sm text-secondary/90">{content["text_en"]}</p>}
      <p className="text-sm text-cream/90">{content["question"]}</p>
      <OptionList options={options} chosen={chosen} submitted={submitted} answer={answer} onChoose={setChosen} />
      {!submitted && (
        <Button
          className="rounded-xl"
          disabled={chosen === null}
          onClick={() => onSubmit(chosen === answer, options[chosen ?? 0] ?? "")}
        >
          Check answer
        </Button>
      )}
    </div>
  );
}

function PragmaticsChoice({
  content,
  submitted,
  onSubmit,
}: {
  content: Content;
  submitted: boolean;
  onSubmit: (c: boolean, r: string) => void;
}) {
  const options = content["options"] as unknown as string[];
  const answer = content["answer"] as unknown as number;
  const [chosen, setChosen] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-4 text-sm leading-relaxed text-cream/90">
        {content["scenario"]}
      </p>
      <p className="text-sm text-cream/90">{content["question"]}</p>
      <OptionList options={options} chosen={chosen} submitted={submitted} answer={answer} onChoose={setChosen} />
      {!submitted && (
        <Button
          className="rounded-xl"
          disabled={chosen === null}
          onClick={() => onSubmit(chosen === answer, options[chosen ?? 0] ?? "")}
        >
          Check answer
        </Button>
      )}
    </div>
  );
}

function FillBlank({
  content,
  submitted,
  onSubmit,
}: {
  content: Content;
  submitted: boolean;
  onSubmit: (c: boolean, r: string) => void;
}) {
  const options = content["options"] as unknown as string[];
  const answer = content["answer"] as unknown as number;
  const [chosen, setChosen] = useState<number | null>(null);
  const sentence = (content["sentence"] ?? "") as string;
  const filled = chosen !== null ? sentence.replace("___", options[chosen] ?? "") : sentence;

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-border/70 bg-background/30 p-5 text-center font-serif text-xl text-cream">
        {filled}
      </p>
      <p className="text-center text-xs text-muted-foreground">{content["en"]}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((option, index) => {
          const reveal = submitted && index === answer;
          const wrong = submitted && chosen === index && index !== answer;
          return (
            <button
              key={option}
              type="button"
              disabled={submitted}
              onClick={() => setChosen(index)}
              className={`rounded-full border px-5 py-2 font-serif text-base transition-all ${
                reveal
                  ? "border-secondary bg-secondary/20 text-cream"
                  : wrong
                    ? "animate-nudge border-primary/70 bg-primary/10"
                    : chosen === index
                      ? "border-primary bg-primary/20 text-cream"
                      : "border-border bg-background/30 text-cream/85 hover:border-primary/60"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {!submitted && (
        <Button
          className="rounded-xl"
          disabled={chosen === null}
          onClick={() => onSubmit(chosen === answer, options[chosen ?? 0] ?? "")}
        >
          Check answer
        </Button>
      )}
    </div>
  );
}

function WordOrder({
  content,
  submitted,
  onSubmit,
}: {
  content: Content;
  submitted: boolean;
  onSubmit: (c: boolean, r: string) => void;
}) {
  const answer = content["answer"] as unknown as string[];
  const tokens = content["tokens"] as unknown as string[];
  const bankStart = useMemo(
    () => tokens.map((t, i) => ({ id: `${t}-${i}`, text: t })).sort(() => Math.random() - 0.5),
    [tokens],
  );
  const [bank, setBank] = useState(bankStart);
  const [line, setLine] = useState<{ id: string; text: string }[]>([]);

  const place = (id: string) => {
    const token = bank.find((t) => t.id === id);
    if (!token) return;
    setBank((b) => b.filter((t) => t.id !== id));
    setLine((l) => [...l, token]);
  };

  const correct = line.map((t) => t.text).join(" ") === answer.join(" ");

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          place(e.dataTransfer.getData("text/plain"));
        }}
        className={`flex min-h-20 flex-wrap items-center gap-2 rounded-xl border border-dashed p-4 transition-colors ${
          submitted
            ? correct
              ? "border-secondary bg-secondary/10"
              : "border-primary/60 bg-primary/10"
            : "border-border bg-background/30"
        }`}
      >
        {line.length === 0 && (
          <span className="text-xs text-muted-foreground">Drag or tap the words to build the sentence…</span>
        )}
        {line.map((token) => (
          <button
            key={token.id}
            type="button"
            disabled={submitted}
            onClick={() => {
              setLine((l) => l.filter((t) => t.id !== token.id));
              setBank((b) => [...b, token]);
            }}
            className="rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 font-serif text-base text-cream"
          >
            {token.text}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {bank.map((token) => (
          <button
            key={token.id}
            type="button"
            draggable={!submitted}
            onDragStart={(e) => e.dataTransfer.setData("text/plain", token.id)}
            disabled={submitted}
            onClick={() => place(token.id)}
            className="cursor-grab rounded-lg border border-border bg-background/40 px-3 py-2 font-serif text-base text-cream/85 hover:border-primary/60 active:cursor-grabbing"
          >
            {token.text}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Target meaning: {content["en"]}</p>

      {submitted && !correct && (
        <p className="font-serif text-base text-secondary">Correct order: {answer.join(" ")}</p>
      )}

      {!submitted && (
        <Button className="rounded-xl" disabled={bank.length > 0} onClick={() => onSubmit(correct, line.map((t) => t.text).join(" "))}>
          Check sentence
        </Button>
      )}
    </div>
  );
}

function VocabMatch({
  content,
  speed,
  submitted,
  onSubmit,
}: {
  content: Content;
  speed: number;
  submitted: boolean;
  onSubmit: (c: boolean, r: string) => void;
}) {
  const pairs = content["pairs"] as unknown as { de: string; en: string }[];
  const shuffledEn = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<string | null>(null);
  const { speak } = useGermanVoice();

  const done = matched.length === pairs.length;

  function chooseEn(en: string) {
    if (!selected) return;
    const pair = pairs.find((p) => p.de === selected);
    if (pair && pair.en === en) {
      setMatched((m) => [...m, selected]);
    } else {
      setMistakes((m) => m + 1);
      setShake(en);
      setTimeout(() => setShake(null), 420);
    }
    setSelected(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          {pairs.map((pair) => {
            const isMatched = matched.includes(pair.de);
            return (
              <button
                key={pair.de}
                type="button"
                disabled={isMatched || submitted}
                onClick={() => {
                  setSelected(pair.de);
                  speak(pair.de, { rate: speed });
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left font-serif text-base transition-all ${
                  isMatched
                    ? "border-secondary/60 bg-secondary/15 text-secondary"
                    : selected === pair.de
                      ? "border-primary bg-primary/20 text-cream"
                      : "border-border bg-background/30 text-cream/85 hover:border-primary/60"
                }`}
              >
                {pair.de}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {shuffledEn.map((pair) => {
            const isMatched = matched.includes(pair.de);
            return (
              <button
                key={pair.en}
                type="button"
                disabled={isMatched || submitted}
                onClick={() => chooseEn(pair.en)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  isMatched
                    ? "border-secondary/60 bg-secondary/15 text-secondary"
                    : shake === pair.en
                      ? "animate-nudge border-primary/70 bg-primary/10 text-cream"
                      : "border-border bg-background/30 text-cream/85 hover:border-primary/60"
                }`}
              >
                {pair.en}
              </button>
            );
          })}
        </div>
      </div>
      {!submitted && (
        <Button className="rounded-xl" disabled={!done} onClick={() => onSubmit(mistakes === 0, `${mistakes} misses`)}>
          {done ? "Finish matching" : `Matched ${matched.length} of ${pairs.length}`}
        </Button>
      )}
    </div>
  );
}

function Pronounce({
  content,
  speed,
  submitted,
  onSubmit,
}: {
  content: Content;
  speed: number;
  submitted: boolean;
  onSubmit: (c: boolean, r: string) => void;
}) {
  const target = (content["target_de"] ?? "") as string;
  const { listen, listening, supported } = useSpeechInput();
  const [heard, setHeard] = useState<string | null>(null);

  async function record() {
    const result = await listen();
    if (!result) {
      setHeard("");
      return;
    }
    setHeard(result.transcript);
    const match = normalise(result.transcript) === normalise(target);
    onSubmit(match, result.transcript);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-background/30 p-6 text-center">
        <p className="font-serif text-2xl leading-snug text-cream">{target}</p>
        <p className="mt-2 text-sm text-muted-foreground">{content["en"]}</p>
        <p className="mt-4 text-sm tracking-[0.2em] text-primary">{content["stress"]}</p>
      </div>
      <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-4 text-sm text-cream/90">
        {content["tip"]}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SpeakButton text={target} speed={speed} label="Hear a native example" />
      </div>

      {heard && <p className="text-sm text-secondary">We heard: “{heard}”</p>}

      {!submitted && (
        <div className="flex flex-wrap gap-3">
          {supported ? (
            <Button className="gap-2 rounded-xl" onClick={record} disabled={listening}>
              <Mic className="size-4" strokeWidth={1.6} />
              {listening ? "Listening…" : "Say it aloud"}
            </Button>
          ) : (
            <>
              <p className="w-full text-xs text-muted-foreground">
                Repeat it aloud after the example, then rate yourself.
              </p>
              <Button className="gap-2 rounded-xl" onClick={() => onSubmit(true, "self: confident")}>
                <Check className="size-4" strokeWidth={1.6} /> I said it well
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-border bg-transparent hover:bg-muted"
                onClick={() => onSubmit(false, "self: needs work")}
              >
                Needs more practice
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function WritingPrompt({
  content,
  submitted,
  onSubmit,
}: {
  content: Content;
  submitted: boolean;
  onSubmit: (c: boolean, r: string) => void;
}) {
  const [text, setText] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-border/70 bg-background/30 p-4 font-serif text-lg text-cream">
        {content["prompt"]}
      </p>
      <p className="text-xs text-muted-foreground">{content["hint"]}</p>
      <Textarea
        value={text}
        disabled={submitted || reviewing}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Schreiben Sie hier…"
        className="rounded-xl border-border bg-background/40 text-base"
      />
      <p className="text-xs text-muted-foreground">{words} words</p>

      {!reviewing && !submitted && (
        <Button className="rounded-xl" disabled={words < 6} onClick={() => setReviewing(true)}>
          Compare with a model answer
        </Button>
      )}

      {reviewing && !submitted && (
        <div className="space-y-4 animate-pop">
          <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-secondary">Native speaker example</p>
            <p className="mt-2 font-serif text-base text-cream">{content["sample"]}</p>
          </div>
          <p className="text-sm text-cream/85">
            Check your text: is the verb in second position, and do the articles match the noun genders?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-xl" onClick={() => onSubmit(true, text)}>
              My sentences matched
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-border bg-transparent hover:bg-muted"
              onClick={() => onSubmit(false, text)}
            >
              I made mistakes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
