# Exact changed-file index

Baseline `4e979ba`, branch `feat/program-boundaries`. Shared files are assigned a primary responsibility; linked runbooks describe dependencies. All actual application/migration/tooling/test/document changes are listed. PNGs are enumerated by the screenshot indexes. No environment values, private operator plans or generated test artifacts are included.

| Stage                                      | Exact file                                                                                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Shared integration, tests or documentation | [.env.example](../.env.example)                                                                                                           |
| Shared integration, tests or documentation | [DEPLOYMENT.md](../DEPLOYMENT.md)                                                                                                         |
| Shared integration, tests or documentation | [README.md](../README.md)                                                                                                                 |
| Staff operations / scoped authorization    | [app/admin/AdminContext.tsx](../app/admin/AdminContext.tsx)                                                                               |
| Staff operations / scoped authorization    | [app/admin/audit/page.tsx](../app/admin/audit/page.tsx)                                                                                   |
| Staff operations / scoped authorization    | [app/admin/cases/[id]/page.tsx](../app/admin/cases/[id]/page.tsx)                                                                         |
| Staff operations / scoped authorization    | [app/admin/cases/page.tsx](../app/admin/cases/page.tsx)                                                                                   |
| Staff operations / scoped authorization    | [app/admin/components/ProgramInvitations.tsx](../app/admin/components/ProgramInvitations.tsx)                                             |
| Staff operations / scoped authorization    | [app/admin/components/StaffTable.tsx](../app/admin/components/StaffTable.tsx)                                                             |
| Human help / AI                            | [app/admin/components/SupportIntakeSettings.tsx](../app/admin/components/SupportIntakeSettings.tsx)                                       |
| Staff operations / scoped authorization    | [app/admin/components/staff.module.css](../app/admin/components/staff.module.css)                                                         |
| Staff operations / scoped authorization    | [app/admin/directory/page.tsx](../app/admin/directory/page.tsx)                                                                           |
| Staff operations / scoped authorization    | [app/admin/finance/FinanceClient.tsx](../app/admin/finance/FinanceClient.tsx)                                                             |
| Staff operations / scoped authorization    | [app/admin/finance/page.tsx](../app/admin/finance/page.tsx)                                                                               |
| Staff operations / scoped authorization    | [app/admin/layout.module.css](../app/admin/layout.module.css)                                                                             |
| Staff operations / scoped authorization    | [app/admin/layout.tsx](../app/admin/layout.tsx)                                                                                           |
| Staff operations / scoped authorization    | [app/admin/login.module.css](../app/admin/login.module.css)                                                                               |
| Staff operations / scoped authorization    | [app/admin/login/page.tsx](../app/admin/login/page.tsx)                                                                                   |
| Staff operations / scoped authorization    | [app/admin/page.tsx](../app/admin/page.tsx)                                                                                               |
| Staff operations / scoped authorization    | [app/admin/payouts/page.tsx](../app/admin/payouts/page.tsx)                                                                               |
| Program/security                           | [app/admin/programs/page.tsx](../app/admin/programs/page.tsx)                                                                             |
| Staff operations / scoped authorization    | [app/admin/reports/page.tsx](../app/admin/reports/page.tsx)                                                                               |
| Staff operations / scoped authorization    | [app/admin/security/page.tsx](../app/admin/security/page.tsx)                                                                             |
| Staff operations / scoped authorization    | [app/admin/staff/page.tsx](../app/admin/staff/page.tsx)                                                                                   |
| Staff operations / scoped authorization    | [app/admin/users/[userId]/page.tsx](../app/admin/users/[userId]/page.tsx)                                                                 |
| Staff operations / scoped authorization    | [app/admin/users/page.tsx](../app/admin/users/page.tsx)                                                                                   |
| Shared integration, tests or documentation | [app/api/access/route.ts](../app/api/access/route.ts)                                                                                     |
| Staff operations / scoped authorization    | [app/api/admin/audit/route.ts](../app/api/admin/audit/route.ts)                                                                           |
| Human help / AI                            | [app/api/admin/cases/[id]/acknowledge/route.ts](../app/api/admin/cases/[id]/acknowledge/route.ts)                                         |
| Staff operations / scoped authorization    | [app/api/admin/cases/[id]/allocate/route.ts](../app/api/admin/cases/[id]/allocate/route.ts)                                               |
| Staff operations / scoped authorization    | [app/api/admin/cases/[id]/dispatch/route.ts](../app/api/admin/cases/[id]/dispatch/route.ts)                                               |
| Staff operations / scoped authorization    | [app/api/admin/cases/[id]/notes/route.ts](../app/api/admin/cases/[id]/notes/route.ts)                                                     |
| Staff operations / scoped authorization    | [app/api/admin/cases/[id]/route.ts](../app/api/admin/cases/[id]/route.ts)                                                                 |
| Staff operations / scoped authorization    | [app/api/admin/cases/route.ts](../app/api/admin/cases/route.ts)                                                                           |
| Staff operations / scoped authorization    | [app/api/admin/cases/staff/route.ts](../app/api/admin/cases/staff/route.ts)                                                               |
| Staff operations / scoped authorization    | [app/api/admin/directory/[id]/route.ts](../app/api/admin/directory/[id]/route.ts)                                                         |
| Staff operations / scoped authorization    | [app/api/admin/directory/route.ts](../app/api/admin/directory/route.ts)                                                                   |
| Staff operations / scoped authorization    | [app/api/admin/finance/payout-config/route.ts](../app/api/admin/finance/payout-config/route.ts)                                           |
| Staff operations / scoped authorization    | [app/api/admin/finance/pool/route.ts](../app/api/admin/finance/pool/route.ts)                                                             |
| Staff operations / scoped authorization    | [app/api/admin/finance/route.ts](../app/api/admin/finance/route.ts)                                                                       |
| Staff operations / scoped authorization    | [app/api/admin/invitations/route.ts](../app/api/admin/invitations/route.ts)                                                               |
| Staff operations / scoped authorization    | [app/api/admin/login/route.ts](../app/api/admin/login/route.ts)                                                                           |
| Program/security                           | [app/api/admin/mfa/route.ts](../app/api/admin/mfa/route.ts)                                                                               |
| Staff operations / scoped authorization    | [app/api/admin/overview/route.ts](../app/api/admin/overview/route.ts)                                                                     |
| Staff operations / scoped authorization    | [app/api/admin/payouts/route.ts](../app/api/admin/payouts/route.ts)                                                                       |
| Program/security                           | [app/api/admin/programs/route.ts](../app/api/admin/programs/route.ts)                                                                     |
| Staff operations / scoped authorization    | [app/api/admin/security/route.ts](../app/api/admin/security/route.ts)                                                                     |
| Staff operations / scoped authorization    | [app/api/admin/session/route.ts](../app/api/admin/session/route.ts)                                                                       |
| Staff operations / scoped authorization    | [app/api/admin/staff/[staffId]/route.ts](../app/api/admin/staff/[staffId]/route.ts)                                                       |
| Staff operations / scoped authorization    | [app/api/admin/staff/route.ts](../app/api/admin/staff/route.ts)                                                                           |
| Staff operations / scoped authorization    | [app/api/admin/stats/activity/route.ts](../app/api/admin/stats/activity/route.ts)                                                         |
| Staff operations / scoped authorization    | [app/api/admin/stats/reports/route.ts](../app/api/admin/stats/reports/route.ts)                                                           |
| Staff operations / scoped authorization    | [app/api/admin/stats/route.ts](../app/api/admin/stats/route.ts)                                                                           |
| Staff operations / scoped authorization    | [app/api/admin/stats/trends/route.ts](../app/api/admin/stats/trends/route.ts)                                                             |
| Human help / AI                            | [app/api/admin/support-settings/route.ts](../app/api/admin/support-settings/route.ts)                                                     |
| Staff operations / scoped authorization    | [app/api/admin/users/[userId]/route.ts](../app/api/admin/users/[userId]/route.ts)                                                         |
| Staff operations / scoped authorization    | [app/api/admin/users/route.ts](../app/api/admin/users/route.ts)                                                                           |
| Shared integration, tests or documentation | [app/api/auth/login/route.ts](../app/api/auth/login/route.ts)                                                                             |
| Shared integration, tests or documentation | [app/api/auth/register/route.ts](../app/api/auth/register/route.ts)                                                                       |
| Human help / AI                            | [app/api/chat/route.ts](../app/api/chat/route.ts)                                                                                         |
| Human help / AI                            | [app/api/stress-signal/route.ts](../app/api/stress-signal/route.ts)                                                                       |
| Human help / AI                            | [app/api/support/route.ts](../app/api/support/route.ts)                                                                                   |
| Human help / AI                            | [app/api/tts/route.ts](../app/api/tts/route.ts)                                                                                           |
| Shared integration, tests or documentation | [app/api/user/ensure/route.ts](../app/api/user/ensure/route.ts)                                                                           |
| Human help / AI                            | [app/components/HelpButton.tsx](../app/components/HelpButton.tsx)                                                                         |
| Human help / AI                            | [app/components/HubertChat.tsx](../app/components/HubertChat.tsx)                                                                         |
| Human help / AI                            | [app/components/support/HumanResources.tsx](../app/components/support/HumanResources.tsx)                                                 |
| Human help / AI                            | [app/components/support/ProgramHelpRequest.tsx](../app/components/support/ProgramHelpRequest.tsx)                                         |
| Human help / AI                            | [app/components/support/SupportWorkspace.tsx](../app/components/support/SupportWorkspace.tsx)                                             |
| Human help / AI                            | [app/components/support/support.module.css](../app/components/support/support.module.css)                                                 |
| Human help / AI                            | [app/lifeline/page.tsx](../app/lifeline/page.tsx)                                                                                         |
| Human help / AI                            | [app/privacy/page.tsx](../app/privacy/page.tsx)                                                                                           |
| Shared integration, tests or documentation | [app/profile/Rewards.tsx](../app/profile/Rewards.tsx)                                                                                     |
| Shared integration, tests or documentation | [docs/current-architecture.md](../docs/current-architecture.md)                                                                           |
| Human help / AI                            | [docs/hubert-support/README.md](../docs/hubert-support/README.md)                                                                         |
| Human help / AI                            | [docs/hubert-support/audit.md](../docs/hubert-support/audit.md)                                                                           |
| Human help / AI                            | [docs/hubert-support/response-policy.md](../docs/hubert-support/response-policy.md)                                                       |
| Human help / AI                            | [docs/hubert-support/screenshots/README.md](../docs/hubert-support/screenshots/README.md)                                                 |
| Human help / AI                            | [docs/hubert-support/screenshots/browser-checks.json](../docs/hubert-support/screenshots/browser-checks.json)                             |
| Human help / AI                            | [docs/hubert-support/source-verification.json](../docs/hubert-support/source-verification.json)                                           |
| Human help / AI                            | [docs/hubert-support/verification-results.json](../docs/hubert-support/verification-results.json)                                         |
| Human help / AI                            | [docs/hubert-support/verification.md](../docs/hubert-support/verification.md)                                                             |
| Shared integration, tests or documentation | [docs/implementation-files.md](../docs/implementation-files.md)                                                                           |
| Program/security                           | [docs/program-boundaries/README.md](../docs/program-boundaries/README.md)                                                                 |
| Program/security                           | [docs/program-boundaries/audit.md](../docs/program-boundaries/audit.md)                                                                   |
| Program/security                           | [docs/program-boundaries/migration-evidence.json](../docs/program-boundaries/migration-evidence.json)                                     |
| Program/security                           | [docs/program-boundaries/verification.md](../docs/program-boundaries/verification.md)                                                     |
| Staff operations / scoped authorization    | [docs/staff-operations/README.md](../docs/staff-operations/README.md)                                                                     |
| Staff operations / scoped authorization    | [docs/staff-operations/audit.md](../docs/staff-operations/audit.md)                                                                       |
| Staff operations / scoped authorization    | [docs/staff-operations/screenshots/README.md](../docs/staff-operations/screenshots/README.md)                                             |
| Staff operations / scoped authorization    | [docs/staff-operations/screenshots/browser-checks.json](../docs/staff-operations/screenshots/browser-checks.json)                         |
| Staff operations / scoped authorization    | [docs/staff-operations/verification.md](../docs/staff-operations/verification.md)                                                         |
| Shared integration, tests or documentation | [docs/upgrade-plan.md](../docs/upgrade-plan.md)                                                                                           |
| Shared integration, tests or documentation | [docs/upgrade-status.md](../docs/upgrade-status.md)                                                                                       |
| Shared integration, tests or documentation | [e2e/admin.spec.ts](../e2e/admin.spec.ts)                                                                                                 |
| Shared integration, tests or documentation | [e2e/design-system.spec.ts](../e2e/design-system.spec.ts)                                                                                 |
| Shared integration, tests or documentation | [e2e/global-teardown.ts](../e2e/global-teardown.ts)                                                                                       |
| Shared integration, tests or documentation | [e2e/helpers/rewards.ts](../e2e/helpers/rewards.ts)                                                                                       |
| Shared integration, tests or documentation | [e2e/helpers/seed.ts](../e2e/helpers/seed.ts)                                                                                             |
| Shared integration, tests or documentation | [e2e/helpers/staff.ts](../e2e/helpers/staff.ts)                                                                                           |
| Human help / AI                            | [e2e/hubert-support.spec.ts](../e2e/hubert-support.spec.ts)                                                                               |
| Shared integration, tests or documentation | [e2e/payout-approval.spec.ts](../e2e/payout-approval.spec.ts)                                                                             |
| Shared integration, tests or documentation | [e2e/release-smoke.spec.ts](../e2e/release-smoke.spec.ts)                                                                                 |
| Shared integration, tests or documentation | [e2e/rewards.spec.ts](../e2e/rewards.spec.ts)                                                                                             |
| Staff operations / scoped authorization    | [e2e/staff-operations.spec.ts](../e2e/staff-operations.spec.ts)                                                                           |
| Program/security                           | [lib/admin-auth.ts](../lib/admin-auth.ts)                                                                                                 |
| Shared integration, tests or documentation | [lib/api-helpers.ts](../lib/api-helpers.ts)                                                                                               |
| Shared integration, tests or documentation | [lib/audit.ts](../lib/audit.ts)                                                                                                           |
| Shared integration, tests or documentation | [lib/payout-rules.ts](../lib/payout-rules.ts)                                                                                             |
| Program/security                           | [lib/program-backfill.ts](../lib/program-backfill.ts)                                                                                     |
| Program/security                           | [lib/program-enrollment.ts](../lib/program-enrollment.ts)                                                                                 |
| Program/security                           | [lib/program-scope.ts](../lib/program-scope.ts)                                                                                           |
| Shared integration, tests or documentation | [lib/rewards/accounting.ts](../lib/rewards/accounting.ts)                                                                                 |
| Staff operations / scoped authorization    | [lib/rewards/finance.ts](../lib/rewards/finance.ts)                                                                                       |
| Shared integration, tests or documentation | [lib/rewards/http.ts](../lib/rewards/http.ts)                                                                                             |
| Shared integration, tests or documentation | [lib/rewards/new-account.ts](../lib/rewards/new-account.ts)                                                                               |
| Staff operations / scoped authorization    | [lib/rewards/requests.ts](../lib/rewards/requests.ts)                                                                                     |
| Shared integration, tests or documentation | [lib/staff-fetch.ts](../lib/staff-fetch.ts)                                                                                               |
| Program/security                           | [lib/staff-security.ts](../lib/staff-security.ts)                                                                                         |
| Staff operations / scoped authorization    | [lib/staff/cases.ts](../lib/staff/cases.ts)                                                                                               |
| Staff operations / scoped authorization    | [lib/staff/csv.ts](../lib/staff/csv.ts)                                                                                                   |
| Staff operations / scoped authorization    | [lib/staff/directory.ts](../lib/staff/directory.ts)                                                                                       |
| Staff operations / scoped authorization    | [lib/staff/lists.ts](../lib/staff/lists.ts)                                                                                               |
| Staff operations / scoped authorization    | [lib/staff/reporting.ts](../lib/staff/reporting.ts)                                                                                       |
| Human help / AI                            | [lib/support/bounded-json.ts](../lib/support/bounded-json.ts)                                                                             |
| Human help / AI                            | [lib/support/intake.ts](../lib/support/intake.ts)                                                                                         |
| Human help / AI                            | [lib/support/policy.ts](../lib/support/policy.ts)                                                                                         |
| Human help / AI                            | [lib/support/provider.ts](../lib/support/provider.ts)                                                                                     |
| Human help / AI                            | [lib/support/resources.ts](../lib/support/resources.ts)                                                                                   |
| Human help / AI                            | [lib/support/usage.ts](../lib/support/usage.ts)                                                                                           |
| Human help / AI                            | [lib/use-modal-a11y.ts](../lib/use-modal-a11y.ts)                                                                                         |
| Shared integration, tests or documentation | [lib/user-session.ts](../lib/user-session.ts)                                                                                             |
| Shared integration, tests or documentation | [middleware.ts](../middleware.ts)                                                                                                         |
| Shared integration, tests or documentation | [package-lock.json](../package-lock.json)                                                                                                 |
| Shared integration, tests or documentation | [package.json](../package.json)                                                                                                           |
| Shared integration, tests or documentation | [playwright.config.ts](../playwright.config.ts)                                                                                           |
| Program/security                           | [prisma/migrations/20261027040000_program_boundaries/migration.sql](../prisma/migrations/20261027040000_program_boundaries/migration.sql) |
| Staff operations / scoped authorization    | [prisma/migrations/20261029000000_staff_workflows/migration.sql](../prisma/migrations/20261029000000_staff_workflows/migration.sql)       |
| Human help / AI                            | [prisma/migrations/20261101000000_support_integrity/migration.sql](../prisma/migrations/20261101000000_support_integrity/migration.sql)   |
| Shared integration, tests or documentation | [prisma/schema.prisma](../prisma/schema.prisma)                                                                                           |
| Program/security                           | [prisma/seed-admin.ts](../prisma/seed-admin.ts)                                                                                           |
| Shared integration, tests or documentation | [scripts/build.ts](../scripts/build.ts)                                                                                                   |
| Program/security                           | [scripts/provision-program.ts](../scripts/provision-program.ts)                                                                           |
| Program/security                           | [scripts/reconcile-programs.ts](../scripts/reconcile-programs.ts)                                                                         |
| Program/security                           | [scripts/recover-staff.ts](../scripts/recover-staff.ts)                                                                                   |
| Shared integration, tests or documentation | [scripts/run-tests.ts](../scripts/run-tests.ts)                                                                                           |
| Shared integration, tests or documentation | [tests/api/admin-login.test.ts](../tests/api/admin-login.test.ts)                                                                         |
| Human help / AI                            | [tests/api/hubert-support.test.ts](../tests/api/hubert-support.test.ts)                                                                   |
| Shared integration, tests or documentation | [tests/api/payout.test.ts](../tests/api/payout.test.ts)                                                                                   |
| Program/security                           | [tests/api/program-boundaries.test.ts](../tests/api/program-boundaries.test.ts)                                                           |
| Program/security                           | [tests/api/program-migration.test.ts](../tests/api/program-migration.test.ts)                                                             |
| Program/security                           | [tests/api/staff-mfa.test.ts](../tests/api/staff-mfa.test.ts)                                                                             |
| Program/security                           | [tests/fixtures/pre-program-schema.prisma](../tests/fixtures/pre-program-schema.prisma)                                                   |
| Shared integration, tests or documentation | [tests/helpers/factories.ts](../tests/helpers/factories.ts)                                                                               |
| Shared integration, tests or documentation | [tests/helpers/request.ts](../tests/helpers/request.ts)                                                                                   |
| Shared integration, tests or documentation | [tests/helpers/staff.ts](../tests/helpers/staff.ts)                                                                                       |
| Shared integration, tests or documentation | [tests/setup-env.ts](../tests/setup-env.ts)                                                                                               |
| Program/security                           | [tests/unit/staff-security.test.ts](../tests/unit/staff-security.test.ts)                                                                 |

All image files: [33 staff captures](staff-operations/screenshots/README.md) and [10 help captures](hubert-support/screenshots/README.md). Previous-stage screenshot collections remain historical evidence.
