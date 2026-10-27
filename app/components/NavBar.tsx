"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLearnerSession } from "./learner/LearnerSession";
import { HomeIcon, LifelineIcon, UserIcon, WalletIcon } from "./icons";
import styles from "./NavBar.module.css";
export default function NavBar() {
  const path = usePathname(),
    params = useSearchParams();
  const { user } = useLearnerSession();
  const rewards = path === "/profile" && params.get("tab") === "earnings";
  const links = [
    {
      href: "/app",
      label: "Learn",
      active:
        path === "/app" ||
        path.startsWith("/paths/") ||
        path.startsWith("/lesson/"),
      icon: <HomeIcon size={22} />,
    },
    ...(user?.kind === "account"
      ? [
          {
            href: "/profile?tab=earnings",
            label: "Rewards",
            active: rewards,
            icon: <WalletIcon size={22} />,
          },
        ]
      : []),
    ...(user
      ? [
          {
            href: "/profile",
            label: "Profile",
            active: path === "/profile" && !rewards,
            icon: <UserIcon size={22} />,
          },
        ]
      : []),
    {
      href: "/lifeline",
      label: "Help",
      active: path === "/lifeline",
      icon: <LifelineIcon size={22} />,
    },
  ];
  return (
    <nav aria-label="Primary" className={styles.navigation}>
      <p className={styles.brand}>
        Learn<span>2</span>Earn
      </p>
      <div className={styles.links}>
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            aria-current={
              link.active
                ? path.startsWith("/paths/")
                  ? "location"
                  : "page"
                : undefined
            }
            className={styles.link}
          >
            <span aria-hidden="true">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
      <div className={styles.note}>
        {user?.kind === "guest" ? (
          <>
            <p>Guest session</p>
            <Link href="/signup">Save your progress</Link>
          </>
        ) : (
          <p>
            Small steps count.
            <br />
            Return at your own pace.
          </p>
        )}
      </div>
    </nav>
  );
}
