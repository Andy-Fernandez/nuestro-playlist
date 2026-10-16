/** Every cassette owns its cover art and hardware images. Paths are relative to public/. */
export type Song = {
  id: string;
  title: string;
  artist: string;
  src: string;
};
export type Mixtape = {
  id: string;
  title: string;
  songIds: string[];
  artwork: {
    spine: string;
    label: string;
  };
  hardware: {
    reel: string;
    guideRoller: string;
  };
};
export const SONGS: Song[] = [
  { id: 's1', title: 'Tu sonrisa', artist: 'Loveline · Original demo', src: 'audio/demo-1.mp3' },
  { id: 's2', title: 'Nuestra primera página', artist: 'Loveline · Original demo', src: 'audio/demo-2.mp3' },
  { id: 's3', title: 'A medianoche', artist: 'Loveline · Original demo', src: 'audio/demo-3.mp3' }
];
export const MIXTAPES: Mixtape[] = [
  {
    id: 'for-you', title: 'For You', songIds: ['s1'],
    artwork: {
      spine: 'assets/cassettes/for-you/spine.svg',
      label: 'assets/cassettes/for-you/label.svg'
    },
    hardware: {
      reel: 'assets/cassettes/for-you/reel.svg',
      guideRoller: 'assets/cassettes/for-you/guide-roller.svg'
    }
  },
  {
    id: 'beginning', title: 'Our Beginning', songIds: ['s2'],
    artwork: {
      spine: 'assets/cassettes/beginning/spine.svg',
      label: 'assets/cassettes/beginning/label.svg'
    },
    hardware: {
      reel: 'assets/cassettes/beginning/reel.svg',
      guideRoller: 'assets/cassettes/beginning/guide-roller.svg'
    }
  },
  {
    id: 'late-night', title: 'Late Night Talks', songIds: ['s3'],
    artwork: {
      spine: 'assets/cassettes/late-night/spine.svg',
      label: 'assets/cassettes/late-night/label.svg'
    },
    hardware: {
      reel: 'assets/cassettes/late-night/reel.svg',
      guideRoller: 'assets/cassettes/late-night/guide-roller.svg'
    }
  },
  {
    id: 'home', title: 'You Feel Like Home', songIds: ['s1'],
    artwork: {
      spine: 'assets/cassettes/home/spine.svg',
      label: 'assets/cassettes/home/label.svg'
    },
    hardware: {
      reel: 'assets/cassettes/home/reel.svg',
      guideRoller: 'assets/cassettes/home/guide-roller.svg'
    }
  },
  {
    id: 'road', title: 'Road Trips', songIds: ['s2'],
    artwork: {
      spine: 'assets/cassettes/road/spine.svg',
      label: 'assets/cassettes/road/label.svg'
    },
    hardware: {
      reel: 'assets/cassettes/road/reel.svg',
      guideRoller: 'assets/cassettes/road/guide-roller.svg'
    }
  },
  {
    id: 'forever', title: 'Forever Us', songIds: ['s3'],
    artwork: {
      spine: 'assets/cassettes/forever/spine.svg',
      label: 'assets/cassettes/forever/label.svg'
    },
    hardware: {
      reel: 'assets/cassettes/forever/reel.svg',
      guideRoller: 'assets/cassettes/forever/guide-roller.svg'
    }
  }
];

export const findSongs = (mix: Mixtape): Song[] =>
  mix.songIds.map((id) => SONGS.find((song) => song.id === id)).filter((song): song is Song => Boolean(song));

/** Resolve public asset paths under Vite's configured base, while preserving complete URLs. */
export const resolveAsset = (src: string) =>
  /^(blob:|https?:|data:)/.test(src) ? src : `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;

export const resolveAudio = resolveAsset;
