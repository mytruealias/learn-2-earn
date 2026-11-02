"use client";
import { clientFetch } from "@/lib/reliability/client-fetch";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Dialog } from "./ui";
import { HubertIcon } from "./icons";
import HumanResources from "./support/HumanResources";
import styles from "./support/support.module.css";
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  complete: boolean;
};
type Availability = { accountId: string | null; aiAvailable: boolean };
export default function HubertChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [consent, setConsent] = useState(false),
    [cloudConsent, setCloudConsent] = useState(false),
    [state, setState] = useState<"checking" | "ready" | "streaming">(
      "checking",
    ),
    [available, setAvailable] = useState<Availability | null>(null),
    [error, setError] = useState(""),
    [region, setRegion] = useState<"US" | "other">("US"),
    [audioBusy, setAudioBusy] = useState(false),
    [audioMessage, setAudioMessage] = useState("");
  const pending = useRef<AbortController | null>(null),
    audioRequest = useRef<AbortController | null>(null),
    audio = useRef<HTMLAudioElement | null>(null),
    audioUrl = useRef<string | null>(null),
    lock = useRef(false),
    mounted = useRef(true),
    log = useRef<HTMLDivElement>(null);
  const stopAudio = useCallback(() => {
    audioRequest.current?.abort();
    audio.current?.pause();
    if (audio.current) audio.current.src = "";
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = null;
    audio.current = null;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }, []);
  useEffect(() => {
    mounted.current = true;
    const c = new AbortController();
    clientFetch("/api/support", {
      credentials: "include",
      cache: "no-store",
      signal: c.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (mounted.current) setAvailable(d);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError(
            "Hubert’s availability could not be checked. Human help remains available below.",
          );
      })
      .finally(() => {
        if (!c.signal.aborted) setState("ready");
      });
    return () => {
      mounted.current = false;
      c.abort();
      pending.current?.abort();
      stopAudio();
    };
  }, [stopAudio]);
  const latest = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.complete && m.content),
    canSend =
      !!available?.accountId &&
      available.aiAvailable &&
      consent &&
      state === "ready";
  async function send(retry = false) {
    const text = (
      retry
        ? [...messages].reverse().find((m) => m.role === "user")?.content
        : input
    )?.trim();
    if (!text || lock.current || !canSend) return;
    lock.current = true;
    setState("streaming");
    setError("");
    stopAudio();
    const user: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        complete: true,
      },
      history = retry
        ? messages
            .filter((m) => m.complete)
            .filter((m, i, all) => !(i === all.length - 1 && m.role === "user"))
        : messages.filter((m) => m.complete),
      conversation = [...history, user];
    setMessages(conversation);
    setInput("");
    const answerId = crypto.randomUUID(),
      c = new AbortController();
    pending.current = c;
    const timer = setTimeout(() => c.abort(), 35000);
    let content = "",
      complete = false;
    try {
      let turns = conversation
        .slice(-12)
        .map(({ role, content }) => ({ role, content }));
      while (
        turns.length > 1 &&
        (turns.reduce((n, m) => n + m.content.length, 0) > 12000 ||
          new TextEncoder().encode(
            JSON.stringify({
              expectedAccountId: available!.accountId,
              consent: true,
              region,
              messages: turns,
            }),
          ).byteLength > 49152)
      )
        turns = turns.slice(1);
      const r = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedAccountId: available!.accountId,
          consent: true,
          region,
          messages: turns,
        }),
        signal: c.signal,
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error?.message || "Hubert could not reply.");
      }
      if (!r.body) throw new Error("No reply stream was available.");
      const reader = r.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "";
      setMessages((prev) => [
        ...prev,
        { id: answerId, role: "assistant", content: "", complete: false },
      ]);
      while (!complete) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (buffer.length > 20000) throw new Error("Reply interrupted.");
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const data = frame
            .split(/\r?\n/)
            .find((l) => l.startsWith("data: "))
            ?.slice(6);
          if (!data) continue;
          if (data === "[DONE]") {
            complete = true;
            break;
          }
          const event = JSON.parse(data);
          if (event.error) throw new Error(event.error);
          if (typeof event.text === "string") {
            content += event.text;
            if (content.length > 6000) throw new Error("Reply interrupted.");
            if (mounted.current)
              setMessages((prev) =>
                prev.map((m) => (m.id === answerId ? { ...m, content } : m)),
              );
          }
        }
      }
      if (!complete)
        throw new Error(
          "This reply was interrupted and may be incomplete. No help request or alert was sent.",
        );
      if (mounted.current)
        setMessages((prev) =>
          prev.map((m) => (m.id === answerId ? { ...m, complete: true } : m)),
        );
    } catch (e) {
      if (mounted.current)
        setError(
          c.signal.aborted
            ? "Reply stopped or timed out. Partial text may be incomplete. Human help remains available; no alert was sent."
            : e instanceof Error
              ? e.message
              : "The reply could not be confirmed. Human help remains available.",
        );
    } finally {
      clearTimeout(timer);
      c.abort();
      pending.current = null;
      lock.current = false;
      if (mounted.current) setState("ready");
    }
  }
  async function voice(cloud: boolean) {
    if (!latest) return;
    stopAudio();
    setAudioMessage("");
    if (!cloud) {
      const voices =
        typeof speechSynthesis !== "undefined"
          ? speechSynthesis.getVoices().filter((v) => v.localService)
          : [];
      if (!voices.length) {
        setAudioMessage(
          "No local device voice is available. Text remains readable; cloud voice requires a separate choice.",
        );
        return;
      }
      const utterance = new SpeechSynthesisUtterance(latest.content);
      utterance.voice =
        voices.find((v) =>
          v.lang.startsWith(navigator.language.split("-")[0]),
        ) || voices[0];
      speechSynthesis.speak(utterance);
      setAudioMessage(
        "Reading on a local device voice. Use Stop audio to end it.",
      );
      return;
    }
    if (!cloudConsent) return;
    const c = new AbortController();
    audioRequest.current = c;
    setAudioBusy(true);
    try {
      const r = await clientFetch("/api/tts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedAccountId: available!.accountId,
          text: latest.content.slice(0, 2000),
          consent: true,
        }),
        signal: c.signal,
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error?.message || "Cloud voice unavailable.");
      }
      const url = URL.createObjectURL(await r.blob());
      if (!mounted.current) {
        URL.revokeObjectURL(url);
        return;
      }
      audioUrl.current = url;
      const player = new Audio(url);
      audio.current = player;
      player.onended = stopAudio;
      await player.play();
      setAudioMessage(
        "Playing AI-generated cloud voice, up to the first 2,000 characters. No automatic voice processing is enabled.",
      );
    } catch (e) {
      if (mounted.current)
        setAudioMessage(
          c.signal.aborted
            ? "Audio stopped."
            : e instanceof Error
              ? e.message
              : "Audio unavailable. Text remains available.",
        );
    } finally {
      if (mounted.current) setAudioBusy(false);
    }
  }
  return (
    <Dialog
      open
      title="Hubert — AI support"
      onClose={() => {
        pending.current?.abort();
        stopAudio();
        onClose();
      }}
    >
      <div className={styles.chat} data-design="support">
        <div className={styles.badge}>
          <HubertIcon size={32} />
          <strong>Optional AI support</strong>
        </div>
        <p>
          Hubert can be wrong. It is not a clinician, crisis counselor or
          monitored service. It cannot read case files, change rewards, contact
          staff or dispatch help.
        </p>
        <label>
          Resource region
          <select
            aria-label="Resource region"
            value={region}
            onChange={(e) => setRegion(e.target.value as "US" | "other")}
          >
            <option value="US">United States</option>
            <option value="other">Outside the United States</option>
          </select>
        </label>
        <p>
          Messages go to OpenAI when AI is enabled. We do not save chat
          transcripts to your account or browser storage. Provider and hosting
          retention depend on their settings and agreements; closing chat does
          not guarantee their deletion. Avoid names, locations, case details and
          payment information.
        </p>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          I choose to send this conversation to the AI provider.
        </label>
        {state === "checking" ? (
          <p role="status">Checking optional AI availability…</p>
        ) : !available ? (
          <p>
            Optional AI status is unavailable. Human help remains available
            below.
          </p>
        ) : !available.accountId ? (
          <p>
            Sign in to use AI chat. Human help below does not require sign-in.
          </p>
        ) : !available.aiAvailable ? (
          <p>
            Hubert AI is unavailable. Human-help options remain available; this
            conversation is not monitored.
          </p>
        ) : null}
        <div
          ref={log}
          className={styles.log}
          tabIndex={0}
          role="log"
          aria-label="Hubert conversation"
          aria-live="polite"
          aria-relevant="additions"
        >
          <p>
            Choose what you want to share. Sending a chat message does not send
            a program help request.
          </p>
          {messages.map((m) => (
            <article
              key={m.id}
              className={`${styles.message} ${m.role === "user" ? styles.mine : ""}`}
            >
              <strong>
                {m.role === "user" ? "You" : "Hubert AI"}
                {!m.complete && m.role === "assistant"
                  ? " — incomplete reply"
                  : ""}
              </strong>
              <p>{m.content || "Preparing a reply…"}</p>
            </article>
          ))}
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label>
            Your message
            <textarea
              maxLength={1000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!canSend}
              aria-describedby="hubert-input-note"
            />
          </label>
          <p id="hubert-input-note">
            Up to 1,000 characters. Voice dictation on your keyboard may use
            your device provider; type if you prefer.
          </p>
          <div className={styles.actions}>
            <Button
              type="submit"
              disabled={!canSend || !input.trim()}
              disabledReason="AI must be available, you must be signed in, and the privacy choice and message are required."
              busy={state === "streaming"}
            >
              Send to Hubert
            </Button>
            {state === "streaming" && (
              <Button
                variant="secondary"
                onClick={() => pending.current?.abort()}
              >
                Stop reply
              </Button>
            )}
            {error && (
              <Button
                variant="secondary"
                disabled={!canSend}
                disabledReason="Wait for the current reply or availability check."
                onClick={() => void send(true)}
              >
                Retry last message
              </Button>
            )}
          </div>
        </form>
        {latest && (
          <section>
            <h3>Optional read-aloud</h3>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => void voice(false)}>
                Read with local device voice
              </Button>
              <Button
                variant="quiet"
                onClick={() => {
                  stopAudio();
                  setAudioMessage("Audio stopped.");
                }}
              >
                Stop audio
              </Button>
            </div>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={cloudConsent}
                onChange={(e) => setCloudConsent(e.target.checked)}
              />
              I choose to send this reply text to OpenAI for AI-generated voice.
            </label>
            <Button
              variant="secondary"
              busy={audioBusy}
              disabled={!cloudConsent}
              disabledReason="Cloud voice sends reply text to OpenAI; choose that processing option first."
              onClick={() => void voice(true)}
            >
              Read with cloud voice
            </Button>
            {audioMessage && <p role="status">{audioMessage}</p>}
          </section>
        )}
        <HumanResources compact region={region} />
        <a href="/lifeline" className={styles.link}>
          Open public help and program request status
        </a>
      </div>
    </Dialog>
  );
}
