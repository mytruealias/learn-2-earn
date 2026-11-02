"use client";
import { useState } from "react";
import { Button, ButtonLink, Dialog } from "./ui";
import HumanResources from "./support/HumanResources";
import HubertChat from "./HubertChat";
import styles from "./support/support.module.css";
export default function HelpButton() {
  const [open, setOpen] = useState(false),
    [chat, setChat] = useState(false);
  return (
    <>
      <div className={styles.help} data-design="support">
        <Button
          aria-label="Open help and human-support resources"
          onClick={() => setOpen(true)}
        >
          Help
        </Button>
      </div>
      <Dialog
        open={open}
        title="Human help and support"
        onClose={() => setOpen(false)}
      >
        <HumanResources compact />
        <p>
          Hubert is an optional AI support tool. It is not a clinician or a
          monitored emergency service.
        </p>
        <div className={styles.actions}>
          <ButtonLink href="/lifeline">
            Program help and full resources
          </ButtonLink>
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
              setChat(true);
            }}
          >
            Open Hubert AI
          </Button>
        </div>
      </Dialog>
      {chat && <HubertChat onClose={() => setChat(false)} />}
    </>
  );
}
