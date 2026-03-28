'use client';

import { FormEvent, useState } from 'react';

const features = [
  {
    title: 'Macro Regime Engine',
    description:
      'Continuously ingests global signals to classify Risk-On / Risk-Off posture with conviction scores.',
  },
  {
    title: 'Signal Drivers',
    description: 'Liquidity, credit, and energy inputs ranked and weighted for instant attribution.',
  },
  {
    title: 'Live Intelligence Feed',
    description: 'Real-time macro commentary streamed to desks, PMs, and treasury teams with zero noise.',
  },
  {
    title: 'AI Copilot — Alora',
    description: 'Ask natural questions, generate trade ideas, or translate signals into action steps in seconds.',
  },
];

const productHighlights = [
  { label: 'Current Regime', value: 'Risk-On' },
  { label: 'Confidence', value: '86%' },
  { label: 'Liquidity Impulse', value: '+2.1%' },
  { label: 'Credit Stress', value: '-0.8%' },
];

const defaultMessage = 'Access is limited. Submit a work email to request entry.';

export default function LandingPage() {
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [messageState, setMessageState] = useState<'info' | 'success' | 'error'>('info');
  const [isLoading, setIsLoading] = useState(false);

  const resetMessage = () => {
    setMessage(defaultMessage);
    setMessageState('info');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      full_name: fullName.trim(),
      company: company.trim(),
      role: roleTitle.trim(),
      email: email.trim(),
    };

    if (!payload.full_name) {
      setMessage('Please enter your full name.');
      setMessageState('error');
      return;
    }

    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setMessage('Enter a valid institutional or work email.');
      setMessageState('error');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('Submitting your request...');
      setMessageState('info');

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        setMessage(data?.error ?? 'Unable to add you right now. Please try again.');
        setMessageState('error');
        return;
      }

      setMessage(data?.message ?? 'Request received. Expect a response within 24 hours.');
      setMessageState('success');
      setFullName('');
      setCompany('');
      setRoleTitle('');
      setEmail('');
    } catch {
      setMessage('Network error. Please try again shortly.');
      setMessageState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const messageClasses =
    messageState === 'success'
      ? 'text-emerald-400'
      : messageState === 'error'
        ? 'text-rose-400'
        : 'text-zinc-500';

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),_transparent_65%)]" />
        <div className="absolute right-[15%] top-[55%] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.2),_transparent_70%)]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12 lg:px-10 lg:py-16">
        <header className="space-y-8 text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-zinc-500">System Capital</p>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-[1.1] md:text-6xl">Stop Guessing the Market.</h1>
            <p className="mx-auto max-w-3xl text-lg text-zinc-400 md:text-xl">
              System Capital is the AI-powered macro signal dashboard trusted by institutional desks. Detect regime
              shifts, interrogate drivers, and translate conviction into action — all from one glass board.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:justify-center">
            <span className="rounded-full border border-zinc-800 px-5 py-2">Designed for traders &amp; allocators</span>
            <span className="rounded-full border border-zinc-800 px-5 py-2">Institutional security baked in</span>
          </div>
        </header>

        <section className="grid gap-8 rounded-3xl border border-zinc-900/70 bg-zinc-950/70 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-zinc-500">Product Preview</p>
              <h2 className="mt-3 text-3xl font-semibold">Macro Intelligence Console</h2>
            </div>

            <div className="space-y-6 rounded-2xl border border-zinc-900 bg-black/30 p-6">
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-sm text-zinc-500">Market Regime</p>
                  <p className="text-4xl font-semibold">Risk-On</p>
                  <p className="text-sm text-zinc-400">86% confidence</p>
                </div>

                <div className="flex gap-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
                  {['US', 'EU', 'APAC'].map((region) => (
                    <span key={region} className="rounded-full border border-zinc-800 px-3 py-1">
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {productHighlights.map((highlight) => (
                  <div key={highlight.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">{highlight.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{highlight.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-emerald-500/10 via-transparent to-indigo-500/10 p-4">
                <p className="text-sm text-zinc-400">
                  Liquidity impulse rolled higher while credit spreads stabilized. Alora recommends adding 35 bps net
                  exposure with tight overlays.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6">
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-500">System Capital Stack</p>

            <ul className="space-y-5">
              {features.slice(0, 3).map((feature) => (
                <li key={feature.title} className="rounded-2xl border border-zinc-900/70 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Alora Insight</p>
              <p className="mt-2 text-sm text-emerald-100">
                "Credit stress moderating while energy remains constructive. Consider rotating into Asia DM equities
                with a 30 bps overlay." — Ask Alora
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-zinc-900/70 bg-zinc-950/60 p-6">
              <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">{feature.title}</p>
              <p className="mt-3 text-base text-zinc-300">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-zinc-900/80 bg-gradient-to-b from-white/[0.08] via-black to-black p-10 text-center shadow-[0_50px_140px_rgba(0,0,0,0.8)]">
          <p className="text-xs uppercase tracking-[0.5em] text-zinc-500">Private beta</p>
          <h2 className="mt-3 text-4xl font-semibold">Join the System Capital waitlist.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
            We onboard a limited number of desks each month to keep the signal pure. Submit your work email for a
            guided walkthrough of the dashboard.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="full_name" className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                  Full name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    resetMessage();
                  }}
                  placeholder="Ava Reynolds"
                  className="w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-base text-white placeholder:text-zinc-500 focus:border-white/70 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="company" className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(event) => {
                    setCompany(event.target.value);
                    resetMessage();
                  }}
                  placeholder="Atlas Macro"
                  className="w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-base text-white placeholder:text-zinc-500 focus:border-white/70 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="role" className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                  Role
                </label>
                <input
                  id="role"
                  type="text"
                  value={roleTitle}
                  onChange={(event) => {
                    setRoleTitle(event.target.value);
                    resetMessage();
                  }}
                  placeholder="Portfolio Manager"
                  className="w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-base text-white placeholder:text-zinc-500 focus:border-white/70 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div className="flex flex-col gap-2 text-left md:col-span-2">
                <label htmlFor="email" className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetMessage();
                  }}
                  placeholder="alexa@fundname.com"
                  className="w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-base text-white placeholder:text-zinc-500 focus:border-white/70 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-white px-6 py-3 text-base font-semibold text-black shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Submitting...' : 'Request Access'}
            </button>

            <p className={`text-xs ${messageClasses}`}>{message}</p>
          </form>
        </section>

        <footer className="flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-white">System Capital</p>

          <div className="flex flex-wrap gap-6">
            {['Product', 'Security', 'Careers', 'Contact'].map((link) => (
              <a key={link} href="#" className="text-zinc-500 transition hover:text-white">
                {link}
              </a>
            ))}
          </div>

          <p>© {new Date().getFullYear()} System Capital. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}