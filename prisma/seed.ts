import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertPath(data: { title: string; slug: string; description: string; icon: string; order: number; color?: string; estimatedHours?: number; targetAudience?: string; difficulty?: string }) {
  const newFields = {
    color: data.color || "#3b9eff",
    estimatedHours: data.estimatedHours || 0,
    targetAudience: data.targetAudience || "All learners",
    difficulty: data.difficulty || "foundational",
  };
  return prisma.path.upsert({
    where: { slug: data.slug },
    update: newFields,
    create: { ...data, ...newFields },
  });
}

async function upsertModule(data: { pathId: string; title: string; slug: string; order: number; description?: string; color?: string }) {
  const newFields = {
    description: data.description || "",
    color: data.color || "",
  };
  return prisma.module.upsert({
    where: { pathId_slug: { pathId: data.pathId, slug: data.slug } },
    update: newFields,
    create: { ...data, ...newFields },
  });
}

async function upsertLesson(data: { moduleId: string; title: string; slug: string; order: number; xpReward: number; type?: string; lessonType?: string; estimatedMinutes?: number; learningObjectives?: string; difficulty?: string }) {
  const lessonType = data.lessonType || "learn";
  const estimatedMinutes = data.estimatedMinutes || 5;
  const newFields = {
    type: data.type || "learn",
    lessonType,
    estimatedMinutes,
    learningObjectives: data.learningObjectives || "[]",
    difficulty: data.difficulty || "foundational",
  };
  return prisma.lesson.upsert({
    where: { moduleId_slug: { moduleId: data.moduleId, slug: data.slug } },
    update: { ...newFields, xpReward: data.xpReward },
    create: { ...data, ...newFields },
  });
}

async function reconcileLessonMetadata() {
  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      lessonType: true,
      estimatedMinutes: true,
      _count: { select: { cards: true } },
    },
  });
  for (const lesson of lessons) {
    const lessonType = lesson.lessonType || "learn";
    // Only auto-calculate estimatedMinutes for "learn" lessons;
    // checkpoint (15 min) and capstone (15 min) preserve their explicit values.
    const estimatedMinutes =
      lessonType === "learn"
        ? Math.max(5, lesson._count.cards * 2)
        : lesson.estimatedMinutes;
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { lessonType, estimatedMinutes },
    });
  }

  // Backfill Card.subtype for INFO cards using constrained domain values:
  //   "INTRO"      — INFO card at order 1 (context-setting / lesson opener)
  //   "MISSION"    — INFO card whose prompt contains "Mission" (action assignment)
  //   "REFLECTION" — INFO card whose prompt contains "Reflect" (journaling/reflection)
  //   ""           — all other cards; MULTIPLE_CHOICE/TRUE_FALSE/SCENARIO retain type alone
  // Find all INFO cards that don't yet have a canonical uppercase subtype
  const canonicalSubtypes = ["INTRO", "MISSION", "REFLECTION"];
  const infoCards = await prisma.card.findMany({
    where: { type: "INFO", NOT: { subtype: { in: canonicalSubtypes } } },
    select: { id: true, order: true, prompt: true },
  });
  for (const card of infoCards) {
    let subtype = "";
    if (card.order === 1) subtype = "INTRO";
    else if (/mission/i.test(card.prompt)) subtype = "MISSION";
    else if (/reflect/i.test(card.prompt)) subtype = "REFLECTION";
    // Reset non-canonical values and apply correct subtype (or leave "" for mid-lesson info)
    await prisma.card.update({ where: { id: card.id }, data: { subtype } });
  }
  const updatedSubtypes = infoCards.filter(
    (c) => c.order === 1 || /mission|reflect/i.test(c.prompt)
  ).length;
  const learnCount = lessons.filter((l) => l.lessonType === "learn").length;
  const specialCount = lessons.length - learnCount;
  console.log(`  ↳ Reconciled metadata for ${lessons.length} lessons (${learnCount} learn, ${specialCount} checkpoint/capstone)`);
  console.log(`  ↳ Backfilled subtype on ${updatedSubtypes} INFO cards (INTRO/MISSION/REFLECTION)`);
}

async function seedCards(lessonId: string, cards: any[]) {
  const count = await prisma.card.count({ where: { lessonId } });
  if (count === 0) {
    await prisma.card.createMany({ data: cards.map((c) => ({ lessonId, ...c })) });
  }
}

