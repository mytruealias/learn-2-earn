import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import HelpButton from "../../components/HelpButton";
import LessonList from "../../components/LessonList";
import {
  ShelterIcon,
  ShieldIcon,
  RocketIcon,
  WalletIcon,
  SproutIcon,
  BrainIcon,
  LifeRingIcon,
  MedicalIcon,
  KeyIcon,
  WarningIcon,
  HeartCareIcon,
  StarIcon,
  ChevronRightIcon,
} from "../../components/icons";

export const dynamic = "force-dynamic";

function getPathIcon(emoji: string, color: string, size = 28) {
  const map: Record<string, React.ReactNode> = {
    "🏠": <ShelterIcon size={size} color={color} />,
    "🛡️": <ShieldIcon size={size} color={color} />,
    "🚀": <RocketIcon size={size} color={color} />,
    "💰": <WalletIcon size={size} color={color} />,
    "🌱": <SproutIcon size={size} color={color} />,
    "🧠": <BrainIcon size={size} color={color} />,
    "🛟": <LifeRingIcon size={size} color={color} />,
    "🏥": <MedicalIcon size={size} color={color} />,
    "🔒": <KeyIcon size={size} color={color} />,
    "⚠️": <WarningIcon size={size} color={color} />,
    "💛": <HeartCareIcon size={size} color={color} />,
  };
  return map[emoji] ?? <StarIcon size={size} color={color} />;
}

export default async function PathPage({ params }: { params: { pathSlug: string } }) {
  const { pathSlug } = await params;

  const path = await prisma.path.findUnique({
    where: { slug: pathSlug },
    include: {
      modules: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!path) {
    notFound();
  }

  const modulesData = path.modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    order: mod.order,
    lessons: mod.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      xpReward: l.xpReward,
      order: l.order,
    })),
  }));

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", padding: "0 0 6rem 0" }}>
      <header style={{
        padding: "1.5rem 1.5rem",
        background: "linear-gradient(180deg, rgba(59,158,255,0.07) 0%, transparent 100%)",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <Link href="/app" style={{
            color: "var(--accent-green)",
            fontSize: "0.85rem",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            marginBottom: "1rem",
          }}>
            <div style={{ transform: "rotate(180deg)", display: "flex" }}>
              <ChevronRightIcon size={16} color="var(--accent-green)" />
            </div>
            Back to Paths
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              border: "2px solid var(--accent-green)",
              backgroundColor: "rgba(59,158,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {getPathIcon(path.icon, "var(--accent-green)", 28)}
            </div>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.75rem",
                fontWeight: "700",
                marginBottom: "0.25rem",
                letterSpacing: "0.02em",
              }}>{path.title}</h1>
              <p style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                lineHeight: "1.5",
              }}>{path.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem 1.5rem" }}>
        <LessonList modules={modulesData} />
      </main>

      <HelpButton />
    </div>
  );
}
