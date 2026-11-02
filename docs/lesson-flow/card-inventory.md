# Card inventory before refactoring

Source checkpoint `bb6f1e0`, inspected 2026-10-27. `npm run audit:cards` parses TypeScript syntax trees in `prisma/seed.ts`, `prisma/seed-recovery.ts` and `prisma/recovery-expansions/*.ts`, without connecting to a database or running seeds. It finds **1,502 authored card definitions**, including expansion slots. This is not the number of cards inserted in a deployed database: `prisma/seed-support.ts:addMissingCards` preserves occupied orders and never overwrites existing content. Runtime edits can differ, so every served lesson is also validated.

| Stored type | Authored definitions | Answer format | Adapter / rendering |
| --- | ---: | --- | --- |
| INFO | 625 | None | Teaching, optional activity or reflection |
| MULTIPLE_CHOICE | 363 | JSON string in a JSON string-array of choices | Native radio question |
| SCENARIO | 265 | Same string format | Context/body plus decision radio group |
| TRUE_FALSE | 249 | JSON `"True"` or `"False"` in the corresponding two choices | Native radio question |

All **877 assessment answers** use strings in their choices. No authored graded free-text, numeric, JSON-boolean or multi-select format was found. Recovery expansion authors use `choices` / `answer`; `seed-recovery.ts:expandCards` serializes them to the same stored fields.

Subtypes are empty, MISSION or REFLECTION. The seed helper infers them from INFO prompt prefixes when omitted: 229 Mission definitions and 68 Reflect definitions; the remaining 1,205 definitions have no subtype. Adapters preserve every authored definition: 557 teaching/activity, 68 reflection, 612 ordinary questions and 265 scenarios. The unit suite validates all 1,502 definitions. Mission activities are optional; reflection text is optional, skippable and never sent to the server. Completion does not depend on personal disclosure.

Baseline rendering was one INFO branch plus one generic question branch. It parsed choices without validation, received every answer key, omitted scenario body text, graded locally, decremented client hearts, lost position on reload and submitted peak-combo/perfect flags. Unknown non-INFO cards entered the question branch. The endpoint trusted those flags, wrote Progress separately from XP/streaks, and reported a 5-XP perfect bonus while actually crediting 1. The new adapter/registry, attempt protocol and atomic completion replace those branches without rewriting curriculum.
