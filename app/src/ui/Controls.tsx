import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";

/** Black full-width pill (Bevel's "Done"). */
export function PrimaryButton({ className, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={event => { haptic("success"); onClick?.(event); }}
      className={cn(
        "h-[54px] w-full rounded-full bg-[var(--button)] text-[16px] font-semibold text-[var(--button-ink)] transition-transform active:scale-[0.98] disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
}

/** Round frosted icon button (share / profile in Bevel's header). */
export function IconButton({ className, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={event => { haptic("tap"); onClick?.(event); }}
      className={cn("glass grid size-10 place-items-center rounded-full text-ink transition-transform active:scale-90 [&>svg]:size-[18px]", className)}
      {...props}
    />
  );
}

/** White row card: icon, label, trailing control. */
export function ListRow({ icon, label, detail, trailing, onClick, className }: {
  icon?: ReactNode; label: ReactNode; detail?: ReactNode; trailing?: ReactNode; onClick?: () => void; className?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick ? () => { haptic("tap"); onClick(); } : undefined}
      className={cn("flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left shadow-card", onClick && "active:scale-[0.99]", className)}
    >
      {icon && <span className="grid size-6 shrink-0 place-items-center text-ink [&>svg]:size-[19px]">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">{label}</span>
        {detail && <span className="block truncate text-[12px] text-ink-2">{detail}</span>}
      </span>
      {trailing}
    </Tag>
  );
}

export type Tri = -1 | 0 | 1;

/** Three-way ✕ / — / ✓ segmented toggle. ✓ fills with --selected. */
export function TriToggle({ value, onChange, label }: { value: Tri; onChange: (value: Tri) => void; label: string }) {
  const options: { value: Tri; icon: ReactNode; name: string }[] = [
    { value: -1, icon: <X />, name: "No" },
    { value: 0, icon: <Minus />, name: "Not set" },
    { value: 1, icon: <Check />, name: "Yes" }
  ];
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-[12px] border border-line bg-card-2 p-[3px]">
      {options.map(option => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={option.name}
            onClick={() => { if (!on) { haptic(option.value === 1 ? "success" : "select"); onChange(option.value); } }}
            className={cn("relative grid size-8 place-items-center rounded-[9px] [&>svg]:relative [&>svg]:size-4", on ? "text-ink" : "text-ink-3")}
          >
            {on && (
              <motion.span
                layoutId={`tri-${label}`}
                className={cn("absolute inset-0 rounded-[9px] shadow-card", option.value === 1 ? "bg-selected" : "border border-line bg-card")}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
              />
            )}
            <span className={cn("relative [&>svg]:size-4", on && option.value === 1 && "text-on-accent")}>{option.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Round check for single done / not-done items (checklists, sub-tasks). */
export function CheckCircle({ checked, onChange, color = "var(--selected)", label }: { checked: boolean; onChange: (next: boolean) => void; color?: string; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => { haptic(checked ? "tap" : "success"); onChange(!checked); }}
      className="grid size-7 place-items-center rounded-full border transition-colors active:scale-90"
      style={{ background: checked ? color : "transparent", borderColor: checked ? color : "var(--ink-3)" }}
    >
      <motion.span initial={false} animate={{ scale: checked ? 1 : 0 }} transition={{ type: "spring", stiffness: 600, damping: 26 }}>
        <Check className="size-4 text-on-accent" strokeWidth={3} />
      </motion.span>
    </button>
  );
}
