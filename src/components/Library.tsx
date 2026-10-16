import type { Mixtape } from '../data/mixtapes';
import { Icon } from './Icon';

type Props = {
  mixtapes: Mixtape[];
  favoritesOnly: boolean;
  onToggleFavorites: () => void;
  onSelect: (id: string) => void;
};

export function Library({ mixtapes, favoritesOnly, onToggleFavorites, onSelect }: Props) {
  return <section className="screen library-screen" aria-label="Mixtapes">
    <header className="library-header">
      <span className="library-header-spacer" aria-hidden="true" />
      <h1>MIXTAPES</h1>
      <button
        type="button"
        className={`library-favorites ${favoritesOnly ? 'active' : ''}`}
        onClick={onToggleFavorites}
        aria-label={favoritesOnly ? 'Show all mixtapes' : 'Show favorites'}
        aria-pressed={favoritesOnly}
      >
        <Icon name="heart" size={20} />
      </button>
    </header>
    <div className="mixtape-list">
      {mixtapes.map((mix, index) => <button
        type="button"
        className={`mixtape-card mixtape-card--${mix.kind}`}
        key={mix.id}
        onClick={() => onSelect(mix.id)}
        aria-label={`Open ${mix.title}`}
      >
        <span className="mixtape-card-edge" aria-hidden="true" />
        <span className="mixtape-card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className="mixtape-card-title">{mix.title}</span>
        <span className="mixtape-card-heart" aria-hidden="true">♡</span>
        <span className="mixtape-card-gloss" aria-hidden="true" />
      </button>)}
      {mixtapes.length === 0 && <p className="mixtape-empty">No favorite mixtapes yet.</p>}
    </div>
  </section>;
}
