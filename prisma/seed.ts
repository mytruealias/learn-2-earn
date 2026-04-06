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

// INFO card subtype domain: MISSION ("Mission:" prefix), REFLECTION ("Reflect:" prefix), "" (all others)
function resolveInfoSubtype(prompt: string): string {
  if (prompt.startsWith("Mission:")) return "MISSION";
  if (prompt.startsWith("Reflect:")) return "REFLECTION";
  return "";
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
    // Auto-calculate estimatedMinutes for "learn" only; checkpoint/capstone keep explicit values.
    const estimatedMinutes =
      lessonType === "learn"
        ? Math.max(5, lesson._count.cards * 2)
        : lesson.estimatedMinutes;
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { lessonType, estimatedMinutes },
    });
  }

  // Reconcile Card.subtype for all INFO cards (idempotent).
  const infoCards = await prisma.card.findMany({
    where: { type: "INFO" },
    select: { id: true, prompt: true, subtype: true },
  });
  let updated = 0;
  for (const card of infoCards) {
    const subtype = resolveInfoSubtype(card.prompt);
    if (card.subtype !== subtype) {
      await prisma.card.update({ where: { id: card.id }, data: { subtype } });
      updated++;
    }
  }
  const learnCount = lessons.filter((l) => l.lessonType === "learn").length;
  const specialCount = lessons.length - learnCount;
  console.log(`  ↳ Reconciled metadata for ${lessons.length} lessons (${learnCount} learn, ${specialCount} checkpoint/capstone)`);
  console.log(`  ↳ Reconciled subtype on ${updated} INFO cards (MISSION/REFLECTION)`);
}

