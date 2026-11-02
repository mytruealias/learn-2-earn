import { ButtonLink } from "./components/ui";
import styles from "./components/reliability/reliability.module.css";
export default function NotFound() { return <main className={styles.error} data-design="recovery"><h1>We could not find that page</h1><p>The address may have changed or the content may be unavailable. Your saved learning has not been removed.</p><div><ButtonLink href="/app">Return to Learn</ButtonLink><ButtonLink href="/lifeline" variant="secondary">Human-help resources</ButtonLink></div></main>; }
