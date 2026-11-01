import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import {houstonConfig} from "../../components/CityDeck/configs/houston";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Houston — access required","/houston/unlock",houstonConfig.metadata.description,true);
export default function Page(){return <CityDeckUnlock slug="houston" basePath="/houston" badge={houstonConfig.unlockBadge} sub={houstonConfig.unlockSub} theme={houstonConfig.theme}/>;}
