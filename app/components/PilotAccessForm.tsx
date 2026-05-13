"use client";

import { FormEvent, useState } from "react";

type PilotAccessFormState = {
  name: string;
  company: string;
  email: string;
  website: string;
  bottleneck: string;
  leadProcess: string;
  monthlyLeadVolume: string;
};

const initialFormState: PilotAccessFormState = {
  name: "",
  company: "",
  email: "",
  website: "",
  bottleneck: "",
  leadProcess: "",
  monthlyLeadVolume: "",
};

const textInputClassName =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:bg-slate-950/75 focus:ring-2 focus:ring-cyan-300/10";

const labelClassName = "text-xs font-medium uppercase tracking-[0.22em] text-slate-400";

export function PilotAccessForm() {
  const [formState, setFormState] = useState<PilotAccessFormState>(initialFormState);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof PilotAccessFormState, value: string) {
    setSubmitted(false);
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl md:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">Pilot Intake</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
            Request Pilot Access
          </h3>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-400">
          Frontend intake for scoping workflow complexity, lead flow, and routing requirements before deployment.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className={labelClassName}>
          Name
          <input
            className={textInputClassName}
            name="name"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Alex Morgan"
            required
            type="text"
            value={formState.name}
          />
        </label>

        <label className={labelClassName}>
          Company
          <input
            className={textInputClassName}
            name="company"
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="Northstar Operations"
            required
            type="text"
            value={formState.company}
          />
        </label>

        <label className={labelClassName}>
          Email
          <input
            className={textInputClassName}
            name="email"
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="alex@company.com"
            required
            type="email"
            value={formState.email}
          />
        </label>

        <label className={labelClassName}>
          Website
          <input
            className={textInputClassName}
            name="website"
            onChange={(event) => updateField("website", event.target.value)}
            placeholder="https://company.com"
            type="url"
            value={formState.website}
          />
        </label>

        <label className={`${labelClassName} md:col-span-2`}>
          Biggest operational bottleneck
          <textarea
            className={`${textInputClassName} min-h-28 resize-none`}
            name="bottleneck"
            onChange={(event) => updateField("bottleneck", event.target.value)}
            placeholder="Where does response time, routing, handoff, or visibility break down today?"
            required
            value={formState.bottleneck}
          />
        </label>

        <label className={labelClassName}>
          Current lead handling process
          <textarea
            className={`${textInputClassName} min-h-28 resize-none`}
            name="leadProcess"
            onChange={(event) => updateField("leadProcess", event.target.value)}
            placeholder="Describe intake sources, assignment, follow-up, and escalation steps."
            required
            value={formState.leadProcess}
          />
        </label>

        <label className={labelClassName}>
          Estimated monthly lead volume
          <select
            className={textInputClassName}
            name="monthlyLeadVolume"
            onChange={(event) => updateField("monthlyLeadVolume", event.target.value)}
            required
            value={formState.monthlyLeadVolume}
          >
            <option value="">Select range</option>
            <option value="1-25">1–25 leads</option>
            <option value="26-100">26–100 leads</option>
            <option value="101-500">101–500 leads</option>
            <option value="500+">500+ leads</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          This lightweight intake is frontend-only for now. Backend routing can be connected when the pilot workflow is ready.
        </p>
        <button
          className="rounded-2xl bg-cyan-100 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(165,243,252,0.2)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
          type="submit"
        >
          Request Pilot Access
        </button>
      </div>

      {submitted ? (
        <p className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          Pilot request captured locally. System Capital can connect this intake to routing, CRM, or alerting infrastructure next.
        </p>
      ) : null}
    </form>
  );
}
