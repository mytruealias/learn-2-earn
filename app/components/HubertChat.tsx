"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HubertIcon, CloseIcon } from "./icons";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

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
        setError(data.error || "Something went wrong. Please try again.");
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
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 3000,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "rgba(0,0,0,0.8)",
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
            background: "linear-gradient(135deg, #58cc02, #3b9eff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <HubertIcon size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
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
              background: "linear-gradient(135deg, #58cc02, #3b9eff)",
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
        }}>
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
                  background: "linear-gradient(135deg, #58cc02, #3b9eff)",
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
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
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
            <div style={{
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
          <div style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={streaming}
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
