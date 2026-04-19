"use client";

import { useState, useRef, useCallback } from "react";
import { PhoneIcon, HomeIcon, ChatIcon, HandshakeIcon, HeartPulseIcon, HubertIcon } from "./icons";
import HubertChat from "./HubertChat";
import { useModalA11y } from "@/lib/use-modal-a11y";

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useModalA11y(open, dialogRef, close);

  const openHubert = () => {
    setOpen(false);
    setChatOpen(true);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="SOS — open emergency help and crisis resources"
        aria-haspopup="dialog"
        style={{
          position: "fixed",
          bottom: "5rem",
          right: "1.5rem",
          backgroundColor: "var(--accent-red)",
          color: "#fff",
          border: "none",
          height: "48px",
          padding: "0 1.1rem",
          borderRadius: "999px",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(255,75,75,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "1rem",
          letterSpacing: "0.08em",
          transition: "all 0.2s",
        }}
      >
        SOS
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "2px solid var(--accent-red)",
              borderRadius: "20px",
              padding: "2rem",
              maxWidth: "440px",
              width: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ marginBottom: "0.5rem" }}>
              <HeartPulseIcon size={32} color="var(--accent-gold)" />
            </div>
            <h2 id="help-modal-title" style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
            }}>
              You Are Not Alone
            </h2>
            <p style={{
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
              lineHeight: "1.5",
            }}>
              Free help is available right now. Tap to call or text.
            </p>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <button
                onClick={openHubert}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid rgba(88,204,2,0.35)",
                  borderRadius: "12px",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-display)",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  background: "linear-gradient(135deg, rgba(88,204,2,0.08), rgba(59,158,255,0.08))",
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <HubertIcon size={15} color="#fff" />
                </div>
                Talk to Hubert
                <span style={{
                  marginLeft: "auto",
                  fontSize: "0.65rem",
                  color: "var(--accent-green)",
                  fontWeight: 700,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(88,204,2,0.3)",
                  background: "rgba(88,204,2,0.1)",
                }}>AI</span>
              </button>
              {[
                { href: "tel:988", label: "988 Suicide & Crisis Lifeline", color: "var(--accent-red)", icon: <PhoneIcon size={20} color="var(--accent-red)" /> },
                { href: "tel:211", label: "211 — Food, Shelter, & Services", color: "var(--accent-blue)", icon: <HomeIcon size={20} color="var(--accent-blue)" /> },
                { href: "sms:741741&body=HELLO", label: "Text HOME to 741741", color: "var(--accent-purple)", icon: <ChatIcon size={20} color="var(--accent-purple)" /> },
                { href: "tel:18007997233", label: "SAMHSA Helpline", color: "var(--accent-gold)", icon: <HandshakeIcon size={20} color="var(--accent-gold)" /> },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.85rem 1rem",
                    backgroundColor: "var(--bg-card)",
                    border: `1px solid ${item.color}40`,
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    fontFamily: "var(--font-display)",
                    transition: "all 0.2s",
                  }}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginTop: "1rem",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "0.85rem",
                fontFamily: "var(--font-display)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {chatOpen && <HubertChat onClose={() => setChatOpen(false)} />}
    </>
  );
}
