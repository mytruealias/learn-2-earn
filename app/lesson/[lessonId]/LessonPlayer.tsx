"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HeartIcon, CloseIcon, LightbulbIcon } from "@/app/components/icons";

interface Card {
  id: string;
  type: string;
  subtype: string;
  prompt: string;
  body: string | null;
  choicesJson: string | null;
  answerJson: string | null;
  explain: string | null;
  hint: string | null;
  tags: string;
  difficulty: string;
  order: number;
}

interface LessonSummary {
  id: string;
  title: string;
  order: number;
}

interface ModuleSummary {
  id: string;
  title: string;
  order: number;
  lessons: LessonSummary[];
}

interface Lesson {
  id: string;
  title: string;
  xpReward: number;
  order: number;
  lessonType: string;
  estimatedMinutes: number;
  learningObjectives: string;
  difficulty: string;
  cards: Card[];
  module: {
    id: string;
    title: string;
    order: number;
    description: string;
    lessons: LessonSummary[];
    path: {
      slug: string;
      title: string;
      modules: ModuleSummary[];
    };
  };
}

interface BadgeInfo {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const MOTIVATIONAL_MESSAGES = [
  "Nailed it!",
  "Amazing!",
  "Keep going!",
  "You got it!",
  "Brilliant!",
  "Fantastic!",
  "That's right!",
  "Well done!",
  "Excellent!",
  "You're on fire!",
];

function pickMotivational() {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#58cc02", "#f5b731", "#3b9eff", "#a78bfa", "#f55050", "#f59e0b"];
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      angle: number;
      spin: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
      });
    }

    let animId: number;
    let frame = 0;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      frame++;
      if (frame < 200) {
        animId = requestAnimationFrame(draw);
      }
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
}

function findNextLesson(lesson: Lesson, completedIds: Set<string>): { id: string; title: string; moduleTitle: string } | null {
  const currentModuleOrder = lesson.module.order;
  const currentLessonOrder = lesson.order;
  const allModules = lesson.module.path.modules;

  for (const mod of allModules) {
    if (mod.order < currentModuleOrder) continue;
    for (const l of mod.lessons) {
      if (mod.order === currentModuleOrder && l.order <= currentLessonOrder) continue;
      if (!completedIds.has(l.id)) {
        return { id: l.id, title: l.title, moduleTitle: mod.title };
      }
    }
  }
  return null;
}

