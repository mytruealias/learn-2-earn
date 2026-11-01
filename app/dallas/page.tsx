import CityDeckPage from "../components/CityDeck/CityDeckPage";
import {dallasConfig} from "../components/CityDeck/configs/dallas";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Dallas — private pilot discussion","/dallas",dallasConfig.metadata.description,true);
export default function Page(){return <CityDeckPage config={dallasConfig}/>;}
