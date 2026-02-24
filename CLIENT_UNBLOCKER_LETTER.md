Subject: Updated external inputs needed to finalize launch-ready delivery

Hi [Client Name],

Thank you for the recent direction. We have applied those decisions to the working specification.

## Decisions now confirmed (captured in plan)

1. Catalog data strategy:
   - no legacy backup export is required for this prototype,
   - we will use seeded prototype catalog data plus admin-managed catalog records in the product,
   - Home Depot/Lowes scraping is a follow-on phase after prototype approval.
2. Launch account model:
   - single-user accounts only at initial launch (no team/company tenancy in this phase).
3. Launch billing model:
   - hybrid model: `$1200/year` base plus `$10` per real-time pricing run.
4. Proposal content for prototype:
   - no additional company logo/legal/disclaimer package required for this initial prototype build.

## Remaining inputs required to close final gaps

0) Security confirmation (immediate)
- Legacy source includes plaintext credentials in `web.config`.
- Please confirm in writing whether legacy credentials were rotated (if any legacy environment is still active).

1) Pricing formula confirmation (highest priority)
- Please confirm exact pricing order + rounding policy, or provide 2-3 known-output examples from current operations so we can lock fixture truth.
- This is the only major business-logic correctness gate still open.

2) Hybrid billing policy details
- We have the billing model confirmed (`$1200/year` + `$10` real-time pricing run).
- Please confirm operational policy details: exact trigger for the `$10` event, duplicate/retry handling, reversal/refund behavior, and subscription-cancel timing rules (immediate vs period-end).

3) Stripe launch ownership and access timing
- Please confirm who will own Stripe production account access, and when test/live keys and webhook configuration can be provisioned for final cutover.

4) Compliance and retention policy
- Retention controls are implemented and configurable in the product.
- Please confirm required audit retention duration, export/deletion requirements, and any mandatory legal controls so production values can be locked.

5) Launch operating envelope
- Please confirm expected launch usage/concurrency profile.
- We already have internal SQLite envelope probe tooling ready; once expected traffic is confirmed, we can immediately validate and tune launch DB settings against that target.

## Deliverable alignment (what we are delivering)

We are delivering a fully refactored, API-first Remodelator v5 product with a polished web workflow and admin controls, built to replace legacy workflow mechanics with cleaner architecture and lower maintenance risk.

Final scope for this delivery:
1. End-to-end user workflow in one UI surface: account access, profile defaults, estimate creation/editing, line-item operations, deterministic recalculation, proposal generation, billing actions, and admin operations.
2. Password-reset flow is intentionally deferred in this phase and will be introduced with email delivery infrastructure in the production hardening stage.
3. Catalog/template workflow with prototype records and admin-driven record management now, plus a clean path to future catalog ingestion automation.
4. Deterministic, test-backed financial behavior with explicit rounding/validation and replay-safe billing simulation.
5. Hybrid billing model support in product behavior (`$1200/year` + `$10` real-time pricing event) with local simulation-first validation before live billing cutover.
6. OpenRouter-required LLM pricing assist (fail-loud if unavailable) so dependency failures are explicit and auditable; project-managed credential ownership is already in place.
7. SQLite-first local/launch baseline with hardened runtime settings, backup/restore workflow, demo reset controls, and strong automated regression gates.

Why this is objectively better than legacy:
1. Simpler operations and onboarding (single coherent UI + fewer moving parts).
2. Better correctness and predictability (deterministic pricing + contract-backed tests).
3. Better security posture (modern session auth and environment-managed secrets).
4. Better maintainability (modular boundaries, lower coupling, documented configuration knobs).
5. Better delivery confidence (automated backend/UI/e2e quality gates and reproducible demo reset cycles).

After responses to remaining items (0-5), we can lock final production policy/configuration and complete launch hardening without rework.

Thank you,
[Your Name]
