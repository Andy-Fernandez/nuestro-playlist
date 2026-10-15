/** Customize your collection here. Audio should live under public/audio. */
export type ShellKind = 'pink' | 'mauve' | 'paper' | 'rose' | 'trip' | 'dark';
export type Song = {
  id: string;
  title: string;
  artist: string;
  src: string;
  note: string;
};
export type Mixtape = {
  id: string;
  title: string;
  date: string;
  color: string;
  soft: string;
  kind: ShellKind;
  caption: string;
  songIds: string[];
  note: string;
};
export const SONGS: Song[] = [
  { id: 's1', title: 'Tu sonrisa', artist: 'Una melodía para ti · Demo original', src: 'audio/demo-1.mp3', note: 'Hay personas que se vuelven canciones. Tú eres mi favorita.' },
  { id: 's2', title: 'Nuestra primera página', artist: 'Un recuerdo nuestro · Demo original', src: 'audio/demo-2.mp3', note: 'No sé qué tiene el destino, pero me gusta mucho cómo nos encontró.' },
  { id: 's3', title: 'A medianoche', artist: 'En cada pensamiento · Demo original', src: 'audio/demo-3.mp3', note: 'Hay noches que se sienten menos oscuras cuando pienso en ti.' }
];
export const MIXTAPES: Mixtape[] = [
  { id: 'for-you', title: 'For You', date: '14 FEB 2026', color: '#ff70ad', soft: '#f5a4cc', kind: 'pink', caption: 'La banda sonora de lo que siento por ti.', songIds: ['s1', 's2', 's3'], note: 'Para ti, que conviertes días normales en recuerdos que quiero guardar para siempre. Cada canción aquí lleva un pedacito de mi corazón. ♡' },
  { id: 'beginning', title: 'Our Beginning', date: '03 ENE 2026', color: '#d5a8e6', soft: '#dfcde8', kind: 'mauve', caption: 'Donde empezó nuestra historia.', songIds: ['s2', 's1'], note: 'A veces vuelvo a pensar en el principio. Y siempre termino sonriendo.' },
  { id: 'late-night', title: 'Late Night Talks', date: '18 MAR 2026', color: '#ffa2c2', soft: '#e4c6d8', kind: 'paper', caption: 'Conversaciones que no quería terminar.', songIds: ['s3', 's2'], note: 'Hay conversaciones que uno quisiera que duraran toda la noche.' },
  { id: 'home', title: 'You Feel Like Home', date: '22 ABR 2026', color: '#ff659c', soft: '#eda0c0', kind: 'rose', caption: 'Mi lugar favorito no es un lugar.', songIds: ['s1', 's3'], note: 'Contigo, incluso los silencios se sienten como casa.' },
  { id: 'road', title: 'Road Trips', date: '26 MAY 2026', color: '#e79bc1', soft: '#f7bad3', kind: 'trip', caption: 'Cualquier camino es bonito contigo.', songIds: ['s2', 's3'], note: 'Hay tantos caminos todavía por recorrer. Qué bonito imaginarte en ellos.' },
  { id: 'forever', title: 'Forever Us', date: '01 OCT 2026', color: '#e95694', soft: '#f29bbd', kind: 'dark', caption: 'Para todos nuestros próximos capítulos.', songIds: ['s3', 's1', 's2'], note: 'Una lista que nunca termina, porque nuestra historia todavía se está escribiendo.' }
];

export const findSongs = (mix: Mixtape): Song[] =>
  mix.songIds.map((id) => SONGS.find((song) => song.id === id)).filter((song): song is Song => Boolean(song));

export const resolveAudio = (src: string) =>
  /^(blob:|https?:|data:)/.test(src) ? src : `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;
