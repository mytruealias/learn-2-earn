import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { dallasConfig as cfg } from "../../components/CityDeck/configs/dallas";

export const metadata = { title: "Dallas Pilot – Access Required" };

export default function DallasUnlockPage() {
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
