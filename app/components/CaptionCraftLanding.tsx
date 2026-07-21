"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  AudioLines,
  Check,
  CheckCircle2,
  Download,
  Layers,
  Menu,
  Palette,
  Play,
  Sparkles,
  Star,
  Type,
  UploadCloud,
  X,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------- scroll-reveal helpers (reduced-motion aware) ---------- */

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function RevealItem({
  children,
  index = 0,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function HeroReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- background dressing ---------- */

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const r1 = pseudoRandom(i + 1);
  const r2 = pseudoRandom(i + 51);
  const r3 = pseudoRandom(i + 101);
  const r4 = pseudoRandom(i + 151);
  return {
    left: `${(r1 * 100).toFixed(2)}%`,
    top: `${(r2 * 100).toFixed(2)}%`,
    size: 2 + Math.round(r3 * 3),
    duration: Number((3 + r4 * 4).toFixed(2)),
    delay: Number((r1 * 5).toFixed(2)),
  };
});

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="orb w-[500px] h-[500px] -top-40 -left-40 bg-[#a855f7] opacity-[0.12]" />
      <div className="orb w-[600px] h-[600px] top-1/3 -right-52 bg-[#ec4899] opacity-[0.1]" />
    </div>
  );
}

/* ---------- navbar ---------- */

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-[#0a0a0f]/70 border-b border-white/[0.08]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#a855f7] to-[#ec4899]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            Caption<span className="gradient-text">Craft</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <a
            href="#waitlist"
            className="btn-gradient inline-flex items-center px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
          >
            Join Waitlist
          </a>
        </div>

        <button
          type="button"
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="md:hidden overflow-hidden border-b border-white/[0.08] bg-[#0a0a0f]/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-[#a1a1aa] hover:text-white transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#waitlist"
                onClick={() => setMobileOpen(false)}
                className="btn-gradient inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold"
              >
                Join Waitlist
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------- hero ---------- */

const STATS = [
  { value: "30 sec", label: "per video" },
  { value: "6", label: "viral styles" },
  { value: "99%", label: "accuracy" },
];

function PhoneMockup() {
  return (
    <div className="relative">
      <div className="orb w-[420px] h-[420px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 bg-gradient-to-br from-[#a855f7] to-[#ec4899] opacity-20" />
      <div className="relative w-[270px] sm:w-[310px] aspect-[9/16] rounded-[2.5rem] border border-white/10 bg-black/40 p-3 shadow-2xl">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-zinc-900">
          <img
            src="https://picsum.photos/seed/captioncraft-hero-reel/640/1138"
            alt="Vertical video frame with an auto-generated caption overlay"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
          <div className="absolute top-4 left-4">
            <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
              Transcribing audio
            </span>
          </div>
          <div className="absolute bottom-10 inset-x-4 text-center">
            <p
              className="text-2xl font-extrabold uppercase leading-tight text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
            >
              this changes
              <br />
              <span className="gradient-text">everything</span>
            </p>
          </div>
        </div>
        <div className="absolute top-3 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-black/60" />
      </div>
    </div>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] overflow-hidden pt-24 pb-16 flex items-center"
    >
      <GradientOrbs />
      <FloatingParticles />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full grid xl:grid-cols-[1.15fr_1fr] gap-12 items-center">
        <div>
          <HeroReveal delay={0} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm text-[#a1a1aa]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Now in early access, 47 spots left
          </HeroReveal>

          <HeroReveal delay={0.15}>
            <h1 className="mb-6 text-3xl sm:text-4xl md:text-[2.65rem] font-bold tracking-tight leading-[1.2] text-white">
              Upload your video. Get <span className="gradient-text">viral-ready captions</span> in 30 seconds.
            </h1>
          </HeroReveal>

          <HeroReveal delay={0.3}>
            <p className="mb-8 max-w-[46ch] text-lg leading-relaxed text-[#a1a1aa]">
              Auto-generated, styled, and animated captions for TikTok, Reels and Shorts. No editing skills needed. Just upload and post.
            </p>
          </HeroReveal>

          <HeroReveal delay={0.45} className="mb-10 flex flex-col sm:flex-row gap-4">
            <a
              href="#waitlist"
              className="btn-gradient inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold whitespace-nowrap"
            >
              Join Waitlist - 50% Off Forever
            </a>
            <button
              type="button"
              className="btn-ghost inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold whitespace-nowrap"
            >
              <Play className="h-4 w-4" strokeWidth={2} />
              Watch demo
            </button>
          </HeroReveal>

          <HeroReveal delay={0.6} className="flex flex-wrap items-center gap-6">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                {i > 0 && <span className="hidden sm:block h-4 w-px bg-white/10" />}
                <span className="text-sm text-[#71717a]">
                  <span className="font-semibold text-white">{s.value}</span> {s.label}
                </span>
              </div>
            ))}
          </HeroReveal>
        </div>

        <motion.div
          style={reduce ? undefined : { y }}
          className="relative flex justify-center xl:justify-end"
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- logo cloud ---------- */

