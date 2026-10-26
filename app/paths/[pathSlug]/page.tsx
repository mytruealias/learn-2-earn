import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import HelpButton from "../../components/HelpButton";
import PathLearning from "../../components/PathLearning";
import { ButtonLink } from "../../components/ui";
import styles from "./path.module.css";
import { HubertIcon } from "../../components/icons";
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

export default async function PathPage({
  params,
}: {
  params: Promise<{ pathSlug: string }>;
}) {
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
      lessonType: l.lessonType,
      estimatedMinutes: l.estimatedMinutes,
      order: l.order,
    })),
  }));

  return (
    <div data-design="learner" data-ui-shell="learner" className={styles.page}>
      <a className="ds-skip-link" href="#path-content">
        Skip to lessons
      </a>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            Learn<span>2</span>Earn
          </div>
          <ButtonLink href="/app" variant="quiet">
            <span style={{ transform: "rotate(180deg)", display: "flex" }}>
              <ChevronRightIcon size={18} />
            </span>{" "}
            Back to paths
          </ButtonLink>
        </div>
      </div>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Your learning path</p>
          <div className={styles.heading}>
            <span className={styles.pathIcon}>
              {getPathIcon(path.icon, "currentColor", 28)}
            </span>
            <h1>{path.title}</h1>
          </div>
          <p className={styles.description}>{path.description}</p>
          <div className={styles.facts}>
            <span>{modulesData.length} units</span>
            <span>
              {modulesData.reduce((sum, mod) => sum + mod.lessons.length, 0)}{" "}
              lessons
            </span>
            <span>At your own pace</span>
          </div>
        </div>
        <aside className={styles.companion} aria-label="A reminder from Hubert">
          <div className={styles.companionIcon}>
            <HubertIcon size={36} />
          </div>
          <strong>Small steps count.</strong>
          <p>
            Take this one lesson at a time. You can come back whenever you need.
          </p>
        </aside>
      </header>
      <main id="path-content" tabIndex={-1} className={styles.content}>
        <PathLearning modules={modulesData} />
      </main>
      <HelpButton />
    </div>
  );
}
