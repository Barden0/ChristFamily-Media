import React from 'react';
import { X, Play, Music, ArrowLeft, Share2, Download, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Playlist, Sermon } from '../types';
import { downloadFile } from '../utils/download';
import { shareContent } from '../utils/share';

interface PlaylistDetailProps {
  playlist: Playlist;
  bookmarks: (number | string)[];
  onToggleBookmark: (id: number | string) => void;
  onClose: () => void;
  onPlayTrack: (sermon: Sermon, playlist: Playlist) => void;
}

export const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlist, bookmarks, onToggleBookmark, onClose, onPlayTrack }) => {
  const handleShare = async () => {
    await shareContent(
      playlist.title,
      `Check out this series: ${playlist.title}`,
      window.location.href
    );
  };

  const handleDownloadTrack = (e: React.MouseEvent, track: { title: string; url: string }) => {
    e.stopPropagation();
    downloadFile(track.url, `${playlist.title} - ${track.title}`);
  };

  const handleBookmarkTrack = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    onToggleBookmark(url);
  };

  const handlePlayTrack = (track: { title: string; url: string }) => {
    const sermonFromTrack: Sermon = {
      id: track.url, // Use URL as stable ID for tracks
      title: track.title,
      date: new Date().toISOString(),
      excerpt: '',
      content: '',
      audioUrl: track.url,
      imageUrl: playlist.imageUrl,
      categories: [playlist.title]
    };
    onPlayTrack(sermonFromTrack, playlist);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] flex flex-col bg-stone-50 dark:bg-stone-950"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between bg-stone-50/80 px-4 py-4 backdrop-blur-md dark:bg-stone-950/80">
        <button onClick={onClose} className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
          <ArrowLeft size={24} />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex gap-2">
          <button onClick={handleShare} className="rounded-full bg-stone-200/50 p-2 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
            <Share2 size={20} />
          </button>
          <button onClick={onClose} className="rounded-full bg-stone-200/50 p-2 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-4">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 aspect-square w-32 overflow-hidden rounded-2xl shadow-xl">
              <img src={playlist.imageUrl} alt={playlist.title} className="h-full w-full object-cover" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-white" dangerouslySetInnerHTML={{ __html: playlist.title }} />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{playlist.tracks.length} Tracks</p>
            
            {playlist.tracks.length > 0 && (
              <button
                onClick={() => handlePlayTrack(playlist.tracks[0])}
                className="mt-6 flex items-center gap-2 rounded-full bg-brand px-8 py-3 font-bold text-white shadow-lg shadow-brand/20 transition-transform active:scale-95"
              >
                <Play size={20} fill="currentColor" />
                Play All
              </button>
            )}
          </div>

          <div className="mb-48 space-y-2">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-stone-400">Tracks</h2>
            {playlist.tracks.length > 0 ? (
              playlist.tracks.map((track, index) => {
                const isBookmarked = bookmarks.includes(track.url);
                return (
                  <div
                    key={index}
                    onClick={() => handlePlayTrack(track)}
                    className="flex w-full items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-stone-200/50 active:bg-stone-200 cursor-pointer group dark:hover:bg-white/5 dark:active:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-200 text-stone-500 group-hover:bg-stone-900 group-hover:text-white transition-colors dark:bg-stone-800 dark:text-stone-400 dark:group-hover:bg-stone-700 dark:group-hover:text-white">
                      <Music size={18} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-stone-800 dark:text-stone-200">{track.title}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">Track {index + 1}</p>
                    </div>
                    <div className="flex items-center gap-1 text-stone-400">
                      <button
                        onClick={(e) => handleBookmarkTrack(e, track.url)}
                        className={`rounded-full p-2 transition-colors ${
                          isBookmarked ? 'text-brand' : 'hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300'
                        }`}
                        title={isBookmarked ? "Remove from Bookmarks" : "Add to Bookmarks"}
                      >
                        <Heart size={18} fill={isBookmarked ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={(e) => handleDownloadTrack(e, track)}
                        className="rounded-full p-2 hover:bg-stone-200 hover:text-stone-600 transition-colors dark:hover:bg-stone-800 dark:hover:text-stone-300"
                        title="Download Track"
                      >
                        <Download size={18} />
                      </button>
                      <Play size={18} className="ml-1" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-stone-400">
                <p>No tracks found in this playlist.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
