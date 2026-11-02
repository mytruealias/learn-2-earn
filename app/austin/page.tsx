import CityDeckPage from "../components/CityDeck/CityDeckPage";
import {austinConfig} from "../components/CityDeck/configs/austin";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Austin — private pilot discussion","/austin",austinConfig.metadata.description,true);
export default function Page(){return <CityDeckPage config={austinConfig}/>;}
