import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertPath(data: { title: string; slug: string; description: string; icon: string; order: number; color?: string; estimatedHours?: number; targetAudience?: string; difficulty?: string }) {
  return prisma.path.upsert({
    where: { slug: data.slug },
    update: {},
    create: {
      ...data,
      color: data.color || "#3b9eff",
      estimatedHours: data.estimatedHours || 0,
      targetAudience: data.targetAudience || "All learners",
      difficulty: data.difficulty || "foundational",
    },
  });
}

async function upsertModule(data: { pathId: string; title: string; slug: string; order: number; description?: string; color?: string }) {
  return prisma.module.upsert({
    where: { pathId_slug: { pathId: data.pathId, slug: data.slug } },
    update: {},
    create: {
      ...data,
      description: data.description || "",
      color: data.color || "",
    },
  });
}

async function upsertLesson(data: { moduleId: string; title: string; slug: string; order: number; xpReward: number; type?: string; lessonType?: string; estimatedMinutes?: number; learningObjectives?: string; difficulty?: string }) {
  return prisma.lesson.upsert({
    where: { moduleId_slug: { moduleId: data.moduleId, slug: data.slug } },
    update: {},
    create: {
      ...data,
      type: data.type || "learn",
      lessonType: data.lessonType || "learn",
      estimatedMinutes: data.estimatedMinutes || 5,
      learningObjectives: data.learningObjectives || "[]",
      difficulty: data.difficulty || "foundational",
    },
  });
}

async function seedCards(lessonId: string, cards: any[]) {
  const count = await prisma.card.count({ where: { lessonId } });
  if (count === 0) {
    await prisma.card.createMany({ data: cards.map((c) => ({ lessonId, ...c })) });
  }
}

