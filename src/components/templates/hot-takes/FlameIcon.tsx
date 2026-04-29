interface FlameIconProps {
  size?: number;
  color?: string;
  accent?: string;
}

export function FlameIcon({
  size = 56,
  color = "var(--gold)",
  accent = "var(--hot-pink)",
}: FlameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <path
        d="M32 4c2 8-6 12-6 20 0 4 2 6 2 6s-4-2-6-6c-1-2-1-5-1-5-4 4-9 11-9 20a20 20 0 0 0 40 0c0-12-12-20-14-26-2-6-6-9-6-9z"
        fill={color}
      />
      <path
        d="M32 28c1 4-3 6-3 11 0 4 3 7 7 7s7-3 7-8c0-6-7-9-7-13-2 1-4 2-4 3z"
        fill={accent}
      />
    </svg>
  );
}
