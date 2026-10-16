import type { SVGProps, ReactNode } from 'react';

type IconName = 'heart' | 'play' | 'next' | 'prev' | 'list' | 'close' | 'cassette' | 'square' | 'eject';
type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

const paths: Record<IconName, ReactNode> = {
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 1.06-8.84Z" />,
  play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
  next: <><path d="m6 5 10 7-10 7V5Z" /><path d="M19 5v14" /></>,
  prev: <><path d="m18 5-10 7 10 7V5Z" /><path d="M5 5v14" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  cassette: <><rect x="2" y="6" width="20" height="13" rx="2" /><circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" /><path d="M6 19v-3h12v3" /></>,
  square: <rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none" rx="1" />,
  eject: <><path d="m12 4 9 12H3L12 4Z" fill="currentColor" stroke="none" /><path d="M3 20h18" /></>
};
export function Icon({ name, size = 20, ...rest }: Props) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{paths[name]}</svg>;
}