async function main() {
  // =====================================================
  // JOURNEY A: Stability Basics
  // =====================================================
  const journeyA = await upsertPath({
    title: "Stability Basics",
    slug: "stability-basics",
    description: "Foundation skills you can build a life on. Daily routines, communication, documents, health access, and boundaries.",
    icon: "🏠",
    order: 1,
  });

  // --- Unit A1: Daily Stability ---
  const unitA1 = await upsertModule({ pathId: journeyA.id, title: "Daily Stability", slug: "daily-stability", order: 1 });

  const a1_1 = await upsertLesson({ moduleId: unitA1.id, title: "Your \"Today Plan\"", slug: "today-plan", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a1_1.id, [
    { type: "INFO", order: 1, prompt: "The \"3 Wins\" Rule", body: "Every day, aim for 3 small wins: one for your body (eat, move, rest), one for your money (save, earn, track), and one for your future (learn, connect, plan). Even on hard days, 3 tiny wins add up." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which set of tasks best represents the \"3 Wins\" rule?", choicesJson: JSON.stringify(["Watch TV, nap, scroll phone", "Drink water, check bank balance, send one email", "Clean everything, apply to 20 jobs, run 5 miles", "Wait for motivation to hit"]), answerJson: JSON.stringify("Drink water, check bank balance, send one email"), explain: "Small, realistic wins across body, money, and future. Perfection isn't the goal — progress is." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "You missed your morning appointment. What's the best recovery step?", choicesJson: JSON.stringify(["Give up on the whole day", "Call to reschedule immediately", "Pretend it didn't happen", "Wait until they call you"]), answerJson: JSON.stringify("Call to reschedule immediately"), explain: "A quick call shows responsibility and keeps the door open. Recovery is a skill, not a failure." },
    { type: "INFO", order: 4, prompt: "Mission: Make Your Today Plan", body: "Write down 3 wins for today (1 body, 1 money, 1 future). Add 2 time blocks (when will you do them?). Add 1 backup plan (what if something goes wrong?). You've got this." },
  ]);

  const a1_2 = await upsertLesson({ moduleId: unitA1.id, title: "Sleep and Energy Basics", slug: "sleep-energy", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a1_2.id, [
    { type: "INFO", order: 1, prompt: "Your Brain Needs Rest to Make Decisions", body: "Sleep isn't a luxury — it's how your brain processes stress and makes good choices. Even improving sleep by 30 minutes can change your day." },
    { type: "TRUE_FALSE", order: 2, prompt: "Drinking coffee late in the afternoon helps you sleep better at night.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Caffeine stays in your system for 6–8 hours. Try to stop caffeine by early afternoon if possible." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "What's a simple \"wind-down\" step before sleep?", choicesJson: JSON.stringify(["Scroll social media for an hour", "Do 2 minutes of slow breathing", "Drink an energy drink", "Replay stressful events in your head"]), answerJson: JSON.stringify("Do 2 minutes of slow breathing"), explain: "Slow breathing signals your body it's safe to rest. Even 2 minutes makes a difference." },
  ]);

  const a1_3 = await upsertLesson({ moduleId: unitA1.id, title: "Hygiene and Self-Respect", slug: "hygiene-self-respect", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a1_3.id, [
    { type: "INFO", order: 1, prompt: "Hygiene Is About Feeling Human", body: "Staying clean isn't about other people's opinions — it's about your own dignity and confidence. Many communities offer free showers, laundry, and hygiene kits." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the most important item in a basic hygiene kit?", choicesJson: JSON.stringify(["Cologne", "Toothbrush and toothpaste", "Hair gel", "Makeup"]), answerJson: JSON.stringify("Toothbrush and toothpaste"), explain: "Dental hygiene protects your health and confidence. It's the foundation of a basic kit." },
    { type: "INFO", order: 3, prompt: "Mission: Build Your Mini Kit List", body: "List the 5 hygiene items you need most. Check if any are available free near you (shelters, churches, community centers). Even a virtual list helps you feel prepared." },
  ]);

  const a1_4 = await upsertLesson({ moduleId: unitA1.id, title: "Food Basics on a Tight Budget", slug: "food-basics", order: 4, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a1_4.id, [
    { type: "INFO", order: 1, prompt: "Fuel Your Brain First", body: "Your brain uses 20% of your energy. Skipping meals makes it harder to think clearly, stay calm, and make good decisions. Planning even 1 meal ahead helps." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which meal strategy works best on a very tight budget?", choicesJson: JSON.stringify(["Skip breakfast to save money", "Buy one big meal and eat it all at once", "Plan 2 simple meals using free resources + one purchased item", "Only eat fast food dollar menu items"]), answerJson: JSON.stringify("Plan 2 simple meals using free resources + one purchased item"), explain: "Combining free resources (food banks, community meals) with one smart purchase stretches your budget furthest." },
    { type: "TRUE_FALSE", order: 3, prompt: "Dehydration can make you feel anxious and confused.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Even mild dehydration affects mood and thinking. Carry a water bottle and refill it whenever you can." },
  ]);

  const a1_5 = await upsertLesson({ moduleId: unitA1.id, title: "Safe Storage and Keeping Track", slug: "safe-storage", order: 5, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a1_5.id, [
    { type: "INFO", order: 1, prompt: "The 3-Item Essentials Check", body: "Before you leave any place, check for 3 things: ID, phone, keys (or whatever your 3 essentials are). This simple habit prevents a lot of stress." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the best way to keep track of important items when you don't have a permanent home?", choicesJson: JSON.stringify(["Keep everything in different pockets", "Use one bag or container for all essentials", "Leave things with different people", "Don't worry about it"]), answerJson: JSON.stringify("Use one bag or container for all essentials"), explain: "One dedicated spot for essentials means fewer lost items and less panic." },
  ]);

  const a1_chk = await upsertLesson({ moduleId: unitA1.id, title: "Daily Stability Checkpoint", slug: "daily-stability-checkpoint", order: 6, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(a1_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 1 Review: Daily Stability", body: "You've covered daily routines, sleep, hygiene, food basics, and safe storage. This checkpoint reviews what you've learned before you move forward." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What is the best first step when you wake up with no plan for the day?", choicesJson: JSON.stringify(["Wait and see what happens", "Make a simple Today Plan with 3 priorities", "Ask someone else to decide for you", "Skip the day entirely"]), answerJson: JSON.stringify("Make a simple Today Plan with 3 priorities"), explain: "A Today Plan — even 3 small tasks — gives you structure and a sense of control." },
    { type: "TRUE_FALSE", order: 3, prompt: "Photographing your documents is a smart backup strategy.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "A photo backup can help you get replacements faster and prove identity in emergencies." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Which is the most important benefit of using a single bag for all your essentials?", choicesJson: JSON.stringify(["It looks organized", "You always know where everything is", "It is lighter to carry", "Other people can't see your things"]), answerJson: JSON.stringify("You always know where everything is"), explain: "Consistency reduces stress and prevents lost items — especially critical when you're managing many challenges at once." },
  ]);

  // --- Unit A2: Communication and Access ---
  const unitA2 = await upsertModule({ pathId: journeyA.id, title: "Communication & Access", slug: "communication-access", order: 2 });

  const a2_1 = await upsertLesson({ moduleId: unitA2.id, title: "Phone Basics and Data", slug: "phone-basics", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a2_1.id, [
    { type: "INFO", order: 1, prompt: "Your Phone Is Your Lifeline", body: "WiFi saves data. Battery saves options. Knowing how to use voicemail and texting well can open doors to jobs, housing, and support." },
    { type: "TRUE_FALSE", order: 2, prompt: "Using WiFi instead of mobile data helps your phone plan last longer.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Connecting to free WiFi at libraries, cafes, or shelters saves your mobile data for when you really need it." },
    { type: "INFO", order: 3, prompt: "Mission: Set Up Your Lifeline", body: "Set your voicemail with a clear, professional greeting. Save at least 2 key contacts (caseworker, shelter, family, or friend)." },
  ]);

  const a2_2 = await upsertLesson({ moduleId: unitA2.id, title: "Professional Texting", slug: "professional-texting", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a2_2.id, [
    { type: "INFO", order: 1, prompt: "Texting Can Open Doors", body: "A clear, polite text can confirm an appointment, follow up on a lead, or ask for help. Keep it short, specific, and respectful." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which text is best for confirming an appointment?", choicesJson: JSON.stringify(["yo im coming tmrw", "Hi, this is [Name]. I'm confirming my appointment for [date/time]. Thank you!", "u there?", "i think i have something tomorrow maybe"]), answerJson: JSON.stringify("Hi, this is [Name]. I'm confirming my appointment for [date/time]. Thank you!"), explain: "Clear, polite, and specific. This makes you easy to work with and shows respect for everyone's time." },
  ]);

  const a2_3 = await upsertLesson({ moduleId: unitA2.id, title: "Asking for Help Without Shame", slug: "asking-help", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a2_3.id, [
    { type: "INFO", order: 1, prompt: "Asking for Help Is a Strength", body: "Everyone needs help sometimes. The key is being clear about what you need, what you've already tried, and being grateful for the support." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the most effective way to ask for help?", choicesJson: JSON.stringify(["Just wait and hope someone notices", "Say exactly what you need, what you've tried, and ask clearly", "Demand help immediately", "Apologize 10 times before asking"]), answerJson: JSON.stringify("Say exactly what you need, what you've tried, and ask clearly"), explain: "Clear requests get better results. People want to help — make it easy for them." },
  ]);

  // --- Unit A3: Documents and Identity ---
  const unitA3 = await upsertModule({ pathId: journeyA.id, title: "Documents & Identity", slug: "documents-identity", order: 3 });

  const a3_1 = await upsertLesson({ moduleId: unitA3.id, title: "What Documents Matter Most", slug: "documents-matter", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a3_1.id, [
    { type: "INFO", order: 1, prompt: "Your Documents Are Your Keys", body: "ID, Social Security card, birth certificate, proof of address, and medical cards. These unlock jobs, housing, benefits, and healthcare. Losing them creates barriers — protecting them creates options." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which document should you prioritize getting first?", choicesJson: JSON.stringify(["Library card", "Valid photo ID", "Loyalty card", "Old school report card"]), answerJson: JSON.stringify("Valid photo ID"), explain: "A valid ID is required for almost everything: jobs, housing, benefits, and banking." },
    { type: "INFO", order: 3, prompt: "Mission: Document Inventory", body: "Check which documents you currently have. Pick the next one you need to get. Write down one step you can take this week to pursue it." },
  ]);

  const a3_2 = await upsertLesson({ moduleId: unitA3.id, title: "Safe Document Storage", slug: "document-storage", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a3_2.id, [
    { type: "INFO", order: 1, prompt: "Protect What Protects You", body: "Take photos of all your documents and store them in a secure folder on your phone or email. Physical copies should be in a waterproof bag in one safe place." },
    { type: "TRUE_FALSE", order: 2, prompt: "Taking a photo of your ID is a good backup strategy.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "A photo backup can help you get replacements faster and prove identity in emergencies." },
  ]);

  const a3_3 = await upsertLesson({ moduleId: unitA3.id, title: "Forms Without Panic", slug: "forms-without-panic", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(a3_3.id, [
    { type: "INFO", order: 1, prompt: "Forms Are Just Questions", body: "Read each section before writing. Skip what you don't know and come back. Ask for help with confusing parts — that's what staff are there for." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You're filling out a form and don't understand a question. What should you do?", choicesJson: JSON.stringify(["Guess and hope for the best", "Leave it blank and ask someone for help", "Skip the entire form", "Write 'N/A' everywhere"]), answerJson: JSON.stringify("Leave it blank and ask someone for help"), explain: "It's always better to ask than to guess. Staff expect questions and would rather help than process incorrect information." },
  ]);

  const unitA_cap = await upsertModule({ pathId: journeyA.id, title: "Stability Basics Capstone", slug: "stability-basics-capstone", order: 4 });
  const a_capstone = await upsertLesson({ moduleId: unitA_cap.id, title: "Stability Basics: Final Challenge", slug: "stability-basics-capstone-lesson", order: 1, xpReward: 25, lessonType: "capstone", estimatedMinutes: 15 });
  await seedCards(a_capstone.id, [
    { type: "INFO", order: 1, prompt: "You Made It to the Capstone!", body: "You've learned daily routines, communication, documents, and system navigation. This final challenge tests everything together. You've done the hard work — now show what you know." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You have an appointment at 9am but your phone died. What's the best first step?", choicesJson: JSON.stringify(["Skip the appointment", "Borrow a charger or use a library computer to confirm you're on your way", "Show up without contacting anyone", "Reschedule for next month"]), answerJson: JSON.stringify("Borrow a charger or use a library computer to confirm you're on your way"), explain: "Communicate proactively when problems arise. Showing initiative builds trust with caseworkers and staff." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You lost your ID while moving between shelters.", body: "You need your ID for a job interview in 3 days. What would you do first?", choicesJson: JSON.stringify(["Give up on the interview", "Contact a local resource center or DMV about emergency replacement, and notify the employer you'll have ID shortly", "Show up and hope they won't check", "Ask someone else to pretend to be you"]), answerJson: JSON.stringify("Contact a local resource center or DMV about emergency replacement, and notify the employer you'll have ID shortly"), explain: "Proactive communication and knowing where to get help quickly are core stability skills." },
    { type: "TRUE_FALSE", order: 4, prompt: "Having a simple daily routine can reduce stress even in unstable living conditions.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Routine creates predictability and a sense of control — powerful tools for managing chaos." },
    { type: "INFO", order: 5, prompt: "Mission: Your Stability Summary", body: "You've completed Stability Basics! Write 3 things you learned, 1 thing you're applying this week, and 1 goal you're moving toward. You've earned this — keep going." },
  ]);

  // =====================================================
  // JOURNEY B: Survival & Systems Navigation
  // =====================================================
  const journeyB = await upsertPath({
    title: "Survival & Systems",
    slug: "survival-systems",
    description: "Navigate housing, benefits, crisis moments, and work readiness. Stay steady under pressure.",
    icon: "🛡️",
    order: 2,
  });

  // --- Unit B1: Crisis-to-Plan ---
  const unitB1 = await upsertModule({ pathId: journeyB.id, title: "Crisis to Plan", slug: "crisis-to-plan", order: 1 });

  const b1_1 = await upsertLesson({ moduleId: unitB1.id, title: "Stop the Spiral", slug: "stop-spiral", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(b1_1.id, [
    { type: "INFO", order: 1, prompt: "The 60-Second Reset", body: "When everything feels like it's falling apart: STOP. Name the problem in one sentence. Pick the ONE next step. That's it. You don't need to solve everything — just the next thing." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You just got bad news and feel overwhelmed. What's the best first step?", choicesJson: JSON.stringify(["Make 5 phone calls immediately", "Pause, breathe, and name the actual problem", "Ignore it completely", "Post about it online"]), answerJson: JSON.stringify("Pause, breathe, and name the actual problem"), explain: "Naming the problem takes it from a feeling to a fact. Facts can be solved. Feelings just spin." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "\"Pick the ONE next step\" means:", choicesJson: JSON.stringify(["Solve the whole problem right now", "Choose the smallest action that moves you forward", "Ask someone else to fix everything", "Wait until you feel better"]), answerJson: JSON.stringify("Choose the smallest action that moves you forward"), explain: "One small step breaks the freeze. Action creates clarity." },
  ]);

  const b1_2 = await upsertLesson({ moduleId: unitB1.id, title: "Personal Safety Plan", slug: "safety-plan", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(b1_2.id, [
    { type: "INFO", order: 1, prompt: "Know Your Exits Before You Need Them", body: "A safety plan answers 3 questions: Where do I go? Who do I call? What do I avoid? Write this down before a crisis, not during one." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "A good safety plan includes:", choicesJson: JSON.stringify(["Only phone numbers", "A safe place, a trusted person, and things to avoid", "Just a prayer", "Nothing — you'll figure it out"]), answerJson: JSON.stringify("A safe place, a trusted person, and things to avoid"), explain: "The best safety plans are simple: a place, a person, and awareness of triggers." },
  ]);

  const b1_3 = await upsertLesson({ moduleId: unitB1.id, title: "Recovery After a Bad Day", slug: "recovery-bad-day", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(b1_3.id, [
    { type: "INFO", order: 1, prompt: "Bad Days Don't Erase Good Progress", body: "Everyone has setbacks. The skill isn't avoiding bad days — it's having a restart ritual. Drink water, name one thing that went right, and pick tomorrow's first step." },
    { type: "TRUE_FALSE", order: 2, prompt: "One bad day means you've failed and should start over.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Progress isn't a straight line. Every restart counts. You haven't lost what you learned." },
  ]);

  // --- Unit B2: Housing Pathway ---
  const unitB2 = await upsertModule({ pathId: journeyB.id, title: "Housing Pathway", slug: "housing-pathway", order: 2 });

  const b2_1 = await upsertLesson({ moduleId: unitB2.id, title: "Housing Types Explained", slug: "housing-types", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(b2_1.id, [
    { type: "INFO", order: 1, prompt: "Know Your Options", body: "Shelter, transitional housing, rapid rehousing, supportive housing, and independent housing are all different paths. Understanding each helps you ask for what fits your situation." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What type of housing provides both a place to live and ongoing support services?", choicesJson: JSON.stringify(["Market-rate apartment", "Supportive housing", "Hotel room", "Couch surfing"]), answerJson: JSON.stringify("Supportive housing"), explain: "Supportive housing combines stable housing with case management, making it ideal for people rebuilding their lives." },
  ]);

  const b2_2 = await upsertLesson({ moduleId: unitB2.id, title: "Communicating With Housing Staff", slug: "housing-communication", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(b2_2.id, [
    { type: "INFO", order: 1, prompt: "Polite Persistence Wins", body: "Housing staff are busy but they want to help. Follow up regularly, be specific about what you need, and always thank them for their time. Persistence isn't pushy — it's responsible." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "It's been a week since your housing application. What's the best follow-up?", choicesJson: JSON.stringify(["Call and demand an answer", "Send a polite text or email checking status", "Give up and don't follow up", "Show up unannounced"]), answerJson: JSON.stringify("Send a polite text or email checking status"), explain: "A brief, respectful check-in shows you're engaged and responsible — exactly what housing programs look for." },
  ]);

  // --- Unit B3: Work Readiness ---
  const unitB3 = await upsertModule({ pathId: journeyB.id, title: "Work Readiness", slug: "work-readiness", order: 3 });

  const b3_1 = await upsertLesson({ moduleId: unitB3.id, title: "Your Work Identity", slug: "work-identity", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(b3_1.id, [
    { type: "INFO", order: 1, prompt: "Skills Are Everywhere", body: "Even if you haven't had a traditional job recently, you have skills. Managing a budget on a tight income, navigating complex systems, caring for others, solving problems under pressure — these are real, valuable skills." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which of these counts as a real work skill?", choicesJson: JSON.stringify(["Only things listed on a formal resume", "Managing a household budget and coordinating appointments", "Nothing unless you have a degree", "Only paid work experience"]), answerJson: JSON.stringify("Managing a household budget and coordinating appointments"), explain: "Life experience builds transferable skills. Organization, budgeting, problem-solving — employers value these." },
  ]);

  const b3_2 = await upsertLesson({ moduleId: unitB3.id, title: "Resume Lite", slug: "resume-lite", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(b3_2.id, [
    { type: "INFO", order: 1, prompt: "One Page, Skills First", body: "A skills-based resume puts what you CAN DO at the top, not job history. List 3-5 skills, then add any experience (paid, volunteer, or life experience) underneath." },
    { type: "TRUE_FALSE", order: 2, prompt: "Gaps in work history mean employers won't hire you.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Many employers value resilience and life experience. A skills-first resume shifts the focus to what you can offer." },
    { type: "INFO", order: 3, prompt: "Mission: Build Your Work Readiness Card", body: "Write down 3 strengths and 2 types of support you'd need to succeed in a job. This is your Work Readiness Card — use it when talking to job counselors." },
  ]);

  const b3_3 = await upsertLesson({ moduleId: unitB3.id, title: "Interview Basics", slug: "interview-basics", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(b3_3.id, [
    { type: "INFO", order: 1, prompt: "The STAR Method", body: "When answering interview questions, use STAR: Situation (what happened), Task (what you needed to do), Action (what you did), Result (what happened because of your action). This keeps your answers focused." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "An interviewer asks: 'Tell me about a time you solved a problem.' The best answer uses:", choicesJson: JSON.stringify(["'I'm a hard worker'", "A specific story with situation, action, and result", "'I've never had any problems'", "'I don't know'"]), answerJson: JSON.stringify("A specific story with situation, action, and result"), explain: "Specific stories are memorable and believable. They show you in action, not just talking about yourself." },
  ]);

  const unitB_cap = await upsertModule({ pathId: journeyB.id, title: "Survival & Systems Capstone", slug: "survival-systems-capstone", order: 4 });
  const b_capstone = await upsertLesson({ moduleId: unitB_cap.id, title: "Survival & Systems: Final Challenge", slug: "survival-systems-capstone-lesson", order: 1, xpReward: 25, lessonType: "capstone", estimatedMinutes: 15 });
  await seedCards(b_capstone.id, [
    { type: "INFO", order: 1, prompt: "Capstone: Show What You've Mastered", body: "You've covered crisis management, housing systems, and work readiness. This final test brings it all together. You're more prepared than you realize." },
    { type: "SCENARIO", order: 2, prompt: "Scenario: You're told to leave the shelter in 3 days and have no backup plan.", body: "What's your most important first step?", choicesJson: JSON.stringify(["Panic and give up", "Ask the shelter staff about emergency extensions and referrals to other housing resources", "Leave without a plan", "Wait and see what happens"]), answerJson: JSON.stringify("Ask the shelter staff about emergency extensions and referrals to other housing resources"), explain: "Staff are there to help navigate exactly these situations. Asking is always the right first move." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "When applying for a job with gaps in your work history, the best strategy is:", choicesJson: JSON.stringify(["Lie to fill the gaps", "Use a skills-first resume and be honest about challenges you've overcome", "Don't mention the gaps at all", "Withdraw your application"]), answerJson: JSON.stringify("Use a skills-first resume and be honest about challenges you've overcome"), explain: "Resilience and honesty are valued. Many employers respect people who've overcome real adversity." },
    { type: "TRUE_FALSE", order: 4, prompt: "Calling 211 is a good way to find emergency housing, food, and services in your area.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "211 is a free, confidential service available 24/7 in most of the US. Save that number." },
    { type: "INFO", order: 5, prompt: "Mission: Your Systems Map", body: "Congratulations! Write down 3 systems you now know how to navigate (housing, benefits, employment). Note one contact or number for each. This is your Survival Systems Map." },
  ]);

  // =====================================================
  // JOURNEY C: Building Your Future
  // =====================================================
  const journeyC = await upsertPath({
    title: "Building Your Future",
    slug: "building-future",
    description: "Goals, identity, education, habits, and long-term growth. Design the life you want.",
    icon: "🚀",
    order: 3,
  });

  const unitC1 = await upsertModule({ pathId: journeyC.id, title: "Values & Vision", slug: "values-vision", order: 1 });

  const c1_1 = await upsertLesson({ moduleId: unitC1.id, title: "Values First", slug: "values-first", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c1_1.id, [
    { type: "INFO", order: 1, prompt: "What Matters Most to You?", body: "Values are what guide your choices when things get hard. Family, independence, honesty, safety, growth — knowing your top values helps you say yes to the right things and no to the wrong ones." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why are personal values important?", choicesJson: JSON.stringify(["They make you look good", "They help you make decisions that align with who you want to be", "They don't matter", "Only rich people have values"]), answerJson: JSON.stringify("They help you make decisions that align with who you want to be"), explain: "Values are your compass. When you know what matters, every decision gets a little clearer." },
  ]);

  const c1_2 = await upsertLesson({ moduleId: unitC1.id, title: "Goal Ladder", slug: "goal-ladder", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c1_2.id, [
    { type: "INFO", order: 1, prompt: "Big Goal → Mid Goal → Next Step", body: "Big goals feel impossible alone. Break them down: What's the big dream? What's the mid-point? What's the very next step you can take today? That's your ladder." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your big goal is 'get my own apartment.' What's a good 'next step'?", choicesJson: JSON.stringify(["Sign a lease today", "Research what documents are needed for applications", "Wait until you have enough money", "Think about it more"]), answerJson: JSON.stringify("Research what documents are needed for applications"), explain: "Research is a real step. Knowing what's needed puts you ahead of most people." },
  ]);

  const unitC2 = await upsertModule({ pathId: journeyC.id, title: "Habits That Stick", slug: "habits-stick", order: 2 });

  const c2_1 = await upsertLesson({ moduleId: unitC2.id, title: "Tiny Habits", slug: "tiny-habits", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c2_1.id, [
    { type: "INFO", order: 1, prompt: "Start So Small You Can't Fail", body: "Want to exercise? Start with 1 push-up. Want to save money? Start with 50 cents. Tiny habits build the identity of someone who follows through. The size doesn't matter — the consistency does." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What makes a habit 'tiny' enough to stick?", choicesJson: JSON.stringify(["It takes less than 2 minutes", "It completely changes your life overnight", "It requires expensive equipment", "It needs perfect conditions"]), answerJson: JSON.stringify("It takes less than 2 minutes"), explain: "If it takes less than 2 minutes, you'll actually do it. That builds momentum for bigger changes." },
    { type: "TRUE_FALSE", order: 3, prompt: "You need to feel motivated before starting a new habit.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Motivation follows action, not the other way around. Start tiny, and motivation catches up." },
  ]);

  const unitC_cap = await upsertModule({ pathId: journeyC.id, title: "Building Your Future Capstone", slug: "building-future-capstone", order: 3 });
  const c_capstone = await upsertLesson({ moduleId: unitC_cap.id, title: "Building Your Future: Final Challenge", slug: "building-future-capstone-lesson", order: 1, xpReward: 25, lessonType: "capstone", estimatedMinutes: 15 });
  await seedCards(c_capstone.id, [
    { type: "INFO", order: 1, prompt: "Capstone: Your Future Starts Here", body: "You've worked on values, goal-setting, and building habits. This capstone brings it together. You're not just learning — you're becoming someone who builds." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your big goal is 'become financially stable.' Which is the best next step to take this week?", choicesJson: JSON.stringify(["Wait until the situation is perfect", "Set a $1/day savings micro-habit and track it for 7 days", "Make one huge change all at once", "Tell everyone about your plan but don't start yet"]), answerJson: JSON.stringify("Set a $1/day savings micro-habit and track it for 7 days"), explain: "Tiny consistent actions build real momentum. $1/day for a year is $365 — and the habit itself is the real prize." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You start a new routine but miss 3 days in a row.", body: "What's the most effective response?", choicesJson: JSON.stringify(["Abandon the habit entirely", "Restart the next day without self-judgment — missing days doesn't erase progress", "Punish yourself for failing", "Wait until you feel motivated again"]), answerJson: JSON.stringify("Restart the next day without self-judgment — missing days doesn't erase progress"), explain: "The goal is to never miss twice. One missed day is a pause. Two or more is a new habit of stopping." },
    { type: "TRUE_FALSE", order: 4, prompt: "Your values should guide your biggest life decisions.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "When you know what matters most to you, decisions get clearer. Values are your compass." },
    { type: "INFO", order: 5, prompt: "Mission: Build Your 90-Day Plan", body: "You've earned the Building Your Future capstone! Write 1 big goal, 3 mid-goals, and 9 next steps (one per month). You have a roadmap. Now walk it." },
  ]);

  // =====================================================
  // JOURNEY D: Financial Literacy
  // =====================================================
  const journeyD = await upsertPath({
    title: "Financial Literacy",
    slug: "financial-literacy",
    description: "Money fundamentals, budgeting, banking, credit, and protecting yourself from scams.",
    icon: "💰",
    order: 4,
  });

  const unitD1 = await upsertModule({ pathId: journeyD.id, title: "Money Fundamentals", slug: "money-fundamentals", order: 1 });

  const d1_1 = await upsertLesson({ moduleId: unitD1.id, title: "Money Language", slug: "money-language", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d1_1.id, [
    { type: "INFO", order: 1, prompt: "Words That Control Your Money", body: "Income is money coming in. Expenses are money going out. Net is what's left. Fees are what they take. Knowing these words means no one can confuse you about your own money." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What does 'net income' mean?", choicesJson: JSON.stringify(["All the money you earn before anything is taken out", "The money left after taxes and deductions", "Money you owe to others", "Your credit score"]), answerJson: JSON.stringify("The money left after taxes and deductions"), explain: "Net income is your 'take-home' pay — the actual money you have to work with." },
  ]);

  const d1_2 = await upsertLesson({ moduleId: unitD1.id, title: "Needs vs Wants", slug: "needs-vs-wants", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d1_2.id, [
    { type: "INFO", order: 1, prompt: "No Judgment, Just Clarity", body: "Needs keep you alive and stable: food, shelter, hygiene, transportation. Wants make life better: entertainment, treats, upgrades. This isn't about shame — it's about knowing where your money goes so YOU control it." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which of these is a 'need'?", choicesJson: JSON.stringify(["Streaming subscription", "Bus pass to get to work", "New shoes when yours still work", "Fast food upgrade to large size"]), answerJson: JSON.stringify("Bus pass to get to work"), explain: "Transportation to work protects your income. That's a need. Everything else can wait if money is tight." },
  ]);

  const d1_3 = await upsertLesson({ moduleId: unitD1.id, title: "Money Anxiety Reset", slug: "money-anxiety", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d1_3.id, [
    { type: "INFO", order: 1, prompt: "Numbers First, Feelings Second", body: "Money stress is real. But avoiding your numbers makes anxiety worse. Look at the actual amount. Write it down. Now it's a fact, not a monster. Facts can be solved." },
    { type: "TRUE_FALSE", order: 2, prompt: "Avoiding looking at your bank balance helps reduce money stress.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Avoidance increases anxiety. Knowing the real number — even if it's scary — gives you power to plan." },
  ]);

  const unitD2 = await upsertModule({ pathId: journeyD.id, title: "Budgeting That Works", slug: "budgeting-works", order: 2 });

  const d2_1 = await upsertLesson({ moduleId: unitD2.id, title: "Weekly Cash Plan", slug: "weekly-cash-plan", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d2_1.id, [
    { type: "INFO", order: 1, prompt: "Plan Your Week, Not Your Month", body: "Monthly budgets feel too big. Weekly is easier: How much do I have this week? What must I pay? What's left? That's your spending money. Simple." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You have $60 for the week. Rent and phone are paid. What's the smartest first spend?", choicesJson: JSON.stringify(["$30 on entertainment", "Food and bus fare for the week", "$60 on new clothes", "Lend it to a friend"]), answerJson: JSON.stringify("Food and bus fare for the week"), explain: "Cover basics first. Food and transportation protect your health and income. Extras come from what's left." },
  ]);

  const unitD3 = await upsertModule({ pathId: journeyD.id, title: "Scams & Safety", slug: "scams-safety", order: 3 });

  const d3_1 = await upsertLesson({ moduleId: unitD3.id, title: "Spot the Scam", slug: "spot-scam", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d3_1.id, [
    { type: "INFO", order: 1, prompt: "If It Sounds Too Good, It Probably Is", body: "Scammers target people who are struggling. Common tricks: 'You won a prize,' 'Pay a fee to get your benefits,' 'Give me your card number for verification.' Real agencies never ask for money upfront." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone texts you: 'You've been approved for $5,000! Just send $50 processing fee.' What should you do?", choicesJson: JSON.stringify(["Send the $50 immediately", "Delete and block — it's a scam", "Give them your bank info", "Share it with friends so they can get money too"]), answerJson: JSON.stringify("Delete and block — it's a scam"), explain: "Legitimate programs never ask for money upfront. If they want money to give you money, it's always a scam." },
  ]);

  const unitD_cap = await upsertModule({ pathId: journeyD.id, title: "Financial Literacy Capstone", slug: "financial-literacy-capstone", order: 4 });
  const d_capstone = await upsertLesson({ moduleId: unitD_cap.id, title: "Financial Literacy: Final Challenge", slug: "financial-literacy-capstone-lesson", order: 1, xpReward: 25, lessonType: "capstone", estimatedMinutes: 15 });
  await seedCards(d_capstone.id, [
    { type: "INFO", order: 1, prompt: "Capstone: Your Money, Your Power", body: "You've learned money language, needs vs wants, budgeting, and scam protection. This final challenge brings it all together. Financial confidence is built one smart decision at a time." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You have $80 this week. Rent is paid. You need food ($30), bus ($15), and want a $40 item. What's the smartest choice?", choicesJson: JSON.stringify(["Buy the $40 item now and skip the bus", "Cover food and bus ($45) and save $35 toward the item", "Don't spend any of it", "Borrow $40 to buy the item this week"]), answerJson: JSON.stringify("Cover food and bus ($45) and save $35 toward the item"), explain: "Needs first, then savings toward wants. This is the weekly cash plan working in real life." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: A friend says you can double your money in a week if you invest with them.", body: "What do you do?", choicesJson: JSON.stringify(["Invest all your money immediately", "Research the offer independently before doing anything — it sounds like a scam", "Borrow money to invest more", "Ask other friends if they want to join"]), answerJson: JSON.stringify("Research the offer independently before doing anything — it sounds like a scam"), explain: "Any offer promising guaranteed, rapid returns is a red flag. Always verify before you invest." },
    { type: "TRUE_FALSE", order: 4, prompt: "Net income is the money you take home after taxes — not the total you earn.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Net income is what you actually have to work with. Budget from this number, not your gross salary." },
    { type: "INFO", order: 5, prompt: "Mission: Your Financial Snapshot", body: "List your current income, 3 regular expenses, and 1 savings goal. Even a rough snapshot shows you where you stand and what to do next. You've got this." },
  ]);

  // =====================================================
  // JOURNEY E: Life Skills
  // =====================================================
  const journeyE = await upsertPath({
    title: "Life Skills",
    slug: "life-skills",
    description: "Communication, relationships, home skills, digital literacy, and community connection.",
    icon: "🌱",
    order: 5,
  });

  const unitE1 = await upsertModule({ pathId: journeyE.id, title: "Communication Mastery", slug: "communication-mastery", order: 1 });

  const e1_1 = await upsertLesson({ moduleId: unitE1.id, title: "Clear Requests", slug: "clear-requests", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e1_1.id, [
    { type: "INFO", order: 1, prompt: "Say What You Need Clearly", body: "A good request has 3 parts: what you need, by when, and why it matters. 'I need help with my application by Friday so I don't miss the deadline' is much better than 'Can you help me sometime?'" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is the clearest request?", choicesJson: JSON.stringify(["Can you help me?", "I need a ride to my appointment at 2pm on Tuesday. Can you help?", "I might need something soon", "Whatever works for you"]), answerJson: JSON.stringify("I need a ride to my appointment at 2pm on Tuesday. Can you help?"), explain: "Specific requests get specific answers. Make it easy for people to say yes." },
  ]);

  const unitE2 = await upsertModule({ pathId: journeyE.id, title: "Healthy Relationships", slug: "healthy-relationships", order: 2 });

  const e2_1 = await upsertLesson({ moduleId: unitE2.id, title: "Red Flags and Green Flags", slug: "red-green-flags", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e2_1.id, [
    { type: "INFO", order: 1, prompt: "Trust Your Gut, Then Check the Facts", body: "Green flags: they respect your boundaries, follow through on promises, and make you feel safe. Red flags: they pressure you, isolate you, or make you feel like you owe them." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is a green flag in a relationship?", choicesJson: JSON.stringify(["They get angry when you say no", "They respect your boundaries and check in on you", "They tell you what to do all the time", "They only help when they want something"]), answerJson: JSON.stringify("They respect your boundaries and check in on you"), explain: "Safe people respect your 'no' and don't keep score. That's a green flag." },
  ]);

  const e2_2 = await upsertLesson({ moduleId: unitE2.id, title: "Boundary Scripts", slug: "boundary-scripts", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e2_2.id, [
    { type: "INFO", order: 1, prompt: "Boundaries Are Not Mean", body: "Saying 'I can't do that right now' or 'That doesn't work for me' isn't rude — it's honest. Boundaries protect your energy so you can show up for the things that matter." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone asks you to lend money you can't afford to lose. What's a good boundary response?", choicesJson: JSON.stringify(["Sure, I'll figure it out somehow", "I care about you, but I'm not able to lend money right now", "That's none of your business", "Give them everything and hope they pay back"]), answerJson: JSON.stringify("I care about you, but I'm not able to lend money right now"), explain: "Kind and clear. You're protecting yourself without attacking them. That's a healthy boundary." },
  ]);

  const unitE3 = await upsertModule({ pathId: journeyE.id, title: "Digital Life Skills", slug: "digital-life-skills", order: 3 });

  const e3_1 = await upsertLesson({ moduleId: unitE3.id, title: "Passwords and Security", slug: "passwords-security", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e3_1.id, [
    { type: "INFO", order: 1, prompt: "Your Password Is Your Lock", body: "Use a different password for important accounts. A strong password is long and unique — like a sentence only you would know. Write them down in a safe place if you need to." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is the strongest password?", choicesJson: JSON.stringify(["password123", "MyDog2024", "I-walk-3-miles-to-the-library-daily!", "123456789"]), answerJson: JSON.stringify("I-walk-3-miles-to-the-library-daily!"), explain: "Long, unique passphrases are much harder to crack than short passwords. Make it personal and memorable." },
  ]);

  const unitE_cap = await upsertModule({ pathId: journeyE.id, title: "Life Skills Capstone", slug: "life-skills-capstone", order: 4 });
  const e_capstone = await upsertLesson({ moduleId: unitE_cap.id, title: "Life Skills: Final Challenge", slug: "life-skills-capstone-lesson", order: 1, xpReward: 25, lessonType: "capstone", estimatedMinutes: 15 });
  await seedCards(e_capstone.id, [
    { type: "INFO", order: 1, prompt: "Capstone: Living Fully", body: "You've grown in communication, relationship boundaries, and digital security. This is your final challenge — showing you can apply these life skills in real situations." },
    { type: "SCENARIO", order: 2, prompt: "Scenario: A new 'friend' wants you to share your phone password to prove you trust them.", body: "What's the best response?", choicesJson: JSON.stringify(["Share it to show you trust them", "Explain that protecting your accounts is important for both of you — you can still be close without sharing passwords", "Give them a fake password", "End the friendship immediately without explanation"]), answerJson: JSON.stringify("Explain that protecting your accounts is important for both of you — you can still be close without sharing passwords"), explain: "Healthy relationships don't require you to give up your security. A green flag partner respects this." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "Which best describes a healthy boundary?", choicesJson: JSON.stringify(["An ultimatum that controls someone else", "A clear limit that protects your energy and values", "A wall that keeps everyone away", "A rule that only you have to follow"]), answerJson: JSON.stringify("A clear limit that protects your energy and values"), explain: "Boundaries are about protecting yourself, not controlling others. They make relationships safer and clearer." },
    { type: "TRUE_FALSE", order: 4, prompt: "Asking for exactly what you need makes it easier for people to help you.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Vague requests get vague results. Specific requests get real help." },
    { type: "INFO", order: 5, prompt: "Mission: Your Life Skills Portfolio", body: "You've completed Life Skills! Write down 3 communication wins, 2 boundary moments you're proud of, and 1 digital habit you've changed. These aren't just lessons — they're your life." },
  ]);

  await reconcileLessonMetadata();
  console.log("✅ All 5 Journeys seeded successfully!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