async function main() {
  // =====================================================
  // JOURNEY 6: Addiction and Recovery Foundations
  // =====================================================
  const journey6 = await upsertPath({
    title: "Addiction & Recovery Foundations",
    slug: "addiction-recovery-foundations",
    description: "Understand addiction without shame, build self-awareness, learn craving and stress tools, and create your personal recovery plan.",
    icon: "🧠",
    order: 6,
  });

  // --- Unit 6.1: Understanding What's Happening ---
  const unit6_1 = await upsertModule({ pathId: journey6.id, title: "Understanding What's Happening", slug: "understanding-whats-happening", order: 1 });

  const l6_1_1 = await upsertLesson({ moduleId: unit6_1.id, title: "Addiction 101 (Without Shame)", slug: "addiction-101", order: 1, xpReward: 2 });
  await seedCards(l6_1_1.id, [
    { type: "INFO", order: 1, prompt: "Use, Misuse, and Disorder", body: "Using a substance doesn't automatically mean addiction. There's a range: use (occasional), misuse (causing problems), and substance use disorder (can't stop despite harm). Understanding where you are helps you know what to do next — without shame." },
    { type: "INFO", order: 2, prompt: "The Habit Loop", body: "Every habit follows a loop: Trigger (stress, boredom, people) → Behavior (the substance) → Reward (relief, numbness, energy). Addiction hijacks this loop by making the reward feel essential. Breaking the loop starts with seeing it clearly." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "What are the 3 parts of a habit loop?", choicesJson: JSON.stringify(["Trigger, Behavior, Reward", "Want, Need, Get", "Start, Middle, End", "Pain, Use, Guilt"]), answerJson: JSON.stringify("Trigger, Behavior, Reward"), explain: "Trigger starts it, behavior is the action, reward is why you repeat it. Seeing this loop is the first step to changing it." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Tolerance means:", choicesJson: JSON.stringify(["You don't like the substance anymore", "You need more to get the same effect", "You can handle anything", "You're fully recovered"]), answerJson: JSON.stringify("You need more to get the same effect"), explain: "Tolerance is your body adapting. It's a sign the substance is changing your brain chemistry. It's not a badge of honor — it's a warning sign." },
    { type: "INFO", order: 5, prompt: "Mission: My Pattern Map", body: "Write down 2 triggers that usually lead to use, 2 rewards you get from using, and 1 cost that comes with it. No judgment — just honesty. This is your pattern map." },
  ]);

  const l6_1_2 = await upsertLesson({ moduleId: unit6_1.id, title: "The Brain and Cravings", slug: "brain-and-cravings", order: 2, xpReward: 2 });
  await seedCards(l6_1_2.id, [
    { type: "INFO", order: 1, prompt: "Cravings Are Waves", body: "A craving feels like it will last forever, but it won't. Cravings are like ocean waves — they build, they peak, and they pass. Most cravings peak within 15-20 minutes and then start to fade. You don't have to act on them." },
    { type: "INFO", order: 2, prompt: "Stress and Cravings", body: "When you're stressed, your brain screams for quick relief. Stress floods your system with cortisol, which makes cravings feel 10x stronger. That's not weakness — that's biology. Managing stress IS managing cravings." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "How long does a typical craving peak last?", choicesJson: JSON.stringify(["All day long", "15-20 minutes", "Exactly 1 hour", "It never goes away"]), answerJson: JSON.stringify("15-20 minutes"), explain: "Most cravings peak and start fading within 15-20 minutes. If you can ride the wave, it will pass." },
    { type: "TRUE_FALSE", order: 4, prompt: "Stress makes cravings weaker.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Stress makes cravings stronger because cortisol drives your brain to seek quick relief. Managing stress is key to managing cravings." },
    { type: "INFO", order: 5, prompt: "Mission: Pick One Craving Skill", body: "Choose one skill to try the next time a craving hits: deep breathing, walking, calling someone, drinking cold water, or counting backwards from 10. Just pick one and try it once today." },
  ]);

  const l6_1_3 = await upsertLesson({ moduleId: unit6_1.id, title: "Stages of Change", slug: "stages-of-change", order: 3, xpReward: 2 });
  await seedCards(l6_1_3.id, [
    { type: "INFO", order: 1, prompt: "Change Isn't All-or-Nothing", body: "There are 6 stages of change: Precontemplation (not thinking about it), Contemplation (thinking about it), Preparation (getting ready), Action (making changes), Maintenance (keeping it going), and sometimes Relapse (a setback, not a failure). Each stage is valid." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone says 'I know I should probably do something about my drinking, but I'm not sure I'm ready.' What stage are they in?", choicesJson: JSON.stringify(["Precontemplation", "Contemplation", "Action", "Maintenance"]), answerJson: JSON.stringify("Contemplation"), explain: "They're thinking about change but haven't committed yet. That's contemplation — and it's an important step." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "Which statement matches the Preparation stage?", choicesJson: JSON.stringify(["I don't have a problem", "I'm looking into treatment options for next week", "I've been sober for 6 months", "I just relapsed after 2 weeks"]), answerJson: JSON.stringify("I'm looking into treatment options for next week"), explain: "Preparation means you've decided to change and you're making concrete plans. You're getting ready to take action." },
    { type: "INFO", order: 4, prompt: "Mission: Find Your Stage", body: "Look at the 6 stages and honestly pick which one feels like where you are right now. Then choose 1 small next step that fits THAT stage — not where you think you 'should' be. Meeting yourself where you are is the fastest way forward." },
  ]);

  const l6_1_4 = await upsertLesson({ moduleId: unit6_1.id, title: "Ambivalence (Wanting Two Things)", slug: "ambivalence", order: 4, xpReward: 2 });
  await seedCards(l6_1_4.id, [
    { type: "INFO", order: 1, prompt: "It's Normal to Want Two Things", body: "Wanting to quit AND wanting to use at the same time isn't weakness — it's called ambivalence, and nearly everyone in recovery experiences it. The key isn't eliminating the desire; it's strengthening the reasons for change." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is the best example of 'change talk'?", choicesJson: JSON.stringify(["I guess I have to do this", "I want to be more present for my kids", "Everyone keeps telling me to stop", "I'll try but it probably won't work"]), answerJson: JSON.stringify("I want to be more present for my kids"), explain: "Change talk comes from YOUR reasons, not other people's pressure. Personal motivation is the strongest fuel for change." },
    { type: "TRUE_FALSE", order: 3, prompt: "If you still want to use sometimes, it means recovery won't work for you.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Ambivalence is part of the process, not a disqualifier. Recovery works even when you have mixed feelings — that's exactly when you need it most." },
    { type: "INFO", order: 4, prompt: "Mission: Two Reasons", body: "Write down 2 honest reasons you might want things to be different. They don't have to be dramatic — 'I want to sleep better' counts just as much as 'I want to save my family.' Your reasons are YOUR reasons." },
  ]);

  const l6_1_5 = await upsertLesson({ moduleId: unit6_1.id, title: "Goals That Fit Real Life", slug: "goals-fit-real-life", order: 5, xpReward: 2 });
  await seedCards(l6_1_5.id, [
    { type: "INFO", order: 1, prompt: "Not Everyone's Goal Is the Same", body: "Some people aim for complete abstinence. Others start with reduction or safer use. Stability goals (keeping a job, attending appointments) are valid too. The best goal is one you'll actually work toward — not one that sounds good on paper." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is a SMART goal for recovery?", choicesJson: JSON.stringify(["I'll never use again", "I'll reduce drinking to 2 nights this week instead of 5", "I'll be perfect", "I'll just try harder"]), answerJson: JSON.stringify("I'll reduce drinking to 2 nights this week instead of 5"), explain: "Specific, measurable, achievable, realistic, time-bound. 'Never again' isn't a plan. '2 nights instead of 5 this week' IS a plan." },
    { type: "INFO", order: 3, prompt: "Backup Plans Matter", body: "Every goal needs a Plan B. What happens when the goal gets hard? Having a backup plan isn't pessimism — it's preparation. 'If I feel like using, I'll call my friend instead' turns a moment of weakness into a moment of strength." },
    { type: "INFO", order: 4, prompt: "Mission: Set a 7-Day Goal", body: "Set one specific recovery goal for the next 7 days. Make it realistic. Then add a backup plan: 'If [hard thing] happens, I will [alternative action].' Write it somewhere you'll see it." },
  ]);

  // --- Unit 6.2: Self-Awareness Skills ---
  const unit6_2 = await upsertModule({ pathId: journey6.id, title: "Self-Awareness Skills", slug: "self-awareness-skills", order: 2 });

  const l6_2_1 = await upsertLesson({ moduleId: unit6_2.id, title: "Your Triggers (People, Places, Feelings)", slug: "your-triggers", order: 1, xpReward: 2 });
  await seedCards(l6_2_1.id, [
    { type: "INFO", order: 1, prompt: "Know What Sets You Off", body: "Triggers are the people, places, feelings, or situations that make you want to use. They're not your fault, but knowing them is your power. Common triggers: certain friends, payday, loneliness, boredom, anger, specific streets or buildings." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the best strategy for a trigger you can't avoid?", choicesJson: JSON.stringify(["Ignore it completely", "Prepare a specific plan for how to handle it", "Just hope it won't bother you", "Avoid leaving your house ever"]), answerJson: JSON.stringify("Prepare a specific plan for how to handle it"), explain: "You can't avoid every trigger, but you can prepare. Having a plan turns a trigger from a threat into a test you've studied for." },
    { type: "INFO", order: 3, prompt: "Mission: Build Your Trigger List", body: "Write down your top triggers. For each one, label it: AVOID (stay away), PREPARE (have a plan), or REPLACE (swap the behavior). This is your trigger defense system." },
  ]);

  const l6_2_2 = await upsertLesson({ moduleId: unit6_2.id, title: "HALT Check (Hungry, Angry, Lonely, Tired)", slug: "halt-check", order: 2, xpReward: 2 });
  await seedCards(l6_2_2.id, [
    { type: "INFO", order: 1, prompt: "HALT Before You Act", body: "Before making any big decision or acting on a craving, do a HALT check: Am I Hungry? Angry? Lonely? Tired? These four states make everything feel worse and cravings feel stronger. Fix the HALT issue first — the craving might shrink." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You're feeling a strong urge to use. A HALT check reveals you haven't eaten in 8 hours. What should you do first?", choicesJson: JSON.stringify(["Give in to the craving", "Eat something, then reassess the craving", "Ignore the hunger", "Call your dealer"]), answerJson: JSON.stringify("Eat something, then reassess the craving"), explain: "Hunger makes everything worse. Eat first, then see if the craving is still as strong. Often it fades significantly." },
    { type: "INFO", order: 3, prompt: "Mission: HALT Check Practice", body: "Do a 60-second HALT check right now. Rate each (Hungry, Angry, Lonely, Tired) from 1-5. Try it again tomorrow. Building this habit gives you an early warning system." },
  ]);

  const l6_2_3 = await upsertLesson({ moduleId: unit6_2.id, title: "Emotions and Use", slug: "emotions-and-use", order: 3, xpReward: 2 });
  await seedCards(l6_2_3.id, [
    { type: "INFO", order: 1, prompt: "What Do I Need vs What Do I Want", body: "When a craving hits, ask: 'What am I actually feeling right now?' Then ask: 'What do I actually need?' You might want a drink, but what you need is rest. You might want to get high, but what you need is connection. Naming the real need changes the solution." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You feel lonely and start craving. What's the NEED behind the want?", choicesJson: JSON.stringify(["More substances", "Connection with another person", "Being alone more", "Spending money"]), answerJson: JSON.stringify("Connection with another person"), explain: "Loneliness craves connection. A phone call, a meeting, or even a text can fill that need without the cost of using." },
    { type: "INFO", order: 3, prompt: "Mission: Pick One Emotion Coping Tool", body: "Choose one healthy coping tool for your most common difficult emotion: journaling for anger, calling someone for loneliness, napping for exhaustion, walking for anxiety. Write it down and try it once this week." },
  ]);

  const l6_2_4 = await upsertLesson({ moduleId: unit6_2.id, title: "The Cost of Use (Money, Time, Relationships)", slug: "cost-of-use", order: 4, xpReward: 2 });
  await seedCards(l6_2_4.id, [
    { type: "INFO", order: 1, prompt: "The Real Price Tag", body: "Substance use costs more than money. Calculate: How much do you spend per week? How many hours are lost? Which relationships are strained? This isn't about guilt — it's about seeing the full picture so you can make informed choices." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "If someone spends $20/day on substances, how much is that per month?", choicesJson: JSON.stringify(["$200", "$400", "$600", "$800"]), answerJson: JSON.stringify("$600"), explain: "$20 × 30 days = $600/month. That's $7,200 a year. Seeing the number helps make the invisible cost visible." },
    { type: "INFO", order: 3, prompt: "Mission: One Cost Reducer", body: "Pick one small way to reduce the cost of use this week. Skip one session, use less, or redirect that money to something else. Even one small change is a step forward." },
  ]);

  const l6_2_5 = await upsertLesson({ moduleId: unit6_2.id, title: "Your Strengths Inventory", slug: "strengths-inventory", order: 5, xpReward: 2 });
  await seedCards(l6_2_5.id, [
    { type: "INFO", order: 1, prompt: "You've Survived Before", body: "If you're reading this, you've already survived 100% of your worst days. That takes strength. Recovery isn't about becoming someone new — it's about building on the strength you already have." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which counts as a personal strength for recovery?", choicesJson: JSON.stringify(["Never having any problems", "Being able to ask for help when you need it", "Never feeling afraid", "Having unlimited willpower"]), answerJson: JSON.stringify("Being able to ask for help when you need it"), explain: "Asking for help is one of the strongest things you can do. It takes courage and self-awareness." },
    { type: "INFO", order: 3, prompt: "Mission: Survival Strengths List", body: "Write down 3 things you've survived or overcome. These are your strengths. You didn't get through those by accident — you have skills. Name them." },
  ]);

  // --- Unit 6.3: Craving and Stress Tools ---
  const unit6_3 = await upsertModule({ pathId: journey6.id, title: "Craving & Stress Tools", slug: "craving-stress-tools", order: 3 });

  const l6_3_1 = await upsertLesson({ moduleId: unit6_3.id, title: "Urge Surfing", slug: "urge-surfing", order: 1, xpReward: 2 });
  await seedCards(l6_3_1.id, [
    { type: "INFO", order: 1, prompt: "Ride the Wave, Don't Fight It", body: "Urge surfing means noticing a craving without acting on it. Observe it like a wave: it starts small, builds to a peak, and then it falls. You don't have to fight it — just watch it pass. Most waves last 15-30 minutes." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the correct order of urge surfing?", choicesJson: JSON.stringify(["Fight it, suppress it, ignore it", "Notice it, observe it build, watch it peak, let it fade", "Give in quickly to make it stop", "Distract yourself immediately"]), answerJson: JSON.stringify("Notice it, observe it build, watch it peak, let it fade"), explain: "Urge surfing is about observation, not resistance. Watch the wave. It always comes down." },
    { type: "INFO", order: 3, prompt: "Mission: Ride One Wave", body: "The next time a craving hits, try urge surfing. Note the time it starts, when it peaks, and when it fades. You'll be surprised — most cravings pass faster than you think." },
  ]);

  const l6_3_2 = await upsertLesson({ moduleId: unit6_3.id, title: "Delay and Distract", slug: "delay-and-distract", order: 2, xpReward: 2 });
  await seedCards(l6_3_2.id, [
    { type: "INFO", order: 1, prompt: "15 Minutes Can Change Everything", body: "When a craving hits, delay acting on it for just 15 minutes. Use that time to do something — anything — else. Walk, shower, call someone, listen to music, eat a snack. Most cravings fade in that window." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is the best '15-minute distraction' during a craving?", choicesJson: JSON.stringify(["Sit and think about the craving", "Go for a quick walk and drink cold water", "Plan how to use later", "Scroll social media of people partying"]), answerJson: JSON.stringify("Go for a quick walk and drink cold water"), explain: "Physical movement and cold water engage your body and shift your brain's focus. It's simple and effective." },
    { type: "INFO", order: 3, prompt: "Mission: Build Your 15-Minute List", body: "Write down 5 things you can do for 15 minutes when a craving hits: walk, shower, call someone, listen to music, eat a healthy snack. Keep this list on your phone." },
  ]);

  const l6_3_3 = await upsertLesson({ moduleId: unit6_3.id, title: "Thought Traps", slug: "thought-traps", order: 3, xpReward: 2 });
  await seedCards(l6_3_3.id, [
    { type: "INFO", order: 1, prompt: "Your Brain Lies to You Sometimes", body: "Thought traps are patterns that keep you stuck. Common ones: All-or-nothing ('I messed up once so I might as well give up'), Catastrophizing ('Everything is ruined'), and the 'I already blew it' trap. Catching these traps is half the battle." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "'I had one drink, so I might as well drink the whole bottle.' This is an example of:", choicesJson: JSON.stringify(["Good planning", "All-or-nothing thinking", "Realistic assessment", "Positive self-talk"]), answerJson: JSON.stringify("All-or-nothing thinking"), explain: "One slip doesn't equal total failure. You can stop at any point. The 'all or nothing' trap wants you to believe one mistake means game over — it doesn't." },
    { type: "INFO", order: 3, prompt: "Rewriting the Thought", body: "Take the trapped thought and rewrite it as a fair thought. 'I already blew it' becomes 'I had a setback, but I can make a different choice right now.' Fair thoughts are honest AND hopeful." },
    { type: "INFO", order: 4, prompt: "Mission: Rewrite One Thought", body: "Think of one thought trap you've fallen into recently. Write the trapped thought, then rewrite it as a fair, balanced thought. Keep both — seeing the difference builds the skill." },
  ]);

  const l6_3_4 = await upsertLesson({ moduleId: unit6_3.id, title: "Grounding and Reset", slug: "grounding-reset", order: 4, xpReward: 2 });
  await seedCards(l6_3_4.id, [
    { type: "INFO", order: 1, prompt: "The 5-4-3-2-1 Technique", body: "When anxiety or cravings spike, ground yourself: Name 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, 1 thing you taste. This pulls your brain out of panic mode and back to the present moment." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the purpose of the 5-4-3-2-1 grounding technique?", choicesJson: JSON.stringify(["To distract you permanently", "To bring your attention back to the present moment", "To make the problem go away", "To avoid dealing with feelings"]), answerJson: JSON.stringify("To bring your attention back to the present moment"), explain: "Grounding reconnects you to right here, right now. You can't solve anything from panic mode — grounding gets you back to thinking mode." },
    { type: "INFO", order: 3, prompt: "Mission: 2-Minute Reset", body: "The next time you feel stressed or triggered, try a 2-minute reset: 1 minute of slow breathing (in for 4, out for 6), then 1 minute of 5-4-3-2-1 grounding. Practice it now so it's ready when you need it." },
  ]);

  const l6_3_5 = await upsertLesson({ moduleId: unit6_3.id, title: "Sleep and Recovery", slug: "sleep-and-recovery", order: 5, xpReward: 2 });
  await seedCards(l6_3_5.id, [
    { type: "INFO", order: 1, prompt: "Sleep Is Recovery Fuel", body: "Poor sleep makes cravings stronger, emotions harder to manage, and decisions worse. You don't need perfect sleep — even small improvements matter. A consistent bedtime, less screen time before bed, and a cool room can help." },
    { type: "TRUE_FALSE", order: 2, prompt: "Getting better sleep can actually reduce cravings.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Rest strengthens your brain's ability to resist impulses and manage stress. Better sleep = stronger recovery." },
    { type: "INFO", order: 3, prompt: "Mission: Sleep Supports", body: "Choose 2 sleep improvements to try for the next 3 nights: consistent bedtime, no screens 30 min before bed, deep breathing in bed, no caffeine after 2pm, cooler room. Track how you feel each morning." },
  ]);

  // --- Unit 6.4: Building a Recovery Plan ---
  const unit6_4 = await upsertModule({ pathId: journey6.id, title: "Building a Recovery Plan", slug: "building-recovery-plan", order: 4 });

  const l6_4_1 = await upsertLesson({ moduleId: unit6_4.id, title: "Your Recovery Why", slug: "recovery-why", order: 1, xpReward: 2 });
  await seedCards(l6_4_1.id, [
    { type: "INFO", order: 1, prompt: "Your WHY Is Your Anchor", body: "When things get hard, you need a reason to keep going that's bigger than the craving. Your 'why' might be your kids, your health, your freedom, or simply wanting to feel like yourself again. Whatever it is, make it concrete and personal." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which 'recovery why' is most likely to sustain motivation?", choicesJson: JSON.stringify(["Because my probation officer said so", "Because I want to be present for my daughter's life", "Because someone told me I should", "Because it's what normal people do"]), answerJson: JSON.stringify("Because I want to be present for my daughter's life"), explain: "Personal, emotional reasons sustain motivation when external pressure fades. YOUR why has to matter to YOU." },
    { type: "INFO", order: 3, prompt: "Mission: Record Your Why", body: "Write down your recovery 'why' in one or two sentences. Put it somewhere you'll see it daily — your phone lock screen, a note in your wallet, or a reminder alert. When cravings hit, read it." },
  ]);

  const l6_4_2 = await upsertLesson({ moduleId: unit6_4.id, title: "Your Support Team", slug: "support-team", order: 2, xpReward: 2 });
  await seedCards(l6_4_2.id, [
    { type: "INFO", order: 1, prompt: "You Can't Do This Alone (And You Shouldn't)", body: "Recovery is stronger with support. You need at least: 1 person you can call when struggling, 1 person who checks in on you, and ideally 1 professional (counselor, sponsor, coach). You don't need a huge team — just a real one." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What makes someone a good recovery support person?", choicesJson: JSON.stringify(["They use with you but are 'careful'", "They listen without judgment and respect your goals", "They tell you to just get over it", "They don't believe addiction is real"]), answerJson: JSON.stringify("They listen without judgment and respect your goals"), explain: "Good support means respect, listening, and being on your side — not enabling or dismissing." },
    { type: "INFO", order: 3, prompt: "Mission: Identify Your Team", body: "Write down 2 people you trust as support contacts and 1 professional option (counselor, hotline, support group). Save their numbers in your phone. If you can't think of anyone, SAMHSA's helpline (1-800-662-4357) counts as your professional option." },
  ]);

  const l6_4_3 = await upsertLesson({ moduleId: unit6_4.id, title: "High-Risk Situations Plan", slug: "high-risk-plan", order: 3, xpReward: 2 });
  await seedCards(l6_4_3.id, [
    { type: "INFO", order: 1, prompt: "If X Happens, I Will Do Y", body: "High-risk situations are predictable: payday, Friday nights, arguments, loneliness, celebrations. For each one, have a specific plan BEFORE it happens. 'If my old friend calls to hang out, I will suggest we meet at a coffee shop instead.'" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "It's Friday night and you're home alone feeling triggered. What's the best prepared response?", choicesJson: JSON.stringify(["Wait and see what happens", "Follow your pre-planned action: call your support person", "Go to where you used to use", "Tell yourself you're fine and ignore it"]), answerJson: JSON.stringify("Follow your pre-planned action: call your support person"), explain: "Pre-planned responses work because you made the decision when you were thinking clearly. In the moment, just follow the plan." },
    { type: "INFO", order: 3, prompt: "Mission: 3 If-Then Plans", body: "Write 3 'If X happens, I will do Y' plans for your biggest high-risk situations. Be specific. The more detailed the plan, the more likely you'll follow it when the moment comes." },
  ]);

  const l6_4_4 = await upsertLesson({ moduleId: unit6_4.id, title: "Boundaries Basics", slug: "boundaries-basics-recovery", order: 4, xpReward: 2 });
  await seedCards(l6_4_4.id, [
    { type: "INFO", order: 1, prompt: "Saying No Is a Recovery Skill", body: "Boundaries protect your recovery. Saying no to people, places, or situations that threaten your progress isn't selfish — it's survival. You can be kind AND firm. 'I care about you, but I can't be around that right now.'" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "An old using buddy invites you to hang out 'like old times.' What's the best boundary response?", choicesJson: JSON.stringify(["Sure, I can handle it", "I'd love to catch up — can we meet for coffee instead?", "I'll go but just won't use", "Ghost them without explanation"]), answerJson: JSON.stringify("I'd love to catch up — can we meet for coffee instead?"), explain: "Redirecting to a safer setting keeps the connection while protecting your recovery. That's a healthy boundary." },
    { type: "INFO", order: 3, prompt: "Mission: Practice a 'No' Script", body: "Write out a 'no' script you can use when someone invites you into a risky situation. Practice saying it out loud. It gets easier with repetition." },
  ]);

  const l6_4_5 = await upsertLesson({ moduleId: unit6_4.id, title: "Progress Tracking Without Shame", slug: "progress-tracking", order: 5, xpReward: 2 });
  await seedCards(l6_4_5.id, [
    { type: "INFO", order: 1, prompt: "Track Progress, Not Perfection", body: "Recovery metrics should feel encouraging, not punishing. Options: days sober, fewer uses per week, fewer risky situations, more meetings attended, more coping tools used. Pick what motivates YOU — not what sounds impressive to others." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which tracking approach is most shame-resistant?", choicesJson: JSON.stringify(["Counting consecutive sober days (resetting to zero after any slip)", "Tracking total 'good days' this month (they never reset)", "Not tracking anything", "Only counting when you're perfect"]), answerJson: JSON.stringify("Tracking total 'good days' this month (they never reset)"), explain: "Cumulative tracking means a slip doesn't erase your progress. 28 out of 30 good days is still a win." },
    { type: "INFO", order: 3, prompt: "Mission: Pick Your Metric", body: "Choose 1 recovery metric to track this week: days sober, fewer uses, more meetings, more coping tool uses, or fewer risky situations. Start tracking today. No judgment — just data." },
  ]);

  // =====================================================
  // JOURNEY 7: Harm Reduction & Overdose Prevention
  // =====================================================
  const journey7 = await upsertPath({
    title: "Harm Reduction & Safety",
    slug: "harm-reduction-safety",
    description: "Stay safer, prevent overdose, and connect to help — even if you're not ready to quit. Every step toward safety matters.",
    icon: "🛟",
    order: 7,
  });

  // --- Unit 7.1: Safety Basics ---
  const unit7_1 = await upsertModule({ pathId: journey7.id, title: "Safety Basics", slug: "safety-basics", order: 1 });

  const l7_1_1 = await upsertLesson({ moduleId: unit7_1.id, title: "Harm Reduction Mindset", slug: "harm-reduction-mindset", order: 1, xpReward: 2 });
  await seedCards(l7_1_1.id, [
    { type: "INFO", order: 1, prompt: "Safer Is Better", body: "Harm reduction means any step that makes things safer — even if you're not ready to stop. Using less, using in safer ways, not using alone, carrying naloxone — every safety upgrade counts. No shame, no judgment, just safer choices." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What does harm reduction mean?", choicesJson: JSON.stringify(["You have to quit completely or it doesn't count", "Any step that reduces risk counts as progress", "It means you don't care about recovery", "It only works for some substances"]), answerJson: JSON.stringify("Any step that reduces risk counts as progress"), explain: "Harm reduction meets you where you are. Any reduction in risk is a win — period." },
    { type: "INFO", order: 3, prompt: "Mission: Choose 1 Safety Upgrade", body: "Pick one thing you can do this week to be safer: don't use alone, carry naloxone, use less, test your supply, or have an emergency plan. One upgrade. That's all." },
  ]);

  const l7_1_2 = await upsertLesson({ moduleId: unit7_1.id, title: "Overdose Basics", slug: "overdose-basics", order: 2, xpReward: 2 });
  await seedCards(l7_1_2.id, [
    { type: "INFO", order: 1, prompt: "What Overdose Is", body: "An overdose happens when your body can't handle the amount of substance. Mixing substances (like opioids and alcohol, or opioids and benzodiazepines) dramatically increases risk. Signs include slow or stopped breathing, blue lips, unresponsiveness, and gurgling sounds." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which combination creates the HIGHEST overdose risk?", choicesJson: JSON.stringify(["Coffee and water", "Opioids and alcohol together", "Vitamins and food", "Walking and stretching"]), answerJson: JSON.stringify("Opioids and alcohol together"), explain: "Mixing depressants (opioids + alcohol) is extremely dangerous because both slow breathing. Together, they can stop it entirely." },
    { type: "TRUE_FALSE", order: 3, prompt: "Someone who is overdosing can always be woken up by cold water or slapping.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Cold water and slapping don't reverse an overdose. If someone can't be woken up, call 911 immediately and use naloxone if available." },
    { type: "INFO", order: 4, prompt: "Mission: My Emergency Plan Card", body: "Create a simple card (phone note or paper) with: 1) Call 911, 2) Give naloxone if available, 3) Put person in recovery position, 4) Stay with them. Save this card on your phone now." },
  ]);

  const l7_1_3 = await upsertLesson({ moduleId: unit7_1.id, title: "Naloxone Basics", slug: "naloxone-basics", order: 3, xpReward: 2 });
  await seedCards(l7_1_3.id, [
    { type: "INFO", order: 1, prompt: "Naloxone Saves Lives", body: "Naloxone (Narcan) is a medicine that reverses opioid overdoses. It's safe, it works fast, and it has no effect if the person hasn't taken opioids. Many pharmacies carry it without a prescription. The CDC recommends treating any suspected overdose as an overdose." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "When should you use naloxone?", choicesJson: JSON.stringify(["Only if you're 100% sure it's an opioid overdose", "Whenever you suspect an opioid overdose — it won't hurt if you're wrong", "Only if a doctor is present", "Never, it's dangerous"]), answerJson: JSON.stringify("Whenever you suspect an opioid overdose — it won't hurt if you're wrong"), explain: "Naloxone is safe to give even if you're not sure. If it's not opioids, it simply won't do anything. When in doubt, give it." },
    { type: "INFO", order: 3, prompt: "Mission: Find Naloxone Near You", body: "Search for free naloxone in your area. Many health departments, harm reduction organizations, and pharmacies provide it free or at low cost. SAMHSA's helpline (1-800-662-4357) can help you find local resources." },
  ]);

  const l7_1_4 = await upsertLesson({ moduleId: unit7_1.id, title: "Calling for Help", slug: "calling-for-help", order: 4, xpReward: 2 });
  await seedCards(l7_1_4.id, [
    { type: "INFO", order: 1, prompt: "What to Say When You Call 911", body: "Keep it simple: 'Someone is not breathing' or 'Someone is unconscious and won't wake up.' Give the address. Stay on the line. You don't have to mention substances if you're afraid — just describe what you see." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the MOST important thing to say on a 911 call for a suspected overdose?", choicesJson: JSON.stringify(["List every substance they took", "The person's location and that they're not breathing", "Your own name and information", "Ask if you'll get in trouble"]), answerJson: JSON.stringify("The person's location and that they're not breathing"), explain: "Location and symptoms save lives. That's what dispatchers need first. Everything else can come later." },
    { type: "INFO", order: 3, prompt: "Mission: Emergency Script", body: "Save this in your phone notes: 'I need an ambulance at [ADDRESS]. Someone is not breathing/unconscious. Please hurry.' Having it ready means you won't freeze in a crisis." },
  ]);

  const l7_1_5 = await upsertLesson({ moduleId: unit7_1.id, title: "Recovery Position", slug: "recovery-position", order: 5, xpReward: 2 });
  await seedCards(l7_1_5.id, [
    { type: "INFO", order: 1, prompt: "Keep Them Safe Until Help Arrives", body: "If someone is unconscious but breathing: Roll them on their side (recovery position), tilt their head back slightly to keep airway open, stay with them, and keep checking their breathing. This prevents choking if they vomit." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the correct order for helping someone who is unconscious?", choicesJson: JSON.stringify(["Leave them alone and call later", "Call 911, give naloxone if available, put in recovery position, stay with them", "Shake them hard and pour water on them", "Drive them to the hospital yourself"]), answerJson: JSON.stringify("Call 911, give naloxone if available, put in recovery position, stay with them"), explain: "Call 911 first, then naloxone, then recovery position, then stay. This sequence gives them the best chance." },
    { type: "INFO", order: 3, prompt: "Mission: Learn It, Teach It", body: "Practice putting someone in the recovery position (use a pillow or ask a friend). Once you know it, consider teaching one other person. One skill shared could save a life." },
  ]);

  // --- Unit 7.2: High-Risk Moments ---
  const unit7_2 = await upsertModule({ pathId: journey7.id, title: "High-Risk Moments", slug: "high-risk-moments", order: 2 });

  const l7_2_1 = await upsertLesson({ moduleId: unit7_2.id, title: "Mixing Risks", slug: "mixing-risks", order: 1, xpReward: 2 });
  await seedCards(l7_2_1.id, [
    { type: "INFO", order: 1, prompt: "Mixing Multiplies Danger", body: "Combining substances doesn't just add risk — it multiplies it. Opioids + alcohol, stimulants + depressants, anything + unknown pills — these combinations are the leading cause of overdose death. Know your combinations and avoid the deadliest ones." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why is mixing substances more dangerous than using one alone?", choicesJson: JSON.stringify(["It's actually safer to mix", "Different substances can amplify each other's effects on your body unpredictably", "Mixing has no additional risk", "Your body can handle more when you mix"]), answerJson: JSON.stringify("Different substances can amplify each other's effects on your body unpredictably"), explain: "Substances interact in unpredictable ways. What your body can handle separately, it may not survive together." },
    { type: "INFO", order: 3, prompt: "Mission: Know Your Risk Combos", body: "Identify your top 2 risky combinations to avoid. If you're not sure, the most dangerous are: opioids + alcohol, opioids + benzodiazepines, and any substance + unknown pills." },
  ]);

  const l7_2_2 = await upsertLesson({ moduleId: unit7_2.id, title: "Using Alone", slug: "using-alone", order: 2, xpReward: 2 });
  await seedCards(l7_2_2.id, [
    { type: "INFO", order: 1, prompt: "The Buddy System Can Save Your Life", body: "Using alone is the biggest single risk factor for fatal overdose. If something goes wrong, there's no one to call for help. If you are using, having someone who can check on you could be the difference between life and death." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the safest approach if you're going to use?", choicesJson: JSON.stringify(["Use alone so nobody judges you", "Have someone nearby or a check-in buddy", "Use as much as possible quickly", "Don't tell anyone ever"]), answerJson: JSON.stringify("Have someone nearby or a check-in buddy"), explain: "A check-in buddy doesn't have to approve of what you're doing — they just need to be able to call for help if needed." },
    { type: "INFO", order: 3, prompt: "Mission: Check-In Plan", body: "If you're currently using, set up a check-in buddy system: text someone before and after, or use a timed check-in. If they don't hear back, they know to check on you." },
  ]);

  const l7_2_3 = await upsertLesson({ moduleId: unit7_2.id, title: "Tolerance Changes", slug: "tolerance-changes", order: 3, xpReward: 2 });
  await seedCards(l7_2_3.id, [
    { type: "INFO", order: 1, prompt: "After a Break, Your Tolerance Drops", body: "If you've been in treatment, jail, the hospital, or just haven't used in a while, your tolerance drops fast. Going back to your old dose after a break is one of the most common causes of overdose. Start much lower than before." },
    { type: "TRUE_FALSE", order: 2, prompt: "After being sober for 2 weeks, your old dose is still safe.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Even a few days of not using can significantly lower your tolerance. Your old dose could be fatal. Always start much lower after a break." },
    { type: "INFO", order: 3, prompt: "Mission: Risk After a Break Reminder", body: "If you take a break (by choice or not), set a phone reminder: 'My tolerance is lower now. Start small.' This simple reminder could save your life." },
  ]);

  const l7_2_4 = await upsertLesson({ moduleId: unit7_2.id, title: "Party and Social Safety", slug: "party-social-safety", order: 4, xpReward: 2 });
  await seedCards(l7_2_4.id, [
    { type: "INFO", order: 1, prompt: "Social Situations Are High-Risk", body: "Parties, gatherings, and social pressure create some of the riskiest moments. Having rules before you go protects you: set a drink/use limit, have a leave plan, stay hydrated, and go with a buddy who knows your limits." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the best safety rule for a social situation?", choicesJson: JSON.stringify(["Just go with the flow", "Set your limit before you arrive and have a leave plan", "Don't think about it beforehand", "Match whatever everyone else is doing"]), answerJson: JSON.stringify("Set your limit before you arrive and have a leave plan"), explain: "Decisions made before you're in the moment are clearer and safer. Set your limit before you walk in the door." },
    { type: "INFO", order: 3, prompt: "Mission: Pick 2 Safety Rules", body: "Choose 2 rules for your next social situation: set a limit, stay hydrated, bring a buddy, have a leave plan, eat before you go. Write them down before you go out." },
  ]);

  const l7_2_5 = await upsertLesson({ moduleId: unit7_2.id, title: "After an Overdose Event", slug: "after-overdose", order: 5, xpReward: 2 });
  await seedCards(l7_2_5.id, [
    { type: "INFO", order: 1, prompt: "The Next 24 Hours Matter Most", body: "After an overdose event (yours or someone else's), the next 24 hours are critical. Rest, hydrate, and don't use again immediately — your body is vulnerable. Connect with someone: a support person, a counselor, or a helpline." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "After surviving an overdose, what's the most important thing to do in the next 24 hours?", choicesJson: JSON.stringify(["Use again to feel normal", "Rest, hydrate, and connect with support", "Pretend it didn't happen", "Leave the hospital immediately"]), answerJson: JSON.stringify("Rest, hydrate, and connect with support"), explain: "Your body needs recovery time, and connecting with support can help prevent it from happening again." },
    { type: "INFO", order: 3, prompt: "Mission: Next-24-Hours Plan", body: "Create a stabilization plan: who will you call, where will you rest, what will you eat/drink, and when will you check in with someone? If you need help, call SAMHSA at 1-800-662-4357 or 988 for crisis support." },
  ]);

  // --- Unit 7.3: Safer Living Skills ---
  const unit7_3 = await upsertModule({ pathId: journey7.id, title: "Safer Living Skills", slug: "safer-living-skills", order: 3 });

  const l7_3_1 = await upsertLesson({ moduleId: unit7_3.id, title: "Sleep and Nutrition for Stability", slug: "sleep-nutrition-stability", order: 1, xpReward: 2 });
  await seedCards(l7_3_1.id, [
    { type: "INFO", order: 1, prompt: "Your Body Needs Basics to Heal", body: "Substance use depletes your body. Even small improvements in sleep and nutrition can make a huge difference: more energy, fewer cravings, better mood, clearer thinking. Start with water, regular meals, and any amount of better sleep." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which basic need most directly affects cravings?", choicesJson: JSON.stringify(["Having nice clothes", "Regular sleep and meals", "Watching TV", "Having a lot of money"]), answerJson: JSON.stringify("Regular sleep and meals"), explain: "When your body's basic needs are met, your brain doesn't scream as loud for quick fixes. Sleep and food are craving reducers." },
  ]);

  const l7_3_2 = await upsertLesson({ moduleId: unit7_3.id, title: "Wound and Infection Awareness", slug: "wound-infection-awareness", order: 2, xpReward: 2 });
  await seedCards(l7_3_2.id, [
    { type: "INFO", order: 1, prompt: "Notice and Respond to Warning Signs", body: "Redness, swelling, warmth, or drainage around any wound are signs of infection and need medical attention. Don't ignore them — infections can become life-threatening quickly. Many clinics offer free or low-cost wound care." },
    { type: "TRUE_FALSE", order: 2, prompt: "A wound that's red, warm, and swelling can wait a few weeks to be checked.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Signs of infection need prompt medical attention. Waiting can lead to serious, even life-threatening complications. Seek care now." },
  ]);

  const l7_3_3 = await upsertLesson({ moduleId: unit7_3.id, title: "Mental Health and Risk", slug: "mental-health-risk", order: 3, xpReward: 2 });
  await seedCards(l7_3_3.id, [
    { type: "INFO", order: 1, prompt: "Mental Health and Substance Use Are Connected", body: "Depression, anxiety, trauma, and substance use often go together. Using might feel like it helps in the moment, but it usually makes mental health worse over time. Getting support for both at the same time leads to better outcomes." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "If you're dealing with both anxiety and substance use, what's the best approach?", choicesJson: JSON.stringify(["Only treat the substance use", "Only treat the anxiety", "Get support for both at the same time", "Ignore both and hope they go away"]), answerJson: JSON.stringify("Get support for both at the same time"), explain: "Treating both together (called 'dual diagnosis') is most effective. One affects the other, so addressing both gives you the best chance." },
    { type: "INFO", order: 3, prompt: "If You're Struggling Right Now", body: "If you're having thoughts of self-harm or suicide, please reach out: call or text 988 (Suicide & Crisis Lifeline), text HOME to 741741 (Crisis Text Line), or call SAMHSA at 1-800-662-4357. You matter, and help is available right now." },
  ]);

  const l7_3_4 = await upsertLesson({ moduleId: unit7_3.id, title: "Safer Sex and Consent", slug: "safer-sex-consent", order: 4, xpReward: 2 });
  await seedCards(l7_3_4.id, [
    { type: "INFO", order: 1, prompt: "Protect Yourself and Others", body: "Substance use can affect judgment around sexual decisions. Consent must be clear and freely given — someone who is intoxicated cannot give consent. Protect yourself with barriers, testing, and honest communication." },
    { type: "TRUE_FALSE", order: 2, prompt: "Someone who is very intoxicated can still give valid consent.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Consent requires a clear mind. If someone is heavily intoxicated, they cannot give meaningful consent. Wait until everyone is sober." },
  ]);

  const l7_3_5 = await upsertLesson({ moduleId: unit7_3.id, title: "Avoiding Scams and Exploitation", slug: "avoiding-exploitation", order: 5, xpReward: 2 });
  await seedCards(l7_3_5.id, [
    { type: "INFO", order: 1, prompt: "People in Crisis Are Targets", body: "Scammers and exploiters target people who are struggling. Watch for: anyone offering 'free' substances in exchange for favors, fake treatment programs that demand upfront payment, and people who isolate you from your support network." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone offers you free housing but says you can't tell anyone where you're staying. What should you do?", choicesJson: JSON.stringify(["Accept immediately", "Be very cautious — isolation is a warning sign of exploitation", "It's probably fine", "Don't question free help"]), answerJson: JSON.stringify("Be very cautious — isolation is a warning sign of exploitation"), explain: "Secrecy and isolation are major red flags. Legitimate help never requires you to hide from your support network." },
  ]);

  // =====================================================
  // JOURNEY 8: Treatment & Recovery Navigation
  // =====================================================
  const journey8 = await upsertPath({
    title: "Treatment & Recovery Navigation",
    slug: "treatment-recovery-navigation",
    description: "Access care, stay engaged, and build long-term recovery. Navigate the treatment system with confidence.",
    icon: "🏥",
    order: 8,
  });

  // --- Unit 8.1: Treatment Types ---
  const unit8_1 = await upsertModule({ pathId: journey8.id, title: "Treatment Types & What to Expect", slug: "treatment-types", order: 1 });

  const l8_1_1 = await upsertLesson({ moduleId: unit8_1.id, title: "Levels of Care 101", slug: "levels-of-care", order: 1, xpReward: 2 });
  await seedCards(l8_1_1.id, [
    { type: "INFO", order: 1, prompt: "Treatment Comes in Many Forms", body: "Detox (medical withdrawal support), outpatient (visits while living at home), intensive outpatient (more hours), residential (live-in programs), medication-assisted treatment (MAT/MOUD), and counseling. The right level depends on YOUR needs, not a one-size-fits-all approach." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the difference between outpatient and residential treatment?", choicesJson: JSON.stringify(["They're the same thing", "Outpatient means you go home after sessions; residential means you live there", "Residential is always better", "Outpatient means you never see anyone"]), answerJson: JSON.stringify("Outpatient means you go home after sessions; residential means you live there"), explain: "Both are effective — it depends on your situation. Outpatient works well if you have stable housing; residential provides more structure and support." },
    { type: "INFO", order: 3, prompt: "Medication-Assisted Treatment (MAT)", body: "Medications like buprenorphine, methadone, and naltrexone can reduce cravings and prevent withdrawal. The CDC supports expanding access to these medications. MAT is not 'trading one addiction for another' — it's evidence-based medicine that saves lives." },
  ]);

  const l8_1_2 = await upsertLesson({ moduleId: unit8_1.id, title: "What a First Appointment Looks Like", slug: "first-appointment", order: 2, xpReward: 2 });
  await seedCards(l8_1_2.id, [
    { type: "INFO", order: 1, prompt: "It's Just a Conversation", body: "Your first appointment is usually a conversation, not a test. They'll ask about your substance use, mental health, medical history, and what you want help with. You don't have to have all the answers. Being honest helps them help you better." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What should you bring to a first treatment appointment?", choicesJson: JSON.stringify(["Nothing, they'll figure it out", "ID, insurance card (if you have one), list of medications, and your questions", "A list of excuses", "Someone to answer for you"]), answerJson: JSON.stringify("ID, insurance card (if you have one), list of medications, and your questions"), explain: "Being prepared shows you're serious and helps the provider help you faster. If you don't have insurance, tell them — many programs work with uninsured people." },
    { type: "INFO", order: 3, prompt: "Mission: Write 3 Questions", body: "Before your first appointment, write down 3 questions you want to ask: What will treatment look like? How long does it take? What if I have a setback? Having questions shows you're engaged and helps you make informed choices." },
  ]);

  const l8_1_3 = await upsertLesson({ moduleId: unit8_1.id, title: "Confidentiality Basics", slug: "confidentiality-basics", order: 3, xpReward: 2 });
  await seedCards(l8_1_3.id, [
    { type: "INFO", order: 1, prompt: "Your Treatment Is Usually Private", body: "Federal law protects substance use treatment records. Generally, what you share with your treatment provider stays private. There are some exceptions (immediate danger, child safety concerns), but overall your information is protected." },
    { type: "TRUE_FALSE", order: 2, prompt: "Treatment providers can share your substance use information with anyone they want.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Federal confidentiality laws (42 CFR Part 2) provide strong protections for substance use treatment records. Your privacy is taken seriously." },
    { type: "INFO", order: 3, prompt: "Mission: Comfort Checklist", body: "Write a short list of what you're comfortable sharing and what you'd rather keep private for now. This helps you feel more in control during appointments. Remember: you can always share more later as trust builds." },
  ]);

  const l8_1_4 = await upsertLesson({ moduleId: unit8_1.id, title: "Support Groups Overview", slug: "support-groups-overview", order: 4, xpReward: 2 });
  await seedCards(l8_1_4.id, [
    { type: "INFO", order: 1, prompt: "You Don't Have to Go Alone", body: "Support groups come in many formats: 12-step (AA, NA), SMART Recovery, Refuge Recovery, peer support groups, and more. Some are in-person, some are online. You don't have to speak if you're not ready — just showing up counts." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What if you go to a support group meeting and it doesn't feel right?", choicesJson: JSON.stringify(["Groups don't work for anyone", "Try a different group — there are many types and each has a different feel", "Never try again", "Force yourself to keep going to that one"]), answerJson: JSON.stringify("Try a different group — there are many types and each has a different feel"), explain: "Every group has a different vibe. If the first one doesn't click, try another. The right group can be life-changing." },
    { type: "INFO", order: 3, prompt: "Mission: Try One Meeting", body: "Find one support group meeting to try this week — in-person or online. You don't have to talk. Just listen and see how it feels. Many are free and open to anyone." },
  ]);

  const l8_1_5 = await upsertLesson({ moduleId: unit8_1.id, title: "Recovery Coaching and Case Management", slug: "recovery-coaching", order: 5, xpReward: 2 });
  await seedCards(l8_1_5.id, [
    { type: "INFO", order: 1, prompt: "Coaches and Case Managers Help You Navigate", body: "Recovery coaches have lived experience and help you set goals. Case managers help you access services (housing, benefits, treatment). Both are on YOUR side and can make the system less overwhelming." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the main role of a recovery coach?", choicesJson: JSON.stringify(["To diagnose and prescribe medication", "To share lived experience and help you set and reach recovery goals", "To tell you what to do", "To monitor you for violations"]), answerJson: JSON.stringify("To share lived experience and help you set and reach recovery goals"), explain: "Recovery coaches have been through it themselves. They're guides, not authority figures. They walk alongside you." },
    { type: "INFO", order: 3, prompt: "Mission: Help Request Template", body: "Save this text template on your phone: 'Hi, my name is [Name]. I'm looking for support with [substance use/recovery/housing]. Could you help me or point me to someone who can? Thank you.' Having this ready makes reaching out easier." },
  ]);

  // --- Unit 8.2: Getting In the Door ---
  const unit8_2 = await upsertModule({ pathId: journey8.id, title: "Getting In the Door", slug: "getting-in-door", order: 2 });

  const l8_2_1 = await upsertLesson({ moduleId: unit8_2.id, title: "Finding Local Help", slug: "finding-local-help", order: 1, xpReward: 2 });
  await seedCards(l8_2_1.id, [
    { type: "INFO", order: 1, prompt: "Help Is Closer Than You Think", body: "SAMHSA's National Helpline (1-800-662-4357) provides free, confidential, 24/7 referrals to local treatment facilities, support groups, and community organizations. It's available in English and Spanish. You can also search findtreatment.gov." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the best first step if you don't know where to get help?", choicesJson: JSON.stringify(["Search the internet randomly", "Call SAMHSA's helpline at 1-800-662-4357 for a personalized referral", "Wait until someone offers help", "Ask on social media"]), answerJson: JSON.stringify("Call SAMHSA's helpline at 1-800-662-4357 for a personalized referral"), explain: "SAMHSA's helpline is free, confidential, and can connect you to local services based on your specific needs and location." },
  ]);

  const l8_2_2 = await upsertLesson({ moduleId: unit8_2.id, title: "Insurance and No-Insurance Paths", slug: "insurance-paths", order: 2, xpReward: 2 });
  await seedCards(l8_2_2.id, [
    { type: "INFO", order: 1, prompt: "No Insurance? You Still Have Options", body: "Many treatment programs offer sliding scale fees, accept Medicaid, or provide free services through grants. Community health centers, faith-based programs, and state-funded treatment are all options. Don't let insurance stop you from getting help." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You don't have insurance and need treatment. What should you do?", choicesJson: JSON.stringify(["Give up — treatment is only for people with insurance", "Ask about sliding scale fees, Medicaid eligibility, or free programs", "Wait until you can afford it", "Only go to the emergency room"]), answerJson: JSON.stringify("Ask about sliding scale fees, Medicaid eligibility, or free programs"), explain: "Treatment exists at every income level. Ask directly: 'Do you have options for people without insurance?' Most places do." },
    { type: "INFO", order: 3, prompt: "Mission: Build a 3-Option Plan", body: "Research 3 potential paths to treatment: 1) An insured option (if you have coverage), 2) A sliding-scale or Medicaid option, 3) A free community program. Having options means one closed door doesn't stop you." },
  ]);

  const l8_2_3 = await upsertLesson({ moduleId: unit8_2.id, title: "Paperwork Without Panic", slug: "paperwork-without-panic", order: 3, xpReward: 2 });
  await seedCards(l8_2_3.id, [
    { type: "INFO", order: 1, prompt: "Paperwork Is a Barrier You Can Beat", body: "Treatment paperwork can feel overwhelming, but it's just forms. Common needs: photo ID, proof of income, insurance card, list of medications. If you're missing something, ask what alternatives they accept — most programs work with you." },
    { type: "TRUE_FALSE", order: 2, prompt: "You need to have every document perfect before you can start treatment.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Most programs will work with you even if you're missing documents. Don't let paperwork stop you from showing up." },
    { type: "INFO", order: 3, prompt: "Mission: Document Checklist", body: "Make a checklist: ID, insurance card (or none), medications list, emergency contact. Check what you have and note what's missing. For missing items, write down 'what to do if I don't have this' — call the program and ask." },
  ]);

  const l8_2_4 = await upsertLesson({ moduleId: unit8_2.id, title: "Transportation and Scheduling", slug: "transportation-scheduling", order: 4, xpReward: 2 });
  await seedCards(l8_2_4.id, [
    { type: "INFO", order: 1, prompt: "Getting There Is Half the Battle", body: "Transportation is one of the biggest barriers to treatment. Options: public transit, Medicaid transportation benefits, ride programs through treatment centers, friends/family, walking, or telehealth. Plan your ride BEFORE the appointment." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your appointment is at 10am across town and you don't have a car. Best approach?", choicesJson: JSON.stringify(["Cancel the appointment", "Plan the bus route the night before and leave with extra time", "Hope someone offers a ride that morning", "Walk 5 miles and arrive late"]), answerJson: JSON.stringify("Plan the bus route the night before and leave with extra time"), explain: "Planning ahead removes the excuse. Check the route, set an alarm, and leave early. Showing up is the hardest part — make it easier." },
    { type: "INFO", order: 3, prompt: "Mission: Appointment Plan", body: "For your next appointment: Write the time, location, and your transportation plan. Add a buffer (leave 30 min early). Add a backup ride option. This simple plan triples your chances of actually getting there." },
  ]);

  const l8_2_5 = await upsertLesson({ moduleId: unit8_2.id, title: "Advocacy Skills", slug: "advocacy-skills", order: 5, xpReward: 2 });
  await seedCards(l8_2_5.id, [
    { type: "INFO", order: 1, prompt: "Follow Up Politely But Firmly", body: "The system is slow. Phones go unanswered. Appointments get delayed. That's not a reason to give up — it's a reason to follow up. Be polite, be persistent, and keep a record of who you talked to and when." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You called a treatment center 5 days ago and haven't heard back. What should you do?", choicesJson: JSON.stringify(["They're not interested, give up", "Call again, politely ask for an update, and note who you spoke with", "Show up and demand to be seen", "Wait another month"]), answerJson: JSON.stringify("Call again, politely ask for an update, and note who you spoke with"), explain: "Follow-up shows you're serious. Keep a log: date, who you talked to, what they said. This protects you and keeps things moving." },
    { type: "INFO", order: 3, prompt: "Mission: 2-Week Follow-Up Plan", body: "For any application or request you've made: set a reminder to follow up every 3-5 days for 2 weeks. Write down a simple script: 'Hi, I'm [Name], I [applied/called] on [date]. Can I get an update? Thank you.'" },
  ]);

  // --- Unit 8.3: Staying Engaged ---
  const unit8_3 = await upsertModule({ pathId: journey8.id, title: "Staying Engaged", slug: "staying-engaged", order: 3 });

  const l8_3_1 = await upsertLesson({ moduleId: unit8_3.id, title: "Early Recovery Routine", slug: "early-recovery-routine", order: 1, xpReward: 2 });
  await seedCards(l8_3_1.id, [
    { type: "INFO", order: 1, prompt: "Structure Is Your Shield", body: "In early recovery, empty time is risky time. A daily routine — even a simple one — gives your brain something to do besides crave. Wake time, meals, one productive task, one enjoyable activity, and a bedtime. That's enough." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why is routine important in early recovery?", choicesJson: JSON.stringify(["It makes life boring", "Structure reduces the empty time where cravings are strongest", "It's not important", "Only strict schedules work"]), answerJson: JSON.stringify("Structure reduces the empty time where cravings are strongest"), explain: "Unstructured time is when cravings are loudest. Even a loose routine gives your day purpose and reduces risk." },
  ]);

  const l8_3_2 = await upsertLesson({ moduleId: unit8_3.id, title: "Handling Cravings in Treatment", slug: "cravings-in-treatment", order: 2, xpReward: 2 });
  await seedCards(l8_3_2.id, [
    { type: "INFO", order: 1, prompt: "Cravings in Treatment Are Normal", body: "Having cravings while in treatment doesn't mean it's not working. Cravings are part of recovery, not a sign of failure. Talk about them with your counselor or group — that's literally what treatment is for." },
    { type: "TRUE_FALSE", order: 2, prompt: "If you have cravings during treatment, it means treatment isn't working.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Cravings are expected and normal. Treatment teaches you how to handle them, not eliminate them overnight." },
  ]);

  const l8_3_3 = await upsertLesson({ moduleId: unit8_3.id, title: "Dealing With Shame and Setbacks", slug: "shame-and-setbacks", order: 3, xpReward: 2 });
  await seedCards(l8_3_3.id, [
    { type: "INFO", order: 1, prompt: "Shame Is the Enemy of Recovery", body: "Shame says 'I am bad.' Guilt says 'I did something I regret.' Guilt can motivate change; shame paralyzes. When shame hits, remind yourself: having a substance use disorder is not a moral failing. It's a health condition, and you're working on it." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the healthiest response to a setback in recovery?", choicesJson: JSON.stringify(["Hide it and pretend it didn't happen", "Talk to your support person, learn from it, and get back to your plan", "Decide you're a failure and give up", "Punish yourself"]), answerJson: JSON.stringify("Talk to your support person, learn from it, and get back to your plan"), explain: "Setbacks are data, not verdicts. Every setback teaches you something about your triggers and your plan. Use the information." },
  ]);

  const l8_3_4 = await upsertLesson({ moduleId: unit8_3.id, title: "Family and Relationship Pressure", slug: "family-pressure", order: 4, xpReward: 2 });
  await seedCards(l8_3_4.id, [
    { type: "INFO", order: 1, prompt: "Loved Ones Don't Always Understand", body: "Family might be supportive, angry, exhausted, or all three. Their feelings are valid, AND your recovery is yours. You can't control their reactions, but you can communicate honestly and set boundaries that protect your progress." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "A family member says 'You'll never change.' What's the best response?", choicesJson: JSON.stringify(["Argue and get defensive", "Acknowledge their frustration and show them through actions over time", "Agree and give up", "Cut them off completely"]), answerJson: JSON.stringify("Acknowledge their frustration and show them through actions over time"), explain: "Trust is rebuilt slowly through consistent action, not words. Acknowledge their pain and let your actions speak." },
  ]);

  const l8_3_5 = await upsertLesson({ moduleId: unit8_3.id, title: "Planning Weekends and Triggers", slug: "planning-weekends", order: 5, xpReward: 2 });
  await seedCards(l8_3_5.id, [
    { type: "INFO", order: 1, prompt: "Weekends Are the Danger Zone", body: "Friday evenings through Sunday nights are when most relapses happen. Less structure + social pressure + boredom = high risk. Planning your weekends in advance is one of the most effective relapse prevention strategies." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "It's Friday morning. What's the best way to protect your weekend?", choicesJson: JSON.stringify(["Just see what happens", "Plan at least 2 activities and have a support person to check in with", "Stay in bed all weekend", "Go to all the places you used to use"]), answerJson: JSON.stringify("Plan at least 2 activities and have a support person to check in with"), explain: "A planned weekend is a safer weekend. Activities + accountability = protection." },
  ]);

  // --- Unit 8.4: Long-Term Recovery Tools ---
  const unit8_4 = await upsertModule({ pathId: journey8.id, title: "Long-Term Recovery Tools", slug: "long-term-recovery", order: 4 });

  const l8_4_1 = await upsertLesson({ moduleId: unit8_4.id, title: "Work and Recovery Balance", slug: "work-recovery-balance", order: 1, xpReward: 2 });
  await seedCards(l8_4_1.id, [
    { type: "INFO", order: 1, prompt: "Work Can Support Recovery — Or Threaten It", body: "Employment provides structure, income, and purpose. But work stress can also trigger cravings. The key is finding balance: have a plan for work stress, keep your recovery meetings, and don't let work become an excuse to skip support." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You're offered overtime but it conflicts with your recovery meeting. What should you do?", choicesJson: JSON.stringify(["Skip the meeting — money is more important", "Talk to your boss about scheduling, and find an alternative meeting time", "Quit the job", "Go to work and skip recovery permanently"]), answerJson: JSON.stringify("Talk to your boss about scheduling, and find an alternative meeting time"), explain: "Recovery supports your ability to work. Sacrificing recovery for work is short-term thinking. Find a way to do both." },
  ]);

  const l8_4_2 = await upsertLesson({ moduleId: unit8_4.id, title: "Sober Social Life", slug: "sober-social-life", order: 2, xpReward: 2 });
  await seedCards(l8_4_2.id, [
    { type: "INFO", order: 1, prompt: "Fun Doesn't Require Substances", body: "Building a sober social life feels scary but it's essential. Try: recovery community events, fitness groups, volunteer work, hobby classes, gaming communities, or sober meetups. You'll be surprised how many people are looking for substance-free fun." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the best way to build a sober social life?", choicesJson: JSON.stringify(["Wait for friends to come to you", "Join activities where substances aren't the focus", "Only hang out with people from treatment", "Stay home alone"]), answerJson: JSON.stringify("Join activities where substances aren't the focus"), explain: "Activities create connections naturally. Find something you enjoy and the friendships will follow." },
  ]);

  const l8_4_3 = await upsertLesson({ moduleId: unit8_4.id, title: "Money Repair Plan", slug: "money-repair-plan", order: 3, xpReward: 2 });
  await seedCards(l8_4_3.id, [
    { type: "INFO", order: 1, prompt: "Recovery Includes Financial Recovery", body: "Substance use often leaves financial damage: debt, unpaid bills, destroyed credit. You can't fix it all at once, but you can start. Step 1: know what you owe. Step 2: prioritize essentials. Step 3: one small payment toward one debt." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You have debt from your using days. What's the best first step?", choicesJson: JSON.stringify(["Ignore it and hope it goes away", "Make a list of everything you owe and prioritize the most urgent", "Pay a random bill with money you need for food", "Declare bankruptcy immediately"]), answerJson: JSON.stringify("Make a list of everything you owe and prioritize the most urgent"), explain: "Knowing the full picture removes the unknown fear. Then prioritize: housing, utilities, and basic needs first." },
  ]);

  const l8_4_4 = await upsertLesson({ moduleId: unit8_4.id, title: "Health Follow-Up", slug: "health-follow-up", order: 4, xpReward: 2 });
  await seedCards(l8_4_4.id, [
    { type: "INFO", order: 1, prompt: "Recovery Is a Full-Body Process", body: "Substance use affects your whole body. As you recover, schedule basic health check-ups: dental, vision, general physical, and any specific concerns. Many community health centers offer free or sliding-scale care." },
    { type: "TRUE_FALSE", order: 2, prompt: "You should wait until you feel sick to see a doctor in recovery.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Preventive care catches problems early. Your body has been through a lot — give it a check-up as part of your recovery." },
  ]);

  const l8_4_5 = await upsertLesson({ moduleId: unit8_4.id, title: "Giving Back Without Burnout", slug: "giving-back", order: 5, xpReward: 2 });
  await seedCards(l8_4_5.id, [
    { type: "INFO", order: 1, prompt: "Service Strengthens Recovery", body: "Helping others is powerful for recovery — it gives purpose and perspective. But don't overdo it. You can't pour from an empty cup. Give back at a pace that sustains you, not drains you." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "When is the right time to start helping others in recovery?", choicesJson: JSON.stringify(["Immediately, before you're stable", "When you have a solid foundation and your own support in place", "Never — focus only on yourself", "Only after 10 years of sobriety"]), answerJson: JSON.stringify("When you have a solid foundation and your own support in place"), explain: "Help from a place of stability, not desperation. Secure your own recovery first, then extend a hand to others." },
  ]);

  // =====================================================
  // JOURNEY 9: Relapse Prevention Mastery
  // =====================================================
  const journey9 = await upsertPath({
    title: "Relapse Prevention Mastery",
    slug: "relapse-prevention-mastery",
    description: "Turn 'I'm trying' into 'I have a system.' Master warning signs, boundaries, emotional resilience, and maintenance.",
    icon: "🔒",
    order: 9,
  });

  // --- Unit 9.1: Relapse is a Process ---
  const unit9_1 = await upsertModule({ pathId: journey9.id, title: "Relapse Is a Process, Not a Moment", slug: "relapse-process", order: 1 });

  const l9_1_1 = await upsertLesson({ moduleId: unit9_1.id, title: "The Relapse Road", slug: "relapse-road", order: 1, xpReward: 2 });
  await seedCards(l9_1_1.id, [
    { type: "INFO", order: 1, prompt: "It Starts Long Before the First Use", body: "Relapse follows a road: risky thoughts ('One time won't hurt') → risky behaviors (going to old places, skipping meetings) → use. By the time you use, you've already passed several warning signs. Catching it early is the skill." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which comes FIRST on the relapse road?", choicesJson: JSON.stringify(["Using substances", "Risky thinking patterns", "Going to old hangouts", "Feeling great about recovery"]), answerJson: JSON.stringify("Risky thinking patterns"), explain: "Relapse starts in the mind with thoughts like 'I can handle it now' or 'One time won't matter.' Catching these thoughts early stops the road." },
  ]);

  const l9_1_2 = await upsertLesson({ moduleId: unit9_1.id, title: "Warning Signs", slug: "warning-signs", order: 2, xpReward: 2 });
  await seedCards(l9_1_2.id, [
    { type: "INFO", order: 1, prompt: "Your Personal Warning Signs", body: "Common warning signs: isolating yourself, skipping meetings or appointments, romanticizing past use ('the good old days'), irritability, disrupted sleep, keeping secrets, and reconnecting with using friends. Learn YOUR specific warning signs." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is a warning sign that relapse might be approaching?", choicesJson: JSON.stringify(["Attending support meetings regularly", "Starting to skip meetings and isolate yourself", "Calling your sponsor when stressed", "Using your coping tools"]), answerJson: JSON.stringify("Starting to skip meetings and isolate yourself"), explain: "Isolation and withdrawal from support are major warning signs. If you notice this pattern, reach out before it escalates." },
  ]);

  const l9_1_3 = await upsertLesson({ moduleId: unit9_1.id, title: "The 3-Choice Rule (Pause, Reach, Replace)", slug: "three-choice-rule", order: 3, xpReward: 2 });
  await seedCards(l9_1_3.id, [
    { type: "INFO", order: 1, prompt: "When Temptation Hits, You Have 3 Choices", body: "PAUSE: Stop and breathe for 60 seconds. REACH: Call or text your support person. REPLACE: Do your alternative activity. You don't need all three — any ONE of these can break the cycle. But having all three as options is powerful." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You're at a party and someone offers you a substance. What's the best first move?", choicesJson: JSON.stringify(["Accept and deal with it later", "PAUSE — step away and take 60 seconds to breathe", "Get angry at them", "Stay and try to resist"]), answerJson: JSON.stringify("PAUSE — step away and take 60 seconds to breathe"), explain: "Pausing creates space between trigger and response. That space is where your power lives." },
  ]);

  const l9_1_4 = await upsertLesson({ moduleId: unit9_1.id, title: "Recovery Scripts", slug: "recovery-scripts", order: 4, xpReward: 2 });
  await seedCards(l9_1_4.id, [
    { type: "INFO", order: 1, prompt: "Have Your Lines Ready", body: "Rehearsed responses work better than improvised ones. Scripts for common situations: 'No thanks, I'm good.' 'I don't do that anymore.' 'I'm driving tonight.' Short, confident, and no need to explain. Repeat if they push. Then exit." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone keeps pressuring you after you said no. What's the best next step?", choicesJson: JSON.stringify(["Give in to stop the pressure", "Repeat your refusal calmly and leave if needed", "Get aggressive", "Explain your entire recovery story"]), answerJson: JSON.stringify("Repeat your refusal calmly and leave if needed"), explain: "Short, confident, repeat, exit. You don't owe anyone an explanation. Your safety comes first." },
    { type: "INFO", order: 3, prompt: "Mission: Save 3 Scripts", body: "Write down and save 3 refusal scripts in your phone: one for casual offers, one for pressure from friends, and one for high-pressure situations. Practice saying them out loud." },
  ]);

  const l9_1_5 = await upsertLesson({ moduleId: unit9_1.id, title: "Lapse vs Relapse (Recover Fast)", slug: "lapse-vs-relapse", order: 5, xpReward: 2 });
  await seedCards(l9_1_5.id, [
    { type: "INFO", order: 1, prompt: "A Lapse Is Data, Not Identity", body: "A lapse is a single slip. A relapse is a return to old patterns. The difference is what you do NEXT. A lapse doesn't erase your progress — it teaches you something about your triggers, your plan, and what needs strengthening." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You had a lapse after 3 weeks of sobriety. What should you do?", choicesJson: JSON.stringify(["Decide you're a failure and give up entirely", "Stop, call your support person, and figure out what happened and what to do differently", "Keep using since you already 'failed'", "Hide it and pretend it didn't happen"]), answerJson: JSON.stringify("Stop, call your support person, and figure out what happened and what to do differently"), explain: "A lapse is a learning moment. Stop the behavior, reach out for support, and analyze what went wrong. Your 3 weeks still count." },
    { type: "INFO", order: 3, prompt: "Mission: Write Your Reset Plan", body: "Write a 'reset plan' for if/when a lapse happens: 1) Stop immediately, 2) Who will I call? 3) What triggered it? 4) What will I do differently? Having this plan means a lapse stays a lapse, not a relapse." },
  ]);

  // --- Unit 9.2: Social and Environmental Control ---
  const unit9_2 = await upsertModule({ pathId: journey9.id, title: "Social & Environmental Control", slug: "social-environmental", order: 2 });

  const l9_2_1 = await upsertLesson({ moduleId: unit9_2.id, title: "People Boundaries", slug: "people-boundaries", order: 1, xpReward: 2 });
  await seedCards(l9_2_1.id, [
    { type: "INFO", order: 1, prompt: "Some People Are Risks", body: "Not everyone in your life supports your recovery. Sort your contacts: Safe people (support your recovery), Risky people (use around you or pressure you), and Dangerous people (actively try to pull you back). Protect your recovery by limiting risky and avoiding dangerous people." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "How should you handle a 'risky' person in your life?", choicesJson: JSON.stringify(["Cut them off completely with no explanation", "Set clear boundaries about what you will and won't do around them", "Pretend nothing has changed", "Let them decide your schedule"]), answerJson: JSON.stringify("Set clear boundaries about what you will and won't do around them"), explain: "Boundaries let you maintain relationships while protecting your recovery. Be clear about what you need." },
  ]);

  const l9_2_2 = await upsertLesson({ moduleId: unit9_2.id, title: "Places Plan", slug: "places-plan", order: 2, xpReward: 2 });
  await seedCards(l9_2_2.id, [
    { type: "INFO", order: 1, prompt: "Places Hold Memories", body: "Certain streets, stores, bars, or neighborhoods can trigger powerful cravings just by being there. Map your trigger places and plan alternative routes. If you must go to a trigger location, bring a support person and have a time limit." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You need to walk past your old dealer's block to get to work. What's the best strategy?", choicesJson: JSON.stringify(["Just power through it daily", "Find an alternative route, even if it takes longer", "Stop and say hi since you're in the neighborhood", "Quit the job"]), answerJson: JSON.stringify("Find an alternative route, even if it takes longer"), explain: "A longer safe route is better than a shorter dangerous one. Protect your recovery with small environmental changes." },
  ]);

  const l9_2_3 = await upsertLesson({ moduleId: unit9_2.id, title: "Phone and Social Media Triggers", slug: "phone-social-triggers", order: 3, xpReward: 2 });
  await seedCards(l9_2_3.id, [
    { type: "INFO", order: 1, prompt: "Your Phone Can Be a Trigger", body: "Old contacts, social media showing substance use, late-night scrolling — your phone can work against your recovery. Clean up: delete dealer contacts, unfollow triggering accounts, set screen time limits at night. Make your phone a recovery tool, not a trigger." },
    { type: "TRUE_FALSE", order: 2, prompt: "Keeping your old dealer's number 'just in case' is harmless.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Having the number is having the option. Deleting it removes a temptation that could cost you everything you've built." },
  ]);

  const l9_2_4 = await upsertLesson({ moduleId: unit9_2.id, title: "Money Triggers", slug: "money-triggers", order: 4, xpReward: 2 });
  await seedCards(l9_2_4.id, [
    { type: "INFO", order: 1, prompt: "Money Can Be a Trigger", body: "Payday, unexpected money, tax refunds — having cash can trigger cravings. Strategies: direct deposit, splitting funds (bills first), having someone you trust hold extra cash, and adding 'friction' (extra steps) between you and your money." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "It's payday and you feel the urge to spend on substances. What friction strategy could help?", choicesJson: JSON.stringify(["Carry all your cash in your pocket", "Set up automatic bill pay so the money is already allocated before you see it", "Don't deposit your check", "Lend money to using friends"]), answerJson: JSON.stringify("Set up automatic bill pay so the money is already allocated before you see it"), explain: "Automation removes the decision point. If bills are paid automatically, the temptation window shrinks." },
  ]);

  const l9_2_5 = await upsertLesson({ moduleId: unit9_2.id, title: "Holidays and Anniversaries", slug: "holidays-anniversaries", order: 5, xpReward: 2 });
  await seedCards(l9_2_5.id, [
    { type: "INFO", order: 1, prompt: "Predictable High-Risk Days", body: "Holidays, birthdays, anniversaries, and dates tied to loss or trauma are predictable triggers. You know they're coming, which means you can plan for them. Have extra support lined up, attend a meeting, and have a safe exit plan for gatherings." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Thanksgiving is next week and your family gatherings always involve heavy drinking. What's your best prep?", choicesJson: JSON.stringify(["Just go and hope for the best", "Plan your attendance, bring a support person, have a leave time, and schedule a check-in call after", "Skip all holidays forever", "Don't think about it until the day arrives"]), answerJson: JSON.stringify("Plan your attendance, bring a support person, have a leave time, and schedule a check-in call after"), explain: "A plan for high-risk holidays means you can participate without putting your recovery at risk." },
  ]);

  // --- Unit 9.3: Emotional Resilience ---
  const unit9_3 = await upsertModule({ pathId: journey9.id, title: "Emotional Resilience", slug: "emotional-resilience", order: 3 });

  const l9_3_1 = await upsertLesson({ moduleId: unit9_3.id, title: "Anger Management", slug: "anger-management", order: 1, xpReward: 2 });
  await seedCards(l9_3_1.id, [
    { type: "INFO", order: 1, prompt: "Anger Is Valid, Actions Are Choices", body: "Anger is a natural emotion — it tells you something needs to change. But acting on anger impulsively (using, lashing out) makes things worse. The skill: feel the anger, pause, choose your response. Anger + pause = power." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You're furious after a phone call. What's the best immediate action?", choicesJson: JSON.stringify(["Punch something", "Walk away, breathe for 2 minutes, then decide what to do", "Call your dealer", "Send an angry text"]), answerJson: JSON.stringify("Walk away, breathe for 2 minutes, then decide what to do"), explain: "Two minutes of space between anger and action is usually enough to choose wisely instead of reacting destructively." },
  ]);

  const l9_3_2 = await upsertLesson({ moduleId: unit9_3.id, title: "Loneliness", slug: "loneliness-recovery", order: 2, xpReward: 2 });
  await seedCards(l9_3_2.id, [
    { type: "INFO", order: 1, prompt: "Loneliness Is a Craving in Disguise", body: "Loneliness is one of the strongest triggers for relapse. Your brain translates 'I'm alone' into 'I need relief.' The antidote isn't necessarily a crowd — it's one genuine connection. A text, a call, a meeting, or even a walk in a public place counts." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "It's 9pm and you feel overwhelmingly lonely. What's the best response?", choicesJson: JSON.stringify(["Text a using friend", "Call a recovery support person or a helpline", "Scroll social media until you feel worse", "Go to sleep angry"]), answerJson: JSON.stringify("Call a recovery support person or a helpline"), explain: "One real connection breaks loneliness. Your support person, a helpline (988 or SAMHSA 1-800-662-4357), or even a crisis text (741741) can help." },
  ]);

  const l9_3_3 = await upsertLesson({ moduleId: unit9_3.id, title: "Grief", slug: "grief-recovery", order: 3, xpReward: 2 });
  await seedCards(l9_3_3.id, [
    { type: "INFO", order: 1, prompt: "Grief Doesn't Follow Rules", body: "You might grieve lost relationships, lost time, lost health, or loved ones. Grief comes in waves and doesn't follow a schedule. Using to numb grief delays healing — it doesn't fix it. Allow yourself to feel it, talk about it, and get support." },
    { type: "TRUE_FALSE", order: 2, prompt: "Grief in recovery should be handled by numbing the feelings.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Numbing grief prolongs it. Feeling it — with support — is how healing actually happens. It hurts, but it passes." },
  ]);

  const l9_3_4 = await upsertLesson({ moduleId: unit9_3.id, title: "Anxiety", slug: "anxiety-recovery", order: 4, xpReward: 2 });
  await seedCards(l9_3_4.id, [
    { type: "INFO", order: 1, prompt: "Anxiety Lies About the Future", body: "Anxiety tells you everything will go wrong. In recovery, anxiety can drive cravings for relief. Tools: grounding (5-4-3-2-1), paced breathing, writing down what you're worried about and asking 'Is this real right now?' Most anxiety is about things that haven't happened yet." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your anxiety is spiking and you feel a strong craving. What should you do first?", choicesJson: JSON.stringify(["Use to calm down", "Ground yourself with 5-4-3-2-1 and then call your support person", "Ignore it and hope it passes", "Make a major life decision right now"]), answerJson: JSON.stringify("Ground yourself with 5-4-3-2-1 and then call your support person"), explain: "Ground first to get out of panic mode, then connect with support. Never make big decisions when anxiety is high." },
  ]);

  const l9_3_5 = await upsertLesson({ moduleId: unit9_3.id, title: "Depression-Like Days", slug: "depression-days", order: 5, xpReward: 2 });
  await seedCards(l9_3_5.id, [
    { type: "INFO", order: 1, prompt: "Some Days Are Just Hard", body: "In recovery, some days everything feels heavy, pointless, or numb. That's your brain healing — not a sign of failure. On these days, lower the bar: a 'minimum viable day' is eating one meal, drinking water, and doing one small task. That's enough." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "On a 'minimum viable day,' what counts as success?", choicesJson: JSON.stringify(["Running 5 miles and meal prepping", "Eating one meal, drinking water, and doing one small task", "Solving all your problems", "Feeling amazing all day"]), answerJson: JSON.stringify("Eating one meal, drinking water, and doing one small task"), explain: "On hard days, surviving IS succeeding. Low bars are still bars. You stayed safe, and that matters." },
    { type: "INFO", order: 3, prompt: "Mission: Minimum Viable Day Plan", body: "Write your personal 'minimum viable day' — the bare minimum that counts as a win when everything feels hard. Keep it on your phone for when you need it." },
  ]);

  // --- Unit 9.4: Maintenance and Growth ---
  const unit9_4 = await upsertModule({ pathId: journey9.id, title: "Maintenance & Growth", slug: "maintenance-growth", order: 4 });

  const l9_4_1 = await upsertLesson({ moduleId: unit9_4.id, title: "Routine That Protects You", slug: "protective-routine", order: 1, xpReward: 2 });
  await seedCards(l9_4_1.id, [
    { type: "INFO", order: 1, prompt: "Your Routine Is Your Armor", body: "A daily routine that includes recovery activities (meetings, check-ins, exercise, reflection) protects you automatically. When your routine includes healthy habits, you don't have to rely on willpower alone — structure does the heavy lifting." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why is routine important for long-term recovery?", choicesJson: JSON.stringify(["It makes life boring enough to not want drugs", "It builds automatic habits that protect you without requiring constant willpower", "It's not actually important", "Only morning routines matter"]), answerJson: JSON.stringify("It builds automatic habits that protect you without requiring constant willpower"), explain: "Willpower runs out. Routines are automatic. Building recovery into your daily routine means protection runs on autopilot." },
  ]);

  const l9_4_2 = await upsertLesson({ moduleId: unit9_4.id, title: "Meaning and Purpose", slug: "meaning-purpose", order: 2, xpReward: 2 });
  await seedCards(l9_4_2.id, [
    { type: "INFO", order: 1, prompt: "Recovery Needs a Destination", body: "Staying sober 'just to not use' gets exhausting. Recovery thrives when you're moving TOWARD something: a job you care about, relationships you value, a skill you're building, or a community you're part of. Purpose is the fuel for long-term recovery." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What gives long-term recovery the strongest foundation?", choicesJson: JSON.stringify(["Fear of consequences", "Having a sense of purpose and things you're working toward", "Avoiding all emotions", "Being punished if you relapse"]), answerJson: JSON.stringify("Having a sense of purpose and things you're working toward"), explain: "Fear fades. Purpose grows. The people who stay in recovery longest are the ones who found something worth being sober for." },
  ]);

  const l9_4_3 = await upsertLesson({ moduleId: unit9_4.id, title: "Repairing Relationships", slug: "repairing-relationships", order: 3, xpReward: 2 });
  await seedCards(l9_4_3.id, [
    { type: "INFO", order: 1, prompt: "Actions Over Apologies", body: "Words matter, but consistent behavior matters more. Trust is rebuilt one kept promise at a time. Don't rush it — some relationships heal slowly, some may not heal at all. Focus on what you can control: showing up, being honest, and being consistent." },
    { type: "TRUE_FALSE", order: 2, prompt: "Saying sorry once is enough to repair a damaged relationship.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Apologies start the process, but trust is rebuilt through consistent, reliable behavior over time. Show them, don't just tell them." },
  ]);

  const l9_4_4 = await upsertLesson({ moduleId: unit9_4.id, title: "Handling Success Without Sabotage", slug: "success-without-sabotage", order: 4, xpReward: 2 });
  await seedCards(l9_4_4.id, [
    { type: "INFO", order: 1, prompt: "Success Can Be a Trigger Too", body: "When things go well, your brain might say 'You can handle it now' or 'You deserve a reward.' This is one of the sneakiest triggers. Celebrate wins with safe rewards. Stay connected to your support system especially when things are going well." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You got a promotion and feel great. What's the safest way to celebrate?", choicesJson: JSON.stringify(["Go out drinking to celebrate", "Treat yourself to a nice meal, share the news with your support person, and note this win in your recovery journal", "You don't deserve to celebrate", "Stop going to meetings since you're clearly doing fine"]), answerJson: JSON.stringify("Treat yourself to a nice meal, share the news with your support person, and note this win in your recovery journal"), explain: "Celebrate! But celebrate safely. Safe rewards reinforce recovery. Staying connected prevents the 'I'm cured' trap." },
  ]);

  const l9_4_5 = await upsertLesson({ moduleId: unit9_4.id, title: "Recovery Identity", slug: "recovery-identity", order: 5, xpReward: 2 });
  await seedCards(l9_4_5.id, [
    { type: "INFO", order: 1, prompt: "You Are More Than Your Past", body: "Recovery isn't just about what you're leaving behind — it's about who you're becoming. Your identity expands: you're a person in recovery AND a worker, a parent, a friend, a learner, a creator. The substance doesn't define you. Your choices now do." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What makes a strong 'recovery identity'?", choicesJson: JSON.stringify(["Defining yourself only by your addiction", "Building an identity around your values, roles, and goals — not just sobriety", "Pretending addiction never happened", "Only socializing with other people in recovery"]), answerJson: JSON.stringify("Building an identity around your values, roles, and goals — not just sobriety"), explain: "Recovery is the foundation, but your identity should be built on who you ARE, not just what you're recovering FROM." },
    { type: "INFO", order: 3, prompt: "Mission: 90-Day Plan and Support Map", body: "Create your 90-day plan: 3 goals you're working toward, 3 support people, 3 warning signs to watch for, and 3 things that bring you joy. This is your recovery roadmap for the next quarter." },
  ]);

  // =====================================================
  // JOURNEY 10: Substance-Specific Safety
  // =====================================================
  const journey10 = await upsertPath({
    title: "Substance-Specific Safety",
    slug: "substance-specific-safety",
    description: "Targeted safety skills for alcohol, opioids, and stimulants. Personalized risk reduction and recovery strategies.",
    icon: "⚠️",
    order: 10,
  });

  // --- Track A: Alcohol Skills ---
  const unit10_1 = await upsertModule({ pathId: journey10.id, title: "Alcohol Safety & Recovery", slug: "alcohol-safety", order: 1 });

  const l10_1_1 = await upsertLesson({ moduleId: unit10_1.id, title: "Alcohol and Your Body", slug: "alcohol-body", order: 1, xpReward: 2 });
  await seedCards(l10_1_1.id, [
    { type: "INFO", order: 1, prompt: "What Alcohol Does", body: "Alcohol is a depressant that slows your brain and body. Tolerance builds gradually — needing more to feel the same effect. Severe withdrawal from heavy use can be medically dangerous and requires professional support. Never quit heavy drinking cold turkey without medical advice." },
    { type: "TRUE_FALSE", order: 2, prompt: "It's always safe to quit heavy drinking suddenly on your own.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Alcohol withdrawal can be medically serious, even life-threatening. If you drink heavily, talk to a medical provider before stopping abruptly." },
  ]);

  const l10_1_2 = await upsertLesson({ moduleId: unit10_1.id, title: "Drinking Triggers and Replacements", slug: "drinking-triggers", order: 2, xpReward: 2 });
  await seedCards(l10_1_2.id, [
    { type: "INFO", order: 1, prompt: "Know Your Drinking Patterns", body: "Common triggers: stress, social situations, boredom, specific times of day, certain people. For each trigger, identify a replacement: sparkling water at happy hour, a walk after a stressful day, a phone call when bored. Replacements rewire the habit loop." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your coworkers always go to the bar on Fridays. What's a good replacement routine?", choicesJson: JSON.stringify(["Go to the bar but don't drink (very risky early on)", "Suggest a different activity or go to the gym instead", "Just stay home and isolate", "Drink before you go so you won't want to at the bar"]), answerJson: JSON.stringify("Suggest a different activity or go to the gym instead"), explain: "Replacement routines fill the same time slot with a safer activity. Over time, the new routine becomes the default." },
  ]);

  const l10_1_3 = await upsertLesson({ moduleId: unit10_1.id, title: "Social Pressure and Scripts", slug: "alcohol-social-pressure", order: 3, xpReward: 2 });
  await seedCards(l10_1_3.id, [
    { type: "INFO", order: 1, prompt: "People Will Ask Why You're Not Drinking", body: "Be prepared. Scripts: 'I'm driving tonight,' 'I'm on medication,' 'I'm doing a health challenge,' or simply 'No thanks.' You don't owe anyone an explanation. Most people accept a confident 'no' and move on." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone keeps pushing you to 'just have one.' What's the best response?", choicesJson: JSON.stringify(["Give in so they stop asking", "Repeat 'No thanks, I'm good' and change the subject or leave", "Get angry at them", "Explain your entire recovery story"]), answerJson: JSON.stringify("Repeat 'No thanks, I'm good' and change the subject or leave"), explain: "Broken record technique: keep it short, keep it confident, repeat if needed. You don't need their permission to protect yourself." },
  ]);

  const l10_1_4 = await upsertLesson({ moduleId: unit10_1.id, title: "Sleep, Anxiety, and the Alcohol Cycle", slug: "alcohol-sleep-anxiety", order: 4, xpReward: 2 });
  await seedCards(l10_1_4.id, [
    { type: "INFO", order: 1, prompt: "The Cycle: Anxiety → Drink → Bad Sleep → More Anxiety", body: "Alcohol might help you fall asleep, but it destroys sleep quality. Poor sleep increases anxiety. More anxiety drives more drinking. Breaking this cycle starts with addressing the sleep and anxiety directly — not through the bottle." },
    { type: "TRUE_FALSE", order: 2, prompt: "Alcohol helps you get better quality sleep.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Alcohol disrupts REM sleep, the restorative phase your brain needs. You might pass out, but you don't rest. Better sleep strategies beat a nightcap every time." },
  ]);

  const l10_1_5 = await upsertLesson({ moduleId: unit10_1.id, title: "Alcohol Relapse Prevention", slug: "alcohol-relapse-prevention", order: 5, xpReward: 2 });
  await seedCards(l10_1_5.id, [
    { type: "INFO", order: 1, prompt: "Your Long-Term Alcohol Plan", body: "Build your plan: know your triggers, have refusal scripts ready, keep a sober support person on speed dial, remove alcohol from your home, find alcohol-free social activities, and attend regular support meetings. Consistency beats intensity." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is the most important long-term strategy for alcohol recovery?", choicesJson: JSON.stringify(["Willpower alone", "Consistent routines, support connections, and trigger management", "Avoiding all social situations forever", "Switching to a 'safer' substance"]), answerJson: JSON.stringify("Consistent routines, support connections, and trigger management"), explain: "Long-term recovery is built on systems, not willpower. Routines, support, and awareness work together to keep you safe." },
  ]);

  // --- Track B: Opioid Safety ---
  const unit10_2 = await upsertModule({ pathId: journey10.id, title: "Opioid Safety & Recovery", slug: "opioid-safety", order: 2 });

  const l10_2_1 = await upsertLesson({ moduleId: unit10_2.id, title: "Opioid Overdose Risk", slug: "opioid-overdose-risk", order: 1, xpReward: 2 });
  await seedCards(l10_2_1.id, [
    { type: "INFO", order: 1, prompt: "Opioid Overdose Is Preventable", body: "The CDC emphasizes that naloxone is a lifesaving medicine that reverses opioid overdose. Key risks: using alone, mixing with other depressants, returning to use after a tolerance break, and unknown potency. Carry naloxone. Tell someone. Have a plan." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "After leaving jail or treatment, your old opioid dose is:", choicesJson: JSON.stringify(["Still safe because your body remembers", "Potentially fatal because your tolerance has dropped", "Actually lower than what you need", "The same as before"]), answerJson: JSON.stringify("Potentially fatal because your tolerance has dropped"), explain: "Tolerance drops quickly. Your old dose after a break can be a lethal dose. Always start much lower." },
  ]);

  const l10_2_2 = await upsertLesson({ moduleId: unit10_2.id, title: "Treatment Options Including MOUD", slug: "moud-treatment", order: 2, xpReward: 2 });
  await seedCards(l10_2_2.id, [
    { type: "INFO", order: 1, prompt: "Medications That Help", body: "Medications for Opioid Use Disorder (MOUD) include buprenorphine (Suboxone), methadone, and naltrexone (Vivitrol). The CDC supports expanding access to these treatments. They reduce cravings, prevent withdrawal, and cut overdose risk significantly. Ask your provider about them." },
    { type: "TRUE_FALSE", order: 2, prompt: "Taking medication for opioid use disorder means you're 'not really sober.'", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "MOUD is evidence-based medicine, not 'trading one addiction for another.' People on medication live longer, healthier lives. That's the definition of working." },
  ]);

  const l10_2_3 = await upsertLesson({ moduleId: unit10_2.id, title: "Cravings, Pain, and Alternatives", slug: "opioid-cravings-pain", order: 3, xpReward: 2 });
  await seedCards(l10_2_3.id, [
    { type: "INFO", order: 1, prompt: "Pain Management Without Opioids", body: "Chronic pain and opioid recovery are complicated. Talk to your provider about non-opioid pain options: physical therapy, NSAIDs, nerve blocks, mindfulness, and exercise. Managing pain is important — doing it safely is the goal." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You're in opioid recovery and have chronic back pain. What's the best approach?", choicesJson: JSON.stringify(["Take opioid painkillers and hope you can control it", "Work with your doctor on a non-opioid pain management plan", "Just suffer through the pain", "Ask a friend for their leftover pills"]), answerJson: JSON.stringify("Work with your doctor on a non-opioid pain management plan"), explain: "Your doctor needs to know you're in recovery. Together, you can find pain solutions that don't risk relapse." },
  ]);

  const l10_2_4 = await upsertLesson({ moduleId: unit10_2.id, title: "Recovery Supports and Re-Entry", slug: "opioid-recovery-supports", order: 4, xpReward: 2 });
  await seedCards(l10_2_4.id, [
    { type: "INFO", order: 1, prompt: "Planning for Transitions", body: "Leaving treatment, getting out of jail, moving to a new city — transitions are high-risk moments. Plan ahead: where will you live, who will support you, how will you continue treatment, and what's your plan for the first 72 hours? Those first days matter most." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You're leaving a treatment program tomorrow. What's the most important thing to have in place?", choicesJson: JSON.stringify(["A going-away party", "A plan for safe housing, continued support, and how to handle cravings in the first week", "A new phone", "Nothing — you'll figure it out"]), answerJson: JSON.stringify("A plan for safe housing, continued support, and how to handle cravings in the first week"), explain: "The transition from treatment to the real world is the highest risk period. Planning ahead dramatically improves outcomes." },
  ]);

  const l10_2_5 = await upsertLesson({ moduleId: unit10_2.id, title: "Long-Term Opioid Recovery", slug: "long-term-opioid-recovery", order: 5, xpReward: 2 });
  await seedCards(l10_2_5.id, [
    { type: "INFO", order: 1, prompt: "Recovery Is a Long Game", body: "Long-term opioid recovery includes ongoing support (meetings, counseling), medication management if on MOUD, regular health check-ups, and building a life worth staying sober for. It gets easier, but it never stops being important." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "After a year of successful opioid recovery, should you stop all support?", choicesJson: JSON.stringify(["Yes — a year is enough", "No — continued support (even reduced) helps maintain long-term recovery", "Support is only for the first month", "Only if you feel like it"]), answerJson: JSON.stringify("No — continued support (even reduced) helps maintain long-term recovery"), explain: "Recovery is maintenance, not a finish line. Continued support — even monthly check-ins — keeps your foundation strong." },
  ]);

  // --- Track C: Stimulant Safety ---
  const unit10_3 = await upsertModule({ pathId: journey10.id, title: "Stimulant Safety & Recovery", slug: "stimulant-safety", order: 3 });

  const l10_3_1 = await upsertLesson({ moduleId: unit10_3.id, title: "The Sleep Deprivation Spiral", slug: "sleep-deprivation-spiral", order: 1, xpReward: 2 });
  await seedCards(l10_3_1.id, [
    { type: "INFO", order: 1, prompt: "No Sleep, More Problems", body: "Stimulants keep you awake, and sleep deprivation causes paranoia, anxiety, poor decisions, and physical breakdown. The cycle feeds itself: use → no sleep → feel terrible → use more to function. Breaking the cycle starts with prioritizing sleep above everything else." },
    { type: "TRUE_FALSE", order: 2, prompt: "Sleep deprivation from stimulant use can cause paranoia and hallucinations.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Extended sleep deprivation — especially combined with stimulant use — can cause serious mental health symptoms. Sleep is not optional for your brain." },
  ]);

  const l10_3_2 = await upsertLesson({ moduleId: unit10_3.id, title: "Crash Days Recovery", slug: "crash-days", order: 2, xpReward: 2 });
  await seedCards(l10_3_2.id, [
    { type: "INFO", order: 1, prompt: "The Crash Is Your Body Demanding Rest", body: "After stimulant use, the 'crash' (extreme fatigue, depression, hunger) is your body trying to recover. Don't fight it — support it: sleep as much as you need, eat nutritious food, drink water, and avoid making big decisions until you've rested." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "During a stimulant crash, what's the priority?", choicesJson: JSON.stringify(["Using more to feel normal again", "Sleep, food, water, and rest without judgment", "Exercise intensely", "Going to work immediately"]), answerJson: JSON.stringify("Sleep, food, water, and rest without judgment"), explain: "Your body is recovering. Give it what it needs: rest, nutrition, and hydration. Everything else can wait." },
  ]);

  const l10_3_3 = await upsertLesson({ moduleId: unit10_3.id, title: "Triggers and High-Risk Hours", slug: "stimulant-triggers", order: 3, xpReward: 2 });
  await seedCards(l10_3_3.id, [
    { type: "INFO", order: 1, prompt: "Stimulant Use Often Has a Schedule", body: "Many people have specific 'high-risk hours' — late nights, weekends, payday, or after stressful events. Knowing when you're most vulnerable lets you plan protection: activities, support check-ins, or simply not being alone during those hours." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your highest-risk time is Friday nights after 10pm. What's the best strategy?", choicesJson: JSON.stringify(["Hope you won't feel triggered", "Pre-plan a safe activity or be with a safe person during those hours", "Stay up all night scrolling your phone", "Go to the places where you usually use"]), answerJson: JSON.stringify("Pre-plan a safe activity or be with a safe person during those hours"), explain: "Fill the high-risk window with safety. A planned Friday night is a protected Friday night." },
  ]);

  const l10_3_4 = await upsertLesson({ moduleId: unit10_3.id, title: "Rebuilding Energy and Confidence", slug: "rebuilding-energy", order: 4, xpReward: 2 });
  await seedCards(l10_3_4.id, [
    { type: "INFO", order: 1, prompt: "Natural Energy Takes Time to Rebuild", body: "Stimulants hijack your brain's energy system. After stopping, you may feel flat, tired, and unmotivated for weeks. This is normal. Your brain is healing. Small amounts of exercise, sunlight, regular meals, and patience will gradually restore your natural energy." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Two weeks after quitting stimulants, you have zero motivation. What does this mean?", choicesJson: JSON.stringify(["Recovery isn't working", "Your brain is healing and natural motivation will return gradually", "You should go back to using", "You'll feel like this forever"]), answerJson: JSON.stringify("Your brain is healing and natural motivation will return gradually"), explain: "Low motivation after stimulant use is temporary. Your brain's reward system is resetting. It takes time, but it DOES come back." },
  ]);

  const l10_3_5 = await upsertLesson({ moduleId: unit10_3.id, title: "Stimulant Relapse Prevention", slug: "stimulant-relapse-prevention", order: 5, xpReward: 2 });
  await seedCards(l10_3_5.id, [
    { type: "INFO", order: 1, prompt: "Stimulant Recovery Needs Structure", body: "Stimulant relapse often starts with boredom, nostalgia for the 'high energy' feeling, or social pressure. Prevention: fill your schedule, develop natural energy sources (exercise, sleep routine), maintain support connections, and have a plan for your high-risk hours." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the biggest relapse risk for stimulant recovery?", choicesJson: JSON.stringify(["Too much structure", "Boredom and unstructured time, especially during former high-risk hours", "Eating too healthy", "Sleeping too much"]), answerJson: JSON.stringify("Boredom and unstructured time, especially during former high-risk hours"), explain: "Stimulant cravings love boredom. Fill your time with purpose and your high-risk hours with safety plans." },
  ]);

  // =====================================================
  // JOURNEY 11: Supporter & Family Skills
  // =====================================================
  const journey11 = await upsertPath({
    title: "Supporter & Family Skills",
    slug: "supporter-family-skills",
    description: "Help a loved one effectively without enabling. Protect your own wellbeing while supporting their recovery.",
    icon: "💛",
    order: 11,
  });

  // --- Unit 11.1: Understanding and Compassion ---
  const unit11_1 = await upsertModule({ pathId: journey11.id, title: "Understanding & Compassion", slug: "understanding-compassion", order: 1 });

  const l11_1_1 = await upsertLesson({ moduleId: unit11_1.id, title: "Addiction Basics for Supporters", slug: "addiction-basics-supporters", order: 1, xpReward: 2 });
  await seedCards(l11_1_1.id, [
    { type: "INFO", order: 1, prompt: "Understanding Changes Everything", body: "Addiction is a brain condition, not a choice or moral failure. Your loved one isn't choosing to hurt you — they're trapped in a cycle their brain is driving. Understanding this doesn't excuse harmful behavior, but it changes how you respond to it." },
    { type: "TRUE_FALSE", order: 2, prompt: "Addiction is simply a matter of willpower.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Addiction changes brain chemistry. Willpower alone is rarely enough. That's why treatment, support, and coping skills matter so much." },
  ]);

  const l11_1_2 = await upsertLesson({ moduleId: unit11_1.id, title: "What Helps vs What Harms", slug: "helps-vs-harms", order: 2, xpReward: 2 });
  await seedCards(l11_1_2.id, [
    { type: "INFO", order: 1, prompt: "Good Intentions Can Go Wrong", body: "Helping means supporting their recovery. Enabling means removing consequences that might motivate change. Paying their bills, making excuses, or ignoring the problem can feel like love but often keeps the cycle going." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your loved one spent their rent money on substances and asks you to cover it. What's the most helpful response?", choicesJson: JSON.stringify(["Pay it immediately — you can't let them be homeless", "Express care, offer to help them find resources, but don't cover it without accountability", "Lecture them for an hour", "Never speak to them again"]), answerJson: JSON.stringify("Express care, offer to help them find resources, but don't cover it without accountability"), explain: "Love with accountability. Help them find solutions without removing the natural consequences that can motivate change." },
  ]);

  const l11_1_3 = await upsertLesson({ moduleId: unit11_1.id, title: "Shame vs Accountability", slug: "shame-vs-accountability", order: 3, xpReward: 2 });
  await seedCards(l11_1_3.id, [
    { type: "INFO", order: 1, prompt: "Shame Drives People Away From Help", body: "Shaming someone ('You're a disgrace') pushes them deeper into the cycle. Accountability ('I love you AND this behavior isn't acceptable') keeps the door open while being honest. The goal is honesty without cruelty." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which statement shows accountability without shame?", choicesJson: JSON.stringify(["You're a terrible person and I'm done with you", "I love you, and I'm worried about what's happening. I can't pretend it's okay.", "Whatever you want to do is fine with me", "If you really loved me, you'd stop"]), answerJson: JSON.stringify("I love you, and I'm worried about what's happening. I can't pretend it's okay."), explain: "Honest, caring, and direct. This keeps the relationship open while being truthful about what you see." },
  ]);

  const l11_1_4 = await upsertLesson({ moduleId: unit11_1.id, title: "Talking Without Escalation", slug: "talking-without-escalation", order: 4, xpReward: 2 });
  await seedCards(l11_1_4.id, [
    { type: "INFO", order: 1, prompt: "Timing and Tone Matter", body: "Don't try to have a serious conversation when either of you is angry, intoxicated, or in crisis. Choose a calm moment. Use 'I' statements: 'I'm scared when...' instead of 'You always...' Keep it short. One topic at a time." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "When is the best time to talk to your loved one about their substance use?", choicesJson: JSON.stringify(["Right after they've been using", "During a calm, private moment when you're both sober", "In front of other people to embarrass them into changing", "Over text while you're angry"]), answerJson: JSON.stringify("During a calm, private moment when you're both sober"), explain: "Calm moments produce the best conversations. Private settings feel safer. Both being sober means both can think clearly." },
  ]);

  const l11_1_5 = await upsertLesson({ moduleId: unit11_1.id, title: "Safety Planning for Supporters", slug: "supporter-safety", order: 5, xpReward: 2 });
  await seedCards(l11_1_5.id, [
    { type: "INFO", order: 1, prompt: "Your Safety Comes First", body: "If your loved one's behavior puts you or others in danger, your safety is the priority. Have a plan: a safe place to go, someone to call, and clear lines you won't allow to be crossed. Love doesn't require you to be unsafe." },
    { type: "TRUE_FALSE", order: 2, prompt: "Supporting someone with addiction means accepting unsafe behavior.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "You can love someone AND refuse to be put in danger. Safety boundaries are not abandonment — they're survival." },
  ]);

  // --- Unit 11.2: Boundaries and Communication ---
  const unit11_2 = await upsertModule({ pathId: journey11.id, title: "Boundaries & Communication", slug: "supporter-boundaries", order: 2 });

  const l11_2_1 = await upsertLesson({ moduleId: unit11_2.id, title: "Boundary Scripts for Supporters", slug: "supporter-boundary-scripts", order: 1, xpReward: 2 });
  await seedCards(l11_2_1.id, [
    { type: "INFO", order: 1, prompt: "Boundaries Are Acts of Love", body: "Scripts: 'I love you, but I won't give you money for that.' 'I'm here when you're ready for help, but I can't watch you destroy yourself.' 'I need to take care of myself too.' Boundaries protect both of you." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your loved one says 'If you really loved me, you'd help me.' What's a good boundary response?", choicesJson: JSON.stringify(["You're right, I'll do whatever you want", "I love you enough to say no to this. I'll help you find treatment, but I won't support the addiction.", "Fine, I don't love you then", "Don't talk to me about love"]), answerJson: JSON.stringify("I love you enough to say no to this. I'll help you find treatment, but I won't support the addiction."), explain: "Love and limits can coexist. Offering real help while refusing to enable is one of the hardest and most loving things you can do." },
  ]);

  const l11_2_2 = await upsertLesson({ moduleId: unit11_2.id, title: "Money and Housing Boundaries", slug: "money-housing-boundaries", order: 2, xpReward: 2 });
  await seedCards(l11_2_2.id, [
    { type: "INFO", order: 1, prompt: "Money Is the Most Common Enabling Tool", body: "Giving money to someone in active addiction almost always funds the addiction, even if that's not the intent. Alternatives: pay their bills directly, buy groceries, offer transportation — give support in forms that can't be converted to substances." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your loved one needs groceries. What's the safest way to help?", choicesJson: JSON.stringify(["Give them cash", "Buy groceries and deliver them directly", "Ignore the request entirely", "Give them your credit card"]), answerJson: JSON.stringify("Buy groceries and deliver them directly"), explain: "Direct support (buying the groceries yourself) ensures your help goes where it's intended. It's practical love with protection." },
  ]);

  const l11_2_3 = await upsertLesson({ moduleId: unit11_2.id, title: "Kids and Family Safety", slug: "kids-family-safety", order: 3, xpReward: 2 });
  await seedCards(l11_2_3.id, [
    { type: "INFO", order: 1, prompt: "Children's Safety Is Non-Negotiable", body: "Children should never be in unsafe situations due to a family member's substance use. If children are at risk, their safety comes first — every time. Age-appropriate honesty helps kids understand without taking on adult responsibilities." },
    { type: "TRUE_FALSE", order: 2, prompt: "It's better to hide a family member's addiction from children entirely.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Children usually know something is wrong. Age-appropriate honesty reduces their confusion and self-blame. Hiding it completely can cause more harm." },
  ]);

  const l11_2_4 = await upsertLesson({ moduleId: unit11_2.id, title: "Crisis Calls as a Supporter", slug: "supporter-crisis-calls", order: 4, xpReward: 2 });
  await seedCards(l11_2_4.id, [
    { type: "INFO", order: 1, prompt: "When to Call for Help", body: "Call 911 if someone is: unconscious, not breathing, having a seizure, or threatening harm to themselves or others. Call 988 for mental health crises. You are not 'betraying' them by calling for help — you might be saving their life." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your loved one is unconscious and you suspect an overdose. What should you do?", choicesJson: JSON.stringify(["Wait to see if they wake up", "Call 911 immediately, give naloxone if available, and put them in recovery position", "Try home remedies first", "Call a friend for advice before calling 911"]), answerJson: JSON.stringify("Call 911 immediately, give naloxone if available, and put them in recovery position"), explain: "Every second matters in an overdose. Call 911 first. You can't 'overdose' on calling for help." },
  ]);

  const l11_2_5 = await upsertLesson({ moduleId: unit11_2.id, title: "After a Setback (For Supporters)", slug: "supporter-after-setback", order: 5, xpReward: 2 });
  await seedCards(l11_2_5.id, [
    { type: "INFO", order: 1, prompt: "Setbacks Are Part of the Process", body: "When your loved one relapses, it's devastating. But relapse is common in recovery and doesn't mean failure. Your role: express care, maintain your boundaries, and encourage them to get back to their recovery plan. Don't enable, but don't abandon." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your loved one just relapsed after 60 days of sobriety. What's the most helpful response?", choicesJson: JSON.stringify(["Tell them you're done and walk away forever", "Express your care, remind them of their progress, and encourage them to reconnect with their recovery plan", "Pretend it didn't happen", "Punish them"]), answerJson: JSON.stringify("Express your care, remind them of their progress, and encourage them to reconnect with their recovery plan"), explain: "60 days of sobriety isn't erased by a relapse. Encourage them to learn from it and get back on track. Your support can be the bridge back." },
  ]);

  // --- Unit 11.3: Helping Them Get Help ---
  const unit11_3 = await upsertModule({ pathId: journey11.id, title: "Helping Them Get Help", slug: "helping-get-help", order: 3 });

  const l11_3_1 = await upsertLesson({ moduleId: unit11_3.id, title: "Treatment Options for Supporters", slug: "treatment-options-supporters", order: 1, xpReward: 2 });
  await seedCards(l11_3_1.id, [
    { type: "INFO", order: 1, prompt: "Know What's Available", body: "Research options before they're needed: detox programs, outpatient and residential treatment, medication-assisted treatment, and support groups. SAMHSA's helpline (1-800-662-4357) can help you find local options. Being prepared means you can act quickly when the window opens." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "When should you research treatment options for your loved one?", choicesJson: JSON.stringify(["Only after they ask for help", "Before they ask — be ready for when the window opens", "Never — it's not your job", "After they've already been through treatment once"]), answerJson: JSON.stringify("Before they ask — be ready for when the window opens"), explain: "The window of willingness can open and close fast. Having options ready means you can act immediately when they say 'I'm ready.'" },
  ]);

  const l11_3_2 = await upsertLesson({ moduleId: unit11_3.id, title: "Appointment Prep for Supporters", slug: "appointment-prep-supporters", order: 2, xpReward: 2 });
  await seedCards(l11_3_2.id, [
    { type: "INFO", order: 1, prompt: "Help With the Logistics", body: "Offer concrete help: 'I'll drive you to the appointment,' 'I'll help you gather your documents,' 'I'll sit in the waiting room if you want company.' Practical support removes barriers that keep people from getting help." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the most helpful way to support someone going to their first treatment appointment?", choicesJson: JSON.stringify(["Tell them what to say", "Offer a ride, help with paperwork, and let them lead the conversation with the provider", "Go in and speak for them", "Drop them off and leave immediately"]), answerJson: JSON.stringify("Offer a ride, help with paperwork, and let them lead the conversation with the provider"), explain: "Support their autonomy while removing barriers. They need to own their recovery, but they don't have to navigate logistics alone." },
  ]);

  const l11_3_3 = await upsertLesson({ moduleId: unit11_3.id, title: "Follow-Up and Encouragement", slug: "followup-encouragement", order: 3, xpReward: 2 });
  await seedCards(l11_3_3.id, [
    { type: "INFO", order: 1, prompt: "Check In Without Checking Up", body: "There's a difference between supportive check-ins ('How are you feeling today?') and surveillance ('Are you using again?'). Trust-building check-ins show you care without making them feel monitored. Celebrate small wins and be patient with the process." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which check-in approach builds trust?", choicesJson: JSON.stringify(["Searching their room every day", "Asking 'How are you doing today? Anything you need?' genuinely", "Testing them constantly", "Ignoring them completely"]), answerJson: JSON.stringify("Asking 'How are you doing today? Anything you need?' genuinely"), explain: "Genuine interest without suspicion builds the trust that recovery needs. They'll be more honest with someone who isn't treating them like a suspect." },
  ]);

  const l11_3_4 = await upsertLesson({ moduleId: unit11_3.id, title: "Support Groups for Families", slug: "family-support-groups", order: 4, xpReward: 2 });
  await seedCards(l11_3_4.id, [
    { type: "INFO", order: 1, prompt: "You Need Support Too", body: "Al-Anon, Nar-Anon, SMART Recovery Family & Friends, and other support groups exist for people like you. They're filled with people who understand exactly what you're going through. You don't have to do this alone." },
    { type: "TRUE_FALSE", order: 2, prompt: "Support groups for families are only useful if your loved one is in recovery.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Family support groups help YOU regardless of where your loved one is in their journey. Your wellbeing matters independent of their choices." },
  ]);

  // --- Unit 11.4: Supporter Self-Care ---
  const unit11_4 = await upsertModule({ pathId: journey11.id, title: "Supporter Self-Care", slug: "supporter-self-care", order: 4 });

  const l11_4_1 = await upsertLesson({ moduleId: unit11_4.id, title: "Burnout Prevention", slug: "supporter-burnout", order: 1, xpReward: 2 });
  await seedCards(l11_4_1.id, [
    { type: "INFO", order: 1, prompt: "You Can't Pour From an Empty Cup", body: "Supporting someone with addiction is exhausting. Burnout shows up as: resentment, hopelessness, physical symptoms, isolation, and emotional numbness. You deserve rest, fun, and your own life. Taking care of yourself isn't selfish — it's essential." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is a sign of supporter burnout?", choicesJson: JSON.stringify(["Feeling energized and hopeful", "Constant resentment, exhaustion, and feeling like nothing you do matters", "Having healthy boundaries", "Taking time for yourself"]), answerJson: JSON.stringify("Constant resentment, exhaustion, and feeling like nothing you do matters"), explain: "Burnout is real and damaging. If you recognize these signs, it's time to prioritize your own care and seek support." },
  ]);

  const l11_4_2 = await upsertLesson({ moduleId: unit11_2.id, title: "Guilt and Grief for Supporters", slug: "supporter-guilt-grief", order: 6, xpReward: 2 });
  await seedCards(l11_4_2.id, [
    { type: "INFO", order: 1, prompt: "You Didn't Cause This", body: "Supporter guilt is real: 'Did I cause this? Could I have prevented it? Am I doing enough?' The answer: You didn't cause it, you can't control it, and you can't cure it. What you CAN do is support recovery, set boundaries, and take care of yourself." },
    { type: "TRUE_FALSE", order: 2, prompt: "A family member's addiction is usually caused by something the supporter did wrong.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Addiction is caused by a complex mix of genetics, environment, trauma, and brain chemistry. It's not your fault." },
  ]);

  const l11_4_3 = await upsertLesson({ moduleId: unit11_4.id, title: "Building Your Own Support Team", slug: "own-support-team", order: 2, xpReward: 2 });
  await seedCards(l11_4_3.id, [
    { type: "INFO", order: 1, prompt: "Supporters Need Support", body: "You need people who understand what you're going through: a trusted friend, a therapist, a support group, or a family counselor. Don't carry this alone. Your wellbeing directly affects your ability to help your loved one." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the best support system for someone supporting a loved one with addiction?", choicesJson: JSON.stringify(["Handle everything alone", "A combination of friends, support group, and potentially a therapist", "Only talk to the person with addiction about it", "Social media support groups only"]), answerJson: JSON.stringify("A combination of friends, support group, and potentially a therapist"), explain: "Multiple support sources prevent any one person from being overwhelmed. Spread the weight so no one breaks." },
  ]);

  const l11_4_4 = await upsertLesson({ moduleId: unit11_4.id, title: "Your Long-Term Plan", slug: "supporter-long-term", order: 3, xpReward: 2 });
  await seedCards(l11_4_4.id, [
    { type: "INFO", order: 1, prompt: "This Is a Marathon, Not a Sprint", body: "Supporting someone in recovery is long-term. You need sustainable practices: regular self-care, maintained boundaries, ongoing support for yourself, and the understanding that you can love someone without losing yourself in their struggle." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What makes support sustainable over the long term?", choicesJson: JSON.stringify(["Giving everything you have until you're empty", "Maintaining boundaries, self-care, and your own support network", "Ignoring the problem and hoping it goes away", "Controlling every aspect of their recovery"]), answerJson: JSON.stringify("Maintaining boundaries, self-care, and your own support network"), explain: "Sustainable support means taking care of yourself SO THAT you can continue to be there. Balance is everything." },
    { type: "INFO", order: 3, prompt: "Mission: Write 2 Boundaries and 1 Supportive Offer", body: "Write down 2 boundaries you need to maintain and 1 supportive thing you can offer. Example: 'I won't give cash' and 'I won't cover for you at work' + 'I will drive you to your next appointment.' This is love + limits." },
  ]);

  console.log("✅ All 6 Recovery Journeys seeded successfully!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
