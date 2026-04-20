import Link from "next/link";
import prisma from "@/lib/prisma";
import HelpButton from "../components/HelpButton";
import StatsBar from "../components/StatsBar";
import ContinueLearningCard from "../components/ContinueLearningCard";
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
} from "../components/icons";

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

export default async function AppHome() {
  const paths = await prisma.path.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      modules: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: { id: true, title: true, order: true },
          },
        },
      },
    },
  });

  const pathsForCard = paths.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    icon: p.icon,
    modules: p.modules.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
      })),
    })),
  }));

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", padding: "0 0 6rem 0" }}>
      <header style={{
        padding: "3rem 1.5rem 2rem",
        background: "linear-gradient(180deg, rgba(59,158,255,0.08) 0%, rgba(167,139,250,0.04) 50%, transparent 100%)",
        borderBottom: "1px solid var(--border-color)",
        position: "relative",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--accent-green)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}>
            Ready to level up? Let&apos;s go!
          </div>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "3rem",
              fontWeight: "700",
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}>
              LEARN <span style={{ color: "var(--accent-green)" }}>2</span> EARN
            </h1>
          </Link>
          <p style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            maxWidth: "460px",
            margin: "0 auto",
            lineHeight: "1.6",
            fontFamily: "var(--font-display)",
          }}>
            Small steps. Real skills. Lasting change. Complete missions and earn XP on your path to stability.
          </p>
        </div>
      </header>

      <StatsBar />

      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "1rem 1.5rem" }}>
        <ContinueLearningCard paths={pathsForCard} />

        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.85rem",
          fontWeight: "600",
          color: "var(--accent-green)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "1.25rem",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
        }}>
          Choose Your Path
        </div>

        <div style={{ display: "grid", gap: "0.85rem" }}>
          {paths.map((path, idx) => {
            const lessonCount = path.modules.reduce((s, m) => s + m.lessons.length, 0);
            const moduleCount = path.modules.length;

            const palette = [
              { color: "var(--accent-green)", rgb: "88,204,2" },
              { color: "var(--accent-blue)", rgb: "59,158,255" },
              { color: "var(--accent-purple)", rgb: "167,139,250" },
              { color: "var(--accent-gold)", rgb: "245,183,49" },
              { color: "var(--accent-red)", rgb: "245,80,80" },
            ];
            const { color, rgb } = palette[idx % palette.length];

            return (
              <Link key={path.id} href={`/paths/${path.slug}`}>
                <div style={{
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "14px",
                  border: `1px solid rgba(${rgb},0.35)`,
                  borderLeft: `5px solid ${color}`,
                  padding: "1.1rem 1.25rem 1.1rem 1.15rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1.1rem",
                  boxShadow: `0 2px 16px rgba(${rgb},0.12), inset 0 0 0 1px rgba(${rgb},0.07)`,
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}>
                  {/* Icon bubble */}
                  <div style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "13px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `rgba(${rgb},0.18)`,
                    border: `1.5px solid rgba(${rgb},0.5)`,
                  }}>
                    {getPathIcon(path.icon, color, 26)}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "1.05rem",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                      letterSpacing: "0.01em",
                      marginBottom: "0.25rem",
                      lineHeight: "1.2",
                    }}>
                      {path.title}
                    </div>
                    {path.description && (
                      <p style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.8rem",
                        lineHeight: "1.45",
                        marginBottom: "0.5rem",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}>
                        {path.description}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        color,
                        backgroundColor: `rgba(${rgb},0.15)`,
                        border: `1px solid rgba(${rgb},0.3)`,
                        padding: "0.15rem 0.55rem",
                        borderRadius: "999px",
                        letterSpacing: "0.03em",
                      }}>
                        {moduleCount} units
                      </span>
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        color: "#5d6a7d",
                        backgroundColor: "rgba(136,146,176,0.1)",
                        border: "1px solid rgba(136,146,176,0.35)",
                        padding: "0.15rem 0.55rem",
                        borderRadius: "999px",
                        letterSpacing: "0.03em",
                      }}>
                        {lessonCount} lessons
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ flexShrink: 0 }}>
                    <ChevronRightIcon size={22} color={color} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <HelpButton />
    </div>
  );
}
