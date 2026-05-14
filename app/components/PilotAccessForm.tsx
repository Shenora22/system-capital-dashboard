"use client";

import { FormEvent, useState } from "react";

type PilotAccessFormState = {
  name: string;
  company: string;
  email: string;
  website: string;
  bottleneck: string;
  leadProcess: string;
  monthlyLeads: string;
  teamSize: string;
};

const initialFormState: PilotAccessFormState = {
  name: "",
  company: "",
  email: "",
  website: "",
  bottleneck: "",
  leadProcess: "",
  monthlyLeads: "",
  teamSize: "",
};

const textInputClassName =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:bg-slate-950/75 focus:ring-2 focus:ring-cyan-300/10";

const labelClassName = "text-xs font-medium uppercase tracking-[0.22em] text-slate-400";
const pilotAccessWebhookUrl = "https://systemcapital.app.n8n.cloud/webhook/system-capital-lead";

export function PilotAccessForm() {
  const [formState, setFormState] = useState<PilotAccessFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle");

  function updateField(field: keyof PilotAccessFormState, value: string) {
    setSubmissionStatus("idle");
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus("idle");

    try {
      const response = await fetch(
        pilotAccessWebhookUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formState.name,
            company: formState.company,
            email: formState.email,
            website: formState.website,
            bottleneck: formState.bottleneck,
            leadProcess: formState.leadProcess,
            monthlyLeads: formState.monthlyLeads,
            teamSize: formState.teamSize,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Pilot access webhook request failed");
      }

      setFormState(initialFormState);
      setSubmissionStatus("success");
    } catch {
      setSubmissionStatus("error");
    } finally {
      setIsSubmitting(false);
    }
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
            name="monthlyLeads"
            onChange={(event) => updateField("monthlyLeads", event.target.value)}
            required
            value={formState.monthlyLeads}
          >
            <option value="">Select range</option>
            <option value="1-25">1–25 leads</option>
            <option value="26-100">26–100 leads</option>
            <option value="101-500">101–500 leads</option>
            <option value="500+">500+ leads</option>
          </select>
        </label>

        <label className={labelClassName}>
          Team size
          <select
            className={textInputClassName}
            name="teamSize"
            onChange={(event) => updateField("teamSize", event.target.value)}
            required
            value={formState.teamSize}
          >
            <option value="">Select range</option>
            <option value="1-5">1–5 people</option>
            <option value="6-15">6–15 people</option>
            <option value="16-50">16–50 people</option>
            <option value="51+">51+ people</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          This lightweight intake routes directly into System Capital operations for review.
        </p>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-100 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(165,243,252,0.2)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/60 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-cyan-100"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
            />
          ) : null}
          {isSubmitting ? "Submitting..." : "Request Pilot Access"}
        </button>
      </div>

      {submissionStatus === "success" ? (
        <p className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          Pilot request received. System Capital will review your operational workflow and follow up shortly.
        </p>
      ) : null}

      {submissionStatus === "error" ? (
        <p className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          Submission failed. Please try again.
        </p>
      ) : null}
    </form>
  );
}
