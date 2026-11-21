import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, type AppointmentStatus } from "@/lib/booking/core";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-11 w-full rounded-none border border-hairline bg-ink px-3.5 text-sm text-ivory placeholder:text-stone/50 transition-colors focus:border-bronze focus:outline-none disabled:opacity-50";


export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-hairline pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-bronze">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-[2.25rem] font-medium leading-none text-ivory sm:text-[2.75rem]">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-hairline bg-ink-soft", className)}>
      {(title || actions) && (
        <div className="flex flex-col gap-3 border-b border-hairline px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {title && <h2 className="eyebrow text-ivory/90">{title}</h2>}
            {description && <p className="mt-1.5 text-[0.8125rem] text-stone">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "border-bronze/70 text-bronze-light",
  confirmed: "border-bronze bg-bronze text-ink",
  completed: "border-ivory/40 text-ivory",
  cancelled: "border-hairline text-stone line-through decoration-stone/50",
  no_show: "border-stone/40 bg-graphite text-stone",
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center border px-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em]",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-hairline px-6 py-10 text-center">
      <p className="text-sm text-stone">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="border border-bronze/50 px-6 py-8 text-center">
      <p className="text-sm text-ivory">{message}</p>
      {onRetry && (
        <Button variant="line" size="compact" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" className="flex flex-col gap-2">
      <span className="sr-only">Carregando…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse bg-graphite/60" />
      ))}
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="eyebrow mb-2 block text-[0.625rem] text-stone">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-stone/70">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-bronze-light">
          {error}
        </p>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-none border-hairline bg-ink-soft">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl font-medium text-ivory">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-stone">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-none border-hairline bg-transparent text-ivory hover:bg-graphite hover:text-ivory">
            Voltar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="rounded-none bg-bronze font-semibold text-ink hover:bg-bronze-light"
          >
            {busy ? "Salvando…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SelectField({
  value,
  onChange,
  children,
  id,
  ariaLabel,
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  id?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "appearance-none pr-9 [&>option]:bg-ink-soft")}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 h-1.5 w-1.5 -translate-y-[70%] rotate-45 border-b border-r border-stone"
      />
    </div>
  );
}
