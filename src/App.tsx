import React, { useState, useEffect } from 'react';
import { Search, Menu, Music2, BookOpen, Home, User, Disc, Library, Music, ArrowLeft, Heart, Flame, Bell, BellOff, ExternalLink, Moon, Sun, Monitor, Calendar, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Sermon, Playlist, Quote } from './types';
import { fetchSermons, fetchPlaylists, fetchQuotes, searchSermons } from './services/wordpress';
import { SermonCard } from './components/SermonCard';
import { SermonDetail } from './components/SermonDetail';
import { AudioPlayer } from './components/AudioPlayer';
import { PlaylistCard } from './components/PlaylistCard';
import { PlaylistDetail } from './components/PlaylistDetail';
import { SearchOverlay } from './components/SearchOverlay';
import { DailyQuote } from './components/DailyQuote';
import { requestNotificationPermission } from './firebase';
import { syncUserData, fetchUserData, fetchWrappedStats, ListeningStats } from './services/syncService';
import { StatsModal } from './components/StatsModal';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sermonPage, setSermonPage] = useState(1);
  const [playlistPage, setPlaylistPage] = useState(1);
  const [hasMoreSermons, setHasMoreSermons] = useState(true);
  const [hasMorePlaylists, setHasMorePlaylists] = useState(true);
  
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<Sermon | null>(null);
  const [currentPlaylistContext, setCurrentPlaylistContext] = useState<Playlist | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'sermons' | 'series' | 'music' | 'notes'>('home');
  const [giveUrl, setGiveUrl] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bookmarks, setBookmarks] = useState<(number | string)[]>(() => {
    const saved = localStorage.getItem('user_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('user_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (id: number | string) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Registration successful, scope is:', registration.scope);
        })
        .catch((err) => {
          console.log('Service worker registration failed, error:', err);
        });
    }
  }, []);

  useEffect(() => {
    const updateStreak = () => {
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().split('T')[0];
      
      const storedStreak = localStorage.getItem('user_streak');
      const storedLastVisit = localStorage.getItem('last_visit_date');
      
      let currentStreak = storedStreak ? parseInt(storedStreak, 10) : 0;
      
      if (!storedLastVisit) {
        currentStreak = 1;
      } else {
        const lastVisit = new Date(storedLastVisit);
        const yesterday = new Date(now);
        yesterday.setUTCDate(now.getUTCDate() - 1);
        const yesterdayUTC = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate())).toISOString().split('T')[0];
        
        if (storedLastVisit === todayUTC) {
          // Already visited today, do nothing
        } else if (storedLastVisit === yesterdayUTC) {
          // Visited yesterday, increment streak
          currentStreak += 1;
        } else {
          // Missed a day, reset streak
          currentStreak = 1;
        }
      }
      
      setStreak(currentStreak);
      localStorage.setItem('user_streak', currentStreak.toString());
      localStorage.setItem('last_visit_date', todayUTC);
    };

    updateStreak();
  }, []);

  const [musicSermons, setMusicSermons] = useState<Sermon[]>([]);
  const [notesSermons, setNotesSermons] = useState<Sermon[]>([]);
  const [musicPage, setMusicPage] = useState(1);
  const [notesPage, setNotesPage] = useState(1);
  const [hasMoreMusic, setHasMoreMusic] = useState(true);
  const [hasMoreNotes, setHasMoreNotes] = useState(true);
  const [loadingSubView, setLoadingSubView] = useState(false);
  const [bookmarkedSermons, setBookmarkedSermons] = useState<Sermon[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [listeningStats, setListeningStats] = useState<ListeningStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as 'light' | 'dark' | 'system') || 'system';
  });
  const { user: authUser } = useAuth();
  const userEmail = authUser?.email || 'user@example.com';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const handleSync = async () => {
    setIsSyncing(true);
    const todayUTC = new Date().toISOString().split('T')[0];
    await syncUserData(userEmail, {
      streak,
      bookmarks,
      lastVisitDate: todayUTC
    });
    
    const stats = await fetchWrappedStats(userEmail);
    if (stats) setListeningStats(stats);
    setIsSyncing(false);
  };

  // Auto-sync when critical data changes
  useEffect(() => {
    if (streak > 0 || bookmarks.length > 0) {
      handleSync();
    }
  }, [streak, bookmarks]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Reset sub-view when switching main tabs
    if (tabId === 'home') setCurrentView('home');
    if (tabId === 'sermons') setCurrentView('sermons');
    if (tabId === 'series') setCurrentView('series');
  };

  const loadMoreSermons = async () => {
    if (loadingMore || !hasMoreSermons) return;
    setLoadingMore(true);
    const nextPage = sermonPage + 1;
    const newData = await fetchSermons(nextPage, 10);
    if (newData.length < 10) setHasMoreSermons(false);
    setSermons(prev => [...prev, ...newData]);
    setSermonPage(nextPage);
    setLoadingMore(false);
  };

  const loadMorePlaylists = async () => {
    if (loadingMore || !hasMorePlaylists) return;
    setLoadingMore(true);
    const nextPage = playlistPage + 1;
    const newData = await fetchPlaylists(nextPage, 10);
    if (newData.length < 10) setHasMorePlaylists(false);
    setPlaylists(prev => [...prev, ...newData]);
    setPlaylistPage(nextPage);
    setLoadingMore(false);
  };

  const loadMoreMusic = async () => {
    if (loadingMore || !hasMoreMusic) return;
    setLoadingMore(true);
    const nextPage = musicPage + 1;
    const newData = await fetchSermons(nextPage, 10, 18);
    if (newData.length < 10) setHasMoreMusic(false);
    setMusicSermons(prev => [...prev, ...newData]);
    setMusicPage(nextPage);
    setLoadingMore(false);
  };

  const loadMoreNotes = async () => {
    if (loadingMore || !hasMoreNotes) return;
    setLoadingMore(true);
    const nextPage = notesPage + 1;
    const newData = await fetchSermons(nextPage, 10, 14);
    if (newData.length < 10) setHasMoreNotes(false);
    setNotesSermons(prev => [...prev, ...newData]);
    setNotesPage(nextPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (currentView === 'music' && musicSermons.length === 0) {
      setLoadingSubView(true);
      fetchSermons(1, 10, 18).then(data => {
        if (data.length < 10) setHasMoreMusic(false);
        setMusicSermons(data);
        setLoadingSubView(false);
      });
    } else if (currentView === 'notes' && notesSermons.length === 0) {
      setLoadingSubView(true);
      fetchSermons(1, 10, 14).then(data => {
        if (data.length < 10) setHasMoreNotes(false);
        setNotesSermons(data);
        setLoadingSubView(false);
      });
    }
  }, [currentView]);

  useEffect(() => {
    if (activeTab === 'profile' && bookmarks.length > 0) {
      setLoadingBookmarks(true);
      const postIds = bookmarks.filter((id): id is number => typeof id === 'number');
      
      import('./services/wordpress').then(({ fetchSermonsByIds }) => {
        fetchSermonsByIds(postIds).then(data => {
          // For track bookmarks (string IDs), we might want to store their full data in localStorage
          // but for now let's just show the post bookmarks. 
          // In a real app, we'd fetch or cache the track data too.
          setBookmarkedSermons(data);
          setLoadingBookmarks(false);
        });
      });
    } else if (activeTab === 'profile' && bookmarks.length === 0) {
      setBookmarkedSermons([]);
    }
  }, [activeTab, bookmarks]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [sermonData, playlistData, quoteData] = await Promise.all([
        fetchSermons(1, 10),
        fetchPlaylists(1, 10),
        fetchQuotes(1, 30) // Fetch a pool of quotes
      ]);
      
      if (sermonData.length < 10) setHasMoreSermons(false);
      if (playlistData.length < 10) setHasMorePlaylists(false);
      
      setSermons(sermonData);
      setPlaylists(playlistData);
      
      if (quoteData && quoteData.length > 0) {
        // Pick a quote based on the day of the year to ensure it changes daily
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        const quoteIndex = dayOfYear % quoteData.length;
        setDailyQuote(quoteData[quoteIndex]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        if (currentView !== 'home') {
          let viewTitle = '';
          let viewData: any[] = [];
          let isPlaylist = false;
          let hasMore = false;
          let loadMoreFn = () => {};

          if (currentView === 'sermons') {
            viewTitle = 'All Sermons';
            viewData = sermons;
            hasMore = hasMoreSermons;
            loadMoreFn = loadMoreSermons;
          } else if (currentView === 'series') {
            viewTitle = 'Sermon Series';
            viewData = playlists;
            isPlaylist = true;
            hasMore = hasMorePlaylists;
            loadMoreFn = loadMorePlaylists;
          } else if (currentView === 'music') {
            viewTitle = 'Music';
            viewData = musicSermons;
            hasMore = hasMoreMusic;
            loadMoreFn = loadMoreMusic;
          } else if (currentView === 'notes') {
            viewTitle = 'Notes';
            viewData = notesSermons;
            hasMore = hasMoreNotes;
            loadMoreFn = loadMoreNotes;
          }

          return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6 flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('home')}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600 shadow-sm dark:bg-stone-800 dark:text-stone-400"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white">{viewTitle}</h2>
              </div>

              {loadingSubView ? (
                <div className="flex py-20 justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900 dark:border-stone-700 dark:border-t-stone-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className={isPlaylist ? "grid gap-6" : "grid grid-cols-2 gap-4"}>
                    {viewData.map((item) => (
                      isPlaylist ? (
                        <PlaylistCard 
                          key={item.id} 
                          playlist={item} 
                          onPlay={(sermon, playlist) => {
                            setCurrentPlaying(sermon);
                            setCurrentPlaylistContext(playlist);
                          }} 
                          onClick={setSelectedPlaylist}
                        />
                      ) : (
                        <SermonCard
                          key={item.id}
                          sermon={item}
                          onPlay={(sermon) => {
                            setCurrentPlaying(sermon);
                            setCurrentPlaylistContext(null);
                          }}
                          onClick={setSelectedSermon}
                        />
                      )
                    ))}
                  </div>
                  
                  {hasMore && (
                    <button
                      onClick={loadMoreFn}
                      disabled={loadingMore}
                      className="mt-4 flex w-full items-center justify-center rounded-2xl bg-stone-100 py-4 font-bold text-stone-600 transition-colors hover:bg-stone-200 disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                      ) : (
                        'Load More'
                      )}
                    </button>
                  )}

                  {viewData.length === 0 && (
                    <div className="py-20 text-center text-stone-400">
                      No items found in this category.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        return (
          <>
            {/* Daily Quote Section */}
            {dailyQuote && <DailyQuote quote={dailyQuote} />}

            {/* Explore Section */}
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white">Explore</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setCurrentView('sermons')}
                  className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-stone-100 p-8 text-stone-900 shadow-sm transition-all hover:scale-[1.02] active:scale-95 dark:bg-stone-900 dark:text-white dark:border dark:border-white/5"
                >
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand/5 blur-2xl group-hover:bg-brand/10 transition-colors" />
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900/5 dark:bg-white/5 shadow-inner">
                    <Disc size={28} />
                  </div>
                  <span className="text-lg font-bold">Sermons</span>
                </button>
                <button 
                  onClick={() => setCurrentView('series')}
                  className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-stone-100 p-8 text-stone-900 shadow-sm transition-all hover:scale-[1.02] active:scale-95 dark:bg-stone-900 dark:text-white dark:border dark:border-white/5"
                >
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand/5 blur-2xl group-hover:bg-brand/10 transition-colors" />
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900/5 dark:bg-white/5 shadow-inner">
                    <Library size={28} />
                  </div>
                  <span className="text-lg font-bold">Series</span>
                </button>
                <button 
                  onClick={() => setCurrentView('music')}
                  className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-stone-100 p-8 text-stone-900 shadow-sm transition-all hover:scale-[1.02] active:scale-95 dark:bg-stone-900 dark:text-white dark:border dark:border-white/5"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900/5 dark:bg-white/5">
                    <Music size={28} />
                  </div>
                  <span className="text-lg font-bold">Music</span>
                </button>
                <button 
                  onClick={() => setCurrentView('notes')}
                  className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-stone-100 p-8 text-stone-900 shadow-sm transition-all hover:scale-[1.02] active:scale-95 dark:bg-stone-900 dark:text-white dark:border dark:border-white/5"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900/5 dark:bg-white/5">
                    <BookOpen size={28} />
                  </div>
                  <span className="text-lg font-bold">Notes</span>
                </button>
              </div>
            </section>

            {/* Featured Section */}
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white">Latest Sermons</h2>
                <button onClick={() => setCurrentView('sermons')} className="text-sm font-semibold text-stone-500">See all</button>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 w-full animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {sermons.slice(0, 4).map((sermon) => (
                    <SermonCard
                      key={sermon.id}
                      sermon={sermon}
                      isBookmarked={bookmarks.includes(sermon.id)}
                      onToggleBookmark={() => toggleBookmark(sermon.id)}
                      onPlay={(s) => {
                        setCurrentPlaying(s);
                        setCurrentPlaylistContext(null);
                      }}
                      onClick={setSelectedSermon}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Playlists Section */}
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white">Sermon Series</h2>
                <button onClick={() => setCurrentView('series')} className="text-sm font-semibold text-stone-500">See all</button>
              </div>
              <div className="grid gap-4">
                {playlists.slice(0, 3).map((playlist) => (
                  <PlaylistCard 
                    key={playlist.id} 
                    playlist={playlist} 
                    onPlay={(sermon, p) => {
                      setCurrentPlaying(sermon);
                      setCurrentPlaylistContext(p);
                    }} 
                    onClick={setSelectedPlaylist}
                  />
                ))}
              </div>
            </section>
          </>
        );
      case 'sermons':
        return (
          <section className="mb-8">
            <h2 className="mb-6 font-serif text-3xl font-bold text-stone-900 dark:text-white">All Sermons</h2>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                {sermons.map((sermon) => (
                  <SermonCard
                    key={sermon.id}
                    sermon={sermon}
                    isBookmarked={bookmarks.includes(sermon.id)}
                    onToggleBookmark={() => toggleBookmark(sermon.id)}
                    onPlay={(s) => {
                      setCurrentPlaying(s);
                      setCurrentPlaylistContext(null);
                    }}
                    onClick={setSelectedSermon}
                  />
                ))}
              </div>
              {hasMoreSermons && (
                <button
                  onClick={loadMoreSermons}
                  disabled={loadingMore}
                  className="mt-4 flex w-full items-center justify-center rounded-2xl bg-stone-100 py-4 font-bold text-stone-600 transition-colors hover:bg-stone-200 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                  ) : (
                    'Load More'
                  )}
                </button>
              )}
            </div>
          </section>
        );
      case 'series':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="mb-6 font-serif text-3xl font-bold text-stone-900 dark:text-white">Sermon Series</h2>
            <div className="flex flex-col gap-6">
              <div className="grid gap-4">
                {playlists.map((playlist) => (
                  <PlaylistCard 
                    key={playlist.id} 
                    playlist={playlist} 
                    onPlay={(sermon, p) => {
                      setCurrentPlaying(sermon);
                      setCurrentPlaylistContext(p);
                    }} 
                    onClick={setSelectedPlaylist}
                  />
                ))}
              </div>
              {hasMorePlaylists && (
                <button
                  onClick={loadMorePlaylists}
                  disabled={loadingMore}
                  className="mt-4 flex w-full items-center justify-center rounded-2xl bg-stone-100 py-4 font-bold text-stone-600 transition-colors hover:bg-stone-200 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                  ) : (
                    'Load More'
                  )}
                </button>
              )}
            </div>
          </div>
        );
      case 'give':
        if (giveUrl) {
          return (
            <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-stone-950">
              <div className="sticky top-0 z-10 flex items-center justify-between bg-stone-50/80 px-4 py-4 backdrop-blur-md dark:bg-stone-950/80">
                <button onClick={() => setGiveUrl(null)} className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                  <ArrowLeft size={24} />
                  <span className="font-medium">Back</span>
                </button>
                <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-white">Give</h2>
                <div className="w-10" />
              </div>
              <iframe 
                src={giveUrl} 
                className="flex-1 w-full border-none"
                title="Give"
              />
            </div>
          );
        }
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="mb-6 font-serif text-3xl font-bold text-stone-900 dark:text-white">Give</h2>
            <div className="grid gap-6">
              <button 
                onClick={() => setGiveUrl('https://christfamilymedia.org/cfigive')}
                className="group relative overflow-hidden rounded-[32px] bg-brand p-8 text-left text-white shadow-xl shadow-brand/20 transition-transform active:scale-[0.98]"
              >
                <div className="relative z-10">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <Heart size={28} fill="currentColor" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">CFI Give</h3>
                  <p className="mb-6 text-brand-light">Give a one-time offering to support the ministry and spread the gospel.</p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-brand shadow-lg">
                    <span>Give Now</span>
                  </div>
                </div>
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-150" />
              </button>

              <button 
                onClick={() => setGiveUrl('https://paystack.shop/pay/cfipledge')}
                className="group relative overflow-hidden rounded-[32px] bg-stone-900 p-8 text-left text-white shadow-xl transition-transform active:scale-[0.98] dark:bg-stone-800"
              >
                <div className="relative z-10">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <Calendar size={28} />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">CFI Pledge</h3>
                  <p className="mb-6 text-stone-400">Pledge an amount to give at your own frequency and partner with us.</p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-bold text-white shadow-lg">
                    <span>Pledge Now</span>
                  </div>
                </div>
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/10 blur-3xl transition-transform group-hover:scale-150" />
              </button>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-sm text-stone-500">"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."</p>
              <p className="mt-2 text-xs font-bold text-stone-400 uppercase tracking-widest">2 Corinthians 9:7</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8 flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-brand-dark text-brand-light">
                <User size={48} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">Your Profile</h2>
              
              {streak > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-brand/10 px-6 py-3 text-brand">
                  <Flame size={24} fill="currentColor" />
                  <div className="text-left">
                    <p className="text-sm font-bold leading-none">{streak} Day Streak</p>
                    <p className="text-[10px] opacity-70 uppercase tracking-wider">Faithful Listener</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-stone-900">Bookmarked Sermons</h3>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{bookmarks.length} saved</span>
              </div>

              {loadingBookmarks ? (
                <div className="grid gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-32 w-full animate-pulse rounded-3xl bg-stone-200" />
                  ))}
                </div>
              ) : bookmarkedSermons.length > 0 ? (
                <div className="grid gap-6">
                  {bookmarkedSermons.map((sermon) => (
                    <SermonCard
                      key={sermon.id}
                      sermon={sermon}
                      isBookmarked={true}
                      onToggleBookmark={() => toggleBookmark(sermon.id)}
                      onPlay={(s) => {
                        setCurrentPlaying(s);
                        setCurrentPlaylistContext(null);
                      }}
                      onClick={setSelectedSermon}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-stone-200 p-10 text-center">
                  <Heart size={32} className="mx-auto mb-3 text-stone-300" />
                  <p className="text-sm font-medium text-stone-500">No bookmarks yet.</p>
                  <button 
                    onClick={() => handleTabChange('sermons')}
                    className="mt-4 text-xs font-bold text-brand uppercase tracking-widest"
                  >
                    Explore Sermons
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-stone-100 p-6">
              <h4 className="mb-2 font-bold text-stone-900">Notifications</h4>
              <p className="text-sm text-stone-500">Stay updated with the latest sermons and daily quotes.</p>
              <button 
                onClick={async () => {
                  const token = await requestNotificationPermission();
                  if (token) setNotificationToken(token);
                }}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold transition-colors ${
                  notificationToken ? 'bg-emerald-50 text-emerald-600' : 'bg-brand text-white'
                }`}
              >
                {notificationToken ? <Bell size={20} /> : <BellOff size={20} />}
                {notificationToken ? 'Notifications Enabled' : 'Enable Notifications'}
              </button>
            </div>

            <div className="mt-6 rounded-3xl bg-stone-100 p-6 dark:bg-stone-800">
              <h4 className="mb-4 font-bold text-stone-900 dark:text-white">Appearance</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex flex-col items-center gap-2 rounded-2xl p-3 transition-all ${
                      theme === t.id 
                        ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                        : 'bg-white text-stone-600 dark:bg-stone-700 dark:text-stone-400'
                    }`}
                  >
                    <t.icon size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-stone-100 p-6 dark:bg-stone-800">
              <h4 className="mb-2 font-bold text-stone-900 dark:text-white">Sync your data</h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">Your data is synced across all your devices using your account.</p>
              
              {listeningStats && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Hours</p>
                    <p className="text-xl font-bold text-stone-900 dark:text-white">{listeningStats.totalHours}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Top Sermon</p>
                    <p className="truncate text-sm font-bold text-stone-900 dark:text-white">{listeningStats.topSermon?.title || 'None'}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setIsStatsModalOpen(true)}
                className="mt-6 w-full rounded-2xl bg-brand-dark py-4 font-bold text-white shadow-lg shadow-brand-dark/20"
              >
                View Your Moments
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-stone-50/80 backdrop-blur-md dark:bg-stone-950/80">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{getGreeting()},</span>
            <h1 className="font-serif text-xl font-bold text-stone-900 dark:text-white">Beloved</h1>
          </div>
          <div className="flex gap-4">
            {streak > 0 && (
              <button 
                onClick={() => setIsStatsModalOpen(true)}
                className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-orange-600 shadow-sm transition-transform active:scale-90 dark:bg-orange-500/10 dark:text-orange-400"
              >
                <Flame size={16} fill="currentColor" />
                <span className="text-xs font-bold">{streak}</span>
              </button>
            )}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="rounded-full bg-white p-2 text-stone-600 shadow-sm transition-transform active:scale-90 dark:bg-stone-800 dark:text-stone-400"
            >
              <Search size={20} />
            </button>
            <button className="rounded-full bg-white p-2 text-stone-600 shadow-sm transition-transform active:scale-90 dark:bg-stone-800 dark:text-stone-400">
              <Bell size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-6 pb-40 pt-4">
        {renderContent()}
      </main>

      {/* Global Components */}
      <AnimatePresence>
        {selectedSermon && (
          <SermonDetail
            sermon={selectedSermon}
            isBookmarked={bookmarks.includes(selectedSermon.id)}
            onToggleBookmark={() => toggleBookmark(selectedSermon.id)}
            onClose={() => setSelectedSermon(null)}
            onPlay={(s) => {
              setCurrentPlaying(s);
              setCurrentPlaylistContext(null);
            }}
          />
        )}
        {selectedPlaylist && (
          <PlaylistDetail
            playlist={selectedPlaylist}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            onClose={() => setSelectedPlaylist(null)}
            onPlayTrack={(sermon, playlist) => {
              setCurrentPlaying(sermon);
              setCurrentPlaylistContext(playlist);
            }}
          />
        )}
        {isSearchOpen && (
          <SearchOverlay
            onClose={() => setIsSearchOpen(false)}
            onSelectSermon={(sermon) => {
              setSelectedSermon(sermon);
              setIsSearchOpen(false);
            }}
            onPlaySermon={(sermon) => {
              setCurrentPlaying(sermon);
              setCurrentPlaylistContext(null);
              setIsSearchOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <AudioPlayer
        currentSermon={currentPlaying}
        playlistContext={currentPlaylistContext}
        isBookmarked={currentPlaying ? bookmarks.includes(currentPlaying.id) : false}
        onToggleBookmark={() => currentPlaying && toggleBookmark(currentPlaying.id)}
        onClose={() => {
          setCurrentPlaying(null);
          setCurrentPlaylistContext(null);
        }}
        onPlaySermon={(sermon) => setCurrentPlaying(sermon)}
      />

      <AnimatePresence>
        {isStatsModalOpen && listeningStats && (
          <StatsModal 
            stats={listeningStats} 
            streak={streak}
            onClose={() => setIsStatsModalOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 px-4 pb-8 pt-4 backdrop-blur-lg dark:border-white/5 dark:bg-stone-900/95">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'sermons', icon: Music2, label: 'Sermons' },
            { id: 'series', icon: Library, label: 'Series' },
            { id: 'give', icon: Heart, label: 'Give' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === item.id ? 'text-brand scale-105' : 'text-stone-400 dark:text-stone-600'
              }`}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
