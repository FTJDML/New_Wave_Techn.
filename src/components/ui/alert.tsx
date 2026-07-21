import * as React from "react";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "warning" | "notice";

const ICONS: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  notice: ShieldCheck,
};

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: "border-primary/30 bg-primary/5 text-foreground",
  warning: "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  notice: "border-accent/40 bg-accent/5 text-foreground",
};

export function Alert({
  variant = "info",
  className,
  children,
}: {
  variant?: AlertVariant;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = ICONS[variant];
  return (
    <div
      role={variant === "warning" ? "alert" : "note"}
      className={cn(
        "flex items-start gap-3 rounded-md border p-3 text-sm leading-relaxed",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
