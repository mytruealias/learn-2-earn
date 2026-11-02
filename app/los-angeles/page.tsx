import CityDeckPage from "../components/CityDeck/CityDeckPage";
import {losAngelesConfig} from "../components/CityDeck/configs/los-angeles";
import{marketingMetadata}from"@/lib/marketing/metadata";
export const metadata=marketingMetadata("Los Angeles — private pilot discussion","/los-angeles",losAngelesConfig.metadata.description,true);
export default function Page(){return <CityDeckPage config={losAngelesConfig}/>;}
