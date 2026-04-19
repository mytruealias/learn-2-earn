"use client";

interface Props {
  className?: string;
  label?: string;
}

export default function CityDeckPrintButton({
  className = "cd-btn-outline",
  label = "Download PDF",
}: Props) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${className} cd-print-btn`}
      aria-label="Print or save this deck as a PDF"
    >
      {label}
    </button>
  );
}
