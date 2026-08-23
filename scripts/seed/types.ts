export type LessonSeed = {
  slug: string;
  level: "A1" | "A2";
  title: string;
  de: string;
  theme: string;
  summary: string;
  dlg: {
    title: string;
    lines: [string, string, string][];
    q: string;
    opts: string[];
    a: number;
    note: string;
  };
  read: { title: string; de: string; en: string; q: string; opts: string[]; a: number; note: string };
  pron: { de: string; en: string; stress: string; tip: string };
  blanks: { s: string; en: string; opts: string[]; a: number; note: string }[];
  order: { answer: string[]; en: string; note: string };
  vocab: [string, string][];
  prag: { scenario: string; q: string; opts: string[]; a: number; note: string };
  write: { prompt: string; hint: string; sample: string };
};
