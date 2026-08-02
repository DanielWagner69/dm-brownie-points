import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Number field that allows clearing while typing (e.g. change 4 → 3
 * without forced intermediate values like 43).
 */
export function PointsInput({
  value,
  onValueChange,
  className,
  allowNegative = true,
  id,
  "aria-label": ariaLabel,
}: {
  value: number;
  onValueChange: (n: number) => void;
  className?: string;
  allowNegative?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(() => String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const pattern = allowNegative ? /^-?\d*$/ : /^\d*$/;

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
        // Allow empty while editing
        if (next === "") {
          setText("");
          return;
        }
        if (!pattern.test(next)) return;
        setText(next);
        if (next === "-" || next === "+") return;
        const n = Number(next);
        if (Number.isFinite(n)) onValueChange(n);
      }}
      onBlur={() => {
        focused.current = false;
        if (text === "" || text === "-" || text === "+" || !Number.isFinite(Number(text))) {
          setText(String(value));
          return;
        }
        const n = Number(text);
        onValueChange(n);
        setText(String(n));
      }}
    />
  );
}
