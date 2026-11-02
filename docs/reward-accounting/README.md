# Reward accounting, rules and manual payment workflow

This stage starts at `329d7d7` on `feat/reward-accounting`. Read the [source audit](audit.md), [verification](verification.md), [screenshots](screenshots/README.md) and [upgrade status](../upgrade-status.md). No real funds move in this implementation or its tests. No production migration/backfill/deployment/merge has been performed. A successful disposable reconciliation is not a claim that production has been reconciled.

## Authoritative terms and eligibility

`lib/payout-rules.ts` is the program contract: exact USD-per-XP decimal string, minimum XP, rolling seven-day XP cap, supported manual methods, independent-approver requirement, currency and a content/version hash. Established fallback economics remain **USD 0.05 per XP, minimum 20 XP, cap 500 XP in a rolling seven-day window**. Active assigned program config takes priority, then active default, then this fallback. No new conversion economics are chosen. Requests save the entire accepted contract; later edits or program assignments do not reprice accepted requests. New requests must confirm the current rule-version hash. A stale quote is rejected for reconfirmation.

Previously city was self-editable and also selected money rules. Now `RewardAccount.programSlug` is a separately verified financial assignment. Legacy reconciliation preserves the existing city-to-program mapping for operator verification; new accounts use default/fallback until an authorized admin/finance staff records a verified assignment and reason. Editing a learner's contact city changes no financial assignment. This is a financial boundary, not a claim that all staff/partner tenant boundaries are implemented. Existing staff can still access the cross-program queues under their established roles; full partner membership isolation remains separate pending work.

The existing four executable methods remain the default: Venmo, PayPal, Cash App and check, all manual. Zelle remains in schema/history and can be explicitly enabled in a versioned program only when staff attests a verified manual delivery workflow. Its instructions explain that staff uses a bank outside Learn2Earn. There is no automated Zelle/wallet/check transfer. The optional Stripe connection reads balances only; it does not deliver any of these methods or prove payment occurred.

## Accounting invariants

`User.totalXp` remains the existing lifetime XP record. Legacy staff adjustments mixed into that counter are preserved; unique `Progress` remains the actual first-completion learning evidence. Unique first `Progress` is preserved. Practice continues to create no monetary credit. New first-lesson awards update the XP account and append a learning-credit entry inside the existing lesson-completion transaction, with a unique Progress source key. Uninitialized legacy accounts can keep learning; their historical opening must be reconciled explicitly before payout requests.

`RewardAccount` separates learning XP already accounted for, total reward entitlement credited, available XP, reserved XP and spent XP. It also records the historical difference between User.totalXp and the sum of Progress XP. The invariant is:

`creditedXp = availableXp + reservedXp + spentXp`, with all four nonnegative.

RewardEntry is append-only double-entry evidence. Each entry records available/reserved/spent/credited deltas, actor, source key, request linkage, cents where relevant and state transition. Database checks enforce conservation and nonnegative account fields; immutable-entry and accepted-terms triggers protect history. Account totals and request obligations are reconciled with ledger deltas, rather than treating a row count as proof. Financial writes and rule edits require mandatory transaction-scoped audit; failure rolls back the entire operation.

Request: available −XP, reserved +XP. Rejection/cancellation: available +XP, reserved −XP exactly once. Recorded payment: reserved −XP, spent +XP exactly once. Review and approval record decisions without pretending money moved. Staff entitlement corrections affect available/credited XP through a reasoned, idempotent entry; they do not rewrite lifetime learning XP or Progress. A correction cannot consume held/spent entitlement. This preserves the existing ability to correct incentives while removing the old silent clamp/overwrite of learning XP.

Writes lock the same learner row used by lesson credit, within PostgreSQL transactions. Rule/program writes coordinate through an advisory lock; request validation, cap validation, reservation, request, ledger and audit commit together. The unique `(userId, requestKey)` binds retries to a payload fingerprint. Changed key reuse is refused. Decision/cancellation keys have independent namespaces. The request window remains the existing rolling seven days by request creation time, counting pending/reviewed/approved/completed requests; valid rejection/cancellation restores cap room. Lifetime balances remain spent after payment even after the cap window expires.

## Exact amounts and compatibility

New accounting uses integer USD cents and exact BigInt rational arithmetic. Rates are stored as exact decimal strings. The request total is rounded once, half up; no per-XP intermediate rounding occurs. This preserves the previous intended `Math.round(total × 100)` rule while avoiding binary floating multiplication. Fractional-cent rates are supported. Stored per-request cents use PostgreSQL integer range (maximum 2,147,483,647 cents); requests that cannot fit are refused explicitly and need a smaller request or reviewed storage expansion. Aggregate/display estimates can use larger exact integers. TypeScript targets ES2020 to permit BigInt syntax, consistent with the established Next.js modern-browser baseline; the stack and dependencies are unchanged.

The legacy Float `PayoutRequest.dollarAmount` and `PayoutConfig.xpToDollar` remain for compatibility. New accepted requests write the cents-authoritative amount and a dollars compatibility shadow. New config writes preserve the exact string and a Float shadow. Financial calculations use the exact fields. Compatibility shadows and chart display numbers are not authoritative money inputs.

The schema migration is additive and performs **no backfill**. The explicit reconciliation operation converts each legacy recorded dollar amount using its canonical decimal string and half-up cent rounding, preserves the original Float, and records that original amount and rounding method in the import entry. It never multiplies legacy XP by today's rate. Legacy request snapshots state that original rate/minimum/cap terms were not captured; these are null, not invented. Legacy completed records retain their status and value but no actual payment date/reference/payer is inferred. They count in all-time recorded payments and appear separately from dated payment windows.

