import { ButtonLink, Card } from "@/app/components/ui";
export default function MissingLesson() {
  return (
    <main
      data-design="learner"
      style={{ maxWidth: "40rem", margin: "2rem auto", padding: "1rem" }}
    >
      <Card>
        <h1>This lesson is not available</h1>
        <p>
          It may no longer be published, or the link may be out of date. Your
          saved work is still there. Choose another learning path or use Help.
        </p>
        <ButtonLink href="/app">Choose a learning path</ButtonLink>
        <ButtonLink href="/lifeline" variant="quiet">
          Help
        </ButtonLink>
      </Card>
    </main>
  );
}
