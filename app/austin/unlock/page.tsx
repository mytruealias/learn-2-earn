import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import {austinConfig} from "../../components/CityDeck/configs/austin";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Austin — access required","/austin/unlock",austinConfig.metadata.description,true);
export default function Page(){return <CityDeckUnlock slug="austin" basePath="/austin" badge={austinConfig.unlockBadge} sub={austinConfig.unlockSub} theme={austinConfig.theme}/>;}
