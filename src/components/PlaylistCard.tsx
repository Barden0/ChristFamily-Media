import React from 'react';
import { Play, Disc, Download } from 'lucide-react';
import { Playlist, Sermon } from '../types';
import { downloadFile } from '../utils/download';

interface PlaylistCardProps {
  playlist: Playlist;
  onPlay: (sermon: Sermon, playlist: Playlist) => void;
  onClick: (playlist: Playlist) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onPlay, onClick }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.tracks && playlist.tracks.length > 0) {
      const firstTrack = playlist.tracks[0];
      downloadFile(firstTrack.url, `${playlist.title} - ${firstTrack.title}`);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.tracks && playlist.tracks.length > 0) {
      const firstTrack = playlist.tracks[0];
      const sermonFromTrack: Sermon = {
        id: playlist.id,
        title: firstTrack.title,
        date: new Date().toISOString(),
        excerpt: '',
        content: '',
        audioUrl: firstTrack.url,
        imageUrl: playlist.imageUrl,
        categories: [playlist.title]
      };
      onPlay(sermonFromTrack, playlist);
    }
  };

  return (
    <div 
      onClick={() => onClick(playlist)}
      className="group flex items-center gap-4 rounded-3xl bg-white p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] cursor-pointer dark:bg-stone-900 dark:border dark:border-white/5"
    >
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800">
        <img 
          src={playlist.imageUrl} 
          alt={playlist.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
        
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button 
            onClick={handleDownload}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-lg transition-transform hover:scale-110 active:scale-90"
            title="Download first track"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={handlePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-lg transition-transform hover:scale-110 active:scale-90"
            title="Play first track"
          >
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            Playlist
          </span>
          <span className="text-[10px] text-stone-400">
            {playlist.tracks.length} Tracks
          </span>
        </div>
        <h3 
          className="line-clamp-1 font-serif text-lg font-medium text-stone-900 dark:text-white" 
          dangerouslySetInnerHTML={{ __html: playlist.title }} 
        />
      </div>

      <div className="pr-2 text-stone-300">
        <Disc size={20} />
      </div>
    </div>
  );
};
