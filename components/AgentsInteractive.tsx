'use client';

import { useCallback, useMemo, useState } from "react";
import AgentLogViewer, { AgentLogEntry } from "@/components/AgentLogViewer";
import { agentActivityLog, agentRoster } from "@/data/shenora";

type ActivityEntry = {
  time: string;
  agent: string;
  task: string;
  result: string;
  status: string;
};

const TEST_POST_TEXT = `System Capital test signal.
Monitoring macro liquidity and market conditions.`;

const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'text-emerald-200 border-emerald-400/30 bg-emerald-500/10';
    case 'idle':
      return 'text-slate-200 border-slate-400/30 bg-slate-500/10';
    case 'paused':
      return 'text-amber-200 border-amber-300/30 bg-amber-500/10';
    case 'error':
      return 'text-rose-200 border-rose-400/30 bg-rose-500/10';
    default:
      return 'text-slate-200 border-white/15 bg-slate-900/60';
  }
};

const socialSchedules = [
  {
    title: 'Morning Macro Insight',
    time: '08:15 CDT',
    channels: 'X',
    status: 'Queued',
    content:
      'Liquidity impulse stays positive: Treasury buybacks + $18B drop in ON RRP keep the risk-on bias intact. Watching Brent > $87 as the swing factor. System Capital stays net long liquidity into Asia.',
  },
  {
    title: 'Evening Market Observation',
    time: '19:30 CDT',
    channels: 'X',
    status: 'Queued',
    content:
      'NY close: credit spreads keep grinding tighter while energy vol cools, so System Capital holds the Risk-On regime into Asia. Monitoring dealer inventories + CTA trigger at 0.78 beta overnight.',
  },
];

const replyQueue = [
  {
    post: 'Morning Macro Insight',
    status: 'Thread ready',
    eta: 'Auto +2 min',
    content:
      'Thread: ON RRP usage fell another $18B, lifting reserves back to 2023 highs. That + buybacks keeps liquidity impulse positive unless Brent > $87 for two sessions.',
  },
  {
    post: 'Evening Market Observation',
    status: 'Thread ready',
    eta: 'Auto +3 min',
    content:
      'Thread: Credit desks report tighter HY prints and dealer inventories steady. Watching CTA trigger at 0.78 beta; breach flips the plan to neutral overnight.',
  },
];

const engagementMetrics = [
  { label: '24h impressions', value: '182K', delta: '+12%' },
  { label: 'Avg CTR', value: '4.6%', delta: '+0.7%' },
  { label: 'Mentions', value: '58', delta: '+9' },
];

const agentLogTemplates: Record<string, string[]> = {
  'Growth Agent': [
    'Enriched venture account notes',
    'Calibrated scoring weights',
    'Synced outreach cadences',
    'Published pipeline digest',
  ],
  'Research Agent': [
    'Tagged macro memo',
    'Updated regime appendix',
    'Filed energy drill brief',
    'Expanded geopolitics deck',
  ],
  'Newsletter Agent': [
    'Pulled chart assets',
    'Drafted lead paragraph',
    'Scheduled test send',
    'Refreshed CTA footer',
  ],
  'Social Media Agent': [
    'Generated clip script',
    'Queued platform-specific copy',
    'Tagged macro datapoint',
    'Logged engagement review',
  ],
  'Monitoring Agent': [
    'Ran guardrail heartbeat',
    'Escalated alert',
    'Reset webhook',
    'Filed compliance note',
  ],
};

const buildAgentLogs = (agentName: string): AgentLogEntry[] => {
  const base = agentActivityLog
    .filter((entry) => entry.agent === agentName)
    .map((entry) => ({
      timestamp: entry.time,
      agent: entry.agent,
      action: entry.task,
      result: entry.result,
      status: 'ok',
    }));

  const templates = agentLogTemplates[agentName] ?? ['Automation heartbeat'];
  let fillerIndex = 0;
  while (base.length < 20) {
    const template = templates[fillerIndex % templates.length];
    const minutes = (50 - fillerIndex + 60) % 60;
    base.push({
      timestamp: `13:${minutes.toString().padStart(2, '0')}`,
      agent: agentName,
      action: template,
      result: fillerIndex % 2 === 0 ? 'Logged' : 'Success',
      status: fillerIndex % 2 === 0 ? 'info' : 'ok',
    });
    fillerIndex += 1;
  }

  return base.slice(0, 20);
};

const initialAgentLogMap = agentRoster.reduce<Record<string, AgentLogEntry[]>>((acc, agent) => {
  acc[agent.name] = buildAgentLogs(agent.name);
  return acc;
}, {});

const seededActivity: ActivityEntry[] = agentActivityLog.map((entry) => ({
  time: entry.time,
  agent: entry.agent,
  task: entry.task,
  result: entry.result,
  status: 'ok',
}));

