export interface WPPost {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
  meta?: {
    enclosure?: string;
    sonaar_audio_url?: string;
  };
}

export interface Sermon {
  id: number | string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  audioUrl: string;
  imageUrl: string;
  categories: string[];
}

export interface Playlist {
  id: number;
  title: string;
  imageUrl: string;
  tracks: Array<{
    title: string;
    url: string;
  }>;
}

export interface Quote {
  id: number;
  content: string;
  date: string;
}

export interface WPPlaylist {
  id: number;
  title: {
    rendered: string;
  };
  content?: {
    rendered: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
  };
  meta?: {
    _sonaar_tracks?: string;
  };
}
