import type { PathExpansion } from "./types";
import { addictionRecoveryFoundations } from "./addiction-recovery-foundations";
import { harmReductionSafety } from "./harm-reduction-safety";
import { treatmentRecoveryNavigation } from "./treatment-recovery-navigation";
import { relapsePreventionMastery } from "./relapse-prevention-mastery";
import { substanceSpecificSafety } from "./substance-specific-safety";
import { supporterFamilySkills } from "./supporter-family-skills";

/** Keyed by path slug. Each value is keyed by `${moduleSlug}/${lessonSlug}`. */
export const recoveryExpansions: Record<string, PathExpansion> = {
  "addiction-recovery-foundations": addictionRecoveryFoundations,
  "harm-reduction-safety": harmReductionSafety,
  "treatment-recovery-navigation": treatmentRecoveryNavigation,
  "relapse-prevention-mastery": relapsePreventionMastery,
  "substance-specific-safety": substanceSpecificSafety,
  "supporter-family-skills": supporterFamilySkills,
};
