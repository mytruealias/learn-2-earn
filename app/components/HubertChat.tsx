"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HubertIcon, CloseIcon, MicIcon, SpeakerOnIcon, SpeakerOffIcon } from "./icons";
import { useModalA11y } from "@/lib/use-modal-a11y";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean; length: number }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function HubertChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi, I'm Hubert. I'm here to listen — no judgment, no pressure. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceDisabled, setVoiceDisabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [speechSynthSupported, setSpeechSynthSupported] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const lastSpokenIndexRef = useRef<number>(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const baseInputRef = useRef<string>("");

  useEffect(() => {
    setVoiceSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
    setSpeechSynthSupported(supported);
    if (!supported) return;
    try {
      const stored = window.localStorage.getItem("hubert-speak-replies");
      if (stored === "1") setSpeakReplies(true);
    } catch {
      // ignore
    }
    lastSpokenIndexRef.current = 0;
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }, []);

  const toggleSpeakReplies = useCallback(() => {
    setSpeakReplies((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("hubert-speak-replies", next ? "1" : "0");
      } catch {
        // ignore
      }
      if (next) {
        lastSpokenIndexRef.current = messages.length - 1;
      } else {
        stopSpeaking();
      }
      return next;
    });
  }, [stopSpeaking, messages.length]);

  useEffect(() => {
    if (!speechSynthSupported || !speakReplies) return;
    if (streaming) return;
    const lastIdx = messages.length - 1;
    if (lastIdx <= lastSpokenIndexRef.current) return;
    const last = messages[lastIdx];
    if (!last || last.role !== "assistant") return;
    const text = last.content.trim();
    if (!text) return;
    lastSpokenIndexRef.current = lastIdx;
    try {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  }, [messages, streaming, speakReplies, speechSynthSupported]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (!rec) return;
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.onstart = null;
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ignore
    }
  }, []);

  const startListening = useCallback(() => {
    if (voiceDisabled || listening) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    try {
      const rec: SpeechRecognitionLike = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";

      finalTranscriptRef.current = "";
      baseInputRef.current = input ? input.replace(/\s*$/, "") + (input ? " " : "") : "";

      rec.onstart = () => {
        setListening(true);
        setVoiceHint(null);
      };

      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalTranscriptRef.current += transcript;
          } else {
            interim += transcript;
          }
        }
        const combined = (baseInputRef.current + finalTranscriptRef.current + interim)
          .replace(/\s+/g, " ")
          .trimStart();
        setInput(combined);
      };

      rec.onerror = (event) => {
        const err = event.error;
        if (err === "not-allowed" || err === "service-not-allowed") {
          setVoiceDisabled(true);
          setVoiceHint("Microphone access blocked. Enable mic permission in your browser to use voice.");
        } else if (err === "no-speech") {
          setVoiceHint("Didn't catch that — try again.");
        } else if (err === "audio-capture") {
          setVoiceDisabled(true);
          setVoiceHint("No microphone detected on this device.");
        } else if (err !== "aborted") {
          setVoiceHint("Voice input stopped unexpectedly.");
        }
      };

      rec.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setVoiceHint("Voice input isn't available right now.");
      setListening(false);
    }
  }, [input, listening, voiceDisabled]);

  const toggleListening = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);

  useEffect(() => {
    fetch("/api/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((res) => {
        setIsLoggedIn(res.ok);
        setAuthChecked(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setAuthChecked(true);
      });
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const overlayRef = useRef<HTMLDivElement>(null);
  useModalA11y(true, overlayRef, onClose);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
    };

    html.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const scrollEl = scrollContainerRef.current;

    const blockWheel = (e: WheelEvent) => {
      if (scrollEl && scrollEl.contains(e.target as Node)) return;
      e.preventDefault();
    };

    const blockTouch = (e: TouchEvent) => {
      if (scrollEl && scrollEl.contains(e.target as Node)) return;
      e.preventDefault();
    };

    overlay.addEventListener("wheel", blockWheel, { passive: false });
    overlay.addEventListener("touchmove", blockTouch, { passive: false });

    return () => {
      overlay.removeEventListener("wheel", blockWheel);
      overlay.removeEventListener("touchmove", blockTouch);
    };
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    setInput("");
    setError(null);
    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error?.message || "Something went wrong. Please try again.");
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("Connection error. Please try again.");
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setError(parsed.error);
              break;
            }
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            buffer = line + "\n";
          }
        }
      }
    } catch {
      setError("Connection error. Please try again.");
    }

    setStreaming(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hubert-chat-title"
      tabIndex={-1}
      style={{
      position: "fixed",
      inset: 0,
      zIndex: 3000,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "rgba(0,0,0,0.8)",
      touchAction: "none",
    }}>
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        maxWidth: "600px",
        width: "100%",
        margin: "0 auto",
        backgroundColor: "var(--bg-primary)",
        borderLeft: "1px solid var(--border-color)",
        borderRight: "1px solid var(--border-color)",
        overflow: "hidden",
        minHeight: 0,
      }}>
        <div style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          backgroundColor: "var(--bg-secondary)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <HubertIcon size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div id="hubert-chat-title" style={{
              fontWeight: 700,
              fontSize: "1rem",
              fontFamily: "var(--font-display)",
            }}>Hubert</div>
            <div style={{
              fontSize: "0.7rem",
              color: "var(--accent-green)",
              fontWeight: 600,
            }}>
              {streaming ? "typing..." : "online"}
            </div>
          </div>
          {speechSynthSupported && (
            <button
              type="button"
              onClick={toggleSpeakReplies}
              aria-label={speakReplies ? "Turn off read replies aloud" : "Turn on read replies aloud"}
              aria-pressed={speakReplies}
              title={speakReplies ? "Mute Hubert's voice" : "Read Hubert's replies aloud"}
              style={{
                background: "none",
                border: "none",
                color: speakReplies ? "var(--accent-green)" : "var(--text-muted)",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {speakReplies ? (
                <SpeakerOnIcon size={20} color="currentColor" />
              ) : (
                <SpeakerOffIcon size={20} color="currentColor" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close chat"
          >
            <CloseIcon size={22} color="var(--text-muted)" />
          </button>
        </div>

        {authChecked && !isLoggedIn ? (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            gap: "1rem",
            textAlign: "center",
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <HubertIcon size={28} color="#fff" />
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Log in to chat with Hubert
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: 280 }}>
              Create a free account or sign in to start talking with your AI support companion.
            </div>
            <a
              href="/login"
              style={{
                display: "inline-block",
                marginTop: "0.5rem",
                padding: "0.7rem 2rem",
                backgroundColor: "var(--accent-green)",
                color: "#fff",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Log In
            </a>
          </div>
        ) : (
        <>
        <div
          ref={scrollContainerRef}
          style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          minHeight: 0,
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "0.5rem",
                alignItems: "flex-end",
              }}
            >
              {msg.role === "assistant" && (
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
                  <HubertIcon size={14} color="#fff" />
                </div>
              )}
              <div
                style={{
                  maxWidth: "80%",
                  padding: "0.65rem 0.9rem",
                  borderRadius: msg.role === "user" ? "16px 16px 6px 16px" : "16px 16px 16px 6px",
                  backgroundColor: msg.role === "user" ? "var(--accent-blue)" : "var(--bg-card)",
                  color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                  fontSize: "0.88rem",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  border: msg.role === "assistant" ? "1px solid var(--border-color)" : "none",
                }}
              >
                {msg.content || (streaming && i === messages.length - 1 ? "..." : "")}
              </div>
            </div>
          ))}

          {error && (
            <div role="alert" aria-live="assertive" style={{
              textAlign: "center",
              fontSize: "0.8rem",
              color: "var(--accent-red)",
              padding: "0.5rem",
              backgroundColor: "rgba(245,80,80,0.1)",
              borderRadius: "8px",
            }}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} style={{ flexShrink: 0, height: 1 }} />
        </div>

        <div style={{
          padding: "0.75rem 1rem",
          borderTop: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-secondary)",
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: "0.5rem",
          }}>
            Hubert is an AI companion, not a therapist. In crisis? Call <a href="tel:988" style={{ color: "var(--accent-red)", fontWeight: 700 }}>988</a>
          </div>
          {voiceHint && (
            <div role="status" aria-live="polite" style={{
              fontSize: "0.7rem",
              color: "var(--text-secondary)",
              textAlign: "center",
              marginBottom: "0.5rem",
              padding: "0.4rem 0.6rem",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
            }}>
              {voiceHint}
            </div>
          )}
          <div style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}>
            <label htmlFor="hubert-chat-input" className="sr-only">
              Type a message to Hubert
            </label>
            <input
              id="hubert-chat-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (listening) stopListening();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={streaming}
              autoComplete="off"
              style={{
                flex: 1,
                padding: "0.7rem 1rem",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "20px",
                color: "var(--text-primary)",
                fontSize: "0.88rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            {voiceSupported && !voiceDisabled && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={streaming}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                aria-pressed={listening}
                title={listening ? "Stop voice input" : "Start voice input"}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: listening ? "var(--accent-red)" : "var(--bg-card)",
                  color: listening ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${listening ? "var(--accent-red)" : "var(--border-color)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  cursor: streaming ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  animation: listening ? "hubertMicPulse 1.4s ease-in-out infinite" : "none",
                  opacity: streaming ? 0.5 : 1,
                }}
              >
                <MicIcon size={18} color="currentColor" />
              </button>
            )}
            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: streaming || !input.trim() ? "var(--bg-card)" : "var(--accent-green)",
                color: streaming || !input.trim() ? "var(--text-muted)" : "#fff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
              aria-label="Send message"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
