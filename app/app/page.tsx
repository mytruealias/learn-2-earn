import Link from "next/link";
import prisma from "@/lib/prisma";
import HelpButton from "../components/HelpButton";
import StatsBar from "../components/StatsBar";
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
        include: {
          lessons: {
            where: { isActive: true },
          },
        },
      },
    },
  });

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

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {paths.map((path, idx) => {
            const lessonCount = path.modules.reduce((s, m) => s + m.lessons.length, 0);
            const moduleCount = path.modules.length;
            const colors = ["var(--accent-green)", "var(--accent-blue)", "var(--accent-purple)", "var(--accent-gold)", "var(--accent-red)"];
            const bgColors = ["rgba(88,204,2,0.12)", "rgba(59,158,255,0.12)", "rgba(167,139,250,0.12)", "rgba(245,183,49,0.12)", "rgba(245,80,80,0.12)"];
            const color = colors[idx % colors.length];
            const bgColor = bgColors[idx % bgColors.length];

            return (
              <Link key={path.id} href={`/paths/${path.slug}`}>
                <div className="cyber-card" style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      border: `2px solid ${color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: bgColor,
                    }}>
                      {getPathIcon(path.icon, color, 26)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
                        <h3 style={{
                          fontSize: "1.2rem",
                          fontWeight: "700",
                          letterSpacing: "0.02em",
                          color: "var(--text-primary)",
                        }}>{path.title}</h3>
                      </div>
                      <p style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                        lineHeight: "1.5",
                        marginBottom: "0.5rem",
                      }}>
                        {path.description}
                      </p>
                      <div style={{
                        display: "flex",
                        gap: "0.75rem",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                      }}>
                        <span style={{
                          color,
                          background: bgColor,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "999px",
                        }}>{moduleCount} units</span>
                        <span style={{
                          color: "var(--text-muted)",
                          background: "rgba(136,146,176,0.1)",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "999px",
                        }}>{lessonCount} lessons</span>
                      </div>
                    </div>
                    <div style={{
                      color,
                      alignSelf: "center",
                      flexShrink: 0,
                    }}>
                      <ChevronRightIcon size={20} color={color} />
                    </div>
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
