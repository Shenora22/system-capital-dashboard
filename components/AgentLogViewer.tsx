'use client';

import { useMemo, useState } from "react";

export type AgentLogEntry = {
  timestamp: string;
  agent: string;
  action: string;
  result: string;
  status: string;
};

type Props = {
  agent: string;
  logs: AgentLogEntry[];
};

export default function AgentLogViewer({ agent, logs }: Props) {
  const [open, setOpen] = useState(false);
  const entries = useMemo(() => logs.slice(0, 20), [logs]);

  return (
    <>
      <button
        className="rounded-2xl border border-white/10 px-4 py-2 font-semibold text-slate-200 transition hover:border-white/30"
        onClick={() => setOpen(true)}
      >
        View Logs
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-slate-950/70">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Agent Logs</p>
                <h3 className="text-xl font-semibold text-white">{agent}</h3>
                <p className="text-xs text-slate-400">Showing last {entries.length} entries</p>
              </div>
              <button
                className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wider text-slate-300 hover:border-white/30"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 py-4">
              {entries.map((entry, index) => (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 text-sm text-slate-200"
                >
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400">
                    <span>{entry.timestamp}</span>
                    <span className="uppercase tracking-widest text-[11px] text-slate-500">{entry.status}</span>
                  </div>
                  <p className="mt-1 text-base font-semibold text-white">{entry.action}</p>
                  <p className="text-xs text-slate-400">Result · {entry.result}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
