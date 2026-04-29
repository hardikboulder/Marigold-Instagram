"use client";

import { forwardRef } from "react";

import { CTABar } from "@/components/brand/CTABar";
import {
  ReelFrame,
  clamp01,
  easeOutBack,
  easeOutCubic,
  ramp,
  useReelPlayhead,
  type ReelHandle,
} from "./_shared";

export interface CountdownItem {
  number: number;
  item: string;
  annotation: string;
}

export interface ListCountdownReelProps {
  title: string;
  /** Items in countdown order — lowest count last (e.g. [5,4,3,2,1]). */
  countdownItems: CountdownItem[];
  hookText: string;
  ctaText: string;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type ListCountdownReelHandle = ReelHandle;

const COVER_MS = 2000;
const ITEM_MS = 3000;
const ITEM_ONE_PAUSE_MS = 1000;
const CTA_MS = 2400;

export const ListCountdownReel = forwardRef<
  ListCountdownReelHandle,
  ListCountdownReelProps
>(function ListCountdownReel(props, ref) {
  const {
    title,
    countdownItems,
    hookText,
    ctaText,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const totalMs = computeTotal(countdownItems);

  const { currentMs } = useReelPlayhead(
    { totalMs, progressMs, playing, loop, autoPlay, onTick, onComplete },
    ref,
  );

  return (
    <ListCountdownStage
      title={title}
      countdownItems={countdownItems}
      hookText={hookText}
      ctaText={ctaText}
      currentMs={currentMs}
    />
  );
});

function computeTotal(items: CountdownItem[]): number {
  let t = COVER_MS;
  items.forEach((it) => {
    t += ITEM_MS;
    if (it.number === 1) t += ITEM_ONE_PAUSE_MS;
  });
  t += CTA_MS;
  return t;
}

interface StageProps {
  title: string;
  countdownItems: CountdownItem[];
  hookText: string;
  ctaText: string;
  currentMs: number;
}

export function ListCountdownStage({
  title,
  countdownItems,
  hookText,
  ctaText,
  currentMs,
}: StageProps) {
  // Compute current section
  const ctaStart = computeTotal(countdownItems) - CTA_MS;
  let active: { kind: "cover" } | { kind: "item"; index: number } | { kind: "cta" };
  if (currentMs < COVER_MS) {
    active = { kind: "cover" };
  } else if (currentMs >= ctaStart) {
    active = { kind: "cta" };
  } else {
    let cursor = COVER_MS;
    let idx = 0;
    for (let i = 0; i < countdownItems.length; i++) {
      const it = countdownItems[i];
      const dur = ITEM_MS + (it.number === 1 ? ITEM_ONE_PAUSE_MS : 0);
      if (currentMs < cursor + dur) {
        idx = i;
        break;
      }
      cursor += dur;
      idx = i + 1;
    }
    active = { kind: "item", index: Math.min(idx, countdownItems.length - 1) };
  }

  if (active.kind === "cover") {
    return <CoverFrame title={title} hookText={hookText} currentMs={currentMs} />;
  }
  if (active.kind === "cta") {
    const ctaProgress = currentMs - ctaStart;
    return <CtaFrame ctaText={ctaText} progressMs={ctaProgress} />;
  }
  // Item frame
  let cursor = COVER_MS;
  for (let i = 0; i < active.index; i++) {
    const it = countdownItems[i];
    cursor += ITEM_MS + (it.number === 1 ? ITEM_ONE_PAUSE_MS : 0);
  }
  const item = countdownItems[active.index];
  return (
    <ItemFrame
      item={item}
      indexInList={active.index}
      progressMs={currentMs - cursor}
      isLastItem={item.number === 1}
    />
  );
}

function CoverFrame({
  title,
  hookText,
  currentMs,
}: {
  title: string;
  hookText: string;
  currentMs: number;
}) {
  const titleOpacity = ramp(currentMs, 0, 400);
  const hookOpacity = ramp(currentMs, 600, 400);
  return (
    <ReelFrame background="var(--wine)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          textAlign: "center",
          color: "var(--cream)",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(255,248,242,0.55)",
            marginBottom: 32,
            opacity: titleOpacity,
          }}
        >
          The Marigold
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 110,
            lineHeight: 1.05,
            opacity: titleOpacity,
            transform: `translateY(${(1 - titleOpacity) * 30}px)`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 56,
            fontFamily: "'Caveat', cursive",
            fontSize: 56,
            color: "var(--gold-light)",
            transform: `translateY(${(1 - hookOpacity) * 20}px) rotate(-2deg)`,
            opacity: hookOpacity,
          }}
        >
          {hookText}
        </div>
      </div>
      <CTABar variant="light" />
    </ReelFrame>
  );
}

