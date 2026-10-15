import type { SVGProps, ReactNode } from 'react';

type IconName = 'heart' | 'back' | 'arrow' | 'play' | 'pause' | 'next' | 'prev' | 'list' | 'plus' | 'close' | 'volume' | 'volumeOff' | 'cassette' | 'sparkle' | 'note' | 'upload' | 'music' | 'square' | 'eject';
type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

const paths: Record<IconName, ReactNode> = {
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 1.06-8.84Z" />,
  back: <path d="m15 18-6-6 6-6" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></>,
  next: <><path d="m6 5 10 7-10 7V5Z" /><path d="M19 5v14" /></>,
  prev: <><path d="m18 5-10 7 10 7V5Z" /><path d="M5 5v14" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  volume: <><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12" /></>,
  volumeOff: <><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="m16 9 6 6m0-6-6 6" /></>,
  cassette: <><rect x="2" y="6" width="20" height="13" rx="2" /><circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" /><path d="M6 19v-3h12v3" /></>,
  sparkle: <path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" />,
  note: <path d="M7 3h10l4 4v14H7zM17 3v5h4M10 13h8m-8 4h6" />,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  square: <rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none" rx="1" />,
  eject: <><path d="m12 4 9 12H3L12 4Z" fill="currentColor" stroke="none" /><path d="M3 20h18" /></>
};
export function Icon({ name, size = 20, ...rest }: Props) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{paths[name]}</svg>;
}
