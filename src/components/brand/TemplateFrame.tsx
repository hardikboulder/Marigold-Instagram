import type { CSSProperties, ReactNode, RefObject } from "react";

export type TemplateFormat = "story" | "post";

interface TemplateFrameProps {
  format: TemplateFormat;
  /**
   * Render scale. Defaults to 0.25 for stories (270×480 preview) and 0.2963
   * for posts (320×320 preview). Pass `1` for full-resolution export.
   */
  scale?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /**
   * Ref to the inner unscaled (1080-wide) div. Use this to capture full-
   * resolution exports while leaving the visible preview scaled down.
   */
  innerRef?: RefObject<HTMLDivElement>;
}

const FORMAT_DIMENSIONS = {
  story: { width: 1080, height: 1920, defaultScale: 0.25, borderRadius: 16 },
  post: { width: 1080, height: 1080, defaultScale: 0.2963, borderRadius: 12 },
} as const satisfies Record<
  TemplateFormat,
  { width: number; height: number; defaultScale: number; borderRadius: number }
>;

export function TemplateFrame({
  format,
  scale,
  children,
  className,
  style,
  innerRef,
}: TemplateFrameProps) {
  const dims = FORMAT_DIMENSIONS[format];
  const effectiveScale = scale ?? dims.defaultScale;

  return (
    <div
      className={className}
      style={{
        width: dims.width * effectiveScale,
        height: dims.height * effectiveScale,
        borderRadius: dims.borderRadius,
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        position: "relative",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: dims.width,
          height: dims.height,
          transform: `scale(${effectiveScale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
