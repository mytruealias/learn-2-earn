"use client";
import { Button } from "../ui";

interface Props {
  className?: string;
  label?: string;
}

export default function CityDeckPrintButton({
  className,
  label = "Print discussion outline",
}: Props) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Button
      variant="secondary"
      type="button"
      onClick={handleClick}
      className={className}
      aria-label={`${label}: print or save as PDF`}
    >
      {label}
    </Button>
  );
}
