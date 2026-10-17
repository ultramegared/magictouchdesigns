# ChatGPT Engineering Handoff — Global Rules + JQYDesigns Status

Last updated: 2026-10-17. This file is a resume point for future chats, including when switching repositories. Read it before work and verify current state rather than assuming notes are live.

## Global rules for every repository
1. Resume from prior work; inspect the relevant handoff, branch, recent commits/PRs, CI, deployment, and logs before repeating steps.
2. Verify before claiming success. Separate user-reported state from code, CI, provider, deployment, and runtime evidence. “Connected,” “fixed,” “published,” and “production-ready” require evidence.
3. Use available tools to do checks directly. Ask the user only when a permission, credential action, decision, or screen-only check is genuinely required.
4. Inspect files before editing. Make the smallest scoped change and protect known-working flows.
5. Never invent repositories, files, credentials, IDs, deployment states, or test results. Never mix separate products.
6. Do not disconnect accounts, rotate credentials, publish test content, make purchases, or make real payments without explicit authorization.
7. Never record secrets, access tokens, passwords, or full API keys in files, commits, issues, or chat.
8. After meaningful work, update the appropriate handoff with verified status, commit/PR/deployment evidence, blockers, and the next concrete action.
9. Be concise and practical: report what changed, what evidence confirms it, what remains unresolved, and the next step. Do not repeat generic instructions unnecessarily.
10. A green build or successful API response alone does not prove the whole user-facing flow works.

## Project identity and boundaries
- Project: JQYDesigns / Magic Touch Designs Marketing Brain.
- Repository: `ultramegared/magictouchdesigns`.
- Keep separate from IncaStream.
- Marketing scope: admin marketing, social connections, campaigns, publications, analytics, and marketing automation.
- Do not touch checkout, orders, payments, authentication, product uploads, collections, portfolio, or public storefront unless explicitly required and authorized.

## GA4 / Marketing analytics — current pause point (2026-10-17)
**Confirmed from production diagnostics:**
- Backend GA4 property ID: `553929161`.
- `frontend/index.html` contains tag ID `G-0SNT5CWBQJ`. Its presence alone does not prove it belongs to the intended property.
- Realtime API returned 3 active users and 29 events at `2026-10-17T13:50:19Z`.
- Historical Data API reports returned zero summary and daily rows for both 7-day and 30-day queries. Historical users/sessions/page views/revenue therefore remain zero in the Marketing panel.
- This issue is unresolved. Realtime success does not prove historical reporting works.
- Production diagnostics were added previously in `backend/src/services/google-search-console.service.ts`; re-check current deployment before relying on its status.
- Caution: the integration verifier may mark Analytics as verified when a report call succeeds even if it returns no rows. “Connected” must not mean “historical data verified.”

**User is pausing screen-based troubleshooting** because viewing the Google Analytics UI is difficult. Do not pressure the user to navigate the dashboard now. Do not change the GA4 property ID or tag ID without evidence.

**Next steps when work resumes:**
1. Inspect the current report service and production logs using available tools; do not repeat generic instructions.
2. Compare a simple historical report using explicit calendar dates against the existing relative date range; capture safe error details, date boundaries, and row counts.
3. Verify property/stream relationship only from authorized evidence; never assume the tag and property match.
4. If UI evidence is still essential, ask for one minimal check or screenshot only when the user is ready. Continue independent backend diagnostics meanwhile.
5. If code confirms the verifier treats empty reports as fully verified, correct that behavior within Marketing analytics only.
6. Test/build, commit, verify deployment and fresh runtime results, then update this file. Do not say the issue is fixed until historical rows/data are confirmed.

Search Console is separate from GA4. Earlier reported Search Console values (about 2 clicks, 21 impressions, 9.52% CTR, average position 34.5) are historical and need fresh verification before being called current. Never use Search Console metrics as a substitute for GA4 metrics.

## Social integrations — historical reports, not freshly verified
| Integration | Last reported state | Next safe action |
|---|---|---|
| Facebook | User reported connected | Read-only verify if needed; do not disconnect. |
| Instagram | User reported connected; PR #89 reportedly merged for a correction | Verify merge and production behavior before changes. No test post without permission. |
| YouTube | Previously pending; prior investigation mentioned an expired/revoked access token and stored refresh token | Inspect sanitized refresh results. Preserve stored refresh token if response omits a replacement. Identify the correct Google OAuth project before changing settings. |
| Pinterest | App `JQYDesigns Marketing Brain`, ID `1619365`, API v5; Trial access reportedly pending | Check current approval/access tier. Do not claim publishing works until approved and tested. |
| Social copy pricing | Draft PR #90, branch `fix/marketing-social-no-prices`, reportedly filters explicit prices from generated social copy | Verify PR, CI, merge, and deployment before calling it live. No test posts or connection changes were reported. |

## Resume checklist for any new chat/repository
- Identify repository and branch; never assume the current project.
- Read its handoff and inspect recent commits/PRs, CI, deployments, and runtime evidence.
- Resume at the latest unresolved blocker, not from the beginning.
- Keep changes scoped and preserve working behavior.
- Update the relevant handoff after meaningful verified work.
- Final report: changed, evidence, unresolved items, next action.

## Update log
- 2026-10-17: Added global working protocol for future chats across repositories. Recorded GA4 discrepancy: realtime returned 3 active users / 29 events; 7-day and 30-day historical reports returned zero rows. User is pausing screen-based UI checks. GA4 historical reporting remains unresolved.
- 2026-10-16: PR #90 was reported to remove explicit catalog prices from generated social copy and filter price-bearing sentences at the publishing boundary. Verify CI/merge/deployment status.
- 2026-10-16: Initial handoff created from earlier context; social statuses are historical reports, not live verification.
