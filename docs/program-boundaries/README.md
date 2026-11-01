# Program authorization and privileged staff security

Source baseline `4e979ba`; work is on `feat/program-boundaries`. [Pre-edit audit](audit.md). Related [staff operations](../staff-operations/audit.md). No production migration, membership mapping, MFA key setup, deployment or merge has been performed.

## Security ownership

Organization → Program is the explicit boundary. StaffMembership gives an identity a role in one program; ParticipantEnrollment gives an account and its existing history one program owner. Membership/enrollment are server records, never inferred from learner-editable city, financial config slug, invitation presentation or hostname. City proposal routes remain presentation only.

One participant account has one security owner. Concurrent enrollment/transfer would need a separately reviewed history/consent/financial design; there is no hidden transfer endpoint. Financial config assignment remains separate from ownership and can select only a config owned by the same program. Accepted requests keep their monetary snapshots. Program pools are separate; a reviewed legacy singleton pool retains its original ID/amount and is resolved by its program owner. The platform Stripe binding is not an organization-specific connection, so its balance is withheld from program finance views.

Unassigned/null-owned legacy data and quarantined enrollments are excluded from staff lists, details, mutations, exports and aggregates. Learners retain their own authenticated learning/history. Unenrolled exploration accounts may learn, but cannot request new money or claim a routed support team. Private program invitations enroll newly authenticated/created unassigned accounts explicitly marked eligible when created by this version. Pre-migration unassigned accounts default to legacy quarantine and require reviewed ownership mapping; a new invitation cannot silently expose their historical records. Invitations they never move an account from another program. The existing shared demonstration code grants exploration, not staff visibility or organizational ownership.

## Permission matrix

Every staff column requires an active identity, unrevoked MFA-verified session, active membership and active program/organization. The browser's scope header must match the server-selected program on data requests. It is a stale-tab safeguard, not identity proof.

| Capability                                               | Learner                              | Caseworker                          | Finance                                                  | Program administrator                             | Verified platform operator                         |
| -------------------------------------------------------- | ------------------------------------ | ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| Published shared curriculum / public help                | Published/own evidence               | Shared curriculum metadata          | Shared curriculum metadata                               | Shared curriculum metadata                        | Release-only curriculum operations                 |
| Participant profile, learning and consent/support detail | Own account                          | Active program                      | Minimal contact/reward detail; no case/consent documents | Active program                                    | No runtime data endpoint                           |
| Case notes, assignment, dispatch and service allocations | Own support signal if enrolled       | Active program                      | Denied                                                   | Active program                                    | No runtime data endpoint                           |
| Service directory                                        | No participant data in public routes | Program read/write                  | Program read only                                        | Program read/write                                | Explicit release/provisioning only                 |
| Review payout                                            | Own request/cancel before review     | Program review/reject               | Cannot perform caseworker review                         | Program review/reject                             | No runtime data endpoint                           |
| Approve / record verified manual payment                 | Denied                               | Denied                              | Active program; saved distinct-approver rules            | Active program; same saved rules                  | No runtime data endpoint                           |
| Program rules, pool funding, entitlement correction      | Denied                               | Denied                              | Active program                                           | Active program                                    | Reviewed reconciliation/recovery only              |
| Participant account/case number edits                    | Own allowed profile fields only      | Active program                      | Denied                                                   | Active program                                    | Verified recovery only                             |
| Defined aggregate reports / minimal filtered exports     | Own history only                     | Program; staff/audit exports denied | Program; support/staff/audit records denied              | Active program                                    | No global dashboard                                |
| Staff membership management, audit, invitations          | Denied                               | Denied                              | Denied                                                   | Active program; cannot reset another identity/MFA | Target-confirmed out-of-band provisioning/recovery |

Legacy `AdminUser.role` is retained as historical/compatibility data. Explicit reviewed mapping is `admin` → `program_admin`, `caseworker` → `caseworker`, `finance` → `finance`. Runtime API compatibility exposes program_admin as `admin`, derived exclusively from the active membership. Unknown legacy roles are not granted access. No global HTTP platform-admin role is needed or created. Verified operators use named, target-confirmed CLI operations; this is not a claim that possession of a database credential establishes organizational approval.

