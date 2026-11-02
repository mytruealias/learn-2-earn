import CityDeckPage from "../components/CityDeck/CityDeckPage";
import {sanFranciscoConfig} from "../components/CityDeck/configs/san-francisco";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("San Francisco — private pilot discussion","/san-francisco",sanFranciscoConfig.metadata.description,true);
export default function Page(){return <CityDeckPage config={sanFranciscoConfig}/>;}
