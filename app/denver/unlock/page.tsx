import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import {denverConfig} from "../../components/CityDeck/configs/denver";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Denver — access required","/denver/unlock",denverConfig.metadata.description,true);
export default function Page(){return <CityDeckUnlock slug="denver" basePath="/denver" badge={denverConfig.unlockBadge} sub={denverConfig.unlockSub} theme={denverConfig.theme}/>;}
