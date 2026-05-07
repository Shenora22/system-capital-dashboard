import Link from "next/link";
import { redirect } from "next/navigation";

const STARTER_PAYMENT_LINK = "https://buy.stripe.com/...";
const PRO_PAYMENT_LINK = "https://buy.stripe.com/...";
const CUSTOM_BUILD_BOOKING_LINK = "https://cal.com/your-booking-link";

const packages = {
  starter: {
    name: "Starter System",
    price: "$49",
    description: "A lightweight automation kickoff for one focused intake, follow-up, or dashboard workflow.",
    cta: "Pay $49 with Stripe",
    envKey: "NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STARTER",
    fallbackEnvKey: "STRIPE_PAYMENT_LINK_STARTER",
    productionUrl: STARTER_PAYMENT_LINK,
  },
  pro: {
    name: "Pro Follow-Up System",
    price: "$149",
    description: "A complete follow-up system with lead routing, CRM status tracking, and handoff automation.",
    cta: "Pay $149 with Stripe",
    envKey: "NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO",
    fallbackEnvKey: "STRIPE_PAYMENT_LINK_PRO",
    productionUrl: PRO_PAYMENT_LINK,
  },
  custom: {
    name: "Custom Build",
    price: "Book a call",
    description: "For custom automation, payment, dashboard, or CRM builds that need a scoped implementation plan.",
    cta: "Book the custom build call",
    envKey: "NEXT_PUBLIC_CUSTOM_BUILD_BOOKING_LINK",
    fallbackEnvKey: "CUSTOM_BUILD_BOOKING_LINK",
    productionUrl: CUSTOM_BUILD_BOOKING_LINK,
  },
} as const;

type PackageKey = keyof typeof packages;

type NextStepPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function packageKey(value: string): PackageKey {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "");

  if (normalized.includes("pro") || normalized.includes("followup") || normalized === "149") {
    return "pro";
  }

  if (normalized.includes("custom") || normalized.includes("build") || normalized.includes("booking")) {
    return "custom";
  }

  return "starter";
}

function nextStepUrl(packageKeyValue: PackageKey): string {
  const selectedPackage = packages[packageKeyValue];
  return process.env[selectedPackage.envKey] ?? process.env[selectedPackage.fallbackEnvKey] ?? selectedPackage.productionUrl;
}

function isConfiguredExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default async function LeadNextStepPage({ searchParams }: NextStepPageProps) {
  const params = (await searchParams) ?? {};
  const selectedPackageKey = packageKey(firstParam(params.package ?? params.chooseYourPackage ?? params.choose_your_package ?? params.plan ?? params.offer));
  const selectedPackage = packages[selectedPackageKey];
  const selectedUrl = nextStepUrl(selectedPackageKey);

  if (isConfiguredExternalUrl(selectedUrl)) {
    redirect(selectedUrl);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.5em] text-emerald-300">System Capital Intake</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Your request is in. Finish the next step.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            We received your Tally intake and created a CRM record with payment status set to Pending. Choose the
            matching next step below so Stripe or booking confirmation can move your lead to Paid or Booked.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {(Object.entries(packages) as Array<[PackageKey, (typeof packages)[PackageKey]]>).map(([key, option]) => {
            const url = nextStepUrl(key);
            const isSelected = key === selectedPackageKey;
            const cardClasses = isSelected
              ? "border-emerald-400/60 bg-emerald-500/10"
              : "border-white/10 bg-slate-900/60";

            return (
              <article key={key} className={`rounded-3xl border p-6 ${cardClasses}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{isSelected ? "Selected" : "Option"}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{option.name}</h2>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-emerald-200">{option.price}</span>
                </div>
                <p className="mt-4 min-h-20 text-sm leading-6 text-slate-300">{option.description}</p>
                {isConfiguredExternalUrl(url) ? (
                  <Link
                    href={url}
                    className="mt-6 inline-flex w-full justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    {option.cta}
                  </Link>
                ) : (
                  <p className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    Configure {option.envKey} with a valid URL to override the production link.
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">CRM status after this step</h2>
          <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-5">
            {[
              "New Lead",
              "Payment Pending",
              "Paid",
              "Booked",
              "Follow-Up Needed",
            ].map((status) => (
              <div key={status} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                {status}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-400">
            Selected package: <span className="text-slate-100">{selectedPackage.name}</span>. Payment status remains
            Pending until Stripe or n8n sends the confirmation update.
          </p>
          {isConfiguredExternalUrl(selectedUrl) ? null : (
            <p className="mt-3 text-sm text-amber-100">
              The selected next-step link is not a valid external URL. Check the production link or environment override.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
