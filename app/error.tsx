"use client";
import RecoveryScreen from "./components/reliability/RecoveryScreen";
export default function ErrorPage({ reset }: {
    reset: () => void;
}) { return <RecoveryScreen reset={reset}/>; }
