# Magic Touch Designs — Agent Instructions

## Mission
Audit and maintain the existing Magic Touch Designs e-commerce repository safely. The approved project architecture is documented in `docs/PROJECT_ARCHITECTURE.md`; read it before any repository task.

## Current authorization
The current phase is **read-only audit and understanding only**. Do not edit application code, change configuration, add dependencies, run migrations, modify data, or implement fixes unless the owner explicitly authorizes a specific change after reviewing the audit.

## Mandatory workflow
1. Inspect the actual repository files, current branch, recent commits, and relevant configuration before drawing conclusions.
2. Treat the code as the source of truth for what is implemented. Compare it with `docs/PROJECT_ARCHITECTURE.md` and report discrepancies rather than assuming the documentation is current.
3. Trace complete user flows across frontend, API/backend, database, external services, and deployment configuration where relevant.
4. Separate confirmed findings from hypotheses. Cite exact file paths and line numbers when available; never invent files, routes, environment variables, scripts, or test results.
5. Report severity, customer/business impact, evidence, dependencies, and a recommended fix for each finding.
6. If a required file, service, secret, environment, or test environment is inaccessible, state the limitation. Never expose secret values.

## Protected scope
- Never modify unrelated modules just because they appear nearby.
- Preserve existing working functionality and the current architecture unless the owner explicitly approves a design change.
- Do not change products, collections, portfolio, public store, authentication, checkout, orders, uploads, payments, or other modules during a narrowly scoped task unless that exact scope is authorized.
- For contact-page work, distinguish the **Contact & Support** form from the **Custom Mug Request** form. Do not change Contact & Support when the authorized scope is Custom Mug Request.
- Never invent a mobile repository or files that are not present.

## Git, commits, deployment, and cost controls
- Do not commit, merge, push to `main`, or deploy to Vercel without explicit approval for that action.
- Do not deploy for every small fix. Group related, independently verified fixes into a coherent batch, test the batch, and present the complete proposed scope before implementation.
- Prefer working on a dedicated `feature/*` or `fix/*` branch. Keep `main` production-oriented.
- Before any merge to `main` or production deployment, summarize changed files, tests and outcomes, risks, and expected deployment impact, then request approval.
- Do not trigger unnecessary Vercel deployments or waste build/deployment quotas. Never claim a deployment was avoided, completed, or successful without evidence.

## Payments, tax, and external integrations
- Never initiate real charges, refunds, live purchases, or changes to production payment configuration during an audit.
- Distinguish Stripe test mode from live mode. Never assume test and live credentials are interchangeable.
- Do not change tax, shipping, checkout, payment provider, webhook, email, or environment configuration without explicit authorization.
- Never print or commit secrets, tokens, passwords, private keys, or populated environment files. Use example files only when appropriate.

## Quality and reporting
- Prefer root-cause analysis over symptom-only fixes.
- Validate TypeScript, lint, build, and tests only where the available environment supports them. Clearly distinguish checks run from checks merely recommended.
- Do not claim runtime verification from static code inspection alone.
- Keep reports concise, evidence-based, prioritized, and understandable to the owner.
- Follow existing project naming and style conventions where consistent with the approved architecture. Flag architectural conflicts instead of silently refactoring them.

## Required audit output
For each audit, provide:
1. Scope and files inspected.
2. Confirmed findings prioritized as Critical, High, Medium, or Low.
3. Evidence with file paths and line references when available.
4. Customer impact and root cause.
5. Proposed repair batches grouped by related functionality.
6. Tests/verification needed.
7. Deployment and Vercel impact.
8. Explicit list of files and modules that must remain untouched.

**Default rule: audit first, propose changes second, implement only after approval.**
