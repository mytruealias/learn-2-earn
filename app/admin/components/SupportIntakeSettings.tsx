"use client";
import { useEffect, useState } from "react";
import { staffFetch } from "@/lib/staff-fetch";
import { Alert, Button, Card } from "@/app/components/ui";
import styles from "./staff.module.css";
type Settings = {
  supportEnabled: boolean;
  supportTeamName: string | null;
  supportMonitoring: string | null;
  supportRegion: string | null;
  supportReviewReference: string | null;
  supportVersion: number;
};
export default function SupportIntakeSettings() {
  const [data, setData] = useState<Settings | null>(null),
    [enabled, setEnabled] = useState(false),
    [team, setTeam] = useState(""),
    [monitoring, setMonitoring] = useState(""),
    [region, setRegion] = useState("US"),
    [reference, setReference] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function load() {
    const r = await staffFetch("/api/admin/support-settings"),
      d = await r.json();
    if (!r.ok)
      throw new Error(d.error?.message || "Support settings unavailable.");
    setData(d.settings);
    setEnabled(d.settings.supportEnabled);
    setTeam(d.settings.supportTeamName || "");
    setMonitoring(d.settings.supportMonitoring || "");
    setRegion(d.settings.supportRegion || "US");
    setReference(d.settings.supportReviewReference || "");
    setConfirmed(false);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function save() {
    if (!data || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await staffFetch("/api/admin/support-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expectedVersion: data.supportVersion,
            enabled,
            teamName: team,
            monitoring,
            region,
            reviewReference: reference,
            confirmed,
          }),
        }),
        d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error?.message || "Support settings were not confirmed.",
        );
      setMessage(
        "Program intake settings saved and audited. No notification delivery or emergency monitoring was enabled.",
      );
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Save was not confirmed. Reload to verify settings.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card id="program-support-intake">
      <h2>Program support intake</h2>
      <p>
        New intake is off until your program confirms a responsible team,
        monitoring notice and operating review. The app saves requests in the
        scoped case queue; it sends no pager, text, email or emergency dispatch.
        AI chat is separate and does not submit cases.
      </p>
      {error && (
        <Alert tone="error">
          {error}{" "}
          <Button
            variant="quiet"
            onClick={() => load().catch((e) => setError(e.message))}
          >
            Reload settings
          </Button>
        </Alert>
      )}
      {message && <p role="status">{message}</p>}
      {data ? (
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label>
            Intake availability
            <select
              value={enabled ? "enabled" : "disabled"}
              onChange={(e) => setEnabled(e.target.value === "enabled")}
            >
              <option value="disabled">
                Disabled — no new program requests
              </option>
              <option value="enabled">
                Enabled — staffed according to the notice below
              </option>
            </select>
          </label>
          <label>
            Responsible support team
            <input
              required={enabled}
              minLength={enabled ? 3 : undefined}
              maxLength={120}
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
          </label>
          <label>
            Actual monitoring hours, timezone and absence coverage
            <textarea
              required={enabled}
              minLength={enabled ? 10 : undefined}
              maxLength={500}
              value={monitoring}
              onChange={(e) => setMonitoring(e.target.value)}
              placeholder="Enter your verified schedule, including its timezone. Do not promise continuous monitoring unless it exists."
            />
          </label>
          <label>
            Deployment resource region
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="US">United States</option>
              <option value="other">
                Other — verify local human resources separately
              </option>
            </select>
          </label>
          <label>
            Verified staffing/resource-review record reference
            <input
              required
              minLength={5}
              maxLength={200}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".75rem",
              minHeight: 44,
            }}
          >
            <input
              style={{ width: 20, minHeight: 20, height: 20, flex: "none" }}
              type="checkbox"
              checked={confirmed}
              required
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I verified the responsible team, actual schedule, privacy/retention
            and local resource information. I understand that no automatic
            notifications or emergency response are provided.
          </label>
          <Button
            type="submit"
            busy={busy}
            disabled={!confirmed}
            disabledReason="Verify the operating assumptions before enabling or changing intake."
          >
            Confirm program intake settings
          </Button>
        </form>
      ) : (
        <p role="status">Loading program intake settings…</p>
      )}
    </Card>
  );
}
