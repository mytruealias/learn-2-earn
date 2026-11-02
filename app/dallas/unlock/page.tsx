import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import {dallasConfig} from "../../components/CityDeck/configs/dallas";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Dallas — access required","/dallas/unlock",dallasConfig.metadata.description,true);
export default function Page(){return <CityDeckUnlock slug="dallas" basePath="/dallas" badge={dallasConfig.unlockBadge} sub={dallasConfig.unlockSub} theme={dallasConfig.theme}/>;}
