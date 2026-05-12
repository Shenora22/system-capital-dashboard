import Image from "next/image";
import {
  agents,
  buildRules,
  crmStages,
  developmentLogs,
  founderMetrics,
  integrationBacklog,
  operatingBackbone,
  navItems,
  opsMetrics,
  paymentTracks,
  prompts,
  reports,
  statusTracks,
  systemEventBlueprint,
  systemHealthChecks,
  workflowGovernanceRules,
  workflows,
  type AgentHealth,
  type LogLevel,
  type WorkflowStatus,
} from "./data";
import "./system-capital-os.css";

type StatusTone = AgentHealth | WorkflowStatus | LogLevel | string;

function StatusPill({ status }: { status: StatusTone }) {
  return <span className={`os-status os-status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

function SectionHeader({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="os-section-header">
      <p className="os-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function MetricCard({ label, value, delta, detail }: { label: string; value: string; delta: string; detail: string }) {
  return (
    <article className="os-panel os-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <div><b>{delta}</b>{detail}</div>
    </article>
  );
}

export default function SystemCapitalOSPage() {
  return (
    <main className="system-os-shell">
      <aside className="os-sidebar" aria-label="System Capital OS navigation">
        <a className="os-brand" href="#top">
          <Image src="/marketing/assets/brand-kit/system-capital-mark.svg" alt="System Capital mark" width={46} height={46} priority />
          <span>System Capital <b>OS</b></span>
        </a>
        <nav>
          {navItems.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <div className="os-sidebar-card">
          <span>Core theme</span>
          <strong>Mission control for an AI workforce.</strong>
          <p>Built for n8n/OpenClaw orchestration, agent telemetry, prompt governance, and founder-grade reporting.</p>
        </div>
      </aside>

      <div className="os-content" id="top">
        <section className="os-hero os-panel">
          <div>
            <p className="os-kicker">System Capital OS // Autonomous operations layer</p>
            <h1>Mission control for an AI workforce.</h1>
            <p>
              A premium AI-native operating system for managing autonomous agents,
              automation workflows, prompt assets, and founder-level operational visibility.
            </p>
            <div className="os-hero-actions">
              <a className="os-button os-button-primary" href="#operations">Open Operations Center</a>
              <a className="os-button os-button-ghost" href="#backbone">View Operating Backbone</a>
            </div>
          </div>
          <div className="os-orbit-card" aria-label="AI workforce overview visualization">
            <Image src="/marketing/assets/brand-kit/alora-orb.svg" alt="Alora AI assistant orb" width={260} height={260} />
            <div className="os-orbit-ring ring-one" />
            <div className="os-orbit-ring ring-two" />
            <span>42 live automations</span>
            <span>5 managed agents</span>
            <span>8 report streams</span>
          </div>
        </section>

        <section className="os-grid os-metrics-grid" id="operations">
          <SectionHeader
            kicker="01 / AI Operations Center"
            title="Operational cockpit"
            body="Real-time visibility into agent execution, workflow throughput, automation health, and human-in-the-loop decisions."
          />
          {opsMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <section className="os-panel os-table-panel" id="backbone">
          <SectionHeader
            kicker="02 / Operating Backbone"
            title="Clean backbone for CRM, workflows, agents, logs, payments, and health"
            body="A source-map for what exists now, who owns it, which data source it should read from, and what can be connected next without touching stable production systems."
          />
          <div className="os-table-wrap">
            <table>
              <thead>
                <tr><th>Area</th><th>Owner</th><th>Status</th><th>Current source</th><th>Next connector</th></tr>
              </thead>
              <tbody>
                {operatingBackbone.map((item) => (
                  <tr key={item.area}>
                    <td><strong>{item.area}</strong></td>
                    <td>{item.owner}</td>
                    <td><StatusPill status={item.status} /></td>
                    <td>{item.source}</td>
                    <td>{item.nextConnection}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="os-panel os-table-panel" id="crm">
          <SectionHeader
            kicker="03 / CRM + Lead Intake"
            title="Lead operating procedure"
            body="Keep the existing Tally → API route → n8n path intact while making the eventual CRM handoff explicit and auditable."
          />
          <div className="os-table-wrap">
            <table>
              <thead>
                <tr><th>Stage</th><th>Trigger</th><th>Owner</th><th>Automation-safe rule</th></tr>
              </thead>
              <tbody>
                {crmStages.map((stage) => (
                  <tr key={stage.stage}>
                    <td><strong>{stage.stage}</strong></td>
                    <td>{stage.trigger}</td>
                    <td>{stage.owner}</td>
                    <td>{stage.automationSafeRule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="os-panel os-table-panel" id="agents">
          <SectionHeader
            kicker="04 / Agent Registry"
            title="AI workforce registry"
            body="Every autonomous role has ownership, health, workflow context, and a clean path to runtime integrations."
          />
          <div className="os-table-wrap">
            <table>
              <thead>
                <tr><th>Agent</th><th>Role</th><th>Owner</th><th>Workflow</th><th>Health</th><th>Last run</th></tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td><span className="os-agent-id">{agent.id}</span><strong>{agent.name}</strong></td>
                    <td>{agent.role}</td>
                    <td>{agent.owner}</td>
                    <td>{agent.workflow}</td>
                    <td><StatusPill status={agent.health} /></td>
                    <td>{agent.lastRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="os-grid os-two-column" id="prompts">
          <div className="os-panel">
            <SectionHeader
              kicker="05 / Prompt Library UI"
              title="Governed prompt assets"
              body="Reusable prompts are versioned by function, token profile, and operational use case."
            />
            <div className="os-prompt-list">
              {prompts.map((prompt) => (
                <article className="os-prompt-card" key={prompt.title}>
                  <div><strong>{prompt.title}</strong><span>{prompt.useCase}</span></div>
                  <div><StatusPill status={prompt.type} /><code>{prompt.version}</code><code>{prompt.tokens}</code></div>
                </article>
              ))}
            </div>
          </div>

          <div className="os-panel" id="architecture">
            <SectionHeader
              kicker="06 / Workflow Architecture"
              title="Future integration map"
              body="Designed to connect prompt intelligence, workflow automation, event storage, and approval surfaces."
            />
            <div className="os-architecture">
              {workflows.map((workflow, index) => (
                <article className="os-workflow-node" key={workflow.name}>
                  <span>0{index + 1}</span>
                  <div><strong>{workflow.name}</strong><small>{workflow.integration}</small></div>
                  <StatusPill status={workflow.status} />
                  <b>{workflow.nodes} nodes</b>
                  <em>SLA {workflow.sla}</em>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="os-panel os-table-panel" id="workflow-governance">
          <SectionHeader
            kicker="07 / Workflow Governance"
            title="Production-safe workflow rules"
            body="Governance checkpoints for workflow changes so the registry can mature without breaking active n8n paths or creating duplicate sources of truth."
          />
          <div className="os-table-wrap">
            <table>
              <thead>
                <tr><th>Rule</th><th>Owner</th><th>Checkpoint</th></tr>
              </thead>
              <tbody>
                {workflowGovernanceRules.map((rule) => (
                  <tr key={rule.rule}>
                    <td><strong>{rule.rule}</strong></td>
                    <td>{rule.owner}</td>
                    <td>{rule.checkpoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="os-grid os-founder-grid" id="founder">
          <div className="os-panel os-founder-command">
            <SectionHeader
              kicker="08 / Founder Dashboard"
              title="Founder command briefing"
              body="A decision-focused operating view that highlights leverage, blockers, and the next approval that matters."
            />
            <div className="os-founder-metrics">
              {founderMetrics.map((metric) => (
                <article key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.note}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="os-panel os-integration-panel">
            <SectionHeader
              kicker="Integration-ready"
              title="n8n / OpenClaw queue"
              body="Mock interfaces are isolated so real connectors can replace the data layer without redesigning the UI."
            />
            {integrationBacklog.map((item) => <div className="os-backlog-item" key={item}>{item}<span /></div>)}
          </div>
        </section>

        <section className="os-grid os-two-column" id="status">
          <div className="os-panel">
            <SectionHeader
              kicker="09 / Agent Status Tracker"
              title="Runtime state monitor"
              body="Track active work, task progress, and degraded connectors before they create operational drag."
            />
            <div className="os-status-list">
              {statusTracks.map((track) => (
                <article className="os-progress-card" key={track.agent}>
                  <div><strong>{track.agent}</strong><StatusPill status={track.status} /></div>
                  <p>{track.task}</p>
                  <span className="os-progress-track"><span style={{ width: `${track.progress}%` }} /></span>
                </article>
              ))}
            </div>
          </div>

          <div className="os-panel" id="logs">
            <SectionHeader
              kicker="10 / Development Log Viewer"
              title="Build + automation log"
              body="A transparent event ledger for workflow changes, prompt releases, and runtime readiness."
            />
            <div className="os-log-list">
              {developmentLogs.map((log) => (
                <article className="os-log-entry" key={`${log.time}-${log.message}`}>
                  <time>{log.time}</time>
                  <StatusPill status={log.level} />
                  <strong>{log.source}</strong>
                  <p>{log.message}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="os-panel os-table-panel" id="system-events">
          <SectionHeader
            kicker="11 / System Events Preparation"
            title="Normalized event ledger blueprint"
            body="A read-only schema plan for future event capture. The dashboard documents the fields now; live writes should wait for storage and ownership review."
          />
          <div className="os-table-wrap">
            <table>
              <thead>
                <tr><th>Field</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                {systemEventBlueprint.map((eventField) => (
                  <tr key={eventField.field}>
                    <td><strong>{eventField.field}</strong></td>
                    <td>{eventField.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="os-panel os-reports" id="reports">
          <SectionHeader
            kicker="12 / System Reports page"
            title="Report center"
            body="Founder-grade reports translate agent activity and workflow health into operational decisions."
          />
          <div className="os-report-grid">
            {reports.map((report) => (
              <article className="os-report-card" key={report.title}>
                <div>
                  <strong>{report.title}</strong>
                  <span>{report.audience}</span>
                </div>
                <dl>
                  <div><dt>Cadence</dt><dd>{report.cadence}</dd></div>
                  <div><dt>Confidence</dt><dd>{report.confidence}</dd></div>
                  <div><dt>Status</dt><dd>{report.status}</dd></div>
                </dl>
                <button className="os-button os-button-ghost">Preview report</button>
              </article>
            ))}
          </div>
        </section>

        <section className="os-grid os-two-column" id="payments">
          <div className="os-panel">
            <SectionHeader
              kicker="13 / Stripe & Payments"
              title="Payment tracking preparation"
              body="Read-only payment readiness for Starter, Pro, and Custom Build paths. This dashboard documents routing and review needs; it does not modify Stripe."
            />
            <div className="os-status-list">
              {paymentTracks.map((track) => (
                <article className="os-progress-card" key={track.name}>
                  <div><strong>{track.name}</strong><StatusPill status={track.status} /></div>
                  <p>{track.source}</p>
                  <small>{track.review}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="os-panel" id="health">
            <SectionHeader
              kicker="14 / System Health"
              title="Automation-safe health checks"
              body="The live-data path should connect by reading known sources first, preserving n8n, Notion, and payment systems until ownership is reviewed."
            />
            <div className="os-status-list">
              {systemHealthChecks.map((check) => (
                <article className="os-progress-card" key={check.name}>
                  <div><strong>{check.name}</strong><StatusPill status={check.state} /></div>
                  <p>{check.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="os-panel os-reports" id="build-rules">
          <SectionHeader
            kicker="15 / Build Rules"
            title="Stabilize before expanding"
            body="Codex-side operating rules for future builders so improvements stay organized, documented, modular, and safe."
          />
          <div className="os-rule-list">
            {buildRules.map((rule, index) => (
              <article className="os-rule-card" key={rule}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{rule}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
