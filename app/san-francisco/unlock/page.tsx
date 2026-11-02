import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import {sanFranciscoConfig} from "../../components/CityDeck/configs/san-francisco";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("San Francisco — access required","/san-francisco/unlock",sanFranciscoConfig.metadata.description,true);
export default function Page(){return <CityDeckUnlock slug="san-francisco" basePath="/san-francisco" badge={sanFranciscoConfig.unlockBadge} sub={sanFranciscoConfig.unlockSub} theme={sanFranciscoConfig.theme}/>;}