## State machine and duties

| Current state | Allowed action | Actor / accounting |
| --- | --- | --- |
| pending | review | admin/caseworker; no money movement |
| pending | reject | admin/finance/caseworker; release once |
| pending | cancel | authenticated owner; release once before review |
| reviewed | approve | admin/finance; distinct reviewer if saved program terms require it |
| reviewed | reject | admin/finance/caseworker; release once |
| approved | record manual payment | admin/finance; required external reference, actual timestamp and audit; consume held XP |
| completed/rejected/cancelled | replay same receipt only | no additional accounting or state change |

The old executable policy allowed one admin to review and approve; existing terms retain that behavior. A program can explicitly require separate people. Finance-only staff cannot perform caseworker review, and caseworkers cannot approve or mark payment. Approved requests cannot be casually rejected/cancelled: staff may already have sent an external payment. No processor reversal/refund state is fabricated; a verified recovery/reconciliation process is required for such cases.

Manual payment marking records an already verified external action. It sends nothing. The payer must supply a method-scoped unique reference and actual payment time after the request, within allowed clock skew, and confirm verification. Repeating the same save returns the receipt; a different decision key cannot pay the same request again. A reference cannot be recorded for another request of that method. The manual bookkeeping pool is atomically debited once and receives an adjustment/audit entry. Insufficient bookkeeping funds block recording and instruct staff to reconcile funding, **never to send again**. Historical imports preserve the existing pool balance and do not debit old payments again; operators must verify the opening pool balance before enabling new payment records. Pool funding is a manual bookkeeping entry, not a bank transfer or a Stripe balance claim.

## Learner and staff screens

Rewards stays at `/profile?tab=earnings`. It separates the lifetime XP record, currently available estimated value, held amounts awaiting decisions/payment and actual recorded paid totals. It displays program rate, minimum, rolling cap, remaining room, enabled method instructions and accepted historical terms. A labelled form leads to a confirmation dialog; only confirmed server success claims a saved request, never payment or unconfigured notifications. The history timeline distinguishes review, approval and payment. Pending owners can confirm cancellation. Invalid, loading, empty, unavailable and uncertain-save states are explicit.

Payment contacts remain in the private original field. New notes/audit events do not duplicate them. Learner history, staff queues, user-detail history and CSV exports mask contacts. Authorized finance/admin staff may reveal an approved request's contact through an audited private endpoint. The general queue has no direct payment deep link or automatic transfer. Exports preserve a useful request/amount/status/reference-date view with masked contacts and formula-safe CSV values.

The private finance screen and API share the same data function. Only completed records with actual paidAt timestamps enter dated paid totals; legacy completed rows without dates are disclosed separately. Pending/reviewed/approved all remain liability. Dashboard/reports/activity/trends use exact recorded cents and distinguish unavailable legacy data from a fabricated zero. Public/marketing/demo/legal reward copy has no fixed learner dollar promises; demos are explicitly illustrative. The unrelated legal liability cap is not a payout conversion and is preserved.

## Release and reconciliation gates

1. Verify the actual Replit target, migration baseline, private credentials, backups and a tested restore procedure. Runtime remains **0.0.0.0:5000**. No new provider/environment binding is needed. Never run tests, reset, schema push or seed against production.
2. Quiesce old financial and XP-adjustment writers. Apply `20261027030000_reward_accounting` through the explicit reviewed migration command, after previous session/progression/attempt migrations. No build/start command runs this backfill.
3. Run the read-only report against the explicitly confirmed target:

   `npm run rewards:reconcile -- --confirm-database VERIFIED_DATABASE`

4. Review configured rate precision, existing financial program assignments, legacy recorded amounts/rounding, original pool opening, unknown statuses/methods, overspent balances, source XP differences and request history through authorized records. Output contains aggregate counts/hash, not learner records or handles. Fixing anomalous records requires a separately verified, audited recovery operation; this command does not silently repair them.
5. Supply the exact fresh hash to the write operation only after review:

   `npm run rewards:reconcile -- --confirm-database VERIFIED_DATABASE --apply --expected-hash REVIEWED_HASH`

   Add `--accept-legacy-xp-differences` only after explicitly reconciling those opening adjustments. The operation preserves User.totalXp and records the delta, rather than inventing missing lessons or erasing balances. Changes to reviewed inputs cause a hash conflict. Backfill holds the financial lock and learner locks; it is idempotent and atomic. For large databases, stage a reviewed batch strategy rather than raising timeouts blindly.
6. Rerun the read-only report. Require zero uninitialized accounts, zero requests lacking exact fields/snapshots, no ledger/account/request discrepancies, and an independently reviewed pool/recorded-amount reconciliation before calling the production migration complete. Only then enable new financial writers. The release here has **not** performed these production gates.

Unknown/malformed historical statuses and overspent accounts block import; no `paid` → `completed` mapping is guessed. Historical missing payer/reference/date is visible and retained as unknown. Full partner isolation and verified external bank statements remain operator/next-stage responsibilities.

## Rollback

Keep all additive columns/tables, immutable ledger entries, snapshots and imported originals. Reverting a presentation issue must retain the hardened accounting API/credit writer. Pre-ledger binaries can read Float shadows but cannot maintain ledger invariants and may misstate corrected entitlement; do not re-enable their payout, adjustment or completion writers. Disable financial writes while restoring a compatible build, then reconcile before reopening. A backup restore must be separately verified and reconcile subsequent real payments/awards; never overwrite later history to make totals appear balanced. No reverse migration deletes ledger evidence.
