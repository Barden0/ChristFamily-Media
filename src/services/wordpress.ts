import { WPPost, Sermon, WPPlaylist, Playlist, Quote } from '../types';

const WP_URL = '/api/wp-proxy/wp/v2';
const JWT_URL = '/api/wp-proxy/jwt-auth/v1';

function decodeHtml(html: string) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”');
}

export async function fetchQuotes(page = 1, perPage = 5): Promise<Quote[]> {
  try {
    const response = await fetch(`${WP_URL}/quote?page=${page}&per_page=${perPage}`);
    if (!response.ok) throw new Error('Failed to fetch quotes');
    
    const data: any[] = await response.json();
    
    return data.map(item => ({
      id: item.id,
      content: decodeHtml(item.content.rendered.replace(/<[^>]*>?/gm, '').trim()),
      date: item.date
    }));
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
}

export async function fetchPlaylists(page = 1, perPage = 10): Promise<Playlist[]> {
  try {
    const response = await fetch(`${WP_URL}/sr_playlist?_embed&page=${page}&per_page=${perPage}`);
    if (!response.ok) throw new Error('Failed to fetch playlists');
    
    const data: WPPlaylist[] = await response.json();
    
    return data.map(item => {
      let tracks: any[] = [];
      
      // Sonaar tracks are specifically in alb_tracklist for this site
      const rawTracks = (item as any).alb_tracklist || 
                        (item.meta as any)?.alb_tracklist ||
                        (item as any).sonaar_tracks || 
                        (item as any).tracks || 
                        (item as any).track_list ||
                        (item as any).sonaar_track_list ||
                        item.meta?._sonaar_tracks ||
                        (item.meta as any)?.sonaar_tracks;

      if (rawTracks) {
        if (typeof rawTracks === 'string') {
          try {
            tracks = JSON.parse(rawTracks);
          } catch (e) {
            console.warn('Failed to parse tracks JSON for playlist', item.id);
          }
        } else if (Array.isArray(rawTracks)) {
          tracks = rawTracks;
        }
      }

      // If still no tracks, try to parse from content as a last resort
      if (tracks.length === 0 && item.content?.rendered) {
        const mp3Matches = item.content.rendered.matchAll(/href="([^"]+\.mp3)"/gi);
        for (const match of mp3Matches) {
          tracks.push({
            title: match[1].split('/').pop()?.replace('.mp3', '').replace(/-/g, ' ') || 'Track',
            url: match[1]
          });
        }
      }

      return {
        id: item.id,
        title: item.title.rendered,
        imageUrl: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://picsum.photos/seed/playlist/800/600',
        tracks: tracks.map((t, index) => {
          // Sonaar specific fields: track_mp3, track_title, etc.
          const title = t.track_title || t.title || t.name || t.stream_title || 
                        (t.track_mp3 ? t.track_mp3.split('/').pop()?.replace('.mp3', '').replace(/-/g, ' ') : `Track ${index + 1}`);
          const url = t.track_mp3 || t.url || t.file_url || t.audio_file || t.mp3 || '';
          
          return { title, url };
        }).filter(t => t.url)
      };
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
}

export async function fetchSermons(page = 1, perPage = 10, categoryId?: number): Promise<Sermon[]> {
  try {
    let url = `${WP_URL}/posts?_embed&page=${page}&per_page=${perPage}`;
    if (categoryId) {
      url += `&categories=${categoryId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch sermons');
    }

    const posts: WPPost[] = await response.json();
    
    return posts.map(post => {
      // Extract audio URL
      // Sonaar often uses shortcodes or custom fields. 
      // We'll try to find an .mp3 link in the content or meta.
      let audioUrl = '';
      
      // Check for audio in content (common fallback)
      const audioMatch = post.content.rendered.match(/href="([^"]+\.mp3)"/i) || 
                         post.content.rendered.match(/src="([^"]+\.mp3)"/i);
      if (audioMatch) {
        audioUrl = audioMatch[1];
      }

      // Featured image
      const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                       'https://picsum.photos/seed/sermon/800/600';

      // Categories
      const categories = post._embedded?.['wp:term']?.[0]?.map(t => t.name) || [];

      return {
        id: post.id,
        title: post.title.rendered,
        date: post.date,
        excerpt: post.excerpt.rendered.replace(/<[^>]*>?/gm, ''),
        content: post.content.rendered,
        audioUrl,
        imageUrl,
        categories
      };
    });
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return [];
  }
}

export async function fetchSermonById(id: number): Promise<Sermon | null> {
  try {
    const response = await fetch(`${WP_URL}/posts/${id}?_embed`);
    if (!response.ok) return null;
    
    const post: WPPost = await response.json();
    
    let audioUrl = '';
    const audioMatch = post.content.rendered.match(/href="([^"]+\.mp3)"/i) || 
                       post.content.rendered.match(/src="([^"]+\.mp3)"/i);
    if (audioMatch) audioUrl = audioMatch[1];

    const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                     'https://picsum.photos/seed/sermon/800/600';

    const categories = post._embedded?.['wp:term']?.[0]?.map(t => t.name) || [];

    return {
      id: post.id,
      title: post.title.rendered,
      date: post.date,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>?/gm, ''),
      content: post.content.rendered,
      audioUrl,
      imageUrl,
      categories
    };
  } catch (error) {
    console.error('Error fetching sermon:', error);
    return null;
  }
}

export async function searchSermons(query: string): Promise<Sermon[]> {
  try {
    const response = await fetch(
      `${WP_URL}/posts?_embed&search=${encodeURIComponent(query)}&per_page=20`
    );
    
    if (!response.ok) {
      throw new Error('Search failed');
    }

    const posts: WPPost[] = await response.json();
    
    return posts.map(post => {
      let audioUrl = '';
      const audioMatch = post.content.rendered.match(/href="([^"]+\.mp3)"/i) || 
                         post.content.rendered.match(/src="([^"]+\.mp3)"/i);
      if (audioMatch) audioUrl = audioMatch[1];

      const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                       'https://picsum.photos/seed/sermon/800/600';

      const categories = post._embedded?.['wp:term']?.[0]?.map(t => t.name) || [];

      return {
        id: post.id,
        title: decodeHtml(post.title.rendered),
        date: post.date,
        excerpt: decodeHtml(post.excerpt.rendered.replace(/<[^>]*>?/gm, '')),
        content: post.content.rendered,
        audioUrl,
        imageUrl,
        categories
      };
    });
  } catch (error) {
    console.error('Error searching sermons:', error);
    return [];
  }
}

export async function fetchSermonsByIds(ids: number[]): Promise<Sermon[]> {
  if (ids.length === 0) return [];
  try {
    const response = await fetch(`${WP_URL}/posts?_embed&include=${ids.join(',')}`);
    if (!response.ok) throw new Error('Failed to fetch sermons by ids');
    
    const posts: WPPost[] = await response.json();
    
    return posts.map(post => {
      let audioUrl = '';
      const audioMatch = post.content.rendered.match(/href="([^"]+\.mp3)"/i) || 
                         post.content.rendered.match(/src="([^"]+\.mp3)"/i);
      if (audioMatch) audioUrl = audioMatch[1];

      const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                       'https://picsum.photos/seed/sermon/800/600';

      const categories = post._embedded?.['wp:term']?.[0]?.map(t => t.name) || [];

      return {
        id: post.id,
        title: decodeHtml(post.title.rendered),
        date: post.date,
        excerpt: decodeHtml(post.excerpt.rendered.replace(/<[^>]*>?/gm, '')),
        content: post.content.rendered,
        audioUrl,
        imageUrl,
        categories
      };
    });
  } catch (error) {
    console.error('Error fetching sermons by ids:', error);
    return [];
  }
}

export async function loginUser(username: string, password: string) {
  const response = await fetch(`${JWT_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

export async function fetchUserProfile(token: string) {
  try {
    const response = await fetch(`${WP_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: data.avatar_urls?.['96']
    };
  } catch (e) {
    return null;
  }
}
