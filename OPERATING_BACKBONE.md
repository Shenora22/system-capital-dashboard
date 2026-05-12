# System Capital OS Stabilization Backbone
# System Capital OS Operating Backbone

This document captures the Codex-side dashboard responsibilities for stabilizing System Capital before expanding it. It documents the surfaces added in code only; Notion, n8n, and Stripe were not modified.

## What was created

- A System OS backbone section at `/system-capital-os#backbone` that maps CRM, lead intake, workflow registry, AI agents registry, system event logging, Stripe/payments, and system health ownership.
- Workflow governance rules at `/system-capital-os#workflow-governance` that protect production paths, require documentation before connection, and enforce read-only-first adapters.
- A System Events preparation section at `/system-capital-os#system-events` that defines the normalized event fields before any write-capable ledger is connected.
- A CRM + lead intake procedure at `/system-capital-os#crm` that keeps the current Tally → Next.js API route → n8n production webhook path intact while preparing future CRM fields and review rules.
- Payment readiness and system health sections at `/system-capital-os#payments` and `/system-capital-os#health` for read-only tracking preparation.
- A build-rules section at `/system-capital-os#build-rules` that future builders can use as a stabilization checklist.
- Dashboard cards on `/dashboard` that link into the System OS backbone instead of creating duplicate pages.

## What changed

- The main dashboard now includes System OS navigation and module cards for the operating backbone, CRM + lead intake, event logs, payments, and system health.
- The System Capital OS route now organizes operating, governance, and event-blueprint data into typed fixture arrays that can later be replaced by live adapters.
- The System Capital OS route now organizes operating data into typed fixture arrays that can later be replaced by live adapters.
- CSS was extended for the new status tones and rule cards while preserving existing layouts and route behavior.

## What should be reviewed manually

- Confirm the CRM field names that Tim creates in Notion match the dashboard's owner/source/stage concepts before wiring live data.
- Confirm Stripe product/payment-link names, fulfillment handoffs, tax/refund rules, and webhook signing secrets before adding any payment telemetry.
- Confirm whether the system event ledger should be stored in Supabase, Notion, or both before adding write paths.
- Confirm each workflow registry item has an owner, SLA, credential owner, rollback note, and production-safe test procedure.

## What should be connected next

1. Read-only Notion databases for Workflow Registry, AI Agents, Build Rules, Bugs/Issues, and System Events.
2. A typed system event schema based on the dashboard blueprint that captures lead intake, workflow runs, agent actions, payment events, incidents, and manual reviews.
2. A typed system event schema that captures lead intake, workflow runs, agent actions, payment events, incidents, and manual reviews.
3. A read-only Stripe event mirror after payment products and webhook security are approved.
4. A CRM adapter that maps accepted Tally leads into normalized account/contact/opportunity records without overwriting raw submissions.
5. Dashboard health checks backed by existing validation scripts and deployment environment status.

## What should NOT be touched yet

- Do not change the production n8n lead-capture webhook path unless a migration plan and rollback are approved.
- Do not edit Notion databases directly from code until the Notion schema is manually reviewed.
- Do not add write-capable Stripe code or auto-charge behavior from the dashboard.
- Do not replace the current Agent Logs fallback behavior; it keeps the dashboard usable when live credentials are missing.
- Do not duplicate stable pages for CRM, payments, or logs until the live data contracts are finalized.
