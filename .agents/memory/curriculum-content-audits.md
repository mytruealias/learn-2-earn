---
name: Curriculum content audits
description: Why curriculum size/quality claims must be measured from the Prisma seed source, and the content bar the recovery paths are held to.
---

# Auditing curriculum size and quality

Measure curriculum claims by parsing the seed source (`prisma/seed.ts`, `prisma/seed-recovery.ts`),
never from `curriculum-full.md`.

**Why:** `curriculum-full.md` is a point-in-time snapshot regenerated from a production database.
It has been badly stale before: it reported ~342 cards and "2-3 cards per lesson" for the
non-recovery paths long after those paths had been expanded to 6+ cards each, while the *recovery*
paths were the genuinely thin ones. An external review built on that snapshot recommended
exactly the wrong priority. A short throwaway script that counts `seedCards`/`expandCards` entries
per lesson settles the question in one command.

**How to apply:** Before accepting any "the curriculum is thin / needs more content" claim, including
one from a reviewer or from the user, count cards per lesson from the seed source and report the real
distribution. Card-count targets in use: 5-7 for `learn`, 8-12 for `checkpoint`, 10-15 for `capstone`.

# Content bar for the recovery paths (6-11)

These lessons serve people in addiction recovery and homelessness, so content review is a
correctness concern, not a style one.

- No diagnosis, prescription, dosage, or legal advice. No implication that any amount of use is safe.
- Do not invent statistics, program names, laws, or phone numbers. Only 911, 988, and 211 may appear.
- Wrong-answer options must not be self-directed insults the learner can click
  ("Call yourself lazy"). Describe the unhelpful *behavior* instead ("Judge yourself for not doing more").
  Distractors that model a harmful response the learner should reject are fine and useful.
- Every non-INFO card needs an `explain` that still teaches when the learner got it wrong.
- The Harm Reduction path necessarily carries general emergency-response information (overdose signs,
  naloxone, recovery position). That is intentional and consistent with published public-health
  guidance, but it should get clinical review before a public launch. Flag it rather than quietly
  deleting it.

**Why:** Generated content drifts toward both invented specifics and subtle shaming, and neither is
caught by tests or typechecking. A structural validator in the seed catches the mechanical rules;
the tone rules need a human or reviewer pass.
