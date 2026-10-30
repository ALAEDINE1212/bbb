import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Inset row field: label on the left, value on the right (iOS settings style). */
export function InlineField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-card-2 px-4 py-3 text-[15px] font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}

export function DateInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" {...props} className={cn("bg-transparent text-right text-[15px] font-medium text-ink-2 outline-none", props.className)} />;
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-2xl bg-card-2 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-3", className)} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={cn("w-full resize-none rounded-2xl bg-card-2 px-4 py-3 text-[15px] leading-snug text-ink outline-none placeholder:text-ink-3", className)} />;
}

/** Coloured squircle icon (34px, radius 10) used at the start of list rows. */
export function Squircle({ color, children, size = 34 }: { color: string; children: ReactNode; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[10px] text-on-accent [&>svg]:size-[18px]"
      style={{ width: size, height: size, background: color, boxShadow: `inset 0 1px 0 var(--sheen), 0 4px 12px -4px ${color}` }}
    >
      {children}
    </span>
  );
}
