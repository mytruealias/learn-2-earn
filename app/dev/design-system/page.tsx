import { notFound } from "next/navigation";
import Showcase from "./Showcase";
export const dynamic = "force-dynamic";
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Showcase />;
}
