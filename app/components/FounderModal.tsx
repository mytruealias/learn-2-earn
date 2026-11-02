"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Dialog } from "./ui";
/** No organization/history/team claim without verified documentation. */
export default function FounderModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="quiet" onClick={() => setOpen(true)}>
        About Learn2Earn
      </Button>
      <Dialog
        open={open}
        title="About Learn2Earn"
        onClose={() => setOpen(false)}
      >
        <p>
          Learn2Earn is a software platform for supported adult learning and
          program oversight. Organizational status, history, team details and
          any proposed partnership should be verified through the pilot
          discussion process.
        </p>
        <Link href="/#contact" onClick={() => setOpen(false)}>
          Open the partner inquiry form
        </Link>
      </Dialog>
    </>
  );
}
