export default function EdenLogo({ size = 36 }: { size?: number }) {
  const id = `eden-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-leaf`} x1="10" y1="80" x2="70" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00e676" />
          <stop offset="100%" stopColor="#00c3ff" />
        </linearGradient>
        <linearGradient id={`${id}-wire`} x1="40" y1="80" x2="85" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00c3ff" />
          <stop offset="100%" stopColor="#29b6f6" />
        </linearGradient>
      </defs>

      {/* Folha — corpo principal */}
      <path
        d="M18 78 C18 78 14 45 35 28 C50 16 70 18 70 18 C70 18 72 40 58 56 C44 72 18 78 18 78 Z"
        stroke={`url(#${id}-leaf)`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Nervura central */}
      <path
        d="M18 78 C30 60 48 42 68 20"
        stroke={`url(#${id}-leaf)`}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Nervuras laterais */}
      <path
        d="M30 65 C36 54 46 46 56 36"
        stroke={`url(#${id}-leaf)`}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M24 72 C28 64 35 57 44 50"
        stroke={`url(#${id}-leaf)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Fio do circuito */}
      <path
        d="M58 56 C64 52 70 40 78 28 M78 28 C80 22 82 18 82 18"
        stroke={`url(#${id}-wire)`}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Nó 1 — topo */}
      <circle cx="82" cy="16" r="5" stroke={`url(#${id}-wire)`} strokeWidth="3.5" fill="none" />

      {/* Fio nó 2 */}
      <path
        d="M62 50 C68 48 74 44 78 38"
        stroke={`url(#${id}-wire)`}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Nó 2 — meio */}
      <circle cx="80" cy="36" r="5" stroke={`url(#${id}-wire)`} strokeWidth="3.5" fill="none" />

      {/* Fio nó 3 */}
      <path
        d="M54 62 C60 62 66 60 72 58"
        stroke={`url(#${id}-wire)`}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Nó 3 — baixo */}
      <circle cx="75" cy="57" r="5" stroke={`url(#${id}-wire)`} strokeWidth="3.5" fill="none" />
    </svg>
  );
}