export default function AgentsInteractive() {
  const [agentsState, setAgentsState] = useState(agentRoster);
  const [activityLogState, setActivityLogState] = useState<ActivityEntry[]>(seededActivity);
  const [agentLogs, setAgentLogs] = useState(initialAgentLogMap);
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const healthCounts = useMemo(() => ({
    running: agentsState.filter((agent) => agent.status === 'running').length,
    idle: agentsState.filter((agent) => agent.status === 'idle').length,
    paused: agentsState.filter((agent) => agent.status === 'paused').length,
    error: agentsState.filter((agent) => agent.status === 'error').length,
  }), [agentsState]);

  const appendLog = useCallback((agentName: string, action: string, result: string, status: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivityLogState((prev) => [{ time: timestamp, agent: agentName, task: action, result, status }, ...prev].slice(0, 40));
    setAgentLogs((prev) => {
      const next = prev[agentName] ?? [];
      const updated = [{ timestamp, agent: agentName, action, result, status }, ...next];
      return { ...prev, [agentName]: updated.slice(0, 20) };
    });
  }, []);

  const handleRunAgent = useCallback(async (agentName: string) => {
    setActionLoading((prev) => ({ ...prev, [agentName]: true }));
    let resultMessage = 'Workflow triggered successfully.';
    let status = 'ok';
    let logResult = resultMessage;
    let actionLabel = 'Run command executed';

    if (agentName === 'Social Media Agent') {
      actionLabel = 'Social post test';
      try {
        const response = await fetch('/api/social/test-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: TEST_POST_TEXT }),
        });
        const payload = await response.json().catch(() => ({}));
        const preview = (payload?.echoedText ?? TEST_POST_TEXT).replace(/\s+/g, ' ').slice(0, 80);
        resultMessage = payload?.message ?? 'No response from X handler.';
        logResult = `Payload: ${preview}${preview.length === 80 ? '…' : ''} | Response: ${resultMessage}`;
        status = response.ok ? 'ok' : 'error';
      } catch (error) {
        status = 'error';
        resultMessage = error instanceof Error ? error.message : 'Failed to reach X handler.';
        const preview = TEST_POST_TEXT.replace(/\s+/g, ' ').slice(0, 80);
        logResult = `Payload: ${preview}${preview.length === 80 ? '…' : ''} | Response: ${resultMessage}`;
      }
    }

    setAgentsState((prev) =>
      prev.map((agent) => (agent.name === agentName ? { ...agent, status: 'running' } : agent))
    );
    appendLog(agentName, actionLabel, agentName === 'Social Media Agent' ? logResult : resultMessage, status);
    setActionMessages((prev) => ({ ...prev, [agentName]: resultMessage }));
    setActionLoading((prev) => ({ ...prev, [agentName]: false }));
  }, [appendLog]);

  const handlePauseAgent = useCallback((agentName: string) => {
    const message = 'Scheduled runs paused until resumed.';
    setAgentsState((prev) =>
      prev.map((agent) => (agent.name === agentName ? { ...agent, status: 'paused' } : agent))
    );
    appendLog(agentName, 'Pause command executed', message, 'info');
    setActionMessages((prev) => ({ ...prev, [agentName]: message }));
  }, [appendLog]);

  const socialAgent = agentsState.find((agent) => agent.name === 'Social Media Agent');

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agentsState.map((agent) => (
          <article key={agent.name} className="rounded-2xl border border-white/5 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
              <span>{agent.name}</span>
              <span className={`rounded-full border px-3 py-0.5 text-[11px] ${statusClass(agent.status)}`}>
                {agent.status}
              </span>
            </div>
            <p className="mt-3 text-base text-slate-300">{agent.focus}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
              <p>
                Cadence
                <span className="block text-sm font-semibold text-slate-100">{agent.cadence}</span>
              </p>
              <p>
                Next
                <span className="block text-sm font-semibold text-slate-100">{agent.nextRun}</span>
              </p>
              <p>
                Queue
                <span className="block text-sm font-semibold text-slate-100">{agent.queue}</span>
              </p>
              <p>
                Last Action
                <span className="block text-sm font-semibold text-slate-100">
                  {agent.status === 'paused' ? 'Paused' : 'Within SLA'}
                </span>
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => handleRunAgent(agent.name)}
                disabled={actionLoading[agent.name]}
                className="rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 font-semibold text-emerald-50 transition hover:bg-emerald-500/30 disabled:opacity-60"
              >
                {actionLoading[agent.name] ? 'Running…' : 'Run Agent'}
              </button>
              <button
                onClick={() => handlePauseAgent(agent.name)}
                className="rounded-2xl border border-white/10 px-4 py-2 font-semibold text-slate-200 transition hover:border-white/30"
              >
                Pause Agent
              </button>
              <AgentLogViewer agent={agent.name} logs={agentLogs[agent.name] ?? []} />
            </div>
            {actionMessages[agent.name] && (
              <p className="mt-3 rounded-2xl border border-white/5 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                {actionMessages[agent.name]}
              </p>
            )}
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_1fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Activity Log</p>
              <h2 className="text-xl font-semibold text-white">Last 20 Tasks</h2>
            </div>
            <span className="text-xs text-slate-400">Auto-updated</span>
          </div>
          <div className="mt-4 space-y-3">
            {activityLogState.slice(0, 20).map((entry, index) => (
              <div key={`${entry.time}-${entry.agent}-${index}`} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{entry.time}</p>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{entry.status}</span>
                </div>
                <p className="text-sm text-slate-400">{entry.agent}</p>
                <p className="text-base font-semibold text-white">{entry.task}</p>
                <p className="text-sm text-slate-300">{entry.result}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Status Mix</p>
              <h2 className="text-xl font-semibold text-white">Agent Health</h2>
            </div>
            <span className="text-xs text-slate-500">Live</span>
          </div>
          <div className="mt-5 space-y-4">
            {[
              { label: 'Running', value: healthCounts.running, accent: 'bg-emerald-400' },
              { label: 'Idle', value: healthCounts.idle, accent: 'bg-slate-400' },
              { label: 'Paused', value: healthCounts.paused, accent: 'bg-amber-400' },
              { label: 'Error', value: healthCounts.error, accent: 'bg-rose-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <p>{item.label}</p>
                  <span className="font-semibold text-white">{item.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div className={`h-2 rounded-full ${item.accent}`} style={{ width: `${(item.value / agentsState.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-300">
            {healthCounts.error > 0
              ? 'Errors detected — check Monitoring Agent logs.'
              : 'All agents responding within SLA.'}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Featured Agent</p>
            <h2 className="text-xl font-semibold text-white">Social Media Agent</h2>
            <p className="text-sm text-slate-400">
              Posts to X, schedules drops, builds threads, replies to follow-ups, pulls Research insights, and logs engagement.
            </p>
          </div>
          <span className={`rounded-full border px-3 py-0.5 text-xs capitalize ${statusClass(socialAgent?.status ?? 'running')}`}>
            {socialAgent?.status ?? 'running'}
          </span>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-white">Compose</p>
              <textarea
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                rows={3}
                placeholder="Draft X post, macro clip blurb, or full thread..."
                defaultValue={TEST_POST_TEXT}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Schedule · e.g. 15:05 CDT"
                  className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Thread step count"
                  className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {['Post to X', 'Schedule Post', 'Create Thread', 'Reply to Post'].map((action) => (
                  <button
                    key={action}
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 font-semibold text-emerald-50 hover:bg-emerald-500/20"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Schedule</p>
                {socialAgent?.status === 'paused' && (
                  <p className="mt-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Auto schedule paused until the agent resumes.
                  </p>
                )}
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  {socialSchedules.map((slot) => (
                    <div key={slot.title} className="rounded-2xl border border-white/5 bg-slate-900/40 px-3 py-2">
                      <p className="font-semibold text-white">{slot.title}</p>
                      <p className="text-xs text-slate-400">{slot.time} · {slot.channels}</p>
                      <p className="mt-1 text-sm text-slate-300">{slot.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reply Queue</p>
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  {replyQueue.map((reply) => (
                    <div key={reply.post} className="rounded-2xl border border-white/5 bg-slate-900/40 px-3 py-2">
                      <p className="font-semibold text-white">{reply.post}</p>
                      <p className="text-xs text-slate-400">{reply.status} · ETA {reply.eta}</p>
                      <p className="mt-1 text-sm text-slate-300">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Macro Insights · Research Agent</p>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                {activityLogState
                  .filter((entry) => entry.agent === 'Research Agent')
                  .slice(0, 3)
                  .map((insight) => (
                    <div key={`${insight.time}-${insight.task}`} className="rounded-2xl border border-white/5 bg-slate-900/40 p-3">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{insight.time}</p>
                      <p className="text-base font-semibold text-white">{insight.task}</p>
                      <p className="text-xs text-slate-400">{insight.result}</p>
                    </div>
                  ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Engagement Metrics</p>
              <div className="mt-3 grid gap-2">
                {engagementMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/5 bg-slate-900/40 px-3 py-2">
                    <p className="text-xs text-slate-400">{metric.label}</p>
                    <p className="text-2xl font-semibold text-white">{metric.value}</p>
                    <p className="text-xs text-emerald-300">{metric.delta}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Metrics log to Activity whenever the agent publishes or replies.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
