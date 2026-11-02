import { Skeleton } from "../components/ui";
export default function Loading() {
  return (
    <main style={{ padding: "2rem" }}>
      <Skeleton label="Loading your learning space" />
    </main>
  );
}
