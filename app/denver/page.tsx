import CityDeckPage from "../components/CityDeck/CityDeckPage";
import {denverConfig} from "../components/CityDeck/configs/denver";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Denver — private pilot discussion","/denver",denverConfig.metadata.description,true);
export default function Page(){return <CityDeckPage config={denverConfig}/>;}
