"use client";

import { useState } from "react";
import Link from "next/link";
import HelpButton from "../components/HelpButton";
import HubertChat from "../components/HubertChat";
import {
  MedicalIcon, PhoneIcon, HeartPulseIcon, AlertIcon,
  ShieldIcon, SirenIcon, StrengthIcon, ChatIcon, DeviceIcon,
  ShelterIcon, HousePlusIcon, KeyIcon, MedalIcon,
  SproutIcon, CompassIcon, CoffeeIcon, HandsIcon, TargetIcon,
  LifelineIcon, HubertIcon,
} from "../components/icons";

const resources = [
  {
    category: "Medical Emergency",
    icon: <MedicalIcon size={22} />,
    color: "var(--accent-red)",
    items: [
      { label: "911 Emergency Services", desc: "For immediate medical emergencies, life-threatening situations", href: "tel:911", icon: <PhoneIcon size={18} /> },
      { label: "988 Suicide & Crisis Lifeline", desc: "24/7 mental health crisis support, free and confidential", href: "tel:988", icon: <HeartPulseIcon size={18} /> },
      { label: "SAMHSA Helpline", desc: "Substance abuse and mental health referrals 1-800-662-4357", href: "tel:18006624357", icon: <HandsIcon size={18} /> },
      { label: "Poison Control", desc: "For poisoning emergencies 1-800-222-1222", href: "tel:18002221222", icon: <AlertIcon size={18} /> },
    ],
  },
  {
    category: "Safety & Protection",
    icon: <ShieldIcon size={22} />,
    color: "var(--accent-blue)",
    items: [
      { label: "911 Police Emergency", desc: "If you are in immediate danger or witnessing a crime", href: "tel:911", icon: <SirenIcon size={18} /> },
      { label: "National Domestic Violence Hotline", desc: "Safety planning and support 1-800-799-7233", href: "tel:18007997233", icon: <StrengthIcon size={18} /> },
      { label: "Crisis Text Line", desc: "Text HOME to 741741 for crisis support via text", href: "sms:741741&body=HOME", icon: <ChatIcon size={18} /> },
      { label: "Non-Emergency Police", desc: "For non-urgent police matters, contact your local precinct", href: "tel:311", icon: <DeviceIcon size={18} /> },
    ],
  },
  {
    category: "Shelter & Housing",
    icon: <ShelterIcon size={22} />,
    color: "var(--accent-gold)",
    items: [
      { label: "211 Community Services", desc: "Find local shelters, food banks, and housing assistance", href: "tel:211", icon: <HousePlusIcon size={18} /> },
      { label: "HUD Housing Counseling", desc: "Free housing counseling 1-800-569-4287", href: "tel:18005694287", icon: <KeyIcon size={18} /> },
      { label: "National Runaway Safeline", desc: "For youth needing shelter 1-800-786-2929", href: "tel:18007862929", icon: <SparkleIcon size={18} /> },
      { label: "VA Homeless Veteran Hotline", desc: "For veterans needing housing 1-877-424-3838", href: "tel:18774243838", icon: <MedalIcon size={18} /> },
    ],
  },
  {
    category: "Recovery & Coaching",
    icon: <SproutIcon size={22} />,
    color: "var(--accent-purple)",
    items: [
      { label: "SAMHSA Treatment Locator", desc: "Find substance abuse treatment near you 1-800-662-4357", href: "tel:18006624357", icon: <CompassIcon size={18} /> },
      { label: "AA Meeting Finder", desc: "Find local Alcoholics Anonymous meetings", href: "tel:12128703400", icon: <CoffeeIcon size={18} /> },
      { label: "NA Helpline", desc: "Narcotics Anonymous support 1-818-773-9999", href: "tel:18187739999", icon: <HandsIcon size={18} /> },
      { label: "211 Life Coaching Referral", desc: "Connect with local life coaches and mentors through 211", href: "tel:211", icon: <TargetIcon size={18} /> },
    ],
  },
];

function SparkleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" />
      <path d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

type StressStep = "idle" | "form" | "sent";

