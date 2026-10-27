// Only for a newly inserted learner, never for importing a legacy balance.
export function newRewardRelations() {
  return {
    rewardAccount: { create: { learningXp: 0, creditedXp: 0, availableXp: 0 } },
    rewardEntries: {
      create: {
        sourceKey: "opening",
        kind: "opening",
        metadata: '{"source":"new-account"}',
      },
    },
  };
}
