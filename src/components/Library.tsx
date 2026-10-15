import type { Mixtape } from '../data/mixtapes';
import { Icon } from './Icon';
import { motion } from 'motion/react';

type Props = {
  mixtapes: Mixtape[];
  counts: Record<string, number>;
  favoritesOnly: boolean;
  onToggleFavorites: () => void;
  onSelect: (id: string) => void;
  onWelcome: () => void;
  onUpload: () => void;
};
export function Library({ mixtapes, counts, favoritesOnly, onToggleFavorites, onSelect, onWelcome, onUpload }: Props) {
  return <section className="screen library-screen" aria-label="Cassette collection">
    <header className="screen-header library-header">
      <button type="button" className="icon-btn" onClick={onWelcome} aria-label="Back to start"><Icon name="back" /></button>
      <div className="header-center"><span className="mini-overline">A MIXTAPE OF US</span><h1>OUR MIXTAPES</h1></div>
      <button type="button" className={`icon-btn heart-btn ${favoritesOnly ? 'active' : ''}`} onClick={onToggleFavorites} aria-label={favoritesOnly ? 'Show all mixtapes' : 'Show favorites'} aria-pressed={favoritesOnly}><Icon name="heart" size={21} /></button>
    </header>
    <div className="library-intro"><p>Una colección de canciones<br />para cada capítulo de nosotros.</p><span>✳ &nbsp; VOL. 01 &nbsp; ✳</span></div>
    <div className="shelf-scroll">
      <div className="shelf-group">
        {mixtapes.map((mix, i) => <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          whileHover={{ x: 2 }}
          transition={{ duration: 0.15 }}
          className={`spine spine--${mix.kind}`}
          key={mix.id}
          onClick={() => onSelect(mix.id)}
          style={{ '--mix-color': mix.color, '--mix-soft': mix.soft } as React.CSSProperties}
          aria-label={`Open ${mix.title} cassette`}
        >
          <span className="spine-edge" /><span className="spine-doodle">{i % 2 ? '✳' : '♡'}</span>
          <span className="spine-title">{mix.title}</span>
          <span className="spine-meta">{counts[mix.id]} SONGS<small>{mix.date}</small></span>
          <span className="spine-shine" />
        </motion.button>)}
      </div>
      {mixtapes.length === 0 && <div className="empty-state">No favorites yet. Save a song using ♡ in the player.</div>}
      <button type="button" className="add-mixtape" onClick={onUpload}><Icon name="plus" size={22} /><span><strong>AÑADIR TU CANCIÓN</strong><small>Se guardará en “For You” durante esta sesión</small></span></button>
      <p className="library-footnote">CADA CANCIÓN TIENE ALGO QUE DECIRTE. ♡</p>
    </div>
    <nav className="bottom-nav" aria-label="Library navigation">
      <button className={`bottom-link ${!favoritesOnly ? 'selected' : ''}`} onClick={favoritesOnly ? onToggleFavorites : undefined}><Icon name="cassette" size={22} /><span>MIXTAPES</span></button>
      <button className="bottom-link" onClick={onWelcome}><Icon name="heart" size={22} /><span>INICIO</span></button>
      <button className={`bottom-link ${favoritesOnly ? 'selected' : ''}`} onClick={onToggleFavorites}><Icon name="sparkle" size={22} /><span>FAVORITOS</span></button>
    </nav>
  </section>;
}
