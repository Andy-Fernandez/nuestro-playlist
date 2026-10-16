/** Customize your collection here. Audio should live under public/audio. */
export type ShellKind = 'pink' | 'mauve' | 'paper' | 'rose' | 'trip' | 'dark';
export type Song = {
  id: string;
  title: string;
  src: string;
};
export type Mixtape = {
  id: string;
  title: string;
  kind: ShellKind;
  songIds: string[];
};
export const SONGS: Song[] = [
  { id: 's1', title: 'Tu sonrisa', src: 'audio/demo-1.mp3' },
  { id: 's2', title: 'Nuestra primera página', src: 'audio/demo-2.mp3' },
  { id: 's3', title: 'A medianoche', src: 'audio/demo-3.mp3' }
];
export const MIXTAPES: Mixtape[] = [
  { id: 'for-you', title: 'For You', kind: 'pink', songIds: ['s1', 's2', 's3'] },
  { id: 'beginning', title: 'Our Beginning', kind: 'mauve', songIds: ['s2', 's1'] },
  { id: 'late-night', title: 'Late Night Talks', kind: 'paper', songIds: ['s3', 's2'] },
  { id: 'home', title: 'You Feel Like Home', kind: 'rose', songIds: ['s1', 's3'] },
  { id: 'road', title: 'Road Trips', kind: 'trip', songIds: ['s2', 's3'] },
  { id: 'forever', title: 'Forever Us', kind: 'dark', songIds: ['s3', 's1', 's2'] }
];

export const findSongs = (mix: Mixtape): Song[] =>
  mix.songIds.map((id) => SONGS.find((song) => song.id === id)).filter((song): song is Song => Boolean(song));

export const resolveAudio = (src: string) =>
  /^(blob:|https?:|data:)/.test(src) ? src : `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;
