import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { denverConfig as cfg } from "../../components/CityDeck/configs/denver";

export const metadata = { title: "Denver Pilot – Access Required" };

export default function DenverUnlockPage() {
  return (
    <CityDeckUnlock
      slug={cfg.slug}
      basePath={cfg.metadata.path}
      badge={cfg.unlockBadge}
      sub={cfg.unlockSub}
      theme={cfg.theme}
    />
  );
}
