import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { houstonConfig as cfg } from "../../components/CityDeck/configs/houston";

export const metadata = { title: "Houston Pilot – Access Required" };

export default function HoustonUnlockPage() {
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
