interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function FireIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 2C12 2 7 8 7 13C7 15.21 8.47 17.1 10.5 17.74C10.18 17.14 10 16.45 10 15.72C10 13.72 12 11 12 11C12 11 14 13.72 14 15.72C14 16.45 13.82 17.14 13.5 17.74C15.53 17.1 17 15.21 17 13C17 8 12 2 12 2Z" fill={color} />
      <path d="M12 11C12 11 10 13.72 10 15.72C10 17.53 11.12 19 12 19C12.88 19 14 17.53 14 15.72C14 13.72 12 11 12 11Z" fill={color} opacity="0.6" />
    </svg>
  );
}

export function StarIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 2L14.9 8.62L22 9.27L16.81 13.97L18.18 21.02L12 17.27L5.82 21.02L7.19 13.97L2 9.27L9.1 8.62L12 2Z" fill={color} />
    </svg>
  );
}

export function HeartIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill={color} />
    </svg>
  );
}

export function HomeIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9M19 10L21 12M19 10V20C19 20.55 18.55 21 18 21H15M9 21C9.55 21 10 20.55 10 20V16C10 15.45 10.45 15 11 15H13C13.55 15 14 15.45 14 16V20C14 20.55 14.45 21 15 21M9 21H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LifelineIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 3C12 3 12 8 12 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H8L10 8L12 16L14 10L16 12H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <path d="M5 20C5 16.13 8.13 13 12 13C15.87 13 19 16.13 19 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SparkleIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill={color} />
      <path d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z" fill={color} opacity="0.6" />
    </svg>
  );
}

export function SOSIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill={color} opacity="0.15" />
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth="2" />
      <path d="M12 8V12M12 16H12.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.97C20.52 21 20.06 21 19.6 20.97C10.28 20.4 3.6 13.72 3.03 4.4C3 3.94 3 3.48 3.03 3C3.07 2.44 3.52 2 4.08 2H7.08C7.56 2 7.97 2.35 8.05 2.82C8.14 3.49 8.3 4.13 8.53 4.74C8.69 5.14 8.58 5.59 8.27 5.88L6.91 7.24C8.29 9.81 10.19 11.71 12.76 13.09L14.12 11.73C14.41 11.42 14.86 11.31 15.26 11.47C15.87 11.7 16.51 11.86 17.18 11.95C17.65 12.03 18 12.44 18 12.92V16.92C18 17 18 17 18 17C18 17.55 22 17.47 22 16.92Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M21 11.5C21 16.19 16.97 20 12 20C10.82 20 9.69 19.79 8.65 19.42L3 21L4.72 16.37C3.64 14.97 3 13.31 3 11.5C3 6.81 7.03 3 12 3C16.97 3 21 6.81 21 11.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function HandshakeIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M2 14L7 9L10 12L17 5L22 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 9L3 13L6 16L10 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 5L21 9L18 12L14 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12L13 15C13.55 15.55 14.45 15.55 15 15L18 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MedicalIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 2L4 6V12C4 16.42 7.4 20.56 12 22C16.6 20.56 20 16.42 20 12V6L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShelterIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M3 21H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 21V11L12 4L19 11V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" rx="1" stroke={color} strokeWidth="2" />
      <path d="M12 4L2 12M12 4L22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SproutIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12C12 12 12 7 17 4C17 4 18 10 12 12Z" fill={color} opacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 15C12 15 12 10 7 7C7 7 6 13 12 15Z" fill={color} opacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function WalletIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect x="2" y="6" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <path d="M2 10H22" stroke={color} strokeWidth="2" />
      <path d="M6 4H18C19.1 4 20 4.9 20 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="15" r="1.5" fill={color} />
    </svg>
  );
}

