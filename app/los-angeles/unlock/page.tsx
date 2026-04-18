import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { losAngelesConfig as cfg } from "../../components/CityDeck/configs/los-angeles";

export const metadata = { title: "Los Angeles Pilot – Access Required" };

export default function LosAngelesUnlockPage() {
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
