"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AgentLog,
  LogsResponse,
  deriveLogMetrics,
  fallbackAgentLogs,
  formatLogTime,
  isProblemStatus,
} from "@/logging/lib/agent-logs";
import { agentRoster, signalFeed, workflowStatuses } from "@/memory/data/shenora";

type SignalResponse = {
  label?: string;
  confidence?: number;
  horizon?: string;
  context?: string;
};

const shortcuts = [
  { label: "Operations", href: "/operations", detail: "Open incident and run queue" },
  { label: "Agents", href: "/agents", detail: "Inspect workers and logs" },
  { label: "Automation", href: "/automation", detail: "Review n8n workflow state" },
  { label: "Signals", href: "/signals", detail: "Open market and ops signals" },
  { label: "Deployment", href: "/deployment", detail: "Check release readiness" },
  { label: "Prompts", href: "/prompts", detail: "Review prompt governance" },
  { label: "Brand Kit", href: "/brand-kit", detail: "Open marketing system" },
  { label: "Dashboard", href: "/dashboard", detail: "Return to mission control" },
];

export default function CommandCenterClient() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [signal, setSignal] = useState<SignalResponse | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingSignal, setLoadingSignal] = useState(true);
  const [logMessage, setLogMessage] = useState("");
  const [signalError, setSignalError] = useState("");

  useEffect(() => {
    let active = true;

    const loadLogs = async () => {
      setLoadingLogs(true);
      try {
        const response = await fetch("/api/logs", { cache: "no-store" });
        const payload = (await response.json()) as LogsResponse;
        if (!active) return;

        setLogs(payload.logs);
        setLogMessage(response.ok ? payload.message || "" : payload.message || "Unable to read Agent Logs.");
      } catch (error) {
        if (!active) return;
        setLogMessage(error instanceof Error ? error.message : "Unable to read Agent Logs.");
      } finally {
        if (active) setLoadingLogs(false);
      }
    };

    const loadSignal = async () => {
      setLoadingSignal(true);
      try {
        const response = await fetch("/api/signals", { cache: "no-store" });
        const payload = (await response.json()) as SignalResponse;
        if (!active) return;
        if (!response.ok) throw new Error("Signal API returned an error.");
        setSignal(payload);
      } catch (error) {
        if (!active) return;
        setSignalError(error instanceof Error ? error.message : "Unable to load signal status.");
      } finally {
        if (active) setLoadingSignal(false);
      }
    };

    loadLogs();
    loadSignal();

    return () => {
      active = false;
    };
  }, []);

  const displayLogs = logs.length > 0 ? logs : fallbackAgentLogs;
  const metrics = useMemo(() => deriveLogMetrics(displayLogs), [displayLogs]);
  const liveWorkflows = workflowStatuses.filter((workflow) => ["running", "scheduled", "queued"].includes(workflow.status)).length;
  const runningAgents = agentRoster.filter((agent) => agent.status === "running").length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-cyan-300/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/70 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-cyan-300">Command Center</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
                Real-time control page for System Capital operations.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                This page consolidates Notion Agent Logs, system status, active agents, workflow health, signal posture, and module shortcuts.
              </p>
            </div>
            <Link href="/dashboard" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 hover:border-cyan-200">
              Back to dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "System status", value: metrics.health, tone: metrics.attentionItems ? "text-amber-200" : "text-emerald-200" },
            { label: "Recent logs", value: loadingLogs ? "…" : String(metrics.totalLogs), tone: "text-white" },
            { label: "Live workflows", value: String(liveWorkflows), tone: "text-cyan-200" },
            { label: "Running agents", value: String(Math.max(runningAgents, metrics.activeAgents)), tone: "text-violet-200" },
          ].map((item) => (
            <article key={item.label} className="rounded-3xl border border-white/5 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/40">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
              <p className={`mt-3 text-3xl font-semibold tracking-tight ${item.tone}`}>{item.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-white/5 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Recent logs</p>
                <h2 className="mt-2 text-2xl font-semibold">Agent activity from Notion</h2>
              </div>
              {loadingLogs ? <span className="text-sm text-slate-400">Loading…</span> : <span className="text-sm text-slate-400">{logs.length ? "Notion" : "Fallback"}</span>}
            </div>

            {logMessage && !loadingLogs && (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                {logMessage}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {loadingLogs && [1, 2, 3].map((item) => (
                <div key={item} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-400">
                  Loading Notion Agent Log…
                </div>
              ))}

              {!loadingLogs && displayLogs.slice(0, 10).map((log) => (
                <article key={log.id} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{log.action}</h3>
                      <p className="mt-1 text-sm text-slate-400">{log.agent} · {formatLogTime(log.timestamp)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs ${isProblemStatus(log.status, log.result) ? "border-rose-300/30 bg-rose-400/10 text-rose-100" : "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"}`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{log.result}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/5 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Signal status</p>
              {loadingSignal && <p className="mt-4 text-sm text-slate-400">Loading signal engine…</p>}
              {!loadingSignal && signalError && <p className="mt-4 text-sm text-rose-200">{signalError}</p>}
              {!loadingSignal && signal && (
                <div className="mt-4">
                  <p className="text-4xl font-semibold">{signal.label || "Unknown"}</p>
                  <p className="mt-2 text-sm text-slate-400">Confidence {signal.confidence ?? "—"}% · {signal.horizon || "No horizon"}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{signal.context || signalFeed[0]?.detail}</p>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/5 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Module shortcuts</p>
              <div className="mt-4 grid gap-3">
                {shortcuts.map((shortcut) => (
                  <Link key={shortcut.href} href={shortcut.href} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
                    <strong className="block text-white">{shortcut.label}</strong>
                    <span className="text-sm text-slate-400">{shortcut.detail}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
