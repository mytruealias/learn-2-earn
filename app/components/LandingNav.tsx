"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink, Dialog } from "./ui";
import styles from "./marketing/marketing.module.css";
const links = [
  ["/#how-it-works", "How it works"],
  ["/#platform", "The platform"],
  ["/#pathways", "Pathways"],
  ["/#pilot", "Pilot process"],
  ["/demo", "Try a lesson"],
];
export default function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className={styles.nav}>
      <Link className={styles.brand} href="/" aria-label="Learn2Earn home">
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="9" fill="currentColor" />
          <path d="M8 23h4v-6H8zm6 0h4V12h-4zm6 0h4V7h-4z" fill="white" />
        </svg>
        Learn2Earn
      </Link>
      <nav className={styles.desktopNav} aria-label="Partner website">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.navActions}>
        <Link href="/login" className={styles.signIn}>
          Learner sign in
        </Link>
        <span className={styles.desktopCta}>
          <ButtonLink href="/#contact">Discuss a pilot</ButtonLink>
        </span>
        <span className={styles.mobileMenu}>
          <Button
            variant="secondary"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            Menu
          </Button>
        </span>
      </div>
      <Dialog
        open={open}
        title="Website navigation"
        onClose={() => setOpen(false)}
      >
        <nav className={styles.mobileLinks} aria-label="Mobile partner website">
          {[
            ...links,
            ["/#contact", "Discuss a pilot"],
            ["/login", "Learner sign in"],
          ].map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      </Dialog>
    </header>
  );
}
