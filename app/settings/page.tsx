import ShenoraShell from "@/components/ShenoraShell";

const toggles = [
  { label: "Night mode", description: "Lock Shenora Network to dark theme", enabled: true },
  { label: "Escalation pings", description: "Send Ops alerts to mobile", enabled: false },
  { label: "Agent auto-restart", description: "Auto-recover crashed workers", enabled: true },
];

const integrations = [
  { name: "Slack", status: "Connected", detail: "#shenora-ops" },
  { name: "Notion", status: "Connected", detail: "/system-capital" },
  { name: "Broker API", status: "Pending", detail: "Awaiting 2FA" },
];

export default function SettingsPage() {
  return (
    <ShenoraShell
      current="settings"
      title="Settings"
      description="Tune Shenora Network preferences, integrations, and guardrails."
    >
      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">Preferences</h2>
        <div className="mt-4 space-y-3">
          {toggles.map((toggle) => (
            <div key={toggle.label} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <div>
                <p className="text-base font-semibold text-white">{toggle.label}</p>
                <p className="text-sm text-slate-300">{toggle.description}</p>
              </div>
              <button
                className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                  toggle.enabled
                    ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30"
                    : "border border-white/10 text-slate-200"
                }`}
              >
                {toggle.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Integrations</h2>
          <button className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-white/30">
            Add Integration
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <div>
                <p className="text-base font-semibold text-white">{integration.name}</p>
                <p className="text-xs text-slate-400">{integration.detail}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-0.5 text-xs ${
                  integration.status === 'Connected'
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                }`}
              >
                {integration.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </ShenoraShell>
  );
}