export function BookIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M4 19.5C4 18.12 5.12 17 6.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20V22H6.5C5.12 22 4 20.88 4 19.5V4.5C4 3.12 5.12 2 6.5 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7H16M8 11H13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BankIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M3 21H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M3 10H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3L3 10H21L12 3Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M5 10V18M9 10V18M15 10V18M19 10V18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 7V12L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XCircleIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M9 9L15 15M15 9L9 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CashIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <path d="M2 9H5M19 9H22M2 15H5M19 15H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LightbulbIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M9 21H15M12 3C8.69 3 6 5.69 6 9C6 11.22 7.21 13.15 9 14.19V17C9 17.55 9.45 18 10 18H14C14.55 18 15 17.55 15 17V14.19C16.79 13.15 18 11.22 18 9C18 5.69 15.31 3 12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClipboardIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M16 4H18C19.1 4 20 4.9 20 6V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V6C4 4.9 4.9 4 6 4H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <path d="M8 12H16M8 16H13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PenIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M16.47 3.53C17.07 2.93 18.03 2.93 18.63 3.53L20.47 5.37C21.07 5.97 21.07 6.93 20.47 7.53L8 20H4V16L16.47 3.53Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 6L18 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MapPinIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="9" r="3" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function AlertIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 2L2 20H22L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10V14M12 17H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SirenIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect x="4" y="12" width="16" height="8" rx="2" stroke={color} strokeWidth="2" />
      <path d="M12 4V6M6 8L7.5 9.5M18 8L16.5 9.5M4 16H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function StrengthIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M4 15L7 12L4 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 15L17 12L20 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12H17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function KeyIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="8" cy="15" r="5" stroke={color} strokeWidth="2" />
      <path d="M12 11L21 2M18 2H21V5M17 7L19 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MedalIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="14" r="6" stroke={color} strokeWidth="2" />
      <path d="M8 8L6 2H10L12 5L14 2H18L16 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11V14M10 14H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CompassIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M16 8L14.5 14.5L8 16L9.5 9.5L16 8Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function CoffeeIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M18 8H19C20.1 8 21 8.9 21 10V11C21 12.1 20.1 13 19 13H18" stroke={color} strokeWidth="2" />
      <path d="M4 8H18V14C18 16.21 16.21 18 14 18H8C5.79 18 4 16.21 4 14V8Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 21H18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 2V5M11 2V5M14 2V5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M9 6L15 12L9 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RocketIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 2C12 2 7 7 7 13L11 17C13 17 17 14 17 10L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 13L5 15L5 19L9 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13" cy="9" r="1.5" fill={color} />
    </svg>
  );
}

export function BrainIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 5C12 5 9 4 7 6C5 8 5 11 7 13C5 14 4 16 5 18C6 20 9 21 11 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 5C12 5 15 4 17 6C19 8 19 11 17 13C19 14 20 16 19 18C18 20 15 21 13 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="5" x2="12" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LifeRingIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
      <path d="M7.76 7.76L9.88 9.88M14.12 14.12L16.24 16.24M16.24 7.76L14.12 9.88M9.88 14.12L7.76 16.24" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function WarningIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 3L2 21H22L12 3Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10V14M12 17.5H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HeartCareIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v6M9 12h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TargetIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  );
}

export function DeviceIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect x="5" y="2" width="14" height="20" rx="2" stroke={color} strokeWidth="2" />
      <path d="M10 18H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HousePlusIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M3 12L12 3L21 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10V20C5 20.55 5.45 21 6 21H18C18.55 21 19 20.55 19 20V10" stroke={color} strokeWidth="2" />
      <path d="M12 13V19M9 16H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HandsIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M7 11C7 11 5 9 3 9C3 13 5 15 7 16V20H11L13 18C13 18 15 17 17 17H21V13C21 13 19 11 17 11C15 11 13 13 13 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11V4C7 3.45 7.45 3 8 3C8.55 3 9 3.45 9 4V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 10V3C9 2.45 9.45 2 10 2C10.55 2 11 2.45 11 3V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M11 10V4C11 3.45 11.45 3 12 3C12.55 3 13 3.45 13 4V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MicIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke={color} strokeWidth="2" />
      <path d="M5 11C5 14.87 8.13 18 12 18C15.87 18 19 14.87 19 11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18V22M9 22H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SpeakerOnIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M11 5L6 9H3C2.45 9 2 9.45 2 10V14C2 14.55 2.45 15 3 15H6L11 19V5Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18.5 5.5C20.5 7.5 21.5 9.7 21.5 12C21.5 14.3 20.5 16.5 18.5 18.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SpeakerOffIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M11 5L6 9H3C2.45 9 2 9.45 2 10V14C2 14.55 2.45 15 3 15H6L11 19V5Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 9L22 15M22 9L16 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HubertIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="14" rx="3" stroke={color} strokeWidth="2" />
      <circle cx="9" cy="11" r="1.5" fill={color} />
      <circle cx="15" cy="11" r="1.5" fill={color} />
      <path d="M10 14.5C10.5 15.5 11.2 16 12 16C12.8 16 13.5 15.5 14 14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 4V2M16 4V2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18V20M9 20H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HeartPulseIcon({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" stroke={color} strokeWidth="2" />
      <path d="M5 12H8L10 9L12 15L14 11H19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