export default function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [initialHearts] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [signupRequired, setSignupRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [comboCount, setComboCount] = useState(0);
  const [peakCombo, setPeakCombo] = useState(0);
  const [motivationalMsg, setMotivationalMsg] = useState("");
  const [showCombo, setShowCombo] = useState(false);

  const [xpBreakdown, setXpBreakdown] = useState<{
    base: number;
    multiplier: number;
    perfectBonus: number;
  } | null>(null);
  const [moduleComplete, setModuleComplete] = useState(false);
  const [moduleName, setModuleName] = useState("");
  const [showModuleComplete, setShowModuleComplete] = useState(false);

  const [newBadges, setNewBadges] = useState<BadgeInfo[]>([]);
  const [badgeCelebrationIndex, setBadgeCelebrationIndex] = useState(0);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);

  const [, setCompletedIds] = useState<Set<string>>(new Set());
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string; moduleTitle: string } | null>(null);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("l2e_logged_in") === "true");
  }, []);

  const currentCard = lesson.cards[currentCardIndex];
  const progress = ((currentCardIndex) / lesson.cards.length) * 100;

  const handleSelect = (choice: string) => {
    if (showFeedback) return;
    setSelectedAnswer(choice);
  };

  const handleCheck = () => {
    if (!selectedAnswer) return;
    let correctAnswer = null;
    try {
      correctAnswer = currentCard.answerJson ? JSON.parse(currentCard.answerJson) : null;
    } catch {
      correctAnswer = currentCard.answerJson;
    }
    const correct = selectedAnswer === correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      const newCombo = comboCount + 1;
      setComboCount(newCombo);
      if (newCombo > peakCombo) setPeakCombo(newCombo);
      setMotivationalMsg(pickMotivational());
      setShowCombo(newCombo >= 2);
    } else {
      setComboCount(0);
      setShowCombo(false);
      setHearts((h) => Math.max(0, h - 1));
    }
  };

  const handleContinue = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setMotivationalMsg("");

    if (currentCardIndex >= lesson.cards.length - 1) {
      handleComplete();
    } else {
      setCurrentCardIndex((i) => i + 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      let userId = localStorage.getItem("l2e_user_id");
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem("l2e_user_id", userId);
      }

      await fetch("/api/user/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const perfectRun = hearts === initialHearts;

      const [progressRes, progressListRes] = await Promise.all([
        fetch("/api/progress/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, lessonId: lesson.id, comboBonus: peakCombo, perfectRun }),
        }),
        fetch("/api/progress/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }),
      ]);

      const data = await progressRes.json();
      const listData = await progressListRes.json();

      const fetchedCompletedIds = new Set<string>(
        listData.ok && listData.completedLessonIds ? listData.completedLessonIds : []
      );
      fetchedCompletedIds.add(lesson.id);
      setCompletedIds(fetchedCompletedIds);

      const next = findNextLesson(lesson, fetchedCompletedIds);
      setNextLesson(next);

      if (progressRes.ok) {
        setEarnedXp(data.xpAwarded ?? lesson.xpReward);
        setXpBreakdown({
          base: data.baseXp ?? lesson.xpReward,
          multiplier: data.comboMultiplier ?? 1,
          perfectBonus: data.perfectRunBonus ?? 0,
        });
        if (data.moduleComplete) {
          setModuleName(data.moduleName ?? "");
          setModuleComplete(true);
        }
        if (data.newBadges && data.newBadges.length > 0) {
          setNewBadges(data.newBadges);
          setBadgeCelebrationIndex(0);
          setShowBadgeCelebration(true);
        } else {
          setCompleted(true);
        }
      } else if (progressRes.status === 403 && data.error === "signup_required") {
        setSignupRequired(true);
      }
    } catch (err) {
      console.error("Failed to complete lesson:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextBadge = () => {
    if (badgeCelebrationIndex < newBadges.length - 1) {
      setBadgeCelebrationIndex((i) => i + 1);
    } else {
      setShowBadgeCelebration(false);
      setCompleted(true);
    }
  };

  if (showBadgeCelebration && newBadges.length > 0) {
    const badge = newBadges[badgeCelebrationIndex];
    return (
      <div className="grid-bg" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <ConfettiCanvas />
        <div style={{ textAlign: "center", maxWidth: "420px", width: "100%" }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--accent-purple)",
            letterSpacing: "0.2em",
            marginBottom: "1rem",
          }}>
            {'>'} badge_unlocked
          </div>

          <div style={{
            fontSize: "5rem",
            marginBottom: "1rem",
            animation: "pop-in 0.5s ease both",
          }}>
            {badge.icon}
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
            color: "var(--accent-purple)",
            textShadow: "0 0 30px rgba(167,139,250,0.4)",
          }}>
            {badge.label}
          </h1>

          <p style={{
            color: "var(--text-secondary)",
            fontSize: "1rem",
            marginBottom: "2rem",
            lineHeight: "1.6",
          }}>
            {badge.description}
          </p>

          <div style={{
            backgroundColor: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.3)",
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--accent-purple)",
              letterSpacing: "0.15em",
              marginBottom: "0.25rem",
            }}>
              {'>'} achievement_earned
            </div>
            <div style={{
              color: "var(--text-primary)",
              fontWeight: "700",
              fontSize: "1.05rem",
              fontFamily: "var(--font-display)",
            }}>
              You earned the &quot;{badge.label}&quot; badge!
            </div>
          </div>

          {newBadges.length > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.4rem",
              marginBottom: "1.25rem",
            }}>
              {newBadges.map((_, i) => (
                <div key={i} style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "999px",
                  backgroundColor: i === badgeCelebrationIndex ? "var(--accent-purple)" : "var(--border-color)",
                  transition: "background-color 0.2s",
                }} />
              ))}
            </div>
          )}

          <button
            onClick={handleNextBadge}
            style={{
              width: "100%",
              padding: "1rem",
              backgroundColor: "transparent",
              color: "var(--accent-purple)",
              border: "1px solid var(--accent-purple)",
              fontWeight: "700",
              fontSize: "1rem",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.05em",
              boxShadow: "0 0 20px rgba(167,139,250,0.25)",
            }}
          >
            {badgeCelebrationIndex < newBadges.length - 1 ? "NEXT BADGE >" : "CONTINUE >"}
          </button>
        </div>
      </div>
    );
  }

  if (signupRequired) {
    return (
      <div className="grid-bg" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: "420px", width: "100%" }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--accent-green)",
            letterSpacing: "0.2em",
            marginBottom: "1rem",
          }}>
            {'>'} account_required
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "1rem",
            color: "var(--text-primary)",
          }}>
            Great Start!
          </h1>
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--accent-green)",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, var(--accent-green), transparent)",
            }} />
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--accent-green)",
              letterSpacing: "0.15em",
              marginBottom: "0.75rem",
            }}>
              {'>'} sign_up_to_continue
            </div>
            <div style={{
              color: "var(--text-primary)",
              fontWeight: "700",
              fontSize: "1.1rem",
              fontFamily: "var(--font-display)",
              marginBottom: "0.5rem",
            }}>
              Create an Account to Keep Earning
            </div>
            <div style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              lineHeight: "1.6",
              marginBottom: "1.25rem",
            }}>
              You&apos;ve completed your first lesson — nice work! Sign up now to save your progress, keep earning XP, and start converting it to real cash.
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--accent-gold)",
              marginBottom: "1rem",
            }}>
              every 3 XP = $1 real money
            </div>
            <Link
              href="/signup"
              style={{
                display: "block",
                padding: "0.85rem",
                backgroundColor: "transparent",
                color: "var(--accent-green)",
                border: "1px solid var(--accent-green)",
                fontWeight: "700",
                fontSize: "1rem",
                textAlign: "center",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                boxShadow: "var(--glow-green)",
                marginBottom: "0.75rem",
              }}
            >
              SIGN UP NOW
            </Link>
            <Link
              href="/login"
              style={{
                display: "block",
                padding: "0.65rem",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                textAlign: "center",
                fontFamily: "var(--font-display)",
              }}
            >
              Already have an account? Log in
            </Link>
          </div>
          <Link
            href={`/paths/${lesson.module.path.slug}`}
            style={{
              display: "block",
              padding: "0.75rem",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-color)",
              fontWeight: "600",
              fontSize: "0.85rem",
              textAlign: "center",
              fontFamily: "var(--font-display)",
            }}
          >
            Back to Journey
          </Link>
        </div>
      </div>
    );
  }

  if (completed && moduleComplete && !showModuleComplete) {
    return (
      <div className="grid-bg" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <ConfettiCanvas />
        <div style={{ textAlign: "center", maxWidth: "420px", width: "100%" }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--accent-gold)",
            letterSpacing: "0.2em",
            marginBottom: "1rem",
          }}>
            {'>'} unit_complete
          </div>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🏆</div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.25rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
            color: "var(--accent-gold)",
            textShadow: "0 0 30px rgba(255,204,0,0.3)",
          }}>
            UNIT COMPLETE!
          </h1>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: "1rem",
            marginBottom: "2rem",
            lineHeight: "1.6",
          }}>
            You finished every lesson in <strong style={{ color: "var(--text-primary)" }}>{moduleName}</strong>. Outstanding work!
          </p>
          <button
            onClick={() => setShowModuleComplete(true)}
            style={{
              width: "100%",
              padding: "1rem",
              backgroundColor: "transparent",
              color: "var(--accent-gold)",
              border: "1px solid var(--accent-gold)",
              fontWeight: "700",
              fontSize: "1rem",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.05em",
              boxShadow: "var(--glow-gold)",
              marginBottom: "0.75rem",
            }}
          >
            SEE RESULTS
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    const perfectRun = hearts === initialHearts;

    return (
      <div className="grid-bg" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <ConfettiCanvas />
        <div style={{ textAlign: "center", maxWidth: "420px", width: "100%" }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--accent-green)",
            letterSpacing: "0.2em",
            marginBottom: "1rem",
          }}>
            {'>'} mission_complete
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.25rem",
            fontWeight: "700",
            marginBottom: "1.5rem",
            color: "var(--accent-gold)",
            textShadow: "0 0 30px rgba(255,204,0,0.2)",
          }}>
            MISSION COMPLETE
          </h1>

          {perfectRun && (
            <div style={{
              backgroundColor: "rgba(245,183,49,0.1)",
              border: "1px solid var(--accent-gold)",
              borderRadius: "12px",
              padding: "0.75rem 1.25rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}>
              <span style={{ fontSize: "1.25rem" }}>⭐</span>
              <span style={{
                fontFamily: "var(--font-display)",
                fontWeight: "700",
                color: "var(--accent-gold)",
                fontSize: "1rem",
                letterSpacing: "0.05em",
              }}>
                PERFECT RUN!
              </span>
            </div>
          )}

          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--accent-gold)",
            padding: "1.75rem",
            marginBottom: "1.5rem",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, var(--accent-gold), transparent)",
            }} />
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "var(--accent-gold)",
              marginBottom: "0.5rem",
              textShadow: "0 0 20px rgba(255,204,0,0.3)",
            }}>
              +{earnedXp} XP
            </div>

            {xpBreakdown && (xpBreakdown.multiplier > 1 || xpBreakdown.perfectBonus > 0) && (
              <div style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
                lineHeight: "1.6",
              }}>
                {xpBreakdown.multiplier > 1 && (
                  <div>Base {xpBreakdown.base} XP × {xpBreakdown.multiplier} combo bonus</div>
                )}
                {xpBreakdown.perfectBonus > 0 && (
                  <div>+{xpBreakdown.perfectBonus} XP perfect run bonus</div>
                )}
              </div>
            )}

            <div style={{
              color: "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.95rem",
            }}>
              You&apos;re building real skills. Keep going.
            </div>
          </div>

          {nextLesson && (
            <div style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--accent-blue)",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.5rem",
              position: "relative",
              overflow: "hidden",
              textAlign: "left",
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background: "linear-gradient(90deg, transparent, var(--accent-blue), transparent)",
              }} />
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--accent-blue)",
                letterSpacing: "0.15em",
                marginBottom: "0.5rem",
              }}>
                {'>'} next_up
              </div>
              <div style={{
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: "600",
                marginBottom: "0.25rem",
              }}>
                {nextLesson.moduleTitle}
              </div>
              <div style={{
                color: "var(--text-primary)",
                fontWeight: "700",
                fontSize: "1rem",
                fontFamily: "var(--font-display)",
                marginBottom: "1rem",
              }}>
                {nextLesson.title}
              </div>
              <Link
                href={`/lesson/${nextLesson.id}`}
                style={{
                  display: "block",
                  padding: "0.75rem",
                  backgroundColor: "transparent",
                  color: "var(--accent-blue)",
                  border: "1px solid var(--accent-blue)",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.05em",
                  boxShadow: "var(--glow-blue)",
                }}
              >
                START NEXT LESSON &gt;
              </Link>
            </div>
          )}

          {!isLoggedIn && (
            <div style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--accent-green)",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background: "linear-gradient(90deg, transparent, var(--accent-green), transparent)",
              }} />
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--accent-green)",
                letterSpacing: "0.15em",
                marginBottom: "0.75rem",
              }}>
                {'>'} sign_up_to_redeem
              </div>
              <div style={{
                color: "var(--text-primary)",
                fontWeight: "700",
                fontSize: "1.05rem",
                fontFamily: "var(--font-display)",
                marginBottom: "0.5rem",
              }}>
                Create an Account to Cash Out
              </div>
              <div style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                lineHeight: "1.5",
                marginBottom: "1rem",
              }}>
                Sign up to start converting your XP into real money. Every 3 XP = $1. Your progress is saved.
              </div>
              <Link
                href="/signup"
                style={{
                  display: "block",
                  padding: "0.85rem",
                  backgroundColor: "transparent",
                  color: "var(--accent-green)",
                  border: "1px solid var(--accent-green)",
                  fontWeight: "700",
                  fontSize: "1rem",
                  textAlign: "center",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.05em",
                  boxShadow: "var(--glow-green)",
                }}
              >
                SIGN UP NOW
              </Link>
            </div>
          )}

          <Link
            href={`/paths/${lesson.module.path.slug}`}
            style={{
              display: "block",
              padding: "1rem",
              backgroundColor: isLoggedIn ? "transparent" : "var(--bg-card)",
              color: isLoggedIn ? "var(--accent-green)" : "var(--text-secondary)",
              border: `1px solid ${isLoggedIn ? "var(--accent-green)" : "var(--border-color)"}`,
              fontWeight: "700",
              fontSize: "1rem",
              textAlign: "center",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.05em",
              transition: "all 0.2s",
              boxShadow: isLoggedIn ? "var(--glow-green)" : "none",
            }}
          >
            CONTINUE {'>'}
          </Link>
        </div>
      </div>
    );
  }

  if (hearts <= 0) {
    return (
      <div className="grid-bg" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: "420px", width: "100%" }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--accent-red)",
            letterSpacing: "0.2em",
            marginBottom: "1rem",
          }}>
            {'>'} system_alert
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "1rem",
            color: "var(--accent-red)",
          }}>
            HEARTS DEPLETED
          </h1>
          <p style={{
            color: "var(--text-secondary)",
            marginBottom: "2rem",
            lineHeight: "1.6",
            fontSize: "0.95rem",
          }}>
            That&apos;s okay — mistakes are part of learning. Take a break and try again.
          </p>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <button
              onClick={() => { setHearts(5); setCurrentCardIndex(0); setComboCount(0); setPeakCombo(0); }}
              style={{
                padding: "1rem",
                backgroundColor: "transparent",
                color: "var(--accent-green)",
                border: "1px solid var(--accent-green)",
                fontWeight: "700",
                fontSize: "1rem",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                boxShadow: "var(--glow-green)",
              }}
            >
              RETRY MISSION
            </button>
            <Link
              href={`/paths/${lesson.module.path.slug}`}
              style={{
                display: "block",
                padding: "1rem",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                fontWeight: "600",
                fontSize: "0.95rem",
                textAlign: "center",
                fontFamily: "var(--font-display)",
              }}
            >
              Back to Journey
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <header style={{
        padding: "0.85rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        borderBottom: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
      }}>
        <Link
          href={`/paths/${lesson.module.path.slug}`}
          style={{
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            lineHeight: 1,
          }}
        >
          <CloseIcon size={20} color="var(--text-muted)" />
        </Link>

        <div style={{
          flex: 1,
          height: "8px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            backgroundColor: "var(--accent-green)",
            width: `${progress}%`,
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 8px rgba(88,204,2,0.3)",
          }} />
        </div>

        {showCombo && comboCount >= 2 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            backgroundColor: "rgba(245,183,49,0.15)",
            border: "1px solid var(--accent-gold)",
            borderRadius: "999px",
            padding: "0.3rem 0.7rem",
            animation: "pop-in 0.3s ease both",
          }}>
            <span style={{ fontSize: "0.85rem" }}>🔥</span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              fontWeight: "700",
              color: "var(--accent-gold)",
            }}>
              {comboCount} in a row!
            </span>
          </div>
        )}

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          color: "var(--accent-red)",
          fontWeight: "700",
          fontSize: "0.95rem",
          fontFamily: "var(--font-mono)",
        }}>
          <HeartIcon size={18} color="var(--accent-red)" />
          {hearts}
        </div>
      </header>

      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        maxWidth: "650px",
        margin: "0 auto",
        width: "100%",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", overflow: "hidden", maxWidth: "60vw", flexShrink: 1 }}>
            {lesson.cards.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentCardIndex ? "20px" : "8px",
                  minWidth: i === currentCardIndex ? "20px" : "8px",
                  height: "8px",
                  borderRadius: "999px",
                  flexShrink: 0,
                  backgroundColor: i < currentCardIndex
                    ? "var(--accent-green)"
                    : i === currentCardIndex
                    ? "var(--accent-blue)"
                    : "var(--border-color)",
                  transition: "all 0.3s ease",
                  boxShadow: i === currentCardIndex ? "0 0 6px rgba(59,158,255,0.5)" : "none",
                }}
              />
            ))}
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
          }}>
            {currentCardIndex + 1} / {lesson.cards.length}
          </div>
        </div>

        {currentCard.type === "INFO" ? (
          <div
            key={`card-${currentCardIndex}`}
            className="card-animate"
            style={{
              borderLeft: "3px solid var(--accent-blue)",
              backgroundColor: "rgba(59,158,255,0.05)",
              borderRadius: "0 12px 12px 0",
              padding: "1.75rem 1.75rem 2rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, var(--accent-blue), transparent)",
            }} />
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              backgroundColor: "rgba(59,158,255,0.12)",
              border: "1px solid rgba(59,158,255,0.3)",
              borderRadius: "999px",
              padding: "0.3rem 0.8rem 0.3rem 0.55rem",
              marginBottom: "1.25rem",
            }}>
              <LightbulbIcon size={14} color="var(--accent-blue)" />
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: "var(--accent-blue)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: "700",
              }}>
                Info
              </span>
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              fontWeight: "700",
              marginBottom: "1.25rem",
              lineHeight: "1.25",
              color: "var(--text-primary)",
            }}>
              {currentCard.prompt}
            </h2>
            {currentCard.body && (
              <p style={{
                fontSize: "1.1rem",
                lineHeight: "1.8",
                color: "var(--text-secondary)",
                marginTop: "0.25rem",
              }}>
                {currentCard.body}
              </p>
            )}
          </div>
        ) : (
          <div
            key={`card-${currentCardIndex}`}
            className="card-animate"
          >
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--accent-purple)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}>
              {'>'} {currentCard.type === "TRUE_FALSE" ? "binary_check" : "select_answer"}
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "1.75rem",
              lineHeight: "1.3",
            }}>
              {currentCard.prompt}
            </h2>
            {currentCard.choicesJson && (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {JSON.parse(currentCard.choicesJson).map((choice: string) => {
                  const isSelected = selectedAnswer === choice;
                  let correctAnswer = null;
                  try {
                    correctAnswer = currentCard.answerJson ? JSON.parse(currentCard.answerJson) : null;
                  } catch {
                    correctAnswer = currentCard.answerJson;
                  }
                  const isChoiceCorrect = showFeedback && choice === correctAnswer;
                  const isChoiceWrong = showFeedback && isSelected && !isCorrect;

                  let bgColor = "var(--bg-card)";
                  let borderColor = "var(--border-color)";
                  const textColor = "var(--text-primary)";

                  if (isChoiceCorrect) {
                    bgColor = "rgba(88, 204, 2, 0.08)";
                    borderColor = "var(--accent-green)";
                  } else if (isChoiceWrong) {
                    bgColor = "rgba(245, 80, 80, 0.08)";
                    borderColor = "var(--accent-red)";
                  } else if (isSelected && !showFeedback) {
                    bgColor = "var(--bg-card-hover)";
                    borderColor = "var(--accent-blue)";
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleSelect(choice)}
                      disabled={showFeedback}
                      style={{
                        textAlign: "left",
                        padding: "1rem 1.25rem",
                        backgroundColor: bgColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                        fontSize: "1rem",
                        fontWeight: "600",
                        fontFamily: "var(--font-display)",
                        transition: "all 0.15s",
                        opacity: showFeedback && !isChoiceCorrect && !isChoiceWrong ? 0.4 : 1,
                        boxShadow: isChoiceCorrect ? "var(--glow-green)" : isChoiceWrong ? "var(--glow-red)" : isSelected && !showFeedback ? "var(--glow-blue)" : "none",
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{
        padding: "0.75rem 1.5rem 1.5rem",
        borderTop: showFeedback ? "none" : "1px solid var(--border-color)",
      }}>
        {showFeedback && (
          <div style={{
            backgroundColor: isCorrect ? "rgba(88, 204, 2, 0.06)" : "rgba(245, 80, 80, 0.06)",
            borderTop: `2px solid ${isCorrect ? "var(--accent-green)" : "var(--accent-red)"}`,
            padding: "1rem 1.25rem",
            marginBottom: "0.75rem",
          }}>
            <div style={{
              fontWeight: "700",
              fontSize: "1rem",
              color: isCorrect ? "var(--accent-green)" : "var(--accent-red)",
              marginBottom: "0.25rem",
              fontFamily: "var(--font-display)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              {isCorrect ? "> CORRECT" : "> INCORRECT"}
              {isCorrect && motivationalMsg && (
                <span style={{
                  fontSize: "0.9rem",
                  color: "var(--accent-green)",
                  fontWeight: "600",
                  fontFamily: "var(--font-display)",
                }}>
                  — {motivationalMsg}
                </span>
              )}
            </div>
            {isCorrect && comboCount >= 2 && (
              <div style={{
                fontSize: "0.8rem",
                color: "var(--accent-gold)",
                fontFamily: "var(--font-mono)",
                marginBottom: "0.25rem",
              }}>
                🔥 {comboCount} in a row!{comboCount >= 5 ? " +50% XP bonus" : comboCount >= 3 ? " +25% XP bonus" : ""}
              </div>
            )}
            {currentCard.explain && (
              <p style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                marginTop: "0.25rem",
              }}>
                {currentCard.explain}
              </p>
            )}
          </div>
        )}

        <div style={{ maxWidth: "650px", margin: "0 auto" }}>
          {currentCard.type === "INFO" ? (
            <button
              onClick={handleContinue}
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: isSubmitting ? "var(--bg-card)" : "transparent",
                color: isSubmitting ? "var(--text-muted)" : "var(--accent-green)",
                border: `1px solid ${isSubmitting ? "var(--border-color)" : "var(--accent-green)"}`,
                fontWeight: "700",
                fontSize: "1rem",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                boxShadow: isSubmitting ? "none" : "var(--glow-green)",
              }}
            >
              {isSubmitting ? "PROCESSING..." : currentCardIndex >= lesson.cards.length - 1 ? `FINISH [+${lesson.xpReward}xp]` : "CONTINUE >"}
            </button>
          ) : showFeedback ? (
            <button
              onClick={handleContinue}
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: isSubmitting ? "var(--bg-card)" : "transparent",
                color: isSubmitting ? "var(--text-muted)" : "var(--accent-green)",
                border: `1px solid ${isSubmitting ? "var(--border-color)" : "var(--accent-green)"}`,
                fontWeight: "700",
                fontSize: "1rem",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                boxShadow: isSubmitting ? "none" : "var(--glow-green)",
              }}
            >
              {isSubmitting ? "PROCESSING..." : "CONTINUE >"}
            </button>
          ) : (
            <button
              onClick={handleCheck}
              disabled={!selectedAnswer}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: "transparent",
                color: selectedAnswer ? "var(--accent-blue)" : "var(--text-muted)",
                border: `1px solid ${selectedAnswer ? "var(--accent-blue)" : "var(--border-color)"}`,
                fontWeight: "700",
                fontSize: "1rem",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                boxShadow: selectedAnswer ? "var(--glow-blue)" : "none",
              }}
            >
              CHECK
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
