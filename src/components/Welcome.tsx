import { DecorativeCassette } from './DecorativeCassette';
import { Icon } from './Icon';

type Props = { onContinue: () => void };
export function Welcome({ onContinue }: Props) {
  return <section className="screen welcome-screen" aria-label="Welcome">
    <div className="welcome-top"><span>EST. 2026</span><span className="tiny-star">✳</span><span>MADE WITH LOVE</span></div>
    <div className="welcome-inner">
      <div className="welcome-pretitle">ONE LITTLE LOVE LETTER, IN SONGS</div>
      <div className="welcome-heading"><span>A Mixtape</span><span>of Us <b>♡</b></span></div>
      <div className="welcome-stars" aria-hidden="true">✳ &nbsp; · &nbsp; ♡ &nbsp; ✧</div>
      <div className="hero-cassette-area"><div className="hero-aura" /><DecorativeCassette className="hero-cassette" label="A Mixtape of Us" playing /><span className="home-side-note">PLAY ME ♡</span></div>
      <p className="welcome-subtitle">Todas las canciones<br />que me recuerdan a ti.</p>
      <button className="primary-btn welcome-btn" onClick={onContinue}><span>COMENZAR</span><Icon name="arrow" size={20} /></button>
      <div className="home-epilogue">UNA HISTORIA CONTADA EN CANCIONES</div>
    </div>
    <div className="welcome-bottom"><span>VOL. 01</span><span>♡</span><span>JUST FOR YOU</span></div>
  </section>;
}
