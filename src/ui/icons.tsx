import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 18, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const UploadIcon = (p: P) => (
  <Svg {...p}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 20h16" /></Svg>
);
export const LockIcon = (p: P) => (
  <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>
);
export const AlertIcon = (p: P) => (
  <Svg {...p}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></Svg>
);
export const CheckIcon = (p: P) => (
  <Svg {...p}><path d="M5 12l5 5L20 7" /></Svg>
);
export const CloseIcon = (p: P) => (
  <Svg {...p}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></Svg>
);
export const ArrowLeftIcon = (p: P) => (
  <Svg {...p}><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></Svg>
);

/** Brand mark: mint heart-chevron on a dark teal tile. Keep in sync with the favicon in index.html. */
export const LOGO_TILE = '#173a39';
export const LOGO_MARK = '#63d1c7';

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="ACoRN logo" className="flex-none">
      <rect width="100" height="100" rx="22" fill={LOGO_TILE} />
      <path d="M36.2 28.4 L57.8 50 L36.2 71.6" fill="none" stroke={LOGO_MARK} strokeWidth="28.8" strokeLinecap="round" strokeLinejoin="miter" />
    </svg>
  );
}
