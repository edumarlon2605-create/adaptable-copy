import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";
import { testimonials, type Testimonial } from "@/lib/testimonials-data";

const VISIBLE_MS = 2500;
const GAP_MS = 4000;
const FADE_MS = 500;

function pickRandom(exclude: number): number {
  if (testimonials.length <= 1) return 0;
  let i = Math.floor(Math.random() * testimonials.length);
  if (i === exclude) i = (i + 1) % testimonials.length;
  return i;
}

export function TestimonialToast() {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState<number>(() => Math.floor(Math.random() * testimonials.length));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    if (visible) {
      hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    } else {
      showTimer = setTimeout(() => {
        setIndex((prev) => pickRandom(prev));
        setVisible(true);
      }, GAP_MS);
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [visible, mounted]);

  if (!mounted) return null;
  const t: Testimonial = testimonials[index];

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 left-4 z-40 max-w-[22rem] hidden md:block"
    >
      <div
        className={`pointer-events-auto rounded-2xl border border-border bg-card/95 backdrop-blur shadow-lg p-4 transition-opacity ease-out`}
        style={{
          transitionDuration: `${FADE_MS}ms`,
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Quote className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm leading-snug text-foreground/90 line-clamp-4">
              “{t.quote}”
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{t.name}</div>
                <div className="truncate text-xs text-muted-foreground">{t.location}</div>
              </div>
              <div className="flex gap-0.5 text-primary" aria-label="5 estrelas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
