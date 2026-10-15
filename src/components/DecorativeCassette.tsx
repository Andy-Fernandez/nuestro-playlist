import type { ShellKind } from '../data/mixtapes';

type Props = { variant?: ShellKind; label?: string; playing?: boolean; className?: string };
/** Decorative original cassette, used only on the welcome screen. */
export function DecorativeCassette({ variant = 'pink', label = 'A Mixtape of Us', playing = false, className = '' }: Props) {
  return <div className={`cassette cassette--${variant} ${className} ${playing ? 'is-spinning' : ''}`} role="img" aria-label={`Cassette: ${label}`}>
    <div className="cassette__ink" /><div className="cassette__decor cassette__decor--left">✳</div><div className="cassette__decor cassette__decor--right">♡</div>
    <div className="cassette__label"><span className="cassette__label-heart">♡</span><span className="cassette__label-text">{label}</span><span className="cassette__label-end">✳</span></div>
    <div className="cassette__window"><div className="cassette__tape" /><div className="cassette__reel cassette__reel--left"><div className="cassette__reel-core" /></div><div className="cassette__reel cassette__reel--right"><div className="cassette__reel-core" /></div></div>
    <div className="cassette__sticker">♡ always you</div>
    <div className="cassette__bottom"><i /><i /><i /><i /><i /></div>
    {[1, 2, 3, 4].map(n => <span className={`cassette__screw screw--${n}`} key={n} />)}
  </div>;
}
