import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { clampBasePoints, POINTS_CAP } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Number field that allows clearing while typing (e.g. change 4 → 3
 * without forced intermediate values like 43). Ratings are capped at ±10.
 */
export function PointsInput({
  value,
  onValueChange,
  className,
  allowNegative = true,
  id,
  min,
  max,
  "aria-label": ariaLabel,
}: {
  value: number;
  onValueChange: (n: number) => void;
  className?: string;
  allowNegative?: boolean;
  id?: string;
  min?: number;
  max?: number;
  "aria-label"?: string;
}) {
  const lo = min ?? (allowNegative ? -POINTS_CAP : 0);
  const hi = max ?? POINTS_CAP;
  const [text, setText] = useState(() => String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const pattern = allowNegative ? /^-?\d*$/ : /^\d*$/;

  function emit(n: number) {
    const clamped = Math.max(lo, Math.min(hi, clampBasePoints(n)));
    onValueChange(clamped);
    return clamped;
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      className={cn("text-center tabular", className)}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        const next = e.target.value.trim();
        if (next === "") {
          setText("");
          return;
        }
        if (!pattern.test(next)) return;
        setText(next);
        if (next === "-" || next === "+") return;
        const n = Number(next);
        if (Number.isFinite(n)) {
          const clamped = emit(n);
          if (clamped !== n) setText(String(clamped));
        }
      }}
      onBlur={() => {
        focused.current = false;
        if (text === "" || text === "-" || text === "+" || !Number.isFinite(Number(text))) {
          setText(String(value));
          return;
        }
        const clamped = emit(Number(text));
        setText(String(clamped));
      }}
    />
  );
}
