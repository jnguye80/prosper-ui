import { Fragment } from 'react';
import { ArrowLeftIcon } from './icons';

/**
 * Back-to-home button plus breadcrumb trail. The first item is the home page
 * (all assessments); its onClick also drives the back button.
 */
export function Breadcrumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  const home = items[0];
  return (
    <div className="flex flex-col items-start gap-5">
      {home?.onClick && (
        <button
          type="button"
          onClick={home.onClick}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3 text-[13px] font-medium leading-none text-ink hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand"
        >
          <ArrowLeftIcon size={15} />
          Back to all assessments
        </button>
      )}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        {items.map((item, i) => (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.onClick ? (
              <button type="button" onClick={item.onClick} className="cursor-pointer text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand">
                {item.label}
              </button>
            ) : (
              <span aria-current="page" className="text-ink">{item.label}</span>
            )}
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
