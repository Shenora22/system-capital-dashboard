'use client';

import { FormEvent, useMemo, useState } from "react";
import { agentActivityLog, agentRoster, signalFeed, workflowStatuses } from "@/Data/shenora";

const seedMessages = [
  {
    id: 1,
    role: 'alora' as const,
    text: 'I\'m Alora. Ask about agents, workflows, signals, or tell me to run something.',
    timestamp: '14:50',
  },
];

type Message = {
  id: number;
  role: 'user' | 'alora';
  text: string;
  timestamp: string;
};

const formatAgentSummary = () =>
  agentRoster
    .map((agent) => `${agent.name}: ${agent.status} (${agent.queue})`)
    .join(' · ');

const formatWorkflowSummary = () =>
  workflowStatuses
    .map((workflow) => `${workflow.name.split(' → ')[0]}: ${workflow.status}`)
    .join(' · ');

const formatSignalSummary = () => {
  const highlight = signalFeed[0];
  return `${highlight.category} → ${highlight.headline} (${highlight.confidence}% confidence)`;
};

const formatRecentActivity = () =>
  agentActivityLog
    .slice(0, 3)
    .map((entry) => `${entry.time} · ${entry.agent}: ${entry.task}`)
    .join('\n');

const handleCommand = (intent: string): string => {
  switch (intent) {
    case 'run growth agent':
      return 'Queued Growth Agent for immediate execution. I\'ll report back if the job deviates from SLA.';
    case 'generate signal post':
      return `Using latest signal: ${formatSignalSummary()}. Drafted copy and sent to Pulse Social for approval.`;
    case 'create strategic briefing':
      return 'Started System Capital briefing: pulling regime shifts, automation state, and activity log for the last 4 hours.';
    case 'show recent logs':
      return `Here are the latest entries:\n${formatRecentActivity()}`;
    default:
      return "Command recognized. I'm working on it.";
  }
};

const detectCommand = (input: string) => {
  const normalized = input.trim().toLowerCase();
  if (normalized.includes('run growth agent')) return 'run growth agent';
  if (normalized.includes('generate signal post')) return 'generate signal post';
  if (normalized.includes('create strategic briefing')) return 'create strategic briefing';
  if (normalized.includes('show recent logs')) return 'show recent logs';
  return null;
};

const answerQuestion = (input: string) => {
  const normalized = input.toLowerCase();
  if (normalized.includes('agent')) {
    return `Agent status → ${formatAgentSummary()}`;
  }
  if (normalized.includes('workflow') || normalized.includes('automation')) {
    return `Workflow health → ${formatWorkflowSummary()}`;
  }
  if (normalized.includes('signal')) {
    return `Signal engine update → ${formatSignalSummary()}`;
  }
  if (normalized.includes('recent') || normalized.includes('activity') || normalized.includes('log')) {
    return `Latest activity:\n${formatRecentActivity()}`;
  }
  return "Network steady. Ask for agent status, workflows, signals, or run a command.";
};

export default function AskAloraWidget() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [pending, setPending] = useState('');
  const [sending, setSending] = useState(false);

  const lastActivity = useMemo(() => agentActivityLog[0]?.time ?? '—', []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = pending.trim();
    if (!text || sending) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { id: Date.now(), role: 'user', text, timestamp };
    setMessages((prev) => [...prev, userMessage]);
    setPending('');
    setSending(true);

    setTimeout(() => {
      const command = detectCommand(text);
      const replyText = command ? handleCommand(command) : answerQuestion(text);
      const reply: Message = {
        id: Date.now() + 1,
        role: 'alora',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, reply]);
      setSending(false);
    }, 350);
  };

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div className="pointer-events-auto rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-400 shadow-2xl shadow-slate-950/70">
        <p>Alora online · last activity {lastActivity}</p>
      </div>
      <div className="pointer-events-auto w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-slate-950/70">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Ask Alora</p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">AI Operator</p>
          </div>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wider text-slate-300 hover:border-white/30"
          >
            {open ? 'Hide' : 'Open'}
          </button>
        </div>
        {open && (
          <>
            <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-3 text-sm">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-2xl border px-3 py-2 ${
                    message.role === 'alora'
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-50'
                      : 'border-white/10 bg-slate-900/60 text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
                    <span>{message.role === 'alora' ? 'Alora' : 'You'}</span>
                    <span>{message.timestamp}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm">{message.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={submit} className="flex gap-2 border-t border-white/5 px-4 py-3">
              <input
                value={pending}
                onChange={(event) => setPending(event.target.value)}
                placeholder="Ask about agents, automation, signals..."
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-500/30 disabled:opacity-60"
              >
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
