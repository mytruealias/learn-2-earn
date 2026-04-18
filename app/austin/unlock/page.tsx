import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { austinConfig } from "../../components/CityDeck/configs/austin";

export const metadata = { title: "Austin Pilot – Access Required" };

export default function AustinUnlockPage() {
  return (
    <CityDeckUnlock
      slug={austinConfig.slug}
      basePath={austinConfig.metadata.path}
      badge={austinConfig.unlockBadge}
      sub={austinConfig.unlockSub}
      theme={austinConfig.theme}
    />
  );
}
