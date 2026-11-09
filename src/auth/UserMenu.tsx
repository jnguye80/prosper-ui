import { useEffect, useRef, useState } from 'react';
import { cx } from '../ui/primitives';
import type { User } from './AuthScreen';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

/** Small account menu in the header: who is signed in, and sign out. */
export function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${user.name}`}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          'flex h-10 cursor-pointer items-center gap-2 rounded-full pl-1 pr-3 text-sm hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand',
          open && 'bg-subtle',
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark">{initials(user.name)}</span>
        <span className="hidden font-medium sm:inline">{user.name}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-30 flex w-64 flex-col rounded-xl border border-line bg-surface p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
          <div className="flex flex-col gap-0.5 border-b border-[#eef1ee] px-3 pb-3 pt-2">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="break-all text-[13px] text-muted">{user.email}</span>
            <span className="mt-1 text-xs text-muted">{user.organization} · {user.role}</span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="mt-1 h-10 cursor-pointer rounded-lg px-3 text-left text-sm font-medium hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
