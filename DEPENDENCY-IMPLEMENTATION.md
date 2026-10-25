# Zod and Vitest — development branch implementation

This branch introduces a permissive Zod input-envelope validator for the
System Capital Tally lead endpoint and a small Vitest regression suite.

## Scope and safeguards
- Invalid JSON roots, malformed `data` and malformed `fields` receive HTTP 400,
  rather than crashing the handler.
- Valid flat payloads and extra Tally provider fields remain accepted.
- No change to SkyTrace authorization, production runtime, billing or deployments.
- The lead-processing flow otherwise remains as before, including its existing
  n8n forwarding behavior. This is not an authentication mechanism.
- Vitest tests use synthetic inputs only.

## Dependencies and licensing
- `zod`: MIT, commercial use permitted with required notices.
- `vitest`: MIT, commercial use permitted with required notices.
- Upstream GitHub repositories exceed 1,000 stars; counts fluctuate.
- No open-source license is literally without conditions.

## IMPORTANT: installation and release gate
The repository's existing npm lockfile has **not** been regenerated here,
because the package registry was unavailable in this execution environment.
The development branch is therefore **not ready to merge or deploy**.

Before review/merge, in a trusted development checkout run:

```sh
npm install --package-lock-only --ignore-scripts
npm ci
npm run test:unit
npm run lint
npm run build
npm run test:tally-lead
```

Commit the resulting `package-lock.json` only after checking the resolved
dependency tree, licenses and security advisories. Do not modify production
or run external integrations during these checks.
