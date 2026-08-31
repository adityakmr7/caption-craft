"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Hash,
  History,
  ImagePlus,
  Menu,
  SlidersHorizontal,
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: EASE }}
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- shared bits ---------- */

function BrandMark({ size = "h-8 w-8" }: { size?: string }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]`}
    >
      <ImagePlus className="h-4 w-4 text-[#171310]" strokeWidth={2.2} />
    </span>
  );
}

/* ---------- navbar ---------- */

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Why we built this", href: "#founder" },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border-soft)] bg-[var(--bg)]/85 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 shrink-0">
          <BrandMark />
          <span className="text-[15px] font-bold tracking-tight text-[var(--text-1)]">
            CaptionCraft
          </span>
        </a>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-5">
          <a
            href="/login"
            className="text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
          >
            Log in
          </a>
          <a
            href="#waitlist"
            className="btn-primary inline-flex items-center px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
          >
            Join waitlist
          </a>
        </div>

        <button
          type="button"
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-1)]"
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
            transition={{ duration: 0.2, ease: EASE }}
            className="md:hidden overflow-hidden border-b border-[var(--border-soft)] bg-[var(--bg)]"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
              >
                Log in
              </a>
              <a
                href="#waitlist"
                onClick={() => setMobileOpen(false)}
                className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold"
              >
                Join waitlist
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------- hero ---------- */

const HERO_STATS = [
  { value: "3", label: "variations per screenshot" },
  { value: "<60s", label: "screenshot to copy-ready post" },
  { value: "+104%", label: "YoY growth, Indian founders on LinkedIn" },
];

function DemoCard() {
  return (
    <div className="cc-card p-4 flex flex-col gap-3.5">
      <div className="rounded-[0.625rem] border border-[var(--border-soft)] bg-[var(--surface)] p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono-cc text-[11px] text-[var(--text-3)]">
            dashboard_aug.png
          </span>
          <span className="font-mono-cc text-[11px] text-[var(--text-3)]">
            screenshot
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono-cc text-[22px] font-bold text-[var(--text-1)]">
            ₹2,84,000
          </span>
          <span className="text-xs font-semibold text-[var(--success)]">↑ 18%</span>
        </div>
        <div className="text-xs text-[var(--text-3)]">MRR — August</div>
        <div className="grid grid-cols-7 items-end gap-1.5 h-[70px] pt-2">
          {[30, 42, 38, 55, 61, 74, 100].map((h, i) => (
            <div
              key={i}
              className="rounded-t-[3px]"
              style={{
                height: `${h}%`,
                background:
                  i === 6
                    ? "var(--accent)"
                    : "color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center text-[var(--text-3)]">
        <ArrowDown className="h-4 w-4" strokeWidth={2} />
      </div>

      <div className="flex gap-2">
        {["Professional", "Casual", "Hype"].map((tone, i) => (
          <span
            key={tone}
            className={`text-[11.5px] px-2.5 py-1 rounded-full border ${
              i === 0
                ? "border-[var(--accent)] text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
                : "border-[var(--border)] text-[var(--text-3)]"
            }`}
          >
            {tone}
          </span>
        ))}
      </div>

      <div className="rounded-[0.625rem] border border-[var(--border-soft)] bg-[var(--surface)] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[var(--accent)] text-[11px] font-bold">
            AK
          </span>
          <div>
            <div className="text-[13px] font-semibold text-[var(--text-1)]">
              Aditya Kumar
            </div>
            <div className="text-[11px] text-[var(--text-3)]">
              Founder, building in public
            </div>
          </div>
        </div>
        <p className="text-[13.5px] leading-relaxed text-[var(--text-2)]">
          Crossed ₹2.84L MRR this month — up 18% from July. The unlock wasn&apos;t a
          new feature, it was finally pricing in INR instead of copying a US
          SaaS&apos;s dollar tiers.
        </p>
        <div className="flex gap-1.5 flex-wrap">
          <span className="cc-tag">#BuildInPublic</span>
          <span className="cc-tag">#StartupIndia</span>
          <span className="cc-tag">#SaaS</span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
        <div>
          <HeroReveal
            delay={0}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--text-2)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Built for Indian founders building in public
          </HeroReveal>

          <HeroReveal delay={0.12}>
            <h1 className="mb-5 text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-[var(--text-1)]">
              You shipped it. Now{" "}
              <span className="text-[var(--accent)]">post about it.</span>
            </h1>
          </HeroReveal>

          <HeroReveal delay={0.24}>
            <p className="mb-8 max-w-[48ch] text-lg leading-relaxed text-[var(--text-2)]">
              Upload the screenshot you already have — a metric, a shipped
              feature, a payout notification — and get 3 ready-to-post
              LinkedIn variations with hashtags, in a voice that sounds like a
              founder, not a wrapper around ChatGPT.
            </p>
          </HeroReveal>

          <HeroReveal
            delay={0.36}
            className="mb-10 flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#waitlist"
              className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold whitespace-nowrap"
            >
              Join the waitlist
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </a>
            <a
              href="#how"
              className="btn-ghost inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold whitespace-nowrap"
            >
              See how it works
            </a>
          </HeroReveal>

          <HeroReveal delay={0.48} className="flex flex-wrap gap-6">
            {HERO_STATS.map((s) => (
              <div key={s.label}>
                <div className="font-mono-cc text-sm font-semibold text-[var(--text-1)]">
                  {s.value}
                </div>
                <div className="text-xs text-[var(--text-3)] max-w-[20ch]">
                  {s.label}
                </div>
              </div>
            ))}
          </HeroReveal>
        </div>

        <HeroReveal delay={0.2}>
          <DemoCard />
        </HeroReveal>
      </div>
    </section>
  );
}

/* ---------- community strip ---------- */

const COMMUNITIES = ["SaaSBOOMi", "Peerlist", "Turbostart", "IndieHackers India"];

function CommunityStrip() {
  return (
    <section className="border-y border-[var(--border-soft)] py-7">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center gap-6 flex-wrap">
        <span className="text-[11.5px] uppercase tracking-[0.14em] text-[var(--text-3)] shrink-0">
          Made for the founders in
        </span>
        <div className="flex gap-2.5 flex-wrap">
          {COMMUNITIES.map((c) => (
            <span key={c} className="cc-chip">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- problem / solution ---------- */

function ProblemSolution() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid md:grid-cols-2 gap-6">
        <Reveal className="cc-card p-7 flex flex-col gap-3.5">
          <span className="text-[13px] font-semibold text-[var(--text-3)]">
            THE BLANK CURSOR PROBLEM
          </span>
          <p className="text-[15px] leading-relaxed text-[var(--text-2)]">
            You just crossed a milestone — new MRR, a shipped feature, a
            cohort acceptance. You know you should post about it. Then the
            cursor blinks for twenty minutes and you close the tab instead.
          </p>
        </Reveal>
        <Reveal className="cc-card p-7 flex flex-col gap-3.5 border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_7%,var(--bg-elevated))]">
          <span className="text-[13px] font-semibold text-[var(--accent)]">
            WHAT CAPTIONCRAFT DOES INSTEAD
          </span>
          <p className="text-[15px] leading-relaxed text-[var(--text-1)]">
            Upload the screenshot you already have open. Pick a tone. Get
            three posts that sound like you talking, not an AI&apos;s idea of a
            founder — with hashtags an Indian startup audience actually
            follows.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- how it works ---------- */

const STEPS = [
  {
    n: "01",
    title: "Upload the screenshot",
    body: "Drop a screenshot of your dashboard, your Razorpay payout, your shipped UI — whatever actually proves the milestone.",
    icon: UploadCloud,
  },
  {
    n: "02",
    title: "Pick a tone",
    body: "Professional, casual, or hype. Same facts, three different voices — pick the one that sounds like you today.",
    icon: SlidersHorizontal,
  },
  {
    n: "03",
    title: "Copy and post",
    body: "Get 3 variations with hashtags picked for Indian startup audiences. Copy the one that sounds right and post it yourself.",
    icon: ClipboardCheck,
  },
];

function HowItWorks() {
  return (
    <section id="how" className="py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-14 max-w-2xl">
          <p className="mb-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-[var(--text-1)]">
            Screenshot in. Post out. Three steps.
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <RevealItem
              key={step.n}
              index={i}
              className="cc-card p-7 flex flex-col gap-3.5"
            >
              <span className="font-mono-cc text-[13px] text-[var(--accent)]">
                {step.n}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-[0.625rem] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
                <step.icon className="h-4 w-4" strokeWidth={2.1} />
              </div>
              <h3 className="text-[16.5px] font-semibold text-[var(--text-1)]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-2)]">
                {step.body}
              </p>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- features (bento) ---------- */

function Features() {
  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-14 max-w-2xl">
          <p className="mb-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-[var(--text-1)]">
            The only LinkedIn tool that starts from a screenshot
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-6">
          <RevealItem
            index={0}
            className="cc-card p-7 flex flex-col gap-3 md:col-span-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.625rem] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
              <ImagePlus className="h-4 w-4" strokeWidth={2.1} />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-1)]">
              Screenshot-first generation
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-2)] max-w-[44ch]">
              Every other LinkedIn tool starts with a blank prompt or a topic
              idea. We start with the thing you already have open — the
              metric, the merge, the milestone — so the post is specific, not
              generic.
            </p>
          </RevealItem>

          <RevealItem
            index={1}
            className="cc-card p-7 flex flex-col gap-3 md:col-span-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.625rem] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2.1} />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-1)]">
              3 tones, same facts
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-2)]">
              Professional, casual, hype — never rewrites the truth, just the
              voice.
            </p>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {["Professional", "Casual", "Hype"].map((t) => (
                <span key={t} className="cc-chip text-xs">
                  {t}
                </span>
              ))}
            </div>
          </RevealItem>

          <RevealItem
            index={2}
            className="cc-card p-7 flex flex-col gap-3 md:col-span-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.625rem] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
              <Hash className="h-4 w-4" strokeWidth={2.1} />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-1)]">
              Hashtags that aren&apos;t guesses
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-2)]">
              Pulled from a curated set built for Indian startup audiences —
              #BuildInPublic, #StartupIndia, #SaaS — not whatever the model
              picks at random.
            </p>
          </RevealItem>

          <RevealItem
            index={3}
            className="cc-card p-7 flex flex-col gap-3 md:col-span-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.625rem] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
              <History className="h-4 w-4" strokeWidth={2.1} />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-1)]">
              Every post, saved
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-2)]">
              Every generation lands in your history — reopen, re-copy, or
              repurpose it later without regenerating from scratch.
            </p>
          </RevealItem>
        </div>
      </div>
    </section>
  );
}

/* ---------- pricing ---------- */

const PLANS = [
  {
    name: "Monthly",
    price: "₹299",
    period: "/ month",
    highlight: false,
    features: [
      "3 free generations to start, no card",
      "3 post variations per screenshot",
      "Post history + hashtag suggestions",
      "UPI AutoPay, cancel anytime",
    ],
  },
  {
    name: "Yearly",
    price: "₹2,999",
    period: "/ year",
    highlight: true,
    badge: "2 months free",
    features: [
      "Everything in Monthly",
      "Works out to ~₹250/month",
      "Locked-in launch pricing",
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-14 max-w-2xl mx-auto text-center">
          <p className="mb-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-[var(--text-1)]">
            Priced for bootstrapped, not funded
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 max-w-2xl mx-auto">
          {PLANS.map((p, i) => (
            <RevealItem
              key={p.name}
              index={i}
              className={`cc-card relative p-7 flex flex-col gap-5 ${
                p.highlight
                  ? "border-[var(--accent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_60%)]"
                  : ""
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3 right-6 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-bold text-[#171310]">
                  {p.badge}
                </span>
              )}
              <p className="text-sm font-semibold text-[var(--text-2)]">
                {p.name}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono-cc text-[34px] font-bold tracking-tight text-[var(--text-1)]">
                  {p.price}
                </span>
                <span className="text-sm text-[var(--text-3)]">{p.period}</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-[var(--text-2)]"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className={`inline-flex items-center justify-center px-5 py-3 text-sm font-semibold whitespace-nowrap ${
                  p.highlight ? "btn-primary" : "btn-ghost"
                }`}
              >
                Join waitlist for early access
              </a>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- founder note ---------- */

function FounderNote() {
  return (
    <section id="founder" className="py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="cc-card p-9 md:p-10 flex gap-6 items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[var(--accent)] font-bold text-sm">
            AK
          </span>
          <div>
            <p className="text-[17px] leading-relaxed text-[var(--text-1)] max-w-[62ch] mb-3">
              &ldquo;I&apos;m building CaptionCraft in public — using it
              myself to write the post about building it. If it saves you the
              twenty minutes of cursor-blink before you close the tab instead
              of posting, it&apos;s done its job.&rdquo;
            </p>
            <span className="text-sm text-[var(--text-3)]">
              Aditya Kumar, solo founder
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- faq ---------- */

const FAQS = [
  {
    q: "Does this post to LinkedIn for me?",
    a: "Not yet. You copy the variation you like and post it yourself — full control, no API risk.",
  },
  {
    q: "What if I don't have a screenshot?",
    a: "You can start from a quick idea too, but screenshots get you the most specific, believable posts — that's the whole point.",
  },
  {
    q: "Is my screenshot used to train anything?",
    a: "No. Your uploads stay private to your account and are never used for model training.",
  },
  {
    q: "Why is this cheaper than Taplio or Supergrow?",
    a: "Because it's priced for a bootstrapped Indian founder, not a funded US marketing team.",
  },
];

function FAQ() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="mb-14 max-w-2xl">
          <p className="mb-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-[var(--text-1)]">
            Before you ask
          </h2>
        </Reveal>

        <div className="flex flex-col gap-3 max-w-2xl">
          {FAQS.map((f, i) => (
            <RevealItem
              key={f.q}
              index={i}
              className="cc-card px-6 py-5"
            >
              <p className="text-[15px] font-semibold text-[var(--text-1)] mb-2">
                {f.q}
              </p>
              <p className="text-sm leading-relaxed text-[var(--text-2)]">{f.a}</p>
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
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
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
    <section id="waitlist" className="py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="cc-card mx-auto max-w-3xl p-10 text-center md:p-16">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-1)]">
            Your next milestone deserves more than a blank cursor.
          </h2>
          <p className="mx-auto mb-8 max-w-[50ch] text-[var(--text-2)]">
            Join the waitlist for early access. No spam, just a note when we
            launch — this September.
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
                      aria-describedby={
                        status === "error" ? "waitlist-email-error" : undefined
                      }
                      className={`flex-1 rounded-[0.625rem] border bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 ${
                        status === "error"
                          ? "border-red-400/40 focus:border-red-400/50 focus:ring-red-400/40"
                          : "border-[var(--border)] focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] focus:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "submitting" ? "Joining..." : "Join waitlist"}
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                  {status === "error" && (
                    <p
                      id="waitlist-email-error"
                      className="mt-2 text-left text-sm text-red-400"
                    >
                      {errorMessage}
                    </p>
                  )}
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 font-medium text-[var(--success)]"
                >
                  <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
                  You&apos;re on the list!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-[var(--border-soft)] py-10">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-5 px-6 lg:px-8 md:flex-row">
        <a href="#" className="flex items-center gap-2">
          <BrandMark size="h-7 w-7" />
          <span className="text-sm font-bold tracking-tight text-[var(--text-1)]">
            CaptionCraft
          </span>
        </a>

        <div className="flex items-center gap-6 text-sm text-[var(--text-3)]">
          <a href="/privacy" className="transition-colors hover:text-[var(--text-1)]">
            Privacy
          </a>
          <a href="/terms" className="transition-colors hover:text-[var(--text-1)]">
            Terms
          </a>
        </div>

        <p className="text-sm text-[var(--text-3)]">
          Built in India, for founders building in public.
        </p>
      </div>
    </footer>
  );
}

/* ---------- page ---------- */

export default function CaptionCraftLanding() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text-1)]">
      <Navbar />
      <main>
        <Hero />
        <CommunityStrip />
        <ProblemSolution />
        <HowItWorks />
        <Features />
        <Pricing />
        <FounderNote />
        <FAQ />
        <WaitlistCTA />
      </main>
      <Footer />
    </div>
  );
}
