"use client";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavBar from "../NavBar";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Dialog,
  ErrorState,
  Skeleton,
} from "../ui";
import { LearnerSessionProvider, useLearnerSession } from "./LearnerSession";
import styles from "./shell.module.css";
export default function LearnerShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const chrome =
    ["/app", "/practice", "/profile", "/lifeline"].includes(path) ||
    path.startsWith("/paths/");
  const active = chrome || path.startsWith("/lesson/");
  return (
    <LearnerSessionProvider active={active}>
      {chrome ? <Shell>{children}</Shell> : children}
    </LearnerSessionProvider>
  );
}
function Shell({ children }: { children: ReactNode }) {
  const { user, state, refresh, signOut } = useLearnerSession();
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [keyboard, setKeyboard] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [confirmGuest, setConfirmGuest] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    const measure = () => {
      const field = document.activeElement?.matches("input,select,textarea");
      setKeyboard(
        !!field && !!viewport && window.innerHeight - viewport.height > 150,
      );
    };
    viewport?.addEventListener("resize", measure);
    document.addEventListener("focusin", measure);
    document.addEventListener("focusout", measure);
    let nav: HTMLElement | null = null;
    const observer = new ResizeObserver(() => {
      if (nav)
        ref.current?.style.setProperty(
          "--learner-nav-height",
          `${nav.getBoundingClientRect().height}px`,
        );
    });
    const attachNavigation = () => {
      const current = ref.current?.querySelector("nav") || null;
      if (current === nav) return;
      observer.disconnect();
      nav = current;
      if (nav) observer.observe(nav);
    };
    const mutations = new MutationObserver(attachNavigation);
    if (ref.current)
      mutations.observe(ref.current, { childList: true, subtree: true });
    attachNavigation();
    return () => {
      viewport?.removeEventListener("resize", measure);
      document.removeEventListener("focusin", measure);
      document.removeEventListener("focusout", measure);
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);
  async function logout() {
    setLogoutBusy(true);
    setLogoutError("");
    try {
      await signOut();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Could not sign out. Try again.",
      );
      setLogoutBusy(false);
    }
  }
  const publicHelp = path === "/lifeline";
  useEffect(() => {
    if (!publicHelp && state === "ready" && !user && !logoutBusy)
      window.location.replace(
        `/login?reason=expired&next=${encodeURIComponent(path)}`,
      );
  }, [publicHelp, state, user, path, logoutBusy]);
  return (
    <div
      ref={ref}
      data-design="learner-shell"
      data-ui-shell="learner"
      data-learner-shell
      data-keyboard-open={keyboard || undefined}
      className={styles.shell}
    >
      <a className="ds-skip-link" href="#learner-content">
        Skip to content
      </a>
      <Suspense fallback={null}>
        <NavBar />
      </Suspense>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <Link href="/app" className={styles.brand}>
            Learn<span>2</span>Earn
          </Link>
          <div className={styles.actions}>
            <ButtonLink href="/lifeline" variant="quiet">
              Help
            </ButtonLink>
            {user ? (
              <Button
                variant="secondary"
                busy={logoutBusy}
                disabledReason="Signing out on this device. Please wait for confirmation."
                onClick={() =>
                  user.kind === "guest" ? setConfirmGuest(true) : void logout()
                }
              >
                Sign out
              </Button>
            ) : (
              state === "ready" && (
                <ButtonLink href="/login" variant="secondary">
                  Sign in
                </ButtonLink>
              )
            )}
          </div>
        </header>
        {logoutError && <Alert tone="error">{logoutError}</Alert>}
        <div id="learner-content" tabIndex={-1} className={styles.content}>
          {publicHelp ? (
            children
          ) : state === "loading" ? (
            <main className={styles.sessionState}>
              <Skeleton label="Checking your saved session" />
            </main>
          ) : state === "error" ? (
            <main className={styles.sessionState}>
              <Card>
                <ErrorState onRetry={() => void refresh()}>
                  We could not check your session. Reconnect and try again. Your
                  account has not been deleted.
                </ErrorState>
              </Card>
            </main>
          ) : !user ? (
            <main className={styles.sessionState}>
              <Card>
                <h1>Your session ended</h1>
                <p>Sign in to return to your saved work.</p>
                <ButtonLink
                  href={`/login?reason=expired&next=${encodeURIComponent(path)}`}
                >
                  Sign in
                </ButtonLink>
              </Card>
            </main>
          ) : (
            children
          )}
        </div>
      </div>
      <Dialog
        open={confirmGuest}
        title="Keep your guest progress"
        onClose={() => {
          if (!logoutBusy) setConfirmGuest(false);
        }}
        closeDisabledReason={
          logoutBusy ? "Wait while sign out is confirmed." : undefined
        }
      >
        <p>
          Create an account in this browser before signing out if you want to
          keep access to this guest progress. Signing out ends access to the
          guest session on this device.
        </p>
        {logoutError && <Alert tone="error">{logoutError}</Alert>}
        <div className={styles.actions}>
          <ButtonLink href="/signup">Create an account</ButtonLink>
          <Button
            variant="secondary"
            busy={logoutBusy}
            disabledReason="Signing out. Please wait."
            onClick={() => void logout()}
          >
            Sign out of guest session
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