async function seedCards(lessonId: string, cards: Array<{ type: string; order: number; prompt: string; body?: string; choicesJson?: string; answerJson?: string; explain?: string; subtype?: string }>) {
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
    estimatedHours: 4.5,
    targetAudience: "All learners",
    difficulty: "foundational",
  });

  // --- Unit C1: Identity and Self-Belief ---
  const unitC1 = await upsertModule({ pathId: journeyC.id, title: "Identity & Self-Belief", slug: "identity-self-belief", order: 1 });

  const c1_1 = await upsertLesson({ moduleId: unitC1.id, title: "Who You Are Is Not What Happened to You", slug: "identity-not-circumstances", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c1_1.id, [
    { type: "INFO", order: 1, prompt: "You Are Not Your Worst Day", body: "Your identity is not defined by homelessness, job loss, addiction, or mistakes. Those are things that happened TO you or things you went through. Who you are is shown by what you value, how you treat people, and what you do next." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the difference between identity and circumstances?", choicesJson: JSON.stringify(["They're the same thing", "Identity is who you are at your core; circumstances are temporary situations you're in", "Circumstances define your identity permanently", "Identity doesn't matter when you're struggling"]), answerJson: JSON.stringify("Identity is who you are at your core; circumstances are temporary situations you're in"), explain: "Circumstances change. Your core self — your values, your effort, your character — that's identity." },
    { type: "TRUE_FALSE", order: 3, prompt: "A person experiencing homelessness can still have strong values and a clear sense of identity.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Absolutely. Housing status has nothing to do with your character. Many people in difficult situations show extraordinary resilience." },
    { type: "SCENARIO", order: 4, prompt: "Scenario: Someone asks 'What do you do?' and you feel embarrassed about your current situation.", body: "What's a confident response?", choicesJson: JSON.stringify(["Lie about having a great job", "Say 'I'm working on rebuilding — right now I'm focused on stability and learning new skills'", "Walk away without answering", "Say 'Nothing' and change the subject"]), answerJson: JSON.stringify("Say 'I'm working on rebuilding — right now I'm focused on stability and learning new skills'"), explain: "Honest and forward-looking. You're not defined by where you are — you're defined by where you're headed." },
    { type: "INFO", order: 5, prompt: "Mission: Write Your Identity Statement", body: "Complete this sentence: 'I am someone who values ___ and ___. Right now I'm working on ___.' This is your identity — not your address or your past." },
  ]);

  const c1_2 = await upsertLesson({ moduleId: unitC1.id, title: "Recognizing Your Strengths", slug: "recognizing-strengths", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c1_2.id, [
    { type: "INFO", order: 1, prompt: "You Have Skills You Don't See", body: "Surviving hard times builds real skills: problem-solving, adaptability, reading people, staying calm under pressure, resourcefulness. These are the exact skills employers and communities value most." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which of these is a real strength built from overcoming hardship?", choicesJson: JSON.stringify(["Having a college degree", "Adaptability and problem-solving under pressure", "Having wealthy connections", "Never having faced any challenges"]), answerJson: JSON.stringify("Adaptability and problem-solving under pressure"), explain: "Surviving difficult situations requires skills that many people never develop. That's a real strength." },
    { type: "TRUE_FALSE", order: 3, prompt: "Only formal education or job experience counts as a real skill.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Navigating systems, managing crisis, caring for others, and staying resourceful are all valuable real-world skills." },
    { type: "INFO", order: 4, prompt: "Mission: List Three Strengths", body: "Write down 3 things you're good at — even if you think they're small. Maybe you're good at calming people down, finding resources, staying organized, or listening. These are real." },
  ]);

  const c1_3 = await upsertLesson({ moduleId: unitC1.id, title: "The Story You Tell Yourself", slug: "self-narrative", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c1_3.id, [
    { type: "INFO", order: 1, prompt: "Your Internal Story Shapes Your Actions", body: "If you tell yourself 'I always fail,' you'll stop trying. If you tell yourself 'I'm figuring it out,' you'll keep going. The story isn't about lying to yourself — it's about being accurate. You've survived 100% of your worst days." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which self-story is most likely to lead to positive action?", choicesJson: JSON.stringify(["I always mess things up", "I'm figuring things out one step at a time", "Nothing ever works for me", "I don't deserve good things"]), answerJson: JSON.stringify("I'm figuring things out one step at a time"), explain: "This story is honest AND hopeful. It acknowledges the struggle without surrendering to it." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You apply for a program and get rejected.", body: "Which response keeps your identity strong?", choicesJson: JSON.stringify(["See — I knew I'd fail", "That program wasn't the right fit. I'll look for another one this week", "I'm done trying", "It's someone else's fault"]), answerJson: JSON.stringify("That program wasn't the right fit. I'll look for another one this week"), explain: "Rejection is about fit, not worth. Keeping momentum means reframing setbacks as redirections." },
    { type: "INFO", order: 4, prompt: "Mission: Rewrite One Negative Story", body: "Think of one thing you tell yourself that holds you back. Write a more accurate version. Example: 'I'm lazy' → 'I'm exhausted from surviving, and I still show up.'" },
  ]);

  const c1_4 = await upsertLesson({ moduleId: unitC1.id, title: "Shame Is Not a Strategy", slug: "shame-not-strategy", order: 4, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c1_4.id, [
    { type: "INFO", order: 1, prompt: "Shame Stops Growth", body: "Shame says 'I am bad.' Guilt says 'I did something bad.' Shame paralyzes — guilt motivates change. If you're stuck in shame, you can't move forward. Let go of shame. Keep the lessons." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What is the key difference between shame and guilt?", choicesJson: JSON.stringify(["They're the same thing", "Shame is about who you are; guilt is about what you did", "Guilt is worse than shame", "Neither one matters"]), answerJson: JSON.stringify("Shame is about who you are; guilt is about what you did"), explain: "Guilt can motivate you to make amends and change behavior. Shame just makes you feel stuck and worthless." },
    { type: "TRUE_FALSE", order: 3, prompt: "Feeling ashamed of your past is necessary for personal growth.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Growth comes from accountability and learning — not from shame. Shame actually blocks growth by making you feel hopeless." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Someone says 'You should be ashamed of yourself.' What's the healthiest internal response?", choicesJson: JSON.stringify(["They're right — I am worthless", "I can acknowledge my mistakes without letting shame define me", "I should never feel bad about anything", "Their opinion is the only truth"]), answerJson: JSON.stringify("I can acknowledge my mistakes without letting shame define me"), explain: "Take responsibility without internalizing toxic shame. You're allowed to grow beyond your worst moments." },
  ]);

  const c1_5 = await upsertLesson({ moduleId: unitC1.id, title: "You Have Done Hard Things", slug: "done-hard-things", order: 5, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c1_5.id, [
    { type: "INFO", order: 1, prompt: "Your Track Record of Surviving", body: "Think about what you've already gotten through. Every hard day you survived, every time you started over, every time you showed up when you didn't want to — that's evidence. You have a track record of making it through." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why does remembering past hard things you survived matter?", choicesJson: JSON.stringify(["It doesn't — the past is the past", "It reminds you that you have the ability to get through difficult situations", "It makes you feel sorry for yourself", "Only future-thinking matters"]), answerJson: JSON.stringify("It reminds you that you have the ability to get through difficult situations"), explain: "Your survival history is proof of your capability. When things get hard, remember: you've done hard things before." },
    { type: "INFO", order: 3, prompt: "Mission: Write Your Survival Resume", body: "List 3 hard things you've survived or overcome. These are your qualifications for the future. You earned them." },
  ]);

  const c1_chk = await upsertLesson({ moduleId: unitC1.id, title: "Identity and Self-Belief: Checkpoint", slug: "identity-checkpoint", order: 6, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(c1_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 1 Review: Your Identity Foundation", body: "You've explored identity vs circumstances, your strengths, your self-story, shame vs guilt, and your survival track record. This checkpoint tests your understanding before moving into growth mindset." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What defines your identity?", choicesJson: JSON.stringify(["Your current address", "Your values, character, and choices — not your circumstances", "How much money you have", "What other people think of you"]), answerJson: JSON.stringify("Your values, character, and choices — not your circumstances"), explain: "Identity is internal. Circumstances are external and temporary." },
    { type: "TRUE_FALSE", order: 3, prompt: "Surviving hardship builds real, transferable skills.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Adaptability, resourcefulness, crisis management — these are skills that serve you in every area of life." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Which internal story best supports personal growth?", choicesJson: JSON.stringify(["I always fail", "I'm learning and improving one step at a time", "Nothing good ever happens to me", "I don't deserve success"]), answerJson: JSON.stringify("I'm learning and improving one step at a time"), explain: "Accurate and forward-looking stories fuel action. Hopeless stories fuel paralysis." },
  ]);

  // --- Unit C2: Mindset for Growth ---
  const unitC2 = await upsertModule({ pathId: journeyC.id, title: "Mindset for Growth", slug: "mindset-growth", order: 2 });

  const c2_1 = await upsertLesson({ moduleId: unitC2.id, title: "Fixed vs Growth Thinking", slug: "fixed-vs-growth", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c2_1.id, [
    { type: "INFO", order: 1, prompt: "Two Ways of Seeing the World", body: "Fixed mindset: 'I'm either smart or I'm not. I can't change.' Growth mindset: 'I can learn, improve, and get better at things with effort.' The difference isn't talent — it's belief in your ability to grow." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which statement reflects a growth mindset?", choicesJson: JSON.stringify(["I'm just not a math person", "I struggle with math now, but I can improve with practice", "Some people are born smart and some aren't", "If it doesn't come naturally, it's not for me"]), answerJson: JSON.stringify("I struggle with math now, but I can improve with practice"), explain: "Growth mindset adds 'yet' to every struggle. 'I can't do this' becomes 'I can't do this yet.'" },
    { type: "TRUE_FALSE", order: 3, prompt: "Intelligence and ability are completely fixed at birth and cannot be developed.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Research consistently shows that brains grow and adapt. Effort, practice, and good strategies make people smarter." },
    { type: "SCENARIO", order: 4, prompt: "Scenario: You try a new skill and do badly on the first attempt.", body: "What's the growth mindset response?", choicesJson: JSON.stringify(["I'm terrible at this — I quit", "First attempts are supposed to be rough. What can I learn from this?", "I should only do things I'm already good at", "Ask someone else to do it for me from now on"]), answerJson: JSON.stringify("First attempts are supposed to be rough. What can I learn from this?"), explain: "Every expert was once a beginner. The question isn't 'Am I good?' — it's 'What can I learn?'" },
  ]);

  const c2_2 = await upsertLesson({ moduleId: unitC2.id, title: "Mistakes Are Data", slug: "mistakes-data", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c2_2.id, [
    { type: "INFO", order: 1, prompt: "Every Mistake Teaches Something", body: "Mistakes aren't proof you're a failure. They're information: this approach didn't work, so try a different one. The most successful people in history failed more times than most people even tried." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You applied for a job and didn't get it. What's the most useful way to think about it?", choicesJson: JSON.stringify(["I'm not good enough to work", "That's useful data — I'll ask for feedback and adjust my approach", "I'll never apply anywhere again", "Someone probably cheated me out of it"]), answerJson: JSON.stringify("That's useful data — I'll ask for feedback and adjust my approach"), explain: "Treating rejection as data keeps you moving. Treating it as identity keeps you stuck." },
    { type: "TRUE_FALSE", order: 3, prompt: "Making mistakes means you are a failure.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Making mistakes means you're trying. Failure is only permanent if you stop." },
    { type: "INFO", order: 4, prompt: "Mission: Extract One Lesson from a Past Mistake", body: "Think of a mistake you made. Write down one thing you learned from it. That lesson is now an asset, not a liability." },
  ]);

  const c2_3 = await upsertLesson({ moduleId: unitC2.id, title: "Delayed Gratification", slug: "delayed-gratification", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c2_3.id, [
    { type: "INFO", order: 1, prompt: "The Ability to Wait Is a Superpower", body: "Delayed gratification means choosing a bigger reward later over a smaller reward now. Saving $5/day instead of buying fast food. Studying instead of scrolling. It's hard — but it's the single strongest predictor of long-term success." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is an example of delayed gratification?", choicesJson: JSON.stringify(["Spending your whole paycheck the day you get it", "Saving part of your paycheck so you can afford a deposit on an apartment", "Buying whatever makes you feel good right now", "Ignoring future consequences"]), answerJson: JSON.stringify("Saving part of your paycheck so you can afford a deposit on an apartment"), explain: "Short-term sacrifice for a bigger long-term gain. That's delayed gratification in action." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You get $100. You want new shoes ($80) but also need to save for a phone ($200).", body: "What approach builds the best future?", choicesJson: JSON.stringify(["Buy the shoes — you deserve them now", "Save $60 toward the phone and spend $40 on something small", "Spend it all immediately before someone takes it", "Give it all away"]), answerJson: JSON.stringify("Save $60 toward the phone and spend $40 on something small"), explain: "Balance is key. Save toward the bigger goal while still allowing yourself something small. That's sustainable." },
  ]);

  const c2_4 = await upsertLesson({ moduleId: unitC2.id, title: "Discipline as Self-Respect", slug: "discipline-self-respect", order: 4, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c2_4.id, [
    { type: "INFO", order: 1, prompt: "Discipline Is Not Punishment", body: "Discipline means keeping promises to yourself. When you say 'I'll wake up at 7' and you do it — that's self-respect. Every kept promise to yourself builds trust in yourself. That trust is the foundation of confidence." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why is self-discipline connected to self-respect?", choicesJson: JSON.stringify(["It isn't — discipline is just suffering", "Every promise you keep to yourself builds trust and confidence in your own abilities", "Discipline is only for military people", "Self-respect comes from other people's opinions"]), answerJson: JSON.stringify("Every promise you keep to yourself builds trust and confidence in your own abilities"), explain: "When you follow through on commitments to yourself, you learn that you can be counted on — by you." },
    { type: "TRUE_FALSE", order: 3, prompt: "Starting with very small commitments is a weak approach to building discipline.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Small commitments you actually keep build more trust than big commitments you always break." },
  ]);

  const c2_5 = await upsertLesson({ moduleId: unitC2.id, title: "The Power of Small Commitments", slug: "small-commitments", order: 5, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c2_5.id, [
    { type: "INFO", order: 1, prompt: "Start So Small You Can't Fail", body: "Want to exercise? Start with 1 push-up. Want to save? Start with 50 cents. Want to read? Start with 1 page. Tiny commitments build the identity of someone who follows through. The size doesn't matter — the consistency does." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What makes a commitment 'small enough' to stick?", choicesJson: JSON.stringify(["It takes less than 2 minutes to complete", "It completely transforms your life overnight", "It requires expensive equipment", "It needs perfect conditions to start"]), answerJson: JSON.stringify("It takes less than 2 minutes to complete"), explain: "If it takes less than 2 minutes, you'll actually do it. That consistency builds momentum for bigger things." },
    { type: "TRUE_FALSE", order: 3, prompt: "You need to feel motivated before starting a new habit.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Motivation follows action. Start the tiny habit, and motivation catches up." },
    { type: "INFO", order: 4, prompt: "Mission: Pick One Tiny Commitment", body: "Choose one thing you'll do every day this week that takes under 2 minutes. Write it down. Do it tomorrow. That's how change starts." },
  ]);

  const c2_chk = await upsertLesson({ moduleId: unitC2.id, title: "Mindset for Growth: Checkpoint", slug: "mindset-checkpoint", order: 6, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(c2_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 2 Review: Growth Mindset Foundations", body: "You've learned about fixed vs growth thinking, treating mistakes as data, delayed gratification, discipline as self-respect, and the power of small commitments." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You try something new and struggle badly. What's the growth mindset response?", choicesJson: JSON.stringify(["This proves I'm not cut out for it", "Struggling is part of learning — I'll adjust and try again", "I should only do things I'm already good at", "Someone else should do it for me"]), answerJson: JSON.stringify("Struggling is part of learning — I'll adjust and try again"), explain: "Growth mindset treats every struggle as a step in the learning process, not a verdict on your ability." },
    { type: "TRUE_FALSE", order: 3, prompt: "Delayed gratification — choosing a bigger reward later over a smaller reward now — is a strong predictor of success.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Research shows the ability to delay gratification correlates with better life outcomes across the board." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "What's the best way to build self-discipline?", choicesJson: JSON.stringify(["Make huge commitments and punish yourself if you fail", "Start with tiny commitments you can actually keep, then gradually increase", "Wait until you feel disciplined enough to start", "Only disciplined people can build discipline"]), answerJson: JSON.stringify("Start with tiny commitments you can actually keep, then gradually increase"), explain: "Trust is built through kept promises — even tiny ones. Start small, stay consistent, build up." },
  ]);

  // --- Unit C3: Decision-Making ---
  const unitC3 = await upsertModule({ pathId: journeyC.id, title: "Decision-Making", slug: "decision-making", order: 3 });

  const c3_1 = await upsertLesson({ moduleId: unitC3.id, title: "How We Make Decisions", slug: "how-decisions", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c3_1.id, [
    { type: "INFO", order: 1, prompt: "Every Day Is a Series of Choices", body: "You make hundreds of decisions daily — most on autopilot. The big ones deserve more thought. Understanding HOW you decide helps you make better choices: Are you deciding based on fear? Habit? Pressure? Or what actually serves your goals?" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the biggest risk with autopilot decision-making?", choicesJson: JSON.stringify(["It's efficient and saves time", "You might repeat patterns that aren't serving you without realizing it", "There's no risk — autopilot is fine", "Only big decisions matter"]), answerJson: JSON.stringify("You might repeat patterns that aren't serving you without realizing it"), explain: "Autopilot decisions often run on old programming. Pausing to check whether a habit still serves you is powerful." },
    { type: "TRUE_FALSE", order: 3, prompt: "Making a decision based on fear usually leads to the best outcome.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Fear-based decisions often avoid short-term pain but create long-term problems. Pause, think, then choose." },
  ]);

  const c3_2 = await upsertLesson({ moduleId: unitC3.id, title: "Identifying Real Options", slug: "real-options", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c3_2.id, [
    { type: "INFO", order: 1, prompt: "You Have More Options Than You Think", body: "When stressed, our brain narrows to 2 choices: fight or flight. In reality, most situations have 4-5 options you haven't considered. Before deciding, ask: 'What are ALL my options here — not just the obvious ones?'" },
    { type: "SCENARIO", order: 2, prompt: "Scenario: You need a place to stay tonight and your usual spot fell through.", body: "How many real options can you identify?", choicesJson: JSON.stringify(["Only 1 — sleep outside", "At least 4: call 211, contact a shelter, reach out to someone you trust, visit an emergency services center", "2 — outside or a friend's couch", "0 — there's nothing I can do"]), answerJson: JSON.stringify("At least 4: call 211, contact a shelter, reach out to someone you trust, visit an emergency services center"), explain: "When you're stressed, your brain shows you only 1-2 options. Training yourself to list 4+ options gives you real power." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "Why do we tend to see fewer options when we're stressed?", choicesJson: JSON.stringify(["We're lazy", "Stress narrows our thinking to survival mode — fight or flight", "We genuinely have fewer options", "Stress makes us smarter"]), answerJson: JSON.stringify("Stress narrows our thinking to survival mode — fight or flight"), explain: "This is a biological response. Knowing it happens lets you pause and deliberately expand your option list." },
  ]);

  const c3_3 = await upsertLesson({ moduleId: unitC3.id, title: "Costs and Tradeoffs", slug: "costs-tradeoffs", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c3_3.id, [
    { type: "INFO", order: 1, prompt: "Every Choice Has a Cost", body: "Every 'yes' is a 'no' to something else. Spending $20 on food means not saving that $20. Staying up late means being tired tomorrow. There's no free lunch — but knowing the tradeoff helps you choose wisely." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You can work overtime this Saturday ($80) or attend a free job training. Which factor matters most?", choicesJson: JSON.stringify(["Which pays more right now", "Which investment gives you more value long-term — $80 now vs better job prospects later", "What your friends are doing", "Whatever requires the least effort"]), answerJson: JSON.stringify("Which investment gives you more value long-term — $80 now vs better job prospects later"), explain: "Both have value. The key is weighing short-term gain against long-term benefit for YOUR specific situation." },
    { type: "TRUE_FALSE", order: 3, prompt: "There's always one 'right' answer to every decision.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Most decisions have tradeoffs. The goal is making the best choice with the information you have right now." },
  ]);

  const c3_4 = await upsertLesson({ moduleId: unitC3.id, title: "Decisions Under Pressure", slug: "decisions-pressure", order: 4, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c3_4.id, [
    { type: "INFO", order: 1, prompt: "Pressure Makes Us Reactive", body: "When someone says 'decide NOW,' that's a red flag. Good decisions rarely need to be instant. Even in urgent situations, you can take 60 seconds to breathe and think. If someone won't give you time to think, the answer is probably 'no.'" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone pressures you to decide immediately on an offer that 'expires today.' What should you do?", choicesJson: JSON.stringify(["Decide immediately so you don't miss out", "Take at least a few minutes to think — real opportunities don't vanish in 5 minutes", "Always say yes to avoid conflict", "Always say no to everything"]), answerJson: JSON.stringify("Take at least a few minutes to think — real opportunities don't vanish in 5 minutes"), explain: "Artificial urgency is a pressure tactic. Legitimate offers give you time to decide." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: A case worker says you need to sign paperwork right now to keep your benefits.", body: "What's the smartest move?", choicesJson: JSON.stringify(["Sign without reading", "Ask for 5 minutes to read the document, or ask them to explain what you're signing", "Refuse to sign anything ever", "Walk out and come back another day"]), answerJson: JSON.stringify("Ask for 5 minutes to read the document, or ask them to explain what you're signing"), explain: "You have the right to understand what you're signing. A legitimate process allows time for reading." },
    { type: "TRUE_FALSE", order: 4, prompt: "If someone won't give you time to think about a decision, that's a warning sign.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Pressure tactics benefit the person applying pressure, not you. Take your time." },
  ]);

  const c3_chk = await upsertLesson({ moduleId: unitC3.id, title: "Decision-Making: Checkpoint", slug: "decision-checkpoint", order: 5, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(c3_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 3 Review: Making Better Decisions", body: "You've learned about autopilot decisions, expanding your options, weighing tradeoffs, and handling pressure. These skills help you make choices that serve your goals, not just your fears." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "When stressed, your brain tends to:", choicesJson: JSON.stringify(["Generate more creative options", "Narrow to fight-or-flight with fewer visible options", "Make better decisions automatically", "Shut down completely"]), answerJson: JSON.stringify("Narrow to fight-or-flight with fewer visible options"), explain: "Stress biology narrows your options. Knowing this, you can deliberately pause and expand your choices." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "What does 'every yes is a no to something else' mean?", choicesJson: JSON.stringify(["You should never say yes", "Every choice has a tradeoff — spending time or money one way means not spending it another way", "Only say yes to easy things", "Tradeoffs don't exist for smart people"]), answerJson: JSON.stringify("Every choice has a tradeoff — spending time or money one way means not spending it another way"), explain: "Understanding tradeoffs doesn't limit you — it empowers you to choose more wisely." },
    { type: "TRUE_FALSE", order: 4, prompt: "Artificial urgency — being pressured to decide immediately — is usually a red flag.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Real opportunities give you time to think. Pressure tactics benefit the person applying them." },
  ]);

  // --- Unit C4: Long-Term Thinking ---
  const unitC4 = await upsertModule({ pathId: journeyC.id, title: "Long-Term Thinking", slug: "long-term-thinking", order: 4 });

  const c4_1 = await upsertLesson({ moduleId: unitC4.id, title: "Future-Self Thinking", slug: "future-self", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c4_1.id, [
    { type: "INFO", order: 1, prompt: "Your Future Self Is Counting on You", body: "Research shows we treat our future selves like strangers. But every choice you make today is a gift or a burden to the person you'll be in 6 months. Ask: 'What would future me want me to do right now?'" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You have $50 and want to spend it all today. What question helps you decide?", choicesJson: JSON.stringify(["What feels good right now?", "What would future me — 6 months from now — want me to do with this?", "What are other people spending their money on?", "Money doesn't matter anyway"]), answerJson: JSON.stringify("What would future me — 6 months from now — want me to do with this?"), explain: "Future-self thinking connects today's choices to tomorrow's outcomes. It doesn't mean never spending — it means spending wisely." },
    { type: "INFO", order: 3, prompt: "Mission: Write a Letter to Future You", body: "Write a short note to yourself 6 months from now. What do you hope to have accomplished? What choices will you be glad you made? This is your north star." },
  ]);

  const c4_2 = await upsertLesson({ moduleId: unitC4.id, title: "Planning Backward", slug: "planning-backward", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c4_2.id, [
    { type: "INFO", order: 1, prompt: "Start with the End, Then Work Back", body: "Instead of asking 'What should I do next?' ask 'Where do I want to be?' then work backward. Want your own place in 6 months? What needs to happen by month 4? Month 2? This week? That's backward planning." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your goal is 'have stable housing in 6 months.' What's the backward-planning first step?", choicesJson: JSON.stringify(["Sign a lease tomorrow", "List what's required (income proof, ID, deposit) and identify which ones you need to work on first", "Wait and hope something opens up", "Ask someone else to find housing for you"]), answerJson: JSON.stringify("List what's required (income proof, ID, deposit) and identify which ones you need to work on first"), explain: "Backward planning turns a big goal into a checklist. Start with what's needed and work on the gaps." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You want to get a job in 3 months but have no resume.", body: "What's your backward plan?", choicesJson: JSON.stringify(["Apply to jobs without a resume", "Month 3: apply to 5 jobs. Month 2: practice interview answers. Month 1: build a resume this week", "Wait until someone offers you a job", "Don't plan — just see what happens"]), answerJson: JSON.stringify("Month 3: apply to 5 jobs. Month 2: practice interview answers. Month 1: build a resume this week"), explain: "Working backward from the goal makes each month's task clear and manageable." },
  ]);

  const c4_3 = await upsertLesson({ moduleId: unitC4.id, title: "Momentum Building", slug: "momentum-building", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c4_3.id, [
    { type: "INFO", order: 1, prompt: "Momentum Is Built, Not Found", body: "You don't wait for momentum — you create it. One small action leads to another. Apply for one thing. Clean one space. Make one call. Momentum starts with the first move, not the perfect moment." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the best way to build momentum when you feel stuck?", choicesJson: JSON.stringify(["Wait for inspiration to strike", "Take one small action — any action — that moves you forward", "Plan extensively before doing anything", "Only act when everything is perfectly aligned"]), answerJson: JSON.stringify("Take one small action — any action — that moves you forward"), explain: "Action creates energy. Even a tiny step breaks inertia and gets things moving." },
    { type: "TRUE_FALSE", order: 3, prompt: "You need to feel motivated before you can start building momentum.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Motivation follows action. Start with one small thing, and motivation catches up." },
  ]);

  const c4_4 = await upsertLesson({ moduleId: unitC4.id, title: "When Plans Fall Apart", slug: "plans-fall-apart", order: 4, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c4_4.id, [
    { type: "INFO", order: 1, prompt: "Plans Will Break — That's Normal", body: "Every plan meets reality eventually. The goal isn't a perfect plan — it's a flexible one. When something goes wrong, ask: 'What's still true? What's changed? What's my next move?' Adapt, don't abandon." },
    { type: "SCENARIO", order: 2, prompt: "Scenario: You planned to start a job Monday but your transportation fell through.", body: "What do you do?", choicesJson: JSON.stringify(["Don't show up and hope they understand", "Call the employer immediately, explain the situation, and ask about alternative transportation or a delayed start", "Quit before you even start", "Blame someone else and get angry"]), answerJson: JSON.stringify("Call the employer immediately, explain the situation, and ask about alternative transportation or a delayed start"), explain: "Proactive communication shows reliability. Most employers will work with you if you communicate early." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "When your plan fails, the best first step is:", choicesJson: JSON.stringify(["Give up entirely", "Assess what's still working and what needs to change", "Make someone else responsible", "Start a completely new plan from scratch"]), answerJson: JSON.stringify("Assess what's still working and what needs to change"), explain: "Most plan failures are partial. Identify what still works and adjust the broken part." },
    { type: "INFO", order: 4, prompt: "Mission: Write Your 'Plan B' Template", body: "For your current biggest goal, write: 'If ___ goes wrong, I will ___.' Having a Plan B before you need it reduces panic when things shift." },
  ]);

  const c4_chk = await upsertLesson({ moduleId: unitC4.id, title: "Long-Term Thinking: Checkpoint", slug: "long-term-checkpoint", order: 5, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(c4_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 4 Review: Thinking Beyond Today", body: "You've learned future-self thinking, backward planning, momentum building, and adapting when plans change. These skills turn dreams into roadmaps." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What is 'backward planning'?", choicesJson: JSON.stringify(["Planning to go backward in life", "Starting with your end goal and working backward to identify what needs to happen first", "Only planning for things that already happened", "Letting other people make your plan"]), answerJson: JSON.stringify("Starting with your end goal and working backward to identify what needs to happen first"), explain: "Backward planning turns big goals into step-by-step action items with clear milestones." },
    { type: "TRUE_FALSE", order: 3, prompt: "When a plan fails, the best approach is usually to adapt — not abandon.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Most plan failures are partial. Assess what still works, adjust what doesn't, and keep moving." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Why does 'future-self thinking' improve decisions?", choicesJson: JSON.stringify(["It doesn't — only the present matters", "It connects today's choices to tomorrow's outcomes, helping you invest in your own future", "It makes you anxious about the future", "It only works for wealthy people"]), answerJson: JSON.stringify("It connects today's choices to tomorrow's outcomes, helping you invest in your own future"), explain: "When you see your future self as real, you're more likely to make choices that serve them." },
  ]);

  // --- Unit C5: Confidence Through Action ---
  const unitC5 = await upsertModule({ pathId: journeyC.id, title: "Confidence Through Action", slug: "confidence-action", order: 5 });

  const c5_1 = await upsertLesson({ moduleId: unitC5.id, title: "Action Before Confidence", slug: "action-before-confidence", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c5_1.id, [
    { type: "INFO", order: 1, prompt: "Confidence Comes AFTER Action", body: "Most people wait to feel confident before they act. But confidence is built by doing — not by waiting. You don't feel ready, then act. You act, learn you can handle it, then feel ready for the next thing." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What builds real confidence?", choicesJson: JSON.stringify(["Positive affirmations alone", "Taking action even when you're not sure, and seeing that you survive", "Waiting until you feel completely ready", "Only doing things you're already good at"]), answerJson: JSON.stringify("Taking action even when you're not sure, and seeing that you survive"), explain: "Every action you take — even imperfect ones — builds evidence that you can handle things. That's real confidence." },
    { type: "TRUE_FALSE", order: 3, prompt: "You should wait until you feel confident before taking action on your goals.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Confidence is the result of action, not the prerequisite. Act first — confidence follows." },
  ]);

  const c5_2 = await upsertLesson({ moduleId: unitC5.id, title: "Building a Track Record", slug: "building-track-record", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c5_2.id, [
    { type: "INFO", order: 1, prompt: "Stack Small Wins", body: "Confidence isn't one big victory — it's a stack of small wins. Made a phone call you were nervous about? Win. Showed up on time? Win. Finished a lesson? Win. Each one adds to your evidence file: 'I can do hard things.'" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why is tracking small wins important?", choicesJson: JSON.stringify(["It isn't — only big wins matter", "Small wins build momentum and remind you that you're capable and making progress", "Tracking things is a waste of time", "Only winning big competitions counts"]), answerJson: JSON.stringify("Small wins build momentum and remind you that you're capable and making progress"), explain: "Your brain needs evidence. When you track small wins, you create undeniable proof of your progress." },
    { type: "INFO", order: 3, prompt: "Mission: Start Your Wins List", body: "Write down 3 wins from this week — even tiny ones. Did you show up somewhere? Learn something? Help someone? Those count. Keep adding to this list every week." },
  ]);

  const c5_3 = await upsertLesson({ moduleId: unitC5.id, title: "Asking for What You Need", slug: "asking-what-you-need", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(c5_3.id, [
    { type: "INFO", order: 1, prompt: "Asking Is a Skill, Not a Weakness", body: "Many people struggling with homelessness have been told they're 'too much' or 'always asking for something.' But asking for help is a life skill. The key is being specific, respectful, and clear. Good askers get more help — that's a fact." },
    { type: "SCENARIO", order: 2, prompt: "Scenario: You need help getting to a job interview but feel embarrassed to ask anyone.", body: "What's the best approach?", choicesJson: JSON.stringify(["Skip the interview", "Be specific: 'I have a job interview Thursday at 2pm on Main Street. Could you give me a ride or help me find a bus route?'", "Post a vague message on social media", "Wait and hope someone offers"]), answerJson: JSON.stringify("Be specific: 'I have a job interview Thursday at 2pm on Main Street. Could you give me a ride or help me find a bus route?'"), explain: "Specific asks are easier to say yes to. Give people the details they need to help you." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "Which request is most likely to get a positive response?", choicesJson: JSON.stringify(["Can somebody help me?", "I need someone to look at my resume before I apply for a job at Target this week. Could you spend 10 minutes?", "I need help with everything", "Help me or I'll be stuck forever"]), answerJson: JSON.stringify("I need someone to look at my resume before I apply for a job at Target this week. Could you spend 10 minutes?"), explain: "This request is specific (resume), time-bound (this week), and clear about the ask (10 minutes). That's easy to say yes to." },
  ]);

  const unitC_cap = await upsertModule({ pathId: journeyC.id, title: "Building Your Future Capstone", slug: "building-future-capstone", order: 6 });
  const c_capstone = await upsertLesson({ moduleId: unitC_cap.id, title: "Building Your Future: Final Challenge", slug: "building-future-capstone-lesson", order: 1, xpReward: 25, lessonType: "capstone", estimatedMinutes: 15 });
  await seedCards(c_capstone.id, [
    { type: "INFO", order: 1, prompt: "Capstone: Your Future Starts Here", body: "You've worked on identity, growth mindset, decision-making, long-term thinking, and confidence through action. This capstone brings it all together. You're not just learning — you're becoming someone who builds." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Your big goal is 'become financially stable.' Which is the best next step to take this week?", choicesJson: JSON.stringify(["Wait until the situation is perfect", "Set a $1/day savings micro-habit and track it for 7 days", "Make one huge change all at once", "Tell everyone about your plan but don't start yet"]), answerJson: JSON.stringify("Set a $1/day savings micro-habit and track it for 7 days"), explain: "Tiny consistent actions build real momentum. $1/day for a year is $365 — and the habit itself is the real prize." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You start a new routine but miss 3 days in a row.", body: "What's the most effective response?", choicesJson: JSON.stringify(["Abandon the habit entirely", "Restart the next day without self-judgment — missing days doesn't erase progress", "Punish yourself for failing", "Wait until you feel motivated again"]), answerJson: JSON.stringify("Restart the next day without self-judgment — missing days doesn't erase progress"), explain: "The goal is to never miss twice. One missed day is a pause — your progress still counts." },
    { type: "TRUE_FALSE", order: 4, prompt: "Your values should guide your biggest life decisions.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "When you know what matters most to you, decisions get clearer. Values are your compass." },
    { type: "INFO", order: 5, prompt: "Mission: Build Your 90-Day Plan", body: "You've earned the Building Your Future capstone! Write 1 big goal, 3 mid-goals, and 9 next steps. Use backward planning. You have a roadmap. Now walk it." },
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
    estimatedHours: 5.5,
    targetAudience: "All learners",
    difficulty: "foundational",
  });

  // --- Unit D1: Money Mindset and Basics ---
  const unitD1 = await upsertModule({ pathId: journeyD.id, title: "Money Mindset & Basics", slug: "money-mindset-basics", order: 1 });

  const d1_1 = await upsertLesson({ moduleId: unitD1.id, title: "Money Language", slug: "money-language", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d1_1.id, [
    { type: "INFO", order: 1, prompt: "Words That Control Your Money", body: "Income is money coming in. Expenses are money going out. Net is what's left. Fees are what they take. Knowing these words means no one can confuse you about your own money." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What does 'net income' mean?", choicesJson: JSON.stringify(["All the money you earn before anything is taken out", "The money left after taxes and deductions", "Money you owe to others", "Your credit score"]), answerJson: JSON.stringify("The money left after taxes and deductions"), explain: "Net income is your 'take-home' pay — the actual money you have to work with." },
    { type: "TRUE_FALSE", order: 3, prompt: "Gross income and net income are the same thing.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Gross is before deductions. Net is after. Always budget from your net — that's what you actually have." },
  ]);

  const d1_2 = await upsertLesson({ moduleId: unitD1.id, title: "Needs vs Wants", slug: "needs-vs-wants", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d1_2.id, [
    { type: "INFO", order: 1, prompt: "No Judgment, Just Clarity", body: "Needs keep you alive and stable: food, shelter, hygiene, transportation. Wants make life better: entertainment, treats, upgrades. This isn't about shame — it's about knowing where your money goes so YOU control it." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which of these is a 'need'?", choicesJson: JSON.stringify(["Streaming subscription", "Bus pass to get to work", "New shoes when yours still work", "Fast food upgrade to large size"]), answerJson: JSON.stringify("Bus pass to get to work"), explain: "Transportation to work protects your income. That's a need. Everything else can wait if money is tight." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You get paid $200. Your phone bill is $45, food for the week is $60, and you want a $50 jacket.", body: "How do you prioritize?", choicesJson: JSON.stringify(["Buy the jacket first — you deserve it", "Phone ($45) + food ($60) = $105 in needs first, then decide about the jacket with what's left", "Pay nothing and save it all", "Lend the money to a friend"]), answerJson: JSON.stringify("Phone ($45) + food ($60) = $105 in needs first, then decide about the jacket with what's left"), explain: "Needs first, then evaluate wants from what remains. You still have $95 — decide how to split it wisely." },
  ]);

  const d1_3 = await upsertLesson({ moduleId: unitD1.id, title: "Money Anxiety Reset", slug: "money-anxiety", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d1_3.id, [
    { type: "INFO", order: 1, prompt: "Numbers First, Feelings Second", body: "Money stress is real. But avoiding your numbers makes anxiety worse. Look at the actual amount. Write it down. Now it's a fact, not a monster. Facts can be solved." },
    { type: "TRUE_FALSE", order: 2, prompt: "Avoiding looking at your bank balance helps reduce money stress.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Avoidance increases anxiety. Knowing the real number — even if it's scary — gives you power to plan." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "What's the first step to reducing money anxiety?", choicesJson: JSON.stringify(["Make more money immediately", "Write down exactly how much you have and what you owe — turn the unknown into a known", "Stop thinking about money entirely", "Borrow money to feel more secure"]), answerJson: JSON.stringify("Write down exactly how much you have and what you owe — turn the unknown into a known"), explain: "You can't manage what you don't measure. The number might be small, but knowing it gives you control." },
    { type: "INFO", order: 4, prompt: "Mission: Do Your Money Check-In", body: "Right now, write down: How much money do I have? What bills are due this week? What's left? That's your financial snapshot. You just took control." },
  ]);

  const d1_4 = await upsertLesson({ moduleId: unitD1.id, title: "Money Beliefs That Hold You Back", slug: "money-beliefs", order: 4, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d1_4.id, [
    { type: "INFO", order: 1, prompt: "Check Your Money Stories", body: "Many of us grew up hearing 'money is the root of all evil' or 'people like us don't get rich.' These beliefs shape how we handle money. You can keep the lessons from your past without keeping the limiting beliefs." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which money belief is most likely to hold someone back?", choicesJson: JSON.stringify(["I can learn to manage money better", "Money is evil and wanting it makes me a bad person", "Small amounts of money still matter", "Budgeting is a useful skill for everyone"]), answerJson: JSON.stringify("Money is evil and wanting it makes me a bad person"), explain: "This belief creates guilt around earning and saving. Money is a tool — how you use it reflects your values." },
    { type: "TRUE_FALSE", order: 3, prompt: "You need to earn a lot of money before learning to manage it well.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Money management skills work at every income level. If you can manage $100 well, you can manage $1,000 well." },
  ]);

  const d1_chk = await upsertLesson({ moduleId: unitD1.id, title: "Money Mindset: Checkpoint", slug: "money-mindset-checkpoint", order: 5, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(d1_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 1 Review: Money Mindset Foundations", body: "You've learned money language, needs vs wants, how to manage money anxiety, and how beliefs shape your relationship with money." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What should you budget from — gross income or net income?", choicesJson: JSON.stringify(["Gross income", "Net income — the money you actually take home", "Whatever number is higher", "It doesn't matter"]), answerJson: JSON.stringify("Net income — the money you actually take home"), explain: "Net income is what's actually in your pocket. Budget from reality, not the pre-tax number." },
    { type: "TRUE_FALSE", order: 3, prompt: "Looking at your actual bank balance reduces money anxiety more than avoiding it.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Known numbers can be planned for. Unknown numbers create fear." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Why is it important to distinguish needs from wants?", choicesJson: JSON.stringify(["So you never buy anything fun", "So you can prioritize essential spending and make informed choices with what's left", "Wants are always bad", "Only poor people need to think about this"]), answerJson: JSON.stringify("So you can prioritize essential spending and make informed choices with what's left"), explain: "It's not about deprivation — it's about knowing what must be covered first so you can enjoy the rest guilt-free." },
  ]);

  // --- Unit D2: Banking Basics ---
  const unitD2 = await upsertModule({ pathId: journeyD.id, title: "Banking Basics", slug: "banking-basics", order: 2 });

  const d2_1 = await upsertLesson({ moduleId: unitD2.id, title: "Why You Need a Bank Account", slug: "why-bank-account", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d2_1.id, [
    { type: "INFO", order: 1, prompt: "Cash-Only Costs You Money", body: "Check-cashing stores charge 2-5% fees. That's $10-25 on a $500 check — money lost every payday. A bank account is free at most credit unions and many banks. It saves you money, builds a record, and keeps your cash safe." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "How much can check-cashing fees cost you per year if you earn $1,500/month?", choicesJson: JSON.stringify(["Nothing", "$360-$900 per year (2-5% of every check)", "$50 total", "The same as a bank account"]), answerJson: JSON.stringify("$360-$900 per year (2-5% of every check)"), explain: "That's money going straight to the check-cashing company instead of your pocket. A free bank account eliminates this." },
    { type: "TRUE_FALSE", order: 3, prompt: "You need a permanent address to open a bank account.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Many banks accept shelter addresses, PO boxes, or even a trusted friend's address. Some banks serve people without traditional addresses." },
  ]);

  const d2_2 = await upsertLesson({ moduleId: unitD2.id, title: "Checking vs Savings Accounts", slug: "checking-vs-savings", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d2_2.id, [
    { type: "INFO", order: 1, prompt: "Two Buckets for Your Money", body: "Checking: your everyday spending account — pay bills, buy food, use your debit card. Savings: your 'don't touch' account — emergency fund, goals, deposits. Having both keeps your spending money separate from your safety net." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the main purpose of a savings account?", choicesJson: JSON.stringify(["Daily spending", "Setting aside money for emergencies and goals — separate from what you spend", "Paying bills", "Getting rich quickly"]), answerJson: JSON.stringify("Setting aside money for emergencies and goals — separate from what you spend"), explain: "Savings accounts create a barrier between you and your reserve money. Out of sight, harder to spend impulsively." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You get paid $400. Rent is $200, phone is $50, and you want to save.", body: "How should you split this between checking and savings?", choicesJson: JSON.stringify(["Put it all in checking", "$250 in checking (rent + phone) and $150 in savings", "Put it all in savings", "Don't deposit it — keep cash"]), answerJson: JSON.stringify("$250 in checking (rent + phone) and $150 in savings"), explain: "Cover your known expenses in checking, move the rest to savings before you can spend it. Pay yourself first." },
  ]);

  const d2_3 = await upsertLesson({ moduleId: unitD2.id, title: "Avoiding Bank Fees", slug: "avoiding-bank-fees", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d2_3.id, [
    { type: "INFO", order: 1, prompt: "Fees Are Avoidable If You Know the Rules", body: "Common fees: overdraft ($35), monthly maintenance ($5-15), ATM ($2-5). Avoid them: use a no-fee credit union, opt out of overdraft protection, use in-network ATMs, and keep your balance above the minimum." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the best way to avoid overdraft fees?", choicesJson: JSON.stringify(["Keep overdraft protection turned on", "Opt OUT of overdraft protection — your card will decline instead of charging you $35", "Never use your debit card", "Keep $10,000 in your account at all times"]), answerJson: JSON.stringify("Opt OUT of overdraft protection — your card will decline instead of charging you $35"), explain: "A declined card is embarrassing for a moment. A $35 fee hurts for weeks. Choose the declined card." },
    { type: "TRUE_FALSE", order: 3, prompt: "Credit unions typically have lower fees than big banks.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Credit unions are member-owned, not profit-driven. They generally charge fewer and lower fees." },
  ]);

  const d2_4 = await upsertLesson({ moduleId: unitD2.id, title: "Using a Debit Card Safely", slug: "debit-card-safety", order: 4, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d2_4.id, [
    { type: "INFO", order: 1, prompt: "Your Debit Card Is a Direct Line to Your Money", body: "Unlike credit cards, debit cards pull directly from your checking account. If someone steals your debit card info, they're spending YOUR money. Protect it: never share your PIN, check your balance regularly, and report lost cards immediately." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What should you do if you notice a charge on your account that you didn't make?", choicesJson: JSON.stringify(["Ignore it — it's probably fine", "Contact your bank immediately to dispute the charge and freeze your card", "Wait a month to see if it happens again", "Close your account and never use a bank again"]), answerJson: JSON.stringify("Contact your bank immediately to dispute the charge and freeze your card"), explain: "Speed matters with fraud. The sooner you report it, the more likely you are to get your money back." },
    { type: "TRUE_FALSE", order: 3, prompt: "It's safe to share your debit card PIN with close friends.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Your PIN is like your house key. Only you should know it. If someone else uses your card with your PIN, the bank may not cover the loss." },
  ]);

  const d2_chk = await upsertLesson({ moduleId: unitD2.id, title: "Banking Basics: Checkpoint", slug: "banking-checkpoint", order: 5, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(d2_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 2 Review: Banking Foundations", body: "You've learned why bank accounts matter, how checking and savings work, how to avoid fees, and how to protect your debit card." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why is a bank account better than check-cashing stores?", choicesJson: JSON.stringify(["It isn't — check-cashing is fine", "Bank accounts save you 2-5% in fees, keep your money safe, and build financial records", "Banks are always free", "Check-cashing stores give better rates"]), answerJson: JSON.stringify("Bank accounts save you 2-5% in fees, keep your money safe, and build financial records"), explain: "Every dollar saved on check-cashing fees is a dollar that stays in YOUR pocket." },
    { type: "TRUE_FALSE", order: 3, prompt: "Opting out of overdraft protection means your card is declined instead of charged a $35 fee.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "A declined transaction costs $0. An overdraft costs $35. The math is clear." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "If you notice a fraudulent charge on your debit card, you should:", choicesJson: JSON.stringify(["Wait and see if more charges appear", "Contact your bank immediately and freeze the card", "Post about it on social media", "Cancel your bank account permanently"]), answerJson: JSON.stringify("Contact your bank immediately and freeze the card"), explain: "Time is critical with fraud. Fast reporting protects your money and your rights." },
  ]);

  // --- Unit D3: Budgeting Systems ---
  const unitD3 = await upsertModule({ pathId: journeyD.id, title: "Budgeting Systems", slug: "budgeting-systems", order: 3 });

  const d3_1 = await upsertLesson({ moduleId: unitD3.id, title: "Weekly Cash Plan", slug: "weekly-cash-plan", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d3_1.id, [
    { type: "INFO", order: 1, prompt: "Plan Your Week, Not Your Month", body: "Monthly budgets feel too big. Weekly is easier: How much do I have this week? What must I pay? What's left? That's your spending money. Simple." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You have $60 for the week. Rent and phone are paid. What's the smartest first spend?", choicesJson: JSON.stringify(["$30 on entertainment", "Food and bus fare for the week", "$60 on new clothes", "Lend it to a friend"]), answerJson: JSON.stringify("Food and bus fare for the week"), explain: "Cover basics first. Food and transportation protect your health and income. Extras come from what's left." },
    { type: "INFO", order: 3, prompt: "Mission: Make Your Weekly Cash Plan", body: "This week: write down income, fixed costs, and what's left. That leftover number is what you have for everything else. That's your weekly plan." },
  ]);

  const d3_2 = await upsertLesson({ moduleId: unitD3.id, title: "The Envelope Method", slug: "envelope-method", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d3_2.id, [
    { type: "INFO", order: 1, prompt: "Physical Money, Physical Limits", body: "The envelope method: put cash into labeled envelopes — Food, Transport, Personal. When an envelope is empty, you're done spending in that category. It makes your limits real and visible." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why does the envelope method work for many people?", choicesJson: JSON.stringify(["Cash is more convenient", "Physical separation makes limits real — you can SEE when money is running low", "It's the only budgeting method that works", "Digital banking is too complicated"]), answerJson: JSON.stringify("Physical separation makes limits real — you can SEE when money is running low"), explain: "Swiping a card doesn't feel like spending. Watching cash leave an envelope does. That awareness prevents overspending." },
    { type: "TRUE_FALSE", order: 3, prompt: "The envelope method only works if you have a lot of money.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "It works especially well with small amounts. Even $50 split into 3 envelopes gives you structure and control." },
  ]);

  const d3_3 = await upsertLesson({ moduleId: unitD3.id, title: "Tracking Your Spending", slug: "tracking-spending", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d3_3.id, [
    { type: "INFO", order: 1, prompt: "Know Where Your Money Actually Goes", body: "Most people think they know where their money goes — but they're wrong. Track every purchase for one week. You'll find 'leaks' — small purchases that add up: $3 here, $5 there. Those leaks can be plugged and redirected." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's a 'money leak'?", choicesJson: JSON.stringify(["A hole in your wallet", "Small, frequent purchases you don't notice that add up to significant money over time", "A broken ATM", "Giving money to charity"]), answerJson: JSON.stringify("Small, frequent purchases you don't notice that add up to significant money over time"), explain: "$3/day on snacks = $90/month = $1,080/year. That's a leak worth noticing." },
    { type: "INFO", order: 3, prompt: "Mission: Track Every Dollar This Week", body: "For 7 days, write down every purchase — even vending machines and small buys. At the end of the week, look for your biggest leak." },
  ]);

  const d3_chk = await upsertLesson({ moduleId: unitD3.id, title: "Budgeting Systems: Checkpoint", slug: "budgeting-checkpoint", order: 4, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(d3_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 3 Review: Budgeting That Works", body: "You've learned the weekly cash plan, envelope method, and spending tracking. These are practical systems that work at any income level." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why is weekly budgeting easier than monthly?", choicesJson: JSON.stringify(["It isn't — monthly is always better", "Weeks are shorter and easier to plan, with quicker feedback on your spending", "You can only budget monthly with a bank account", "Weekly budgeting requires special software"]), answerJson: JSON.stringify("Weeks are shorter and easier to plan, with quicker feedback on your spending"), explain: "A week is manageable. You can see your progress and adjust quickly before things go off track." },
    { type: "TRUE_FALSE", order: 3, prompt: "Tracking your spending for just one week can reveal significant money leaks.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Even one week of tracking reveals patterns you didn't know existed." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "What makes the envelope method effective?", choicesJson: JSON.stringify(["It's high-tech", "Physical cash separation makes spending limits visible and tangible", "It requires a bank account", "You need a lot of envelopes"]), answerJson: JSON.stringify("Physical cash separation makes spending limits visible and tangible"), explain: "Seeing cash dwindle in an envelope creates natural spending awareness that cards don't provide." },
  ]);

  // --- Unit D4: Credit and Debt ---
  const unitD4 = await upsertModule({ pathId: journeyD.id, title: "Credit & Debt", slug: "credit-debt", order: 4 });

  const d4_1 = await upsertLesson({ moduleId: unitD4.id, title: "What Is Credit and Why It Matters", slug: "what-is-credit", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d4_1.id, [
    { type: "INFO", order: 1, prompt: "Credit Is Your Financial Reputation", body: "Your credit score (300-850) tells lenders, landlords, and employers how reliably you handle money. Higher scores mean better apartments, lower interest rates, and more opportunities. It's not about being rich — it's about being reliable." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What does a credit score measure?", choicesJson: JSON.stringify(["How much money you have", "How reliably you pay back borrowed money over time", "How smart you are with money", "Your total income"]), answerJson: JSON.stringify("How reliably you pay back borrowed money over time"), explain: "Credit scores track your history of borrowing and repaying. Consistency matters more than income." },
    { type: "TRUE_FALSE", order: 3, prompt: "You need to be wealthy to have a good credit score.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Income isn't part of your credit score. A person earning minimum wage who pays bills on time can have excellent credit." },
  ]);

  const d4_2 = await upsertLesson({ moduleId: unitD4.id, title: "Good Debt vs Bad Debt", slug: "good-bad-debt", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d4_2.id, [
    { type: "INFO", order: 1, prompt: "Not All Debt Is Equal", body: "Good debt builds your future: student loans for a degree, a car loan to get to work. Bad debt traps you: payday loans at 400% interest, credit card debt on things you don't need. The question is: does this debt move me forward or hold me back?" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is an example of 'good debt'?", choicesJson: JSON.stringify(["A payday loan to buy new clothes", "A small car loan so you can get to your job reliably", "Credit card debt from impulse shopping", "Borrowing from a friend to gamble"]), answerJson: JSON.stringify("A small car loan so you can get to your job reliably"), explain: "This debt protects your income. The car gets you to work, which pays for the loan and more." },
    { type: "TRUE_FALSE", order: 3, prompt: "Payday loans typically have interest rates over 300%.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Payday loans average 300-400% APR. A $300 loan can cost you $450+ to repay. Avoid them if possible." },
  ]);

  const d4_3 = await upsertLesson({ moduleId: unitD4.id, title: "Building Credit from Zero", slug: "building-credit", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d4_3.id, [
    { type: "INFO", order: 1, prompt: "Everyone Starts Somewhere", body: "No credit isn't bad credit — it's a blank page. Build credit: get a secured credit card (you deposit $200 as collateral), charge something small each month, and pay it off in full. In 6-12 months, you'll have a credit score." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's a secured credit card?", choicesJson: JSON.stringify(["A card that's physically harder to steal", "A card where you deposit money upfront as collateral, and that deposit is your credit limit", "A card with no spending limit", "A gift card from a store"]), answerJson: JSON.stringify("A card where you deposit money upfront as collateral, and that deposit is your credit limit"), explain: "You put down $200, you get a $200 credit limit. It's training wheels for credit. Low risk, high reward." },
    { type: "INFO", order: 3, prompt: "Mission: Research One Secured Credit Card", body: "Look up one secured credit card option (many credit unions offer them). Note the deposit amount and fees. This could be your first step to building credit." },
  ]);

  const d4_chk = await upsertLesson({ moduleId: unitD4.id, title: "Credit and Debt: Checkpoint", slug: "credit-debt-checkpoint", order: 4, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(d4_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 4 Review: Understanding Credit and Debt", body: "You've learned what credit scores measure, the difference between good and bad debt, and how to start building credit from nothing." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the most important factor in your credit score?", choicesJson: JSON.stringify(["Your income level", "Paying bills on time consistently", "How many credit cards you have", "Your job title"]), answerJson: JSON.stringify("Paying bills on time consistently"), explain: "Payment history is the #1 factor — making up about 35% of your score. Consistency is everything." },
    { type: "TRUE_FALSE", order: 3, prompt: "A secured credit card requires a deposit that becomes your credit limit.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "The deposit reduces the bank's risk, making it possible for people with no credit history to get started." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Which type of debt is most likely to trap you financially?", choicesJson: JSON.stringify(["A student loan with 5% interest", "A payday loan with 400% interest", "A car loan that gets you to work", "A medical payment plan with 0% interest"]), answerJson: JSON.stringify("A payday loan with 400% interest"), explain: "Payday loans charge extreme interest rates that can trap you in a cycle of debt. Avoid them when possible." },
  ]);

  // --- Unit D5: Saving and Emergency Funds ---
  const unitD5 = await upsertModule({ pathId: journeyD.id, title: "Saving & Emergency Funds", slug: "saving-emergency", order: 5 });

  const d5_1 = await upsertLesson({ moduleId: unitD5.id, title: "Why Saving Matters Even When You Have Almost Nothing", slug: "why-saving-matters", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d5_1.id, [
    { type: "INFO", order: 1, prompt: "Small Savings Prevent Big Crises", body: "A flat tire costs $80. A lost ID costs $30. Without savings, these small emergencies become crises. Even $5/week adds up to $260/year — enough to handle most common emergencies without borrowing at high interest." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why is saving important even when you earn very little?", choicesJson: JSON.stringify(["It isn't — saving is only for people who earn a lot", "Even small savings prevent minor emergencies from becoming major crises", "You should spend everything you earn", "Saving is pointless if you can't save $1,000"]), answerJson: JSON.stringify("Even small savings prevent minor emergencies from becoming major crises"), explain: "$5/week = $260/year. That's enough to replace a lost ID, fix a phone, or cover unexpected transportation." },
    { type: "TRUE_FALSE", order: 3, prompt: "You need to save at least $100/month for saving to be worthwhile.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Even $1/day matters. The habit of saving is as valuable as the amount saved." },
  ]);

  const d5_2 = await upsertLesson({ moduleId: unitD5.id, title: "Building Your Emergency Fund", slug: "emergency-fund", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d5_2.id, [
    { type: "INFO", order: 1, prompt: "Your First Goal: $500", body: "Financial experts recommend starting with a $500 emergency fund. That covers most common emergencies: car trouble, medical co-pay, urgent travel, lost phone. Save $10/week and you'll hit $500 in under a year." },
    { type: "SCENARIO", order: 2, prompt: "Scenario: You've saved $200 in your emergency fund. A friend asks to borrow $150 for a concert ticket.", body: "What should you do?", choicesJson: JSON.stringify(["Lend the money — they're your friend", "Explain that it's your emergency fund and you can't lend it for non-emergencies", "Give them all $200", "Empty your emergency fund — you can rebuild later"]), answerJson: JSON.stringify("Explain that it's your emergency fund and you can't lend it for non-emergencies"), explain: "Emergency funds are for emergencies — not social spending. Protecting this money protects your stability." },
    { type: "INFO", order: 3, prompt: "Mission: Set Your Emergency Fund Target", body: "Decide your first savings goal: $100, $250, or $500. Calculate how much you'd need to save weekly to reach it. Write it down. That's your plan." },
  ]);

  const d5_3 = await upsertLesson({ moduleId: unitD5.id, title: "Saving Tricks That Actually Work", slug: "saving-tricks", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d5_3.id, [
    { type: "INFO", order: 1, prompt: "Automate and Hide Your Savings", body: "The best saving trick: make it automatic and invisible. Have your bank move $5 to savings on payday — before you can spend it. Use a separate account you don't check. What you don't see, you don't spend." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which saving strategy is most effective?", choicesJson: JSON.stringify(["Save whatever is left at the end of the month", "Automatically transfer a set amount to savings on payday — before you spend anything", "Keep all your money in one account", "Only save when you feel like it"]), answerJson: JSON.stringify("Automatically transfer a set amount to savings on payday — before you spend anything"), explain: "Pay yourself first. If saving is the first thing that happens, it always happens." },
    { type: "TRUE_FALSE", order: 3, prompt: "Keeping savings in a separate account you rarely check helps prevent spending it.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Out of sight, out of mind. A separate savings account creates a healthy barrier between you and your reserve." },
  ]);

  // --- Unit D6: Scams and Safety ---
  const unitD6 = await upsertModule({ pathId: journeyD.id, title: "Scams & Safety", slug: "scams-safety", order: 6 });

  const d6_1 = await upsertLesson({ moduleId: unitD6.id, title: "Spot the Scam", slug: "spot-scam", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d6_1.id, [
    { type: "INFO", order: 1, prompt: "If It Sounds Too Good, It Probably Is", body: "Scammers target people who are struggling. Common tricks: 'You won a prize,' 'Pay a fee to get your benefits,' 'Give me your card number for verification.' Real agencies never ask for money upfront." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone texts: 'You've been approved for $5,000! Just send $50 processing fee.' What should you do?", choicesJson: JSON.stringify(["Send the $50 immediately", "Delete and block — it's a scam", "Give them your bank info", "Share it with friends so they can get money too"]), answerJson: JSON.stringify("Delete and block — it's a scam"), explain: "Legitimate programs never ask for money upfront. If they want money to give you money, it's always a scam." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: Someone at a bus stop says they can get your credit score to 800 for $100.", body: "What's the right move?", choicesJson: JSON.stringify(["Pay them — $100 for an 800 credit score is a great deal", "Walk away — no one can guarantee a specific credit score, and this is a scam", "Give them $50 and see if it works first", "Ask for references from other customers"]), answerJson: JSON.stringify("Walk away — no one can guarantee a specific credit score, and this is a scam"), explain: "No one can guarantee a specific credit score. Anyone who says they can is lying. Walk away." },
  ]);

  const d6_2 = await upsertLesson({ moduleId: unitD6.id, title: "Protecting Your Identity", slug: "protecting-identity", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(d6_2.id, [
    { type: "INFO", order: 1, prompt: "Your Social Security Number Is Gold", body: "Identity thieves use your SSN, date of birth, and address to open accounts in your name. Never share your SSN unless you're sure who's asking and why. Shred old documents. Check your credit report annually at annualcreditreport.com — it's free." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "When is it appropriate to give someone your Social Security number?", choicesJson: JSON.stringify(["Whenever they ask", "Only to verified employers, government agencies, banks, and medical providers for legitimate purposes", "To anyone who says they need it for a 'background check'", "On social media for verification"]), answerJson: JSON.stringify("Only to verified employers, government agencies, banks, and medical providers for legitimate purposes"), explain: "Your SSN is the key to your financial identity. Guard it carefully and only share with verified, legitimate organizations." },
    { type: "TRUE_FALSE", order: 3, prompt: "You can check your credit report once a year for free at annualcreditreport.com.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Federal law entitles you to one free credit report from each bureau annually. Use it." },
  ]);

  const unitD_cap = await upsertModule({ pathId: journeyD.id, title: "Financial Literacy Capstone", slug: "financial-literacy-capstone", order: 7 });
  const d_capstone = await upsertLesson({ moduleId: unitD_cap.id, title: "Financial Literacy: Final Challenge", slug: "financial-literacy-capstone-lesson", order: 1, xpReward: 25, lessonType: "capstone", estimatedMinutes: 15 });
  await seedCards(d_capstone.id, [
    { type: "INFO", order: 1, prompt: "Capstone: Your Money, Your Power", body: "You've learned money language, banking, budgeting, credit, saving, and scam protection. This final challenge brings it all together. Financial confidence is built one smart decision at a time." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "You have $80 this week. Rent is paid. You need food ($30), bus ($15), and want a $40 item. What's the smartest choice?", choicesJson: JSON.stringify(["Buy the $40 item now and skip the bus", "Cover food and bus ($45) and save $35 toward the item", "Don't spend any of it", "Borrow $40 to buy the item this week"]), answerJson: JSON.stringify("Cover food and bus ($45) and save $35 toward the item"), explain: "Needs first, then savings toward wants. This is the weekly cash plan working in real life." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: A friend says you can double your money in a week if you invest with them.", body: "What do you do?", choicesJson: JSON.stringify(["Invest all your money immediately", "Research the offer independently before doing anything — it sounds like a scam", "Borrow money to invest more", "Ask other friends if they want to join"]), answerJson: JSON.stringify("Research the offer independently before doing anything — it sounds like a scam"), explain: "Any offer promising guaranteed, rapid returns is a red flag. Always verify before you invest." },
    { type: "TRUE_FALSE", order: 4, prompt: "Net income is the money you take home after taxes — not the total you earn.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Net income is what you actually have to work with. Budget from this number, not your gross salary." },
    { type: "INFO", order: 5, prompt: "Mission: Your Financial Snapshot", body: "List your current income, 3 regular expenses, your savings goal, and 1 action step for building credit. You have a financial plan. Now work it." },
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
    estimatedHours: 4.5,
    targetAudience: "All learners",
    difficulty: "foundational",
  });

  // --- Unit E1: Time and Organization ---
  const unitE1 = await upsertModule({ pathId: journeyE.id, title: "Time & Organization", slug: "time-organization", order: 1 });

  const e1_1 = await upsertLesson({ moduleId: unitE1.id, title: "Your Daily Anchor Routine", slug: "daily-anchor", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e1_1.id, [
    { type: "INFO", order: 1, prompt: "One Routine That Holds Everything Together", body: "An anchor routine is 2-3 things you do at the same time every day: wake up, drink water, check your schedule. It doesn't need to be big. It just needs to be consistent. This small anchor creates order in chaos." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What makes an anchor routine effective?", choicesJson: JSON.stringify(["It needs to take at least 2 hours", "It's short, consistent, and done at the same time daily", "It requires expensive supplies", "It only works at home"]), answerJson: JSON.stringify("It's short, consistent, and done at the same time daily"), explain: "Consistency creates stability. A 5-minute morning routine done daily is more powerful than a 2-hour routine done randomly." },
    { type: "INFO", order: 3, prompt: "Mission: Design Your Anchor Routine", body: "Write 3 things you'll do every morning in the same order. Example: check phone for appointments, drink water, plan your day's top task. Start tomorrow." },
  ]);

  const e1_2 = await upsertLesson({ moduleId: unitE1.id, title: "Keeping Track Without Technology", slug: "low-tech-organizing", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e1_2.id, [
    { type: "INFO", order: 1, prompt: "A Notebook Is the Original Smartphone", body: "You don't need apps to stay organized. A small notebook or even folded paper works: write tomorrow's tasks, appointments, and one thing you don't want to forget. Cross items off as you complete them. That's time management." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the simplest effective way to track daily tasks?", choicesJson: JSON.stringify(["Memorize everything and hope for the best", "Write them down on paper — a simple daily list you can check off", "Only track things digitally", "Don't track anything — just go with the flow"]), answerJson: JSON.stringify("Write them down on paper — a simple daily list you can check off"), explain: "Written lists free your brain from remembering and give you the satisfaction of crossing things off." },
    { type: "TRUE_FALSE", order: 3, prompt: "You need a smartphone to stay organized.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "People organized entire companies with notebooks long before smartphones existed. Paper still works perfectly." },
  ]);

  const e1_3 = await upsertLesson({ moduleId: unitE1.id, title: "Appointments and Showing Up", slug: "appointments-showing-up", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e1_3.id, [
    { type: "INFO", order: 1, prompt: "Showing Up Is Half the Battle", body: "Missing appointments costs you: rescheduling, lost benefits, wasted time. The fix: write every appointment down immediately, set a reminder, and plan your transportation the night before. Showing up on time shows people you're serious." },
    { type: "SCENARIO", order: 2, prompt: "Scenario: You have a benefits appointment at 10am tomorrow across town.", body: "How do you prepare?", choicesJson: JSON.stringify(["Set an alarm for 9:55am", "The night before: check the bus schedule, set an alarm for 8am, lay out what you need to bring, and confirm the address", "Don't worry about it until morning", "Hope someone reminds you"]), answerJson: JSON.stringify("The night before: check the bus schedule, set an alarm for 8am, lay out what you need to bring, and confirm the address"), explain: "Preparation the night before eliminates morning chaos. Plan transportation, documents, and timing in advance." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "Why does being on time matter so much?", choicesJson: JSON.stringify(["It doesn't — being late is fine", "It shows reliability, keeps your benefits active, and builds trust with the people helping you", "Only for work — not appointments", "Only when you feel like it"]), answerJson: JSON.stringify("It shows reliability, keeps your benefits active, and builds trust with the people helping you"), explain: "Being on time is one of the simplest ways to show you're dependable. It opens doors." },
  ]);

  const e1_chk = await upsertLesson({ moduleId: unitE1.id, title: "Time and Organization: Checkpoint", slug: "time-org-checkpoint", order: 4, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(e1_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 1 Review: Getting Organized", body: "You've learned about anchor routines, low-tech organization, and showing up prepared. These skills create structure that supports everything else." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What is an anchor routine?", choicesJson: JSON.stringify(["A complicated morning ritual", "A short, consistent set of actions done at the same time daily that creates structure", "Something only organized people do", "A routine that takes at least an hour"]), answerJson: JSON.stringify("A short, consistent set of actions done at the same time daily that creates structure"), explain: "Short + consistent + same time = anchor routine. It holds your day together." },
    { type: "TRUE_FALSE", order: 3, prompt: "Preparing for appointments the night before reduces the chance of missing them.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Night-before prep (transportation, documents, alarm) removes morning friction and excuses." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "What's the benefit of writing tasks on paper?", choicesJson: JSON.stringify(["Paper is expensive", "Writing tasks down frees your brain from remembering and lets you visually track progress", "It's outdated and doesn't work", "Only professionals need to write things down"]), answerJson: JSON.stringify("Writing tasks down frees your brain from remembering and lets you visually track progress"), explain: "Your brain is for thinking, not storing to-do lists. Get tasks out of your head and onto paper." },
  ]);

  // --- Unit E2: Professional Communication ---
  const unitE2 = await upsertModule({ pathId: journeyE.id, title: "Professional Communication", slug: "professional-communication", order: 2 });

  const e2_1 = await upsertLesson({ moduleId: unitE2.id, title: "Clear Requests", slug: "clear-requests", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e2_1.id, [
    { type: "INFO", order: 1, prompt: "Say What You Need Clearly", body: "A good request has 3 parts: what you need, by when, and why it matters. 'I need help with my application by Friday so I don't miss the deadline' is much better than 'Can you help me sometime?'" },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is the clearest request?", choicesJson: JSON.stringify(["Can you help me?", "I need a ride to my appointment at 2pm on Tuesday. Can you help?", "I might need something soon", "Whatever works for you"]), answerJson: JSON.stringify("I need a ride to my appointment at 2pm on Tuesday. Can you help?"), explain: "Specific requests get specific answers. Make it easy for people to say yes." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You need a case worker to fax a document for you.", body: "How do you ask?", choicesJson: JSON.stringify(["Hey, I need something", "Can you please fax my housing verification to this number by end of day? I need it for my application deadline tomorrow", "Fax my stuff whenever", "I don't want to bother you but..."]), answerJson: JSON.stringify("Can you please fax my housing verification to this number by end of day? I need it for my application deadline tomorrow"), explain: "What, where, when, why. This request has all four. It's respectful and clear." },
  ]);

  const e2_2 = await upsertLesson({ moduleId: unitE2.id, title: "Phone and Email Basics", slug: "phone-email-basics", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e2_2.id, [
    { type: "INFO", order: 1, prompt: "Professional Communication Opens Doors", body: "When calling about services or jobs: state your name, why you're calling, and what you need. For email: clear subject line, short message, and your contact info. These small things make you stand out as someone who's serious." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What should you include when leaving a voicemail?", choicesJson: JSON.stringify(["Just your first name", "Your full name, phone number, why you're calling, and the best time to reach you", "A long story about your situation", "Nothing — just call back later"]), answerJson: JSON.stringify("Your full name, phone number, why you're calling, and the best time to reach you"), explain: "Make it easy for them to call you back. Name, number, reason, availability — in 30 seconds or less." },
    { type: "TRUE_FALSE", order: 3, prompt: "A professional email subject line like 'Application follow-up — John Smith' is better than 'Hey'.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Subject lines tell people what to expect. A clear subject line gets your email opened and responded to faster." },
  ]);

  const e2_3 = await upsertLesson({ moduleId: unitE2.id, title: "Red Flags and Green Flags in Relationships", slug: "red-green-flags", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e2_3.id, [
    { type: "INFO", order: 1, prompt: "Trust Your Gut, Then Check the Facts", body: "Green flags: they respect your boundaries, follow through on promises, and make you feel safe. Red flags: they pressure you, isolate you, or make you feel like you owe them." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is a green flag in a relationship?", choicesJson: JSON.stringify(["They get angry when you say no", "They respect your boundaries and check in on you", "They tell you what to do all the time", "They only help when they want something"]), answerJson: JSON.stringify("They respect your boundaries and check in on you"), explain: "Safe people respect your 'no' and don't keep score. That's a green flag." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: A new acquaintance at the shelter offers help but wants access to your phone in return.", body: "What's this?", choicesJson: JSON.stringify(["A green flag — they're generous", "A red flag — help with strings attached is control, not kindness", "Totally normal", "A great deal"]), answerJson: JSON.stringify("A red flag — help with strings attached is control, not kindness"), explain: "Real help doesn't come with demands for your privacy or possessions. That's manipulation." },
  ]);

  const e2_4 = await upsertLesson({ moduleId: unitE2.id, title: "Boundary Scripts", slug: "boundary-scripts", order: 4, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e2_4.id, [
    { type: "INFO", order: 1, prompt: "Boundaries Are Not Mean", body: "Saying 'I can't do that right now' or 'That doesn't work for me' isn't rude — it's honest. Boundaries protect your energy so you can show up for the things that matter." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Someone asks you to lend money you can't afford to lose. What's a good boundary response?", choicesJson: JSON.stringify(["Sure, I'll figure it out somehow", "I care about you, but I'm not able to lend money right now", "That's none of your business", "Give them everything and hope they pay back"]), answerJson: JSON.stringify("I care about you, but I'm not able to lend money right now"), explain: "Kind and clear. You're protecting yourself without attacking them. That's a healthy boundary." },
    { type: "TRUE_FALSE", order: 3, prompt: "Setting boundaries means you don't care about people.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Boundaries protect the relationship. Burnout and resentment from no boundaries destroy it." },
  ]);

  const e2_chk = await upsertLesson({ moduleId: unitE2.id, title: "Professional Communication: Checkpoint", slug: "communication-checkpoint", order: 5, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(e2_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 2 Review: Communication and Relationships", body: "You've learned clear requests, professional phone/email skills, red vs green flags, and boundary scripts." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What makes a request effective?", choicesJson: JSON.stringify(["Being vague so they can decide what to help with", "Being specific about what you need, by when, and why", "Demanding help immediately", "Asking everyone at once"]), answerJson: JSON.stringify("Being specific about what you need, by when, and why"), explain: "Specific requests are easy to say yes to. Vague requests get vague responses." },
    { type: "TRUE_FALSE", order: 3, prompt: "A healthy boundary protects both you and the relationship.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Boundaries prevent resentment and burnout, making relationships more sustainable." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Help that comes with strings attached is:", choicesJson: JSON.stringify(["A green flag — generous people set conditions", "A red flag — real help doesn't require you to give up your privacy or autonomy", "Normal in all relationships", "Something you should always accept"]), answerJson: JSON.stringify("A red flag — real help doesn't require you to give up your privacy or autonomy"), explain: "Genuine help is offered freely. Conditional 'help' is often control in disguise." },
  ]);

  // --- Unit E3: Emotional Intelligence ---
  const unitE3 = await upsertModule({ pathId: journeyE.id, title: "Emotional Intelligence", slug: "emotional-intelligence", order: 3 });

  const e3_1 = await upsertLesson({ moduleId: unitE3.id, title: "Naming Your Emotions", slug: "naming-emotions", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e3_1.id, [
    { type: "INFO", order: 1, prompt: "Name It to Tame It", body: "Research shows that simply naming an emotion reduces its intensity. Instead of 'I feel bad,' try 'I feel frustrated because my application was denied.' The more specific you are, the more control you gain over how you respond." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Why does naming your emotions help?", choicesJson: JSON.stringify(["It doesn't help at all", "Naming an emotion engages your thinking brain, which reduces the intensity of the emotional reaction", "It makes you more emotional", "It's only useful for therapy"]), answerJson: JSON.stringify("Naming an emotion engages your thinking brain, which reduces the intensity of the emotional reaction"), explain: "When you label a feeling, you shift from reacting to observing. That shift gives you choice in how you respond." },
    { type: "SCENARIO", order: 3, prompt: "Scenario: You feel angry after being treated rudely at a government office.", body: "Which response shows emotional intelligence?", choicesJson: JSON.stringify(["Yell at the worker", "Name it: 'I feel disrespected and frustrated.' Then decide how to respond calmly", "Stuff the feeling down and pretend it's fine", "Leave and never come back"]), answerJson: JSON.stringify("Name it: 'I feel disrespected and frustrated.' Then decide how to respond calmly"), explain: "Naming the emotion creates space between feeling and acting. That space is where good decisions live." },
  ]);

  const e3_2 = await upsertLesson({ moduleId: unitE3.id, title: "Managing Anger Constructively", slug: "managing-anger", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e3_2.id, [
    { type: "INFO", order: 1, prompt: "Anger Is Information, Not Instructions", body: "Anger tells you something is wrong — a boundary was crossed, you feel disrespected, or you feel powerless. The anger is valid. What you DO with it determines the outcome. Pause, breathe, identify the real issue, then choose your response." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What is anger usually telling you?", choicesJson: JSON.stringify(["That you're a bad person", "That a boundary was crossed, something feels unfair, or you feel powerless", "That you should fight", "Nothing useful"]), answerJson: JSON.stringify("That a boundary was crossed, something feels unfair, or you feel powerless"), explain: "Anger is a signal. The goal isn't to eliminate it — it's to decode it and respond wisely." },
    { type: "TRUE_FALSE", order: 3, prompt: "Taking a 60-second pause when angry usually leads to a better response than reacting immediately.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "60 seconds lets your thinking brain catch up with your emotional brain. That pause prevents most regrettable reactions." },
  ]);

  const e3_3 = await upsertLesson({ moduleId: unitE3.id, title: "Empathy Without Burnout", slug: "empathy-boundaries", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e3_3.id, [
    { type: "INFO", order: 1, prompt: "You Can Care Without Carrying", body: "Empathy means understanding how someone feels. It doesn't mean absorbing their problems. You can say 'I understand you're hurting' without taking on their pain. Healthy empathy has boundaries — otherwise you burn out." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the difference between empathy and burnout?", choicesJson: JSON.stringify(["There is no difference", "Empathy is understanding someone's pain; burnout is absorbing it until you have nothing left", "Empathy always leads to burnout", "Burnout is healthier than empathy"]), answerJson: JSON.stringify("Empathy is understanding someone's pain; burnout is absorbing it until you have nothing left"), explain: "You can be compassionate without sacrificing yourself. Boundaries make empathy sustainable." },
    { type: "TRUE_FALSE", order: 3, prompt: "Being empathetic means you must solve other people's problems.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Empathy means understanding. It doesn't obligate you to fix everything. Sometimes just listening is enough." },
  ]);

  const e3_chk = await upsertLesson({ moduleId: unitE3.id, title: "Emotional Intelligence: Checkpoint", slug: "emotional-intelligence-checkpoint", order: 4, xpReward: 15, lessonType: "checkpoint", estimatedMinutes: 8 });
  await seedCards(e3_chk.id, [
    { type: "INFO", order: 1, prompt: "Unit 3 Review: Emotional Skills", body: "You've learned to name emotions, manage anger constructively, and practice empathy without burnout." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "How does naming an emotion help you?", choicesJson: JSON.stringify(["It makes the emotion worse", "It engages your thinking brain and reduces the intensity of your reaction", "It only works in therapy", "It eliminates the emotion entirely"]), answerJson: JSON.stringify("It engages your thinking brain and reduces the intensity of your reaction"), explain: "Naming = observing instead of reacting. Observation gives you choice." },
    { type: "TRUE_FALSE", order: 3, prompt: "Anger is always a destructive emotion.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("False"), explain: "Anger signals that something is wrong. How you respond to it determines whether it's destructive or constructive." },
    { type: "MULTIPLE_CHOICE", order: 4, prompt: "Healthy empathy requires:", choicesJson: JSON.stringify(["Absorbing everyone else's pain", "Understanding others' feelings while maintaining boundaries that protect your own well-being", "Never caring about anyone", "Only helping people you agree with"]), answerJson: JSON.stringify("Understanding others' feelings while maintaining boundaries that protect your own well-being"), explain: "Empathy with boundaries is sustainable. Empathy without boundaries leads to burnout." },
  ]);

  // --- Unit E4: Digital Life Skills ---
  const unitE4 = await upsertModule({ pathId: journeyE.id, title: "Digital Life Skills", slug: "digital-life-skills", order: 4 });

  const e4_1 = await upsertLesson({ moduleId: unitE4.id, title: "Passwords and Security", slug: "passwords-security", order: 1, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e4_1.id, [
    { type: "INFO", order: 1, prompt: "Your Password Is Your Lock", body: "Use a different password for important accounts. A strong password is long and unique — like a sentence only you would know. Write them down in a safe place if you need to." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which is the strongest password?", choicesJson: JSON.stringify(["password123", "MyDog2024", "I-walk-3-miles-to-the-library-daily!", "123456789"]), answerJson: JSON.stringify("I-walk-3-miles-to-the-library-daily!"), explain: "Long, unique passphrases are much harder to crack than short passwords. Make it personal and memorable." },
    { type: "TRUE_FALSE", order: 3, prompt: "Using the same password for your email and bank account is risky.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "If one account gets hacked, the attacker can access everything using that same password. Use different passwords." },
  ]);

  const e4_2 = await upsertLesson({ moduleId: unitE4.id, title: "Using Public WiFi Safely", slug: "public-wifi-safety", order: 2, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e4_2.id, [
    { type: "INFO", order: 1, prompt: "Free WiFi Is Not Always Safe", body: "Public WiFi at libraries, shelters, and coffee shops is useful — but not secure. Don't log into banking or enter passwords on public WiFi unless you see 'https' in the URL. Hackers can intercept unencrypted data." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "Which activity is safest on public WiFi?", choicesJson: JSON.stringify(["Online banking", "Reading news articles", "Entering credit card numbers", "Logging into your email"]), answerJson: JSON.stringify("Reading news articles"), explain: "Browsing public content is safe. Anything involving passwords or financial info should wait for a secure connection." },
    { type: "TRUE_FALSE", order: 3, prompt: "The 'https' in a website address means the connection is encrypted.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "The 's' stands for 'secure.' Look for it before entering any personal information online." },
  ]);

  const e4_3 = await upsertLesson({ moduleId: unitE4.id, title: "Protecting Your Phone", slug: "phone-protection", order: 3, xpReward: 2, lessonType: "learn", estimatedMinutes: 5 });
  await seedCards(e4_3.id, [
    { type: "INFO", order: 1, prompt: "Your Phone Is Your Lifeline", body: "Your phone holds contacts, appointments, benefits info, and your identity. Protect it: use a screen lock, don't leave it charging unattended, back up important numbers on paper, and never lend it with your accounts logged in." },
    { type: "MULTIPLE_CHOICE", order: 2, prompt: "What's the most important thing to protect on your phone?", choicesJson: JSON.stringify(["Your game progress", "Your contacts, benefits info, and logged-in accounts", "Your photos", "Your music"]), answerJson: JSON.stringify("Your contacts, benefits info, and logged-in accounts"), explain: "Your phone is your portable office. Losing access to contacts and accounts can set you back significantly." },
    { type: "INFO", order: 3, prompt: "Mission: Back Up Your Critical Numbers", body: "Write your 5 most important phone numbers on a card you keep in your wallet: emergency contact, case worker, doctor, employer, and one trusted friend. If your phone dies, you're not stranded." },
  ]);

  const unitE_cap = await upsertModule({ pathId: journeyE.id, title: "Life Skills Capstone", slug: "life-skills-capstone", order: 5 });
  const e_capstone = await upsertLesson({ moduleId: unitE_cap.id, title: "Life Skills: Final Challenge", slug: "life-skills-capstone-lesson", order: 1, xpReward: 25, lessonType: "capstone", estimatedMinutes: 15 });
  await seedCards(e_capstone.id, [
    { type: "INFO", order: 1, prompt: "Capstone: Living Fully", body: "You've grown in time management, communication, emotional intelligence, and digital security. This is your final challenge — showing you can apply these life skills in real situations." },
    { type: "SCENARIO", order: 2, prompt: "Scenario: A new 'friend' wants you to share your phone password to prove you trust them.", body: "What's the best response?", choicesJson: JSON.stringify(["Share it to show you trust them", "Explain that protecting your accounts is important for both of you — you can still be close without sharing passwords", "Give them a fake password", "End the friendship immediately without explanation"]), answerJson: JSON.stringify("Explain that protecting your accounts is important for both of you — you can still be close without sharing passwords"), explain: "Healthy relationships don't require you to give up your security. A green flag partner respects this." },
    { type: "MULTIPLE_CHOICE", order: 3, prompt: "Which best describes a healthy boundary?", choicesJson: JSON.stringify(["An ultimatum that controls someone else", "A clear limit that protects your energy and values", "A wall that keeps everyone away", "A rule that only you have to follow"]), answerJson: JSON.stringify("A clear limit that protects your energy and values"), explain: "Boundaries are about protecting yourself, not controlling others. They make relationships safer and clearer." },
    { type: "TRUE_FALSE", order: 4, prompt: "Asking for exactly what you need makes it easier for people to help you.", choicesJson: JSON.stringify(["True", "False"]), answerJson: JSON.stringify("True"), explain: "Vague requests get vague results. Specific requests get real help." },
    { type: "INFO", order: 5, prompt: "Mission: Your Life Skills Portfolio", body: "You've completed Life Skills! Write down 3 communication wins, 2 boundary moments you're proud of, and 1 digital habit you've changed. These aren't just lessons — they're your life." },
  ]);

  const canonicalModules: Record<string, string[]> = {
    "stability-basics": ["daily-stability", "communication-access", "documents-identity", "stability-basics-capstone"],
    "survival-systems": ["crisis-to-plan", "housing-pathway", "work-readiness", "survival-systems-capstone"],
    "building-future": ["identity-self-belief", "mindset-growth", "decision-making", "long-term-thinking", "confidence-action", "building-future-capstone"],
    "financial-literacy": ["money-mindset-basics", "banking-basics", "budgeting-systems", "credit-debt", "saving-emergency", "scams-safety", "financial-literacy-capstone"],
    "life-skills": ["time-organization", "professional-communication", "emotional-intelligence", "digital-life-skills", "life-skills-capstone"],
  };
  for (const [pathSlug, moduleSlugs] of Object.entries(canonicalModules)) {
    const path = await prisma.path.findUnique({ where: { slug: pathSlug } });
    if (!path) continue;
    const deleted = await prisma.module.deleteMany({
      where: { pathId: path.id, slug: { notIn: moduleSlugs } },
    });
    if (deleted.count > 0) console.log(`  ↳ Pruned ${deleted.count} orphaned module(s) from ${pathSlug}`);
  }

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
