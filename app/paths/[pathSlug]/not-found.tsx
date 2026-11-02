import { ButtonLink, Card } from "@/app/components/ui";
export default function MissingPath() {
  return (
    <main
      data-design="learner"
      style={{ maxWidth: "40rem", margin: "2rem auto", padding: "1rem" }}
    >
      <Card>
        <h1>This pathway is not available</h1>
        <p>
          It may no longer be published, or the link may be out of date. Your
          saved progress has not been deleted.
        </p>
        <ButtonLink href="/app">Choose another path</ButtonLink>
        <ButtonLink href="/lifeline" variant="quiet">
          Help
        </ButtonLink>
      </Card>
    </main>
  );
}
