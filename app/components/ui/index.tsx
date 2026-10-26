"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "react";
import Link from "next/link";
import { CloseIcon, AlertIcon, CheckCircleIcon } from "../icons";
import { useModalA11y } from "@/lib/use-modal-a11y";
import styles from "./ui.module.css";

type Tone = "info" | "success" | "warning" | "error" | "hubert";
type Variant = "primary" | "secondary" | "quiet" | "danger";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  busy?: boolean;
  disabledReason?: string;
};
export function Button({
  variant = "primary",
  busy,
  disabled,
  disabledReason,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const id = useId();
  const reason =
    disabled || busy
      ? disabledReason ||
        (busy
          ? "Please wait while this finishes."
          : "This action is currently unavailable.")
      : "";
  return (
    <span className={styles.action}>
      <button
        {...props}
        type={props.type || "button"}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        aria-describedby={
          [props["aria-describedby"], reason && id].filter(Boolean).join(" ") ||
          undefined
        }
        className={`${styles.button} ${styles[variant]} ${className}`}
      >
        {children}
      </button>
      {reason && (
        <span id={id} className={styles.reason}>
          {reason}
        </span>
      )}
    </span>
  );
}
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${styles.button} ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
export function IconButton({
  label,
  children,
  ...props
}: Omit<ButtonProps, "aria-label"> & { label: string }) {
  return (
    <Button
      {...props}
      aria-label={label}
      title={label}
      variant={props.variant || "quiet"}
      className={`${styles.icon} ${props.className || ""}`}
    >
      {children}
    </Button>
  );
}
export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`${styles.card} ${className}`}>
      {children}
    </div>
  );
}
type Control = ReactElement<{
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}>;
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: Control;
}) {
  const described = [
    children.props["aria-describedby"],
    hint && `${id}-hint`,
    error && `${id}-error`,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {cloneElement(children, {
        id,
        "aria-describedby": described || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {error && (
        <p id={`${id}-error`} role="alert" className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}
export function Alert({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`${styles.alert} ${styles[tone]}`}
    >
      <span aria-hidden="true">
        {tone === "success" ? <CheckCircleIcon /> : <AlertIcon />}
      </span>
      <div>{children}</div>
    </div>
  );
}
export function StatusBadge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
export function ProgressIndicator({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const id = useId();
  const total = Math.max(1, max);
  const current = Math.max(0, Math.min(value, total));
  return (
    <div className={styles.progress}>
      <div className={styles.progressLabel}>
        <label id={`${id}-label`} htmlFor={id}>
          {label}
        </label>
        <span>
          {current} of {max} lessons
        </span>
      </div>
      <progress
        id={id}
        aria-labelledby={`${id}-label`}
        max={total}
        value={current}
        aria-valuetext={`${current} of ${max} lessons complete`}
      />
    </div>
  );
}
export function Skeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className={styles.skeleton}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className={styles.skeletonBar} />
      <span aria-hidden="true" className={styles.skeletonBar} />
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function ErrorState({
  onRetry,
  children,
}: {
  onRetry: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <Alert tone="error">{children}</Alert>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
export function Dialog({
  open,
  title,
  children,
  onClose,
  closeDisabledReason,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeDisabledReason?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useModalA11y(open, ref, onClose);
  useEffect(() => {
    if (open && ref.current && !ref.current.open) ref.current.showModal();
  }, [open]);
  if (!open) return null;
  return (
    <dialog
      ref={ref}
      data-design="dialog"
      aria-labelledby={id}
      aria-modal="true"
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.dialogHeader}>
        <h2 id={id}>{title}</h2>
        <IconButton
          label="Close dialog"
          onClick={onClose}
          disabled={!!closeDisabledReason}
          disabledReason={closeDisabledReason}
        >
          <CloseIcon />
        </IconButton>
      </div>
      <div className={styles.dialogContent}>{children}</div>
    </dialog>
  );
}
export function Toast({
  message,
  tone = "success",
  onDismiss,
}: {
  message: string;
  tone?: Tone;
  onDismiss: () => void;
}) {
  return (
    <div
      className={styles.toastHost}
      data-design="notification"
      role={tone === "error" ? "alert" : "status"}
      aria-atomic="true"
    >
      {message && (
        <div className={`${styles.toast} ${styles[tone]}`}>
          <p>{message}</p>
          <IconButton label="Dismiss notification" onClick={onDismiss}>
            <CloseIcon />
          </IconButton>
        </div>
      )}
    </div>
  );
}
