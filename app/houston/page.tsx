import CityDeckPage from "../components/CityDeck/CityDeckPage";
import {houstonConfig} from "../components/CityDeck/configs/houston";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Houston — private pilot discussion","/houston",houstonConfig.metadata.description,true);
export default function Page(){return <CityDeckPage config={houstonConfig}/>;}
