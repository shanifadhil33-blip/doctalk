type IconProps = { className?: string };

function stroke(className?: string) {
  return {
    className: className ?? "h-4 w-4",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function DocumentGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M7 3.5h7.2L19 8.2V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5H7Z" />
      <path d="M14 3.8V8h4.2" />
      <path d="M8.5 12.5h7M8.5 16h4.5" />
    </svg>
  );
}

export function UploadGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M12 16V5" />
      <path d="m7.5 9 4.5-4.5L16.5 9" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

export function SearchGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function MessageGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M6 16.5 4.5 20l4-1.5" />
      <path d="M6.5 16.5h9A3.5 3.5 0 0 0 19 13V7.5A3.5 3.5 0 0 0 15.5 4h-9A3.5 3.5 0 0 0 3 7.5V13a3.5 3.5 0 0 0 3.5 3.5Z" />
    </svg>
  );
}

export function GridGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </svg>
  );
}

export function ListGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M9 7h11M9 12h11M9 17h11" />
      <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
    </svg>
  );
}

export function MoreGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CloseGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CheckGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="m5 12.5 4.2 4.2L19 7.5" />
    </svg>
  );
}

export function ChevronLeftGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronDownGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function DownloadGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M12 4.5v10" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

export function MinusGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function PlusGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function GitHubGlyph({ className }: IconProps) {
  return (
    <svg {...stroke(className)} viewBox="0 0 24 24">
      <path d="M9 19c-4 1.5-4-2.5-6-3m12 5.5v-3.1a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.6a5.1 5.1 0 0 0-1.4-3.5 4.8 4.8 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.3 12.3 0 0 0-6.2 0C6.4 2.8 5.3 3.1 5.3 3.1a4.8 4.8 0 0 0-.1 3.5 5.1 5.1 0 0 0-1.4 3.6c0 5 3.1 6.2 6.1 6.6a3.4 3.4 0 0 0-.9 2.6V21" />
    </svg>
  );
}

export function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
