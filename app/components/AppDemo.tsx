"use client";

import { useEffect, useState, useRef } from "react";

const LESSONS = [
  { title: "Daily Routines", path: "Stability Basics", xp: 10 },
  { title: "Keeping Documents Safe", path: "Stability Basics", xp: 10 },
  { title: "Basic Budgeting", path: "Financial Literacy", xp: 10 },
  { title: "Finding Safe Shelter", path: "Survival & Systems", xp: 10 },
];

const CARDS = [
  { q: "What is the best way to keep important documents safe?", a: "Store copies digitally and keep originals in a sealed bag" },
  { q: "Which is a free way to start budgeting?", a: "Track spending for one week using pen and paper" },
];

type Phase = "home" | "lesson" | "card" | "correct" | "xp" | "complete";

export default function AppDemo() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("home");
  const [lessonIdx, setLessonIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [totalXp, setTotalXp] = useState(20);
  const [tapPulse, setTapPulse] = useState(false);
  const [tapX, setTapX] = useState(50);
  const [tapY, setTapY] = useState(50);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const sequence: { phase: Phase; delay: number; tap?: [number, number]; lessonIdx?: number; cardIdx?: number; addXp?: number }[] = [
      { phase: "home", delay: 1500, tap: [50, 42] },
      { phase: "lesson", delay: 1800, tap: [50, 55] },
      { phase: "card", delay: 2200, tap: [50, 72] },
      { phase: "correct", delay: 1600 },
      { phase: "xp", delay: 2000, addXp: 10 },
      { phase: "home", delay: 1500, lessonIdx: 1, tap: [50, 52] },
      { phase: "lesson", delay: 1800, tap: [50, 55], cardIdx: 1 },
      { phase: "card", delay: 2200, tap: [50, 72] },
      { phase: "correct", delay: 1600 },
      { phase: "xp", delay: 2000, addXp: 10 },
      { phase: "complete", delay: 3000 },
    ];

    let timer: ReturnType<typeof setTimeout>;
    let step = 0;

    function run() {
      if (step >= sequence.length) {
        step = 0;
        setTotalXp(20);
        setLessonIdx(0);
        setCardIdx(0);
      }
      const s = sequence[step];
      if (s.lessonIdx !== undefined) setLessonIdx(s.lessonIdx);
      if (s.cardIdx !== undefined) setCardIdx(s.cardIdx);
      setPhase(s.phase);

      if (s.tap) {
        setTimeout(() => {
          setTapX(s.tap![0]);
          setTapY(s.tap![1]);
          setTapPulse(true);
          setTimeout(() => setTapPulse(false), 500);
        }, s.delay * 0.5);
      }

      if (s.addXp) {
        setTimeout(() => setTotalXp((x) => x + s.addXp!), 400);
      }

      step++;
      timer = setTimeout(run, s.delay);
    }

    run();
    return () => clearTimeout(timer);
  }, [mounted]);

  const lesson = LESSONS[lessonIdx];
  const card = CARDS[cardIdx];

  if (!mounted) {
    return (
      <div className="demo-phone-container">
        <div className="demo-phone">
          <div className="demo-phone-notch"></div>
          <div className="demo-phone-screen">
            <div className="demo-screen-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#475569", fontSize: "0.75rem" }}>Loading demo...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-phone-container">
      <div className="demo-phone">
        <div className="demo-phone-notch"></div>

        <div className="demo-phone-screen">
          {phase === "home" && (
            <div className="demo-screen-content demo-fade-in">
              <div className="demo-app-header">
                <div className="demo-app-xp-bar">
                  <span className="demo-xp-icon">&#x2B50;</span>
                  <span className="demo-xp-count">{totalXp} XP</span>
                  <span className="demo-streak">&#x1F525; 3</span>
                  <span className="demo-hearts">&#x2764;&#xFE0F; 5</span>
                </div>
                <div className="demo-app-title">Your Journeys</div>
              </div>
              <div className="demo-node-tree">
                {LESSONS.map((l, i) => (
                  <div
                    key={i}
                    className={`demo-node ${i < lessonIdx ? "demo-node-done" : i === lessonIdx ? "demo-node-active" : "demo-node-locked"}`}
                  >
                    <div className="demo-node-circle">
                      {i < lessonIdx ? "✓" : i === lessonIdx ? "▶" : "🔒"}
                    </div>
                    <div className="demo-node-label">{l.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === "lesson" && (
            <div className="demo-screen-content demo-fade-in">
              <div className="demo-lesson-header">
                <div className="demo-lesson-path">{lesson.path}</div>
                <div className="demo-lesson-title">{lesson.title}</div>
                <div className="demo-lesson-progress">
                  <div className="demo-progress-bar">
                    <div className="demo-progress-fill" style={{ width: "30%" }}></div>
                  </div>
                  <span className="demo-progress-text">1 of 3</span>
                </div>
              </div>
              <div className="demo-lesson-body">
                <p className="demo-lesson-text">
                  Tap below to start the lesson card and test your knowledge.
                </p>
                <div className="demo-lesson-btn">Start Card</div>
              </div>
            </div>
          )}

          {(phase === "card" || phase === "correct") && (
            <div className="demo-screen-content demo-fade-in">
              <div className="demo-card-container">
                <div className="demo-card-question">{card.q}</div>
                <div className="demo-card-answers">
                  <div className={`demo-answer ${phase === "correct" ? "demo-answer-wrong" : ""}`}>
                    Call 911 immediately
                  </div>
                  <div className={`demo-answer ${phase === "correct" ? "demo-answer-correct" : ""}`}>
                    {card.a}
                  </div>
                  <div className={`demo-answer ${phase === "correct" ? "demo-answer-wrong" : ""}`}>
                    Leave them with a friend
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === "xp" && (
            <div className="demo-screen-content demo-fade-in">
              <div className="demo-xp-reward">
                <div className="demo-xp-burst">+10 XP</div>
                <div className="demo-xp-message">Lesson Complete!</div>
                <div className="demo-xp-earning">$0.33 earned</div>
                <div className="demo-xp-continue">Continue</div>
              </div>
            </div>
          )}

          {phase === "complete" && (
            <div className="demo-screen-content demo-fade-in">
              <div className="demo-xp-reward">
                <div className="demo-xp-burst" style={{ fontSize: "2rem" }}>&#x1F389;</div>
                <div className="demo-xp-message">2 Lessons Done!</div>
                <div className="demo-xp-earning">{totalXp} XP Total — $0.66 earned</div>
                <div className="demo-xp-continue">Keep Going</div>
              </div>
            </div>
          )}

          <div className="demo-phone-navbar">
            <div className="demo-nav-item demo-nav-active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1a1 1 0 0 0 .7-1.7l-9-9a1 1 0 0 0-1.4 0l-9 9A1 1 0 0 0 3 13z"/></svg>
              <span>Home</span>
            </div>
            <div className="demo-nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              <span>Lifeline</span>
            </div>
            <div className="demo-nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span>Profile</span>
            </div>
          </div>
        </div>

        {tapPulse && (
          <div
            className="demo-tap-indicator"
            style={{ left: `${tapX}%`, top: `${tapY}%` }}
          ></div>
        )}
      </div>

      <div className="demo-caption">
        <p>
          {phase === "home" && "Learners see their journey map with lesson nodes"}
          {phase === "lesson" && "Each lesson opens with a quick intro"}
          {phase === "card" && "Interactive cards test knowledge"}
          {phase === "correct" && "Instant feedback on answers"}
          {phase === "xp" && "XP and cash earned for each completion"}
          {phase === "complete" && "Progress tracked — every lesson counts"}
        </p>
      </div>
    </div>
  );
}