const PLATFORMS = [
  { name: "TikTok", slug: "tiktok" },
  { name: "Instagram", slug: "instagram" },
  { name: "YouTube", slug: "youtube" },
  { name: "LinkedIn", slug: "linkedin" },
  { name: "X", slug: "x" },
  { name: "Snapchat", slug: "snapchat" },
];

function LogoCloud() {
  return (
    <section className="border-y border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-10">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-[#71717a]">
            Works with every platform
          </p>
        </Reveal>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {PLATFORMS.map((p, i) => (
            <RevealItem key={p.slug} index={i}>
              <img
                src={`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${p.slug}.svg`}
                alt={p.name}
                className="h-6 sm:h-7 w-auto opacity-40 brightness-0 invert transition-opacity duration-300 hover:opacity-90"
              />
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- how it works ---------- */

const STEPS = [
  {
    n: "01",
    title: "Upload your video",
    body: "Drop any video up to 100MB. MP4, MOV and WebM are all supported.",
    icon: UploadCloud,
  },
  {
    n: "02",
    title: "Pick your style",
    body: "Choose from 6 viral-tested caption styles. One click for the perfect look.",
    icon: Palette,
  },
  {
    n: "03",
    title: "Download and post",
    body: "AI transcribes, styles, and burns in the captions. Download ready for 9:16.",
    icon: Download,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-16 max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#a855f7]">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white">
            From raw video to <span className="gradient-text">viral clip</span> in 3 steps
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <RevealItem key={step.n} index={i} className="glass-card relative overflow-hidden p-8">
              <span className="pointer-events-none absolute -top-4 -right-2 select-none text-8xl font-black text-white/[0.04]">
                {step.n}
              </span>
              <div className="relative mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#a855f7] to-[#ec4899]">
                <step.icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <h3 className="relative mb-3 text-xl font-bold text-white">{step.title}</h3>
              <p className="relative leading-relaxed text-[#a1a1aa]">{step.body}</p>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- features (bento) ---------- */

const FEATURES = [
  {
    title: "AI Transcription",
    body: "Whisper-powered accuracy across accents and slang, so nothing gets lost in translation.",
    icon: AudioLines,
    color: "from-[#a855f7] to-[#ec4899]",
    tint: "bg-purple-500/[0.06]",
    span: "md:col-span-2",
  },
  {
    title: "6 Viral Styles",
    body: "Tested on real viral videos, not guesswork.",
    icon: Palette,
    color: "from-[#ec4899] to-[#f472b6]",
    tint: "bg-pink-500/[0.06]",
    span: "",
  },
  {
    title: "Word-by-Word Animation",
    body: "Captions pop in sync with speech. Creators see a 40% boost in watch time.",
    icon: Sparkles,
    color: "from-[#3b82f6] to-[#60a5fa]",
    tint: "bg-blue-500/[0.06]",
    span: "",
  },
  {
    title: "Bulk Processing",
    body: "Queue up 10 videos at once and let CaptionCraft handle the rest.",
    icon: Layers,
    color: "from-[#f59e0b] to-[#fbbf24]",
    tint: "bg-amber-500/[0.06]",
    span: "md:col-span-2",
  },
];

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-16 max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#a855f7]">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white">
            Everything you need to go viral
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <RevealItem
              key={f.title}
              index={i}
              className={`glass-card relative p-8 ${f.tint} ${f.span}`}
            >
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${f.color}`}>
                <f.icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">{f.title}</h3>
              <p className="max-w-[42ch] leading-relaxed text-[#a1a1aa]">{f.body}</p>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- style showcase ---------- */

const STYLES = [
  {
    name: "Bold",
    seed: "captioncraft-style-bold",
    captionClass:
      "text-3xl font-black uppercase text-white [text-shadow:_3px_3px_0_rgba(0,0,0,0.9)]",
    sample: "STOP SCROLLING",
  },
  {
    name: "Neon",
    seed: "captioncraft-style-neon",
    captionClass:
      "text-3xl font-extrabold text-[#f472b6] [text-shadow:_0_0_18px_rgba(236,72,153,0.9),_0_0_36px_rgba(168,85,247,0.6)]",
    sample: "glow different",
  },
  {
    name: "Retro",
    seed: "captioncraft-style-retro",
    captionClass:
      "text-2xl font-extrabold uppercase tracking-wide text-[#fbbf24] italic pb-1 [text-shadow:_2px_2px_0_rgba(0,0,0,0.9)]",
    sample: "rewind this",
  },
  {
    name: "Cinematic",
    seed: "captioncraft-style-cinematic",
    captionClass:
      "text-lg font-medium tracking-wide text-white [text-shadow:_0_2px_10px_rgba(0,0,0,0.9)]",
    sample: "the story continues",
  },
];

function StyleShowcase() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-16 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white">
            Pick a style. <span className="gradient-text">Go viral.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STYLES.map((s, i) => (
            <RevealItem
              key={s.name}
              index={i}
              className="glass-card relative aspect-[9/16] overflow-hidden p-0"
            >
              <img
                src={`https://picsum.photos/seed/${s.seed}/360/640`}
                alt={`${s.name} caption style example`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40" />
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center">
                <p className={s.captionClass}>{s.sample}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/30 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">{s.name}</p>
              </div>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- testimonials ---------- */

const TESTIMONIALS = [
  {
    quote:
      "I used to spend two hours a week captioning clips by hand. Now it takes thirty seconds and looks intentional.",
    name: "Maya Odutola",
    role: "Content Creator, 340K on TikTok",
    initials: "MO",
  },
  {
    quote:
      "The word-by-word animation alone lifted our average watch time. My editor needed the retention graph to believe it.",
    name: "Jordan Ashcroft",
    role: "Video Editor and Consultant",
    initials: "JA",
  },
  {
    quote:
      "We run six client accounts. Bulk processing is the reason CaptionCraft stayed in our workflow instead of a bookmark.",
    name: "Lina Torres",
    role: "Founder, ClipHouse Media",
    initials: "LT",
  },
];

function Testimonials() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-16 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white">
            Loved by creators
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <RevealItem key={t.name} index={i} className="glass-card flex flex-col p-8">
              <div className="mb-5 flex gap-1">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]"
                  />
                ))}
              </div>
              <p className="mb-6 flex-1 leading-relaxed text-[#a1a1aa]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a855f7] to-[#ec4899] text-sm font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[#71717a]">{t.role}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- pricing ---------- */

const PLANS = [
  {
    name: "Starter",
    price: "$15",
    period: "/mo",
    features: ["20 videos per month", "3 caption styles", "720p export", "Basic animation"],
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    features: [
      "100 videos per month",
      "All 6 caption styles",
      "1080p export",
      "Word-by-word animation",
      "Bulk processing",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Business",
    price: "$79",
    period: "/mo",
    features: ["Unlimited videos", "Team seats", "API access", "White-label export"],
    popular: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-16 max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#a855f7]">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white">
            Simple pricing, no surprises
          </h2>
        </Reveal>

        <div className="grid items-start gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <RevealItem
              key={p.name}
              index={i}
              className={`glass-card relative p-8 ${
                p.popular
                  ? "border-[#a855f7]/40 bg-gradient-to-b from-[#a855f7]/[0.07] to-transparent"
                  : ""
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#a855f7] to-[#ec4899] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Most Popular
                </span>
              )}
              <h3 className="mb-1 text-lg font-semibold text-white">{p.name}</h3>
              <div className="mb-6 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">{p.price}</span>
                <span className="mb-1 text-[#71717a]">{p.period}</span>
              </div>
              <ul className="mb-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#a1a1aa]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a855f7]" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className={`inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold whitespace-nowrap ${
                  p.popular ? "btn-gradient" : "btn-ghost"
                }`}
              >
                Join Waitlist
              </a>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- waitlist cta ---------- */

function WaitlistCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data?.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section id="waitlist" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="glass-card relative mx-auto max-w-3xl overflow-hidden p-10 text-center md:p-16">
          <div className="orb absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-[#a855f7] to-[#ec4899] opacity-10" />
          <h2 className="mb-4 text-3xl md:text-4xl font-bold tracking-tight text-white">
            Be among the first 100 creators
          </h2>
          <p className="mx-auto mb-8 max-w-[50ch] text-[#a1a1aa]">
            Join the waitlist today and get 50% off forever. No credit card required.
          </p>

          <div className="mx-auto mb-6 min-h-[52px] max-w-md">
            <AnimatePresence mode="wait">
              {status !== "success" ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  exit={{ opacity: 0, y: -10 }}
                  noValidate
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      aria-invalid={status === "error"}
                      aria-describedby={status === "error" ? "waitlist-email-error" : undefined}
                      className={`flex-1 rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 ${
                        status === "error"
                          ? "border-red-400/40 focus:border-red-400/50 focus:ring-red-400/40"
                          : "border-white/10 focus:border-[#a855f7]/40 focus:ring-[#a855f7]/50"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="btn-gradient inline-flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "submitting" ? "Joining..." : "Join Waitlist"}
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                  {status === "error" && (
                    <p id="waitlist-email-error" className="mt-2 text-left text-sm text-red-400">
                      {errorMessage}
                    </p>
                  )}
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 font-medium text-emerald-400"
                >
                  <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
                  You&apos;re on the list!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-xs text-[#71717a]">
            Join 200+ creators already on the list. Launching Q3 2026.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-6 px-6 lg:px-8 md:flex-row">
        <a href="#" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#a855f7] to-[#ec4899]">
            <Type className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <span className="text-sm font-bold tracking-tight text-white">
            Caption<span className="gradient-text">Craft</span>
          </span>
        </a>

        <div className="flex items-center gap-6 text-sm text-[#71717a]">
          <a href="/privacy" className="transition-colors hover:text-white">
            Privacy
          </a>
          <a href="/terms" className="transition-colors hover:text-white">
            Terms
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <img
              src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/x.svg"
              alt=""
              className="h-3.5 w-3.5 brightness-0 invert opacity-60"
            />
            Twitter
          </a>
        </div>

        <p className="text-sm text-[#71717a]">&copy; 2026 CaptionCraft. Built for creators.</p>
      </div>
    </footer>
  );
}

/* ---------- page ---------- */

export default function CaptionCraftLanding() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a0f] text-white">
      <Navbar />
      <main>
        <Hero />
        <LogoCloud />
        <HowItWorks />
        <Features />
        <StyleShowcase />
        <Testimonials />
        <Pricing />
        <WaitlistCTA />
      </main>
      <Footer />
    </div>
  );
}
