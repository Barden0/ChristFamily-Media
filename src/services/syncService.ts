export interface ListeningStats {
  totalHours: number;
  topSermon: { title: string; count: number } | null;
  topAlbum: { title: string; count: number } | null;
}

export const syncUserData = async (email: string, data: { streak: number; bookmarks: (number | string)[]; lastVisitDate: string }) => {
  try {
    const response = await fetch(`/api/user/${encodeURIComponent(email)}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Error syncing user data:', error);
    return null;
  }
};

export const fetchUserData = async (email: string) => {
  try {
    const response = await fetch(`/api/user/${encodeURIComponent(email)}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const reportListening = async (email: string, stats: { sermonId: number | string; sermonTitle: string; albumTitle?: string; durationSeconds: number }) => {
  try {
    const response = await fetch(`/api/user/${encodeURIComponent(email)}/listen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
    return await response.json();
  } catch (error) {
    console.error('Error reporting listening:', error);
    return null;
  }
};

export const fetchWrappedStats = async (email: string): Promise<ListeningStats | null> => {
  try {
    const response = await fetch(`/api/user/${encodeURIComponent(email)}/wrapped`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching wrapped stats:', error);
    return null;
  }
};
