# Batch B Taskboard

Last updated: February 24, 2026  
Batch window: active (2-3 day execution slices)

## Batch Objective

Complete all non-blocked production hardening so remaining work is limited to explicit external answers in `CLIENT_UNBLOCKER_LETTER.md`.

## Exit Gate

Batch B is complete when:
1. quality gate is green (`./scripts/quality_gate.sh`),
2. all Batch B non-blocked items below are complete,
3. remaining incomplete items map directly to external blockers only.

## Product/UX Stream

- [x] B-UX-01: Billing and admin surfaces are fully human-readable (no debug or developer language in primary flows).
  - Acceptance: critical billing/admin actions have clear status cards, action labels, and error guidance.
- [x] B-UX-02: Session, workspace, and output panel flows are walkthrough-ready for customer demo.
  - Acceptance: golden path can be run end-to-end without operator explanation.
- [x] B-UX-03: Add explicit in-app blocker prompts for unresolved external dependencies.
  - Acceptance: blocker conditions show clear next action and ownership.

## Domain/API Stream

- [x] B-API-01: Finalize error contract consistency across route groups.
  - Acceptance: same error shape and status-code semantics for validation, auth, and dependency failures.
- [x] B-API-02: Add request-rate limiting policy for public/protected endpoints.
  - Acceptance: config-driven limits with tests for enforced throttling behavior.
- [x] B-API-03: Harden billing simulation lifecycle invariants.
  - Acceptance: event ordering, replay behavior, and subscription state transitions are test-locked.
- [x] B-API-04: Lock auth defaults for production profile.
  - Acceptance: legacy header is disabled by default, admin/session secret guards are enforced in production mode.
- [x] B-API-05: Introduce provider-driven billing runtime seam.
  - Acceptance: simulation provider remains stable; stripe provider fails loud with explicit blocker reason until live adapter enablement.

## Quality/Ops Stream

- [x] B-OPS-01: Structured request logging + request ID correlation.
  - Acceptance: request/response failures and critical writes are traceable across logs.
- [x] B-OPS-02: SQLite launch hardening package (local/launch profile).
  - Acceptance: WAL/busy-timeout/synchronous knobs documented, integrity-check and backup/restore drill runbook validated.
- [x] B-OPS-03: Launch evidence checklist and signoff package.
  - Acceptance: one checklist maps each required deliverable to a test/artifact/doc reference.

## Blocker-Linked Items (Do Not Block Batch B Close)

- [ ] B-BLK-01: Pricing fixture final signoff (depends on client pricing confirmation package).
- [ ] B-BLK-02: Hybrid billing live policy lock (depends on client billing event policy details).
- [ ] B-BLK-03: Live Stripe cutover readiness (depends on Stripe ownership + keys/webhooks).
- [ ] B-BLK-04: Retention/export final policy implementation (depends on compliance guidance).
- [ ] B-BLK-05: Legacy credential-rotation evidence archive (depends on client written confirmation).

## Notes

1. If a blocker response arrives mid-batch, pull the linked item into active work immediately.
2. Do not open new roadmap work until Batch B exit gate is met.