export default function LifelinePage() {
  const [stressStep, setStressStep] = useState<StressStep>("idle");
  const [stressMessage, setStressMessage] = useState("");
  const [stressLocation, setStressLocation] = useState("");
  const [sending, setSending] = useState(false);
  const [hubertOpen, setHubertOpen] = useState(false);

  const sendStressSignal = async () => {
    if (!stressMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/stress-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: stressMessage.trim(), location: stressLocation.trim() }),
      });
      if (res.ok) {
        setStressStep("sent");
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          alert("Please create a free account or log in first so we can follow up with you. You can still call 211 for immediate help.");
        } else {
          alert(data.error?.message || "Something went wrong. Please call 211 for immediate help.");
        }
      }
    } catch {
      alert("Something went wrong. Please call 211 for immediate help.");
    }
    setSending(false);
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", padding: "0 0 6rem 0" }}>
      <header style={{
        padding: "1.5rem 1.5rem",
        background: "linear-gradient(180deg, rgba(255,75,75,0.06) 0%, transparent 100%)",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <Link href="/app" style={{
            color: "var(--accent-green)",
            fontSize: "0.85rem",
            fontWeight: "600",
            display: "inline-block",
            marginBottom: "1rem",
          }}>
            ← Back to Home
          </Link>
          <div style={{ marginBottom: "0.5rem" }}>
            <LifelineIcon size={32} color="var(--accent-red)" />
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
          }}>
            Resource Lifeline
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
            Free government and community resources available to you right now. All calls are free and confidential.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem 1.5rem" }}>
        {stressStep === "idle" && (
          <div style={{
            marginBottom: "2rem",
            padding: "1.25rem 1.5rem",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.2rem" }}>
                🚨 Need immediate help?
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Send a signal to our support team — we&apos;ll follow up as soon as possible.
              </div>
            </div>
            <button
              onClick={() => setStressStep("form")}
              style={{
                padding: "0.6rem 1.25rem",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              Send Signal
            </button>
          </div>
        )}

        {stressStep === "form" && (
          <div style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "14px",
          }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>
              🚨 Tell us what&apos;s happening
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <textarea
                value={stressMessage}
                onChange={e => setStressMessage(e.target.value)}
                placeholder="Describe what's happening or what you need help with..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <input
                type="text"
                value={stressLocation}
                onChange={e => setStressLocation(e.target.value)}
                placeholder="Your location (optional — e.g. East 6th & Chicon)"
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setStressStep("idle")}
                style={{
                  padding: "0.6rem 1.1rem",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendStressSignal}
                disabled={sending || !stressMessage.trim()}
                style={{
                  padding: "0.6rem 1.25rem",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: sending || !stressMessage.trim() ? "default" : "pointer",
                  opacity: sending || !stressMessage.trim() ? 0.6 : 1,
                  fontFamily: "inherit",
                }}
              >
                {sending ? "Sending..." : "Send Signal"}
              </button>
            </div>
          </div>
        )}

        {stressStep === "sent" && (
          <div style={{
            marginBottom: "2rem",
            padding: "1.25rem 1.5rem",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "14px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.3rem" }}>
              Signal received
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Our team has been notified and will follow up as soon as possible. If this is an emergency, please call 911 or 988 now.
            </div>
          </div>
        )}

        <button
          onClick={() => setHubertOpen(true)}
          style={{
            width: "100%",
            marginBottom: "2rem",
            padding: "1.25rem 1.5rem",
            background: "linear-gradient(135deg, rgba(88,204,2,0.08), rgba(59,158,255,0.08))",
            border: "1px solid rgba(88,204,2,0.25)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            color: "inherit",
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #58cc02, #3b9eff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <HubertIcon size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.15rem" }}>
              Talk to Hubert
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              AI support companion — someone to listen, anytime
            </div>
          </div>
          <div style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--accent-green)",
            flexShrink: 0,
            padding: "0.3rem 0.75rem",
            borderRadius: "999px",
            border: "1px solid rgba(88,204,2,0.3)",
            background: "rgba(88,204,2,0.1)",
          }}>
            CHAT
          </div>
        </button>

        <div style={{ display: "grid", gap: "2rem" }}>
          {resources.map((section) => (
            <section key={section.category}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--border-color)",
              }}>
                <div style={{ color: section.color }}>{section.icon}</div>
                <h2 style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  letterSpacing: "0.02em",
                }}>{section.category}</h2>
              </div>

              <div style={{ display: "grid", gap: "0.5rem" }}>
                {section.items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.85rem 1.25rem",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      borderLeft: `3px solid ${section.color}`,
                      color: "var(--text-primary)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ color: section.color, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        marginBottom: "0.2rem",
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        lineHeight: "1.4",
                      }}>
                        {item.desc}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      color: section.color,
                      flexShrink: 0,
                      padding: "0.3rem 0.75rem",
                      borderRadius: "999px",
                      border: `1px solid ${section.color}40`,
                      background: `${section.color}15`,
                    }}>
                      TAP
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <HelpButton />
      {hubertOpen && <HubertChat onClose={() => setHubertOpen(false)} />}
    </div>
  );
}
