import { resolveAsset, type Mixtape } from '../data/mixtapes';
import { Icon } from './Icon';

type Props = {
  mixtapes: Mixtape[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onPrepare: (id: string) => void;
  onClose?: () => void;
};

export function Library({ mixtapes, selectedId, onSelect, onPrepare, onClose }: Props) {
  return <section className="collection-library flex min-h-0 flex-col" aria-label="Colección de casetes">
    <header className="collection-header flex items-center justify-between">
      <h2>MIXTAPES</h2>
      {onClose && <button type="button" className="collection-close" onClick={onClose} aria-label="Cerrar colección">
        <Icon name="close" size={21} />
      </button>}
    </header>
    <div className="collection-shelf flex min-h-0 flex-col">
      {mixtapes.map((mix) => <button
        type="button"
        className="cassette-spine"
        key={mix.id}
        onClick={() => onSelect(mix.id)}
        onPointerEnter={() => onPrepare(mix.id)}
        onPointerDown={() => onPrepare(mix.id)}
        onFocus={() => onPrepare(mix.id)}
        aria-label={`Insertar casete ${mix.title}`}
        aria-pressed={selectedId === mix.id}
      >
        <span className="cassette-spine__print">
          <img className="cassette-spine__art" src={resolveAsset(mix.artwork.spine)} width="400" height="80" alt="" draggable={false} />
        </span>
        <span className="cassette-spine__cap cassette-spine__cap--left" aria-hidden="true" />
        <span className="cassette-spine__cap cassette-spine__cap--right" aria-hidden="true" />
        <span className="cassette-spine__plastic" aria-hidden="true" />
      </button>)}
      {mixtapes.length === 0 && <p className="collection-empty">Tu colección empieza aquí.</p>}
    </div>
  </section>;
}
