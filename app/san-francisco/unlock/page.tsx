import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { sanFranciscoConfig as cfg } from "../../components/CityDeck/configs/san-francisco";

export const metadata = { title: "San Francisco Pilot – Access Required" };

export default function SanFranciscoUnlockPage() {
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
