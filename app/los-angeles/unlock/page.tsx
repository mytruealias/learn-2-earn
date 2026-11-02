import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import {losAngelesConfig} from "../../components/CityDeck/configs/los-angeles";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Los Angeles — access required","/los-angeles/unlock",losAngelesConfig.metadata.description,true);
export default function Page(){return <CityDeckUnlock slug="los-angeles" basePath="/los-angeles" badge={losAngelesConfig.unlockBadge} sub={losAngelesConfig.unlockSub} theme={losAngelesConfig.theme}/>;}