## Query and endpoint conventions

`lib/program-scope.ts` supplies request-local scoped query helpers. All staff model delegates, nested participant relation reads, counts, aggregates and callback transactions add the active program and live membership/session predicate. Unknown models, arbitrary raw SQL and nested relation writes fail closed. Referenced participants/cases/payouts/assignees are checked in scope; writes hold grant/session/organization locks while proving authority. Scoped financial writes reuse the exact ledger transaction. Limited report SQL joins explicit enrollment/ownership and rechecks live membership/session; it returns aggregate buckets/exact sums only.

Global shared records are authored Path/Module/Lesson/Card curriculum, public marketing/deck illustrations and non-participant UI assets. Staff curriculum queries cannot include unscoped participant evidence. ServiceDirectory is program-owned, not a global shared participant directory. Historical actor names attached to a program's own retained events do not grant membership or expose another staff account's credentials.

`getAdminFromRequest` is checked by every staff data endpoint, including direct API calls. Case endpoints reject finance; directory writes reject finance; finance rejects caseworkers; staff/audit management requires program_admin. Financial helpers recheck roles/session inside their transaction. Session/MFA/program-selection/security endpoints return only the authenticated staff identity's own sign-in/security/membership data before any program access is available. Public/demo routes have no live participant data query; learner APIs use their own server session IDs.

## Sessions, MFA and recovery

Password verification creates only a ten-minute challenge session. It cannot read program data. Mandatory authenticator enrollment/verification then rotates to a hashed opaque token, host-only HttpOnly, Secure in production, SameSite=Strict cookie. Existing raw-token sessions require fresh entry. Authorized sessions have eight-hour absolute expiry and thirty-minute inactivity expiry. Logout revokes the stored token before clearing current/legacy-domain cookies. Every request checks account activation, expiry, revocation and membership. Program switching rotates tokens without extending the original absolute expiry. Deactivating a program membership revokes that program's sessions, preserving other memberships; participant deactivation revokes learner sessions and preserves records.

OTPAuth **9.5.2** implements RFC 4226/6238, using SHA-1, six digits, thirty seconds and ±one-step clock drift. RFC SHA-1 vectors and the adapter are tested. Secrets use AES-256-GCM with identity-bound authenticated data and a private 32-byte hex `STAFF_MFA_ENCRYPTION_KEY`. The key is not returned or embedded in a client build. Keep an encrypted backup/key-rotation recovery plan; losing it requires verified re-enrollment, not a silent fallback. TOTP steps are atomically consumed under the staff row lock. Ten high-entropy recovery codes are shown once, stored as identity-bound hashes and atomically consumed once. Replacing codes invalidates old codes. No SMS/email provider is fabricated.

Account password failures and hashed-IP/MFA attempt buckets are persisted in PostgreSQL. Five failed passwords lock an account for fifteen minutes; password-IP buckets allow twenty attempts and MFA buckets eight within fifteen minutes. These work across application workers. Verify the hosting proxy's forwarded-IP handling; account/MFA controls do not rely on spoofable IP identity. Mutations check Origin and Fetch Metadata when present; JSON APIs still require credentials and scope if called directly without browser headers. Cookies/CSRF are not a replacement for membership checks.

New staff receives a temporary password through an explicitly verified private handoff; password change (16+ characters) and MFA enrollment are mandatory before data access. Program admins cannot overwrite an existing identity or reset its MFA. MFA recovery with an unused code is supported in the real login flow. If password and both second-factor options are lost, a verified operator uses `npm run staff:recover -- --confirm-database VERIFIED_DB --staff-id VERIFIED_STAFF_ID --verification-reference VERIFIED_RECOVERY_RECORD` read-only first, then the same command plus `--apply`, with `STAFF_RECOVERY_PASSWORD` privately supplied. This revokes sessions/codes, records the external verification reference and requires password replacement/new MFA; memberships do not change. It does not reactivate disabled identities. No reset email is claimed sent. SSO/SCIM are future integrations, with no fake enterprise settings.

