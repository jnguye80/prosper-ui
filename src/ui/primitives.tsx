import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-line-strong disabled:text-muted',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-subtle disabled:text-muted',
  dark: 'bg-redact text-white hover:bg-ink',
  ghost: 'bg-transparent text-brand hover:underline px-0',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        size === 'md' ? 'h-11 px-4 text-sm' : 'h-9 px-3 text-[13px]',
        variant === 'primary' && 'font-semibold',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}

export type Tone = 'brand' | 'warn' | 'info' | 'high' | 'neutral';

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand-dark',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
  high: 'bg-high-soft text-high',
  neutral: 'bg-[#eef1ee] text-[#3e4a45]',
};

export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ children, className, as: Tag = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'aside' | 'article' | 'div'; 'aria-label'?: string }) {
  return (
    <Tag className={cx('rounded-[14px] border border-line bg-surface', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div role="group" aria-label={label} className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#eef1ee] p-1">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onChange(o.value)}
              className={cx(
                'h-10 rounded-[9px] text-sm transition-colors cursor-pointer disabled:cursor-not-allowed',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
                on ? 'bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-muted',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  'h-11 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-70';

export function ProgressBar({ value, indeterminate, className }: { value?: number; indeterminate?: boolean; className?: string }) {
  return (
    <div className={cx('h-1.5 overflow-hidden rounded-full bg-track', className)}>
      {indeterminate ? (
        <div className="animate-slide h-1.5 w-2/5 bg-brand motion-reduce:animate-none" />
      ) : (
        <div className="h-1.5 bg-brand transition-[width] duration-500" style={{ width: `${Math.round((value ?? 0) * 100)}%` }} />
      )}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] left-1/2 z-50 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-[10px] bg-ink px-4 py-3 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
    >
      {message}
    </div>
  );
}

export function Modal({ label, onClose, children, width = 'max-w-md' }: { label: string; onClose: () => void; children: ReactNode; width?: string }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cx('flex max-h-full w-full flex-col gap-4 overflow-y-auto rounded-2xl bg-surface p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]', width)}
      >
        {children}
      </div>
    </div>
  );
}
