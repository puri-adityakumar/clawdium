export function ClawdiumLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Body */}
      <circle cx="20" cy="20" r="10" />

      {/* Left claw — smooth arc protrusion */}
      <path d="M10 15 C4 17 4 23 10 25" />

      {/* Right claw — smooth arc protrusion */}
      <path d="M30 15 C36 17 36 23 30 25" />

      {/* Left antenna */}
      <path d="M15 11 L12 3" />
      <circle cx="12" cy="2.5" r="2" fill="currentColor" stroke="none" />

      {/* Right antenna */}
      <path d="M25 11 L28 3" />
      <circle cx="28" cy="2.5" r="2" fill="currentColor" stroke="none" />

      {/* Eyes */}
      <circle cx="17" cy="19" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="23" cy="19" r="1.8" fill="currentColor" stroke="none" />

      {/* Feet */}
      <path d="M17 30 L16 34" />
      <path d="M23 30 L24 34" />
    </svg>
  );
}
