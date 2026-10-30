export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0b4f56" />
      <path d="M6 22c4 0 5-8 10-8s6 8 10 8" fill="none" stroke="#7fe0d2" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="14" r="3" fill="#ffb347" />
    </svg>
  );
}