function ItemFrame({
  item,
  indexInList,
  progressMs,
  isLastItem,
}: {
  item: CountdownItem;
  indexInList: number;
  progressMs: number;
  isLastItem: boolean;
}) {
  const isAlternate = indexInList % 2 === 1;
  const isOne = isLastItem;
  const numberStart = isOne ? ITEM_ONE_PAUSE_MS : 0;

  const numberOpacity = ramp(progressMs, numberStart, 400);
  const numberScale = 0.6 + 0.4 * easeOutBack(ramp(progressMs, numberStart, 500));
  const itemOpacity = ramp(progressMs, numberStart + 500, 400);
  const itemTranslate = (1 - easeOutCubic(ramp(progressMs, numberStart + 500, 500))) * 40;
  const annotationOpacity = ramp(progressMs, numberStart + 1100, 400);

  const background = isOne
    ? "var(--gold)"
    : isAlternate
      ? "var(--wine)"
      : "var(--cream)";
  const textColor = isOne || isAlternate ? "var(--cream)" : "var(--wine)";
  const accent = isOne
    ? "var(--wine)"
    : isAlternate
      ? "var(--gold-light)"
      : "var(--deep-pink)";

  return (
    <ReelFrame background={background}>
      {isOne ? <ConfettiDots /> : null}

      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: accent,
          opacity: numberOpacity,
        }}
      >
        {isOne ? "Number One" : `Number ${item.number}`}
      </div>

      <div
        style={{
          position: "absolute",
          top: "30%",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: isOne ? 360 : 280,
          fontWeight: 400,
          lineHeight: 1,
          color: accent,
          opacity: numberOpacity,
          transform: `scale(${numberScale})`,
          transformOrigin: "center",
        }}
      >
        {item.number}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 380,
          padding: "0 80px",
          textAlign: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: isOne ? 56 : 48,
          lineHeight: 1.2,
          color: textColor,
          opacity: itemOpacity,
          transform: `translateX(${itemTranslate}px)`,
        }}
      >
        {item.item}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 280,
          textAlign: "center",
          fontFamily: "'Caveat', cursive",
          fontSize: 44,
          color: accent,
          opacity: annotationOpacity,
          transform: "rotate(-2deg)",
          padding: "0 80px",
        }}
      >
        {item.annotation}
      </div>

      <CTABar variant={isOne || isAlternate ? "light" : "default"} />
    </ReelFrame>
  );
}

function CtaFrame({
  ctaText,
  progressMs,
}: {
  ctaText: string;
  progressMs: number;
}) {
  const opacity = ramp(progressMs, 0, 500);
  return (
    <ReelFrame background="var(--wine)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          textAlign: "center",
          color: "var(--cream)",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--gold-light)",
            marginBottom: 28,
            opacity,
          }}
        >
          The Marigold
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 84,
            lineHeight: 1.15,
            opacity,
            transform: `translateY(${(1 - opacity) * 24}px)`,
            maxWidth: 880,
          }}
        >
          {ctaText}
        </div>
      </div>
      <CTABar variant="light" />
    </ReelFrame>
  );
}

function ConfettiDots() {
  const dots = Array.from({ length: 18 }, (_, i) => {
    const x = (i * 137) % 100;
    const y = (i * 73) % 100;
    const size = 6 + ((i * 13) % 10);
    const colors = [
      "var(--wine)",
      "var(--deep-pink)",
      "var(--cream)",
      "var(--blush)",
    ];
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: "50%",
          background: colors[i % colors.length],
          opacity: 0.6,
        }}
      />
    );
  });
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{dots}</div>;
}

export interface ListCountdownReelStaticPreviewProps
  extends Omit<
    ListCountdownReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function ListCountdownReelStaticPreview({
  freezeAt = 0.5,
  ...rest
}: ListCountdownReelStaticPreviewProps) {
  const totalMs = computeTotal(rest.countdownItems);
  return <ListCountdownReel {...rest} progressMs={totalMs * clamp01(freezeAt)} />;
}