Official implementation references read: [OTPAuth usage/security](https://github.com/hectorm/otpauth#usage), [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238), [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226).

## Additive migration and reviewed legacy mapping

After the previous reward migration, apply `20261027040000_program_boundaries`, then `20261029000000_staff_workflows` using the existing reviewed release command. No build/start operation migrates, maps memberships, provisions staff or resets MFA. New foreign keys restrict deletion; ownership updates are immutable after assignment. Existing null-owned data is retained and quarantined; migration itself grants no staff access and rewrites no balances/history. Quiesce old staff/financial/session writers during rollout. Verify actual target/migration baseline, backup and restore before production work.

Prepare a **private** reviewed JSON file outside the repository:

```json
{
  "version": 1,
  "organization": {
    "id": "legacy-organization",
    "name": "Verified legacy organization"
  },
  "program": {
    "id": "legacy-program",
    "slug": "legacy",
    "name": "Verified legacy program",
    "defaultConfigSlug": null
  },
  "staffIds": [],
  "participantIds": [],
  "serviceIds": [],
  "configIds": [],
  "acceptLegacyPool": false,
  "verificationReference": "your-verified-review-record"
}
```

Empty lists grant nothing. A verified operator enumerates exact reviewed root IDs; never generate these from city or give every staff member an automatic grant. The default config slug must belong to the reviewed config list. Opt into the existing pool only after independently reconciling funding. Unmapped participants/services/configs remain unassigned. Cases/payouts with unreviewed assignees or decision/actor identities remain quarantined. Unknown roles, ownership conflicts and stale hashes refuse writes.

Run `npm run programs:reconcile -- --confirm-database VERIFIED_DB --mapping PRIVATE_REVIEWED_FILE`. Review aggregate affected/quarantined counts, unchanged lifetime XP/exact recorded cents/pool opening and the hash. Apply only with `--apply --expected-hash REVIEWED_HASH`; the source is rechecked under table/financial locks and the operation is atomic/idempotent. Rerun the read-only report. Independently reconcile all original financial/learning totals and every remaining quarantine before making a multi-organization readiness claim. The mapping revokes reviewed staff’s legacy/unscoped sessions, requiring fresh MFA entry there; unrelated programs’ verified sessions remain intact. Authorization mapping and monetary reconciliation are separate reviewed steps; neither is hidden in the other.

## Deliberate new-program provisioning

`npm run programs:provision -- --confirm-database VERIFIED_DB --plan PRIVATE_REVIEWED_FILE` checks a private plan and prints aggregate counts/hash without granting access. The strict plan contains `organization: {id,name}`, `program: {id,slug,name}`, explicit `memberships: [{adminId,role}]`, an optional `firstAdmin: {email,fullName}`, and a verified review reference. At least one explicit program administrator is required. Add `--apply --expected-hash REVIEWED_HASH` only after the real organization/staff mapping is reviewed. A new first administrator requires a privately supplied 16+ character `STAFF_PROVISION_PASSWORD`; password change/MFA are mandatory. Existing identities/programs/slugs are never overwritten. No participant enrollment, financial rule, money value or pool funding is inferred or copied to the new organization. New participants use its private invitations. This is an operator release command, not a global runtime admin dashboard.

## Rollback and remaining operational gates

Retain all additive ownership/membership/MFA/receipt data and financial evidence. An old globally authorized binary cannot safely run against this database: disable staff/private writers while forward-fixing a compatible build. Do not delete ownership columns, map quarantined records broadly, reset money/history, weaken MFA or restore cookie-only logout to roll back presentation. A backup restore must reconcile subsequent activity and real payments before reopening.

Actual live Replit settings, production mapping/restore/MFA key storage, external identity verification/private credential handoff, remote CI and manual assistive-technology/physical-device behavior remain operational gates. Local disposable tests do not declare production membership or accounting reconciliation complete.
