# JQYDesigns / Magic Touch Designs — Project Status

> Purpose: persistent handoff note for the Marketing Brain project. Update this file after meaningful work so a new conversation can resume without repeating steps.
> Safety rule: do not modify unrelated modules or working integrations without an explicit reason. Never store OAuth tokens, client secrets, API keys, passwords, or other credentials here.
> Last updated: 2026-10-16

## Project scope and boundaries

- Repository: `ultramegared/magictouchdesigns`
- Project: JQYDesigns / Magic Touch Designs Marketing Brain and social marketing integrations.
- Keep this project separate from IncaStream.
- Marketing-related areas include admin marketing, social connections, campaigns, publications, analytics, and marketing automation.
- Avoid unrelated areas such as checkout, orders, payments, authentication, product uploads, collections, portfolio, and public storefront unless the task explicitly requires them.

## Current handoff

The statuses below are based on the prior work conversation and are **not a fresh live verification**. Verify against GitHub, deployment logs, provider dashboards, and runtime results before claiming current success.

| Integration / item | Last reported status | Next action |
|---|---|---|
| Facebook | User reported it confirmed/connected | Check current connection and verify status only if needed; do not disconnect it. |
| Instagram | User reported it confirmed. PR #89 was reported merged into `main` for the Instagram correction. | Verify PR/commit and production behavior before making further changes. Do not publish a test post without permission. |
| YouTube | Pending. Prior investigation reported an expired/revoked access token and a stored refresh token. | Inspect OAuth refresh result and logs without exposing secrets. Confirm Google OAuth publishing status and token behavior. Preserve the existing refresh token when a refresh response omits a replacement. If Google has revoked it, request one user-authorized reconnection after the root cause/configuration is addressed. |
| Pinterest | Developer app reported as `JQYDesigns Marketing Brain`, App ID `1619365`, API v5, status `Trial access pending`. | Check the developer portal's current access-tier/request status. Do not create another app or claim API publishing is available until approved and tested. |
| Project status record | This file is being established as the technical handoff. | Update this file after verified changes and include commit/PR links where available. |

## Working rules

1. Inspect before changing. Prefer small, scoped changes.
2. Do not overwrite or alter existing files without fetching their current contents first.
3. Do not change working Facebook/Instagram flows while troubleshooting YouTube or Pinterest.
4. Do not create test publications, disconnect accounts, or rotate credentials without explicit authorization.
5. Do not record secrets or complete credential values in this file, chat, issues, or commits.
6. Distinguish reported state from verified state. Record evidence such as commit SHA, PR URL, deployment, provider response, or test result.
7. After a code change, report exactly what changed, where, and what was or was not verified.

## Next steps

1. Verify this file exists on GitHub and note the commit that created it.
2. Resume Pinterest access-tier approval/status.
3. Return to YouTube OAuth token refresh and identify the actual Google OAuth project before changing Google Cloud settings.
4. Re-check Facebook and Instagram only as read-only verification unless a specific issue appears.

## Update log

- 2026-10-16: Initial handoff file created from the previously reported project context. Integration statuses above are historical reports, not live verification.
