import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BookOpen, Headphones, MessageCircle, PenLine } from "lucide-react";
import heroImage from "@/assets/cafe-hero.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sprachfluss — Learn German A1 & A2 with a Guided Tutor" },
      {
        name: "description",
        content:
          "Sprachfluss teaches German A1 and A2 through listening, speaking, reading and writing, with pronunciation, grammar and politeness built into every lesson.",
      },
      { property: "og:title", content: "Sprachfluss — Learn German A1 & A2" },
      {
        property: "og:description",
        content:
          "A warm, guided German tutor: three-phase lessons, spaced repetition and mastery tracking across five linguistic dimensions.",
      },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  { icon: Headphones, title: "Hören", body: "Native-paced dialogues you can slow down and unpack line by line." },
  { icon: MessageCircle, title: "Sprechen", body: "Repeat-after-me drills with stress marks and instant feedback." },
  { icon: BookOpen, title: "Lesen", body: "Short A1 and A2 texts with click-to-reveal translations." },
  { icon: PenLine, title: "Schreiben", body: "Sentence building for German word order, then guided free writing." },
];

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <p className="font-serif text-xl text-cream">
          Sprach<span className="text-primary">fluss</span>
        </p>
        <Link to="/auth">
          <Button variant="ghost" className="rounded-full text-cream/80 hover:bg-muted">
            Sign in
          </Button>
        </Link>
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-2 md:pt-14">
        <div className="animate-rise">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Deutsch A1 – A2</p>
          <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-cream md:text-6xl">
            German, learned the way it is actually spoken.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Every lesson moves you through listening and reading, then speaking and writing, then a calm
            review of what slipped — with sounds, grammar, vocabulary and politeness tracked separately.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button className="rounded-xl px-7 py-6 text-base">Start learning</Button>
            </Link>
            <Link to="/auth">
              <Button
                variant="outline"
                className="rounded-xl border-border bg-transparent px-7 py-6 text-base hover:bg-muted"
              >
                I already have an account
              </Button>
            </Link>
          </div>
        </div>

        <div className="animate-rise overflow-hidden rounded-3xl border border-border shadow-warm">
          <img
            src={heroImage}
            alt="A German paperback, notebook and espresso on a café table in warm morning light"
            width={1408}
            height={1008}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="surface rounded-2xl p-6">
                <Icon className="size-6 text-primary" strokeWidth={1.4} />
                <h2 className="mt-4 font-serif text-xl text-cream">{pillar.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
