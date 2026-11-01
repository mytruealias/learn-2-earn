"use client";
import { useState } from "react";
import { Button } from "../ui";
import HubertChat from "../HubertChat";
import HumanResources from "./HumanResources";
import ProgramHelpRequest from "./ProgramHelpRequest";
import styles from "./support.module.css";
export default function SupportWorkspace() {
  const [chat, setChat] = useState(false),
    [region, setRegion] = useState<"US" | "other">("US");
  return (
    <>
      <label className={styles.form}>
        Choose resource region
        <select
          aria-label="Choose resource region"
          value={region}
          onChange={(e) => setRegion(e.target.value as "US" | "other")}
        >
          <option value="US">United States</option>
          <option value="other">Outside the United States</option>
        </select>
      </label>
      <HumanResources region={region} />
      <ProgramHelpRequest />
      <section>
        <h2>Optional Hubert AI</h2>
        <p>
          Hubert is an AI support tool, not a clinician or a monitored service.
          Chat does not create a program request or contact a person. Human
          resources above remain available if AI is unavailable.
        </p>
        <Button variant="secondary" onClick={() => setChat(true)}>
          Open Hubert AI
        </Button>
      </section>
      {chat && <HubertChat onClose={() => setChat(false)} />}
    </>
  );
}
