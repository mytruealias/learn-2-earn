"use client";
import { useCallback, useState } from "react";
import {
  Alert,
  Button,
  IconButton,
  Field,
  Card,
  StatusBadge,
  ProgressIndicator,
  Skeleton,
  EmptyState,
  ErrorState,
  Dialog,
  Toast,
} from "@/app/components/ui";
import { CloseIcon, HubertIcon } from "@/app/components/icons";
import styles from "./showcase.module.css";
export default function Showcase() {
  const [open, setOpen] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(true);
  const close = useCallback(() => setOpen(false), []);
  return (
    <div data-design="workshop" className={styles.page}>
      <main className={styles.inner}>
        <header className={styles.header}>
          <StatusBadge tone="warning">Development only</StatusBadge>
          <h1>A clearer way forward.</h1>
          <p>
            Learn2Earn component workshop. These local examples preview the
            controls used in learning paths and the staff directory. They do not
            change accounts or save data.
          </p>
        </header>
        <div className={styles.grid}>
          <Card className={styles.section}>
            <h2>Actions</h2>
            <p>
              One primary action per decision. Secondary actions stay quieter.
            </p>
            <div className={styles.row}>
              <Button onClick={() => setOpen(true)}>Open example dialog</Button>
              <Button
                variant="secondary"
                onClick={() =>
                  setNotice("Example notification. No data was saved.")
                }
              >
                Preview notification
              </Button>
              <IconButton
                label="Preview dismiss action"
                onClick={() => setNotice("Dismiss action example.")}
              >
                <CloseIcon />
              </IconButton>
            </div>
            <Button
              disabled
              disabledReason="Add a required organization name before saving."
            >
              Unavailable action
            </Button>
            <Button
              busy
              disabledReason="A request is in progress. Please wait."
            >
              Saving example…
            </Button>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              A very long action label that stays readable on a narrow screen
            </Button>
          </Card>
          <Card className={styles.section}>
            <h2>Fields</h2>
            <Field
              id="sample-name"
              label="Organization name (required)"
              hint="Use a name the team will recognize."
            >
              <input required placeholder="Organization name" />
            </Field>
            <Field
              id="sample-error"
              label="Website"
              error="Include https:// for a working website link."
            >
              <input type="url" defaultValue="example" />
            </Field>
            <Field
              id="sample-disabled"
              label="Account identifier"
              hint="This value is managed by the service and cannot be edited here."
            >
              <input disabled value="Read-only example" readOnly />
            </Field>
            <Field id="sample-select" label="Category">
              <select defaultValue="Shelter">
                <option>Shelter</option>
                <option>
                  Healthcare and additional support with a long label
                </option>
              </select>
            </Field>
          </Card>
          <Card className={styles.section}>
            <h2>Feedback and meaning</h2>
            <div className={styles.swatches}>
              <span className={styles.swatch}>Primary</span>
              <span className={styles.swatch}>Success</span>
              <span className={styles.swatch}>Milestone</span>
              <span className={styles.swatch}>Hubert</span>
            </div>
            <Alert>Information example: your filters are still here.</Alert>
            <Alert tone="success">Success example: service saved.</Alert>
            <Alert tone="warning">Milestone example: checkpoint ahead.</Alert>
            <Alert tone="error">
              Error example: changes could not be confirmed.
            </Alert>
            <div className={styles.row}>
              <StatusBadge>Up next</StatusBadge>
              <StatusBadge tone="success">Complete</StatusBadge>
              <StatusBadge tone="warning">Checkpoint</StatusBadge>
              <StatusBadge tone="hubert">
                <HubertIcon size={18} /> Hubert
              </StatusBadge>
              <StatusBadge tone="error">Needs attention</StatusBadge>
            </div>
          </Card>
          <Card className={styles.section}>
            <h2>Progress and waiting</h2>
            <ProgressIndicator
              label="Example path progress"
              value={3}
              max={8}
            />
            <ProgressIndicator
              label="Completed example path"
              value={8}
              max={8}
            />
            <ProgressIndicator label="New example path" value={0} max={8} />
            <Skeleton label="Loading example services" />
            <EmptyState title="No matching services">
              Try another search or clear the filters.
            </EmptyState>
            {error ? (
              <ErrorState onRetry={() => setError(false)}>
                Example error: the directory could not load.
              </ErrorState>
            ) : (
              <Alert tone="success">
                Retry example completed. No request was sent.
              </Alert>
            )}
          </Card>
        </div>
        <Dialog open={open} title="Example service form" onClose={close}>
          <p>
            This dialog demonstrates focus, scrolling and validation. No data is
            saved.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              close();
              setNotice("Example completed. No data was saved.");
            }}
            className={styles.section}
          >
            <Field
              id="dialog-name"
              label="Example organization name (required)"
            >
              <input required />
            </Field>
            <div className={styles.row}>
              <Button type="submit">Complete example</Button>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
            </div>
          </form>
        </Dialog>
        <Toast message={notice} onDismiss={() => setNotice("")} />
      </main>
    </div>
  );
}
