import React from 'react';
import { Play, Calendar, Clock, Download, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { Sermon } from '../types';
import { downloadFile } from '../utils/download';

interface SermonCardProps {
  sermon: Sermon;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onPlay: (sermon: Sermon) => void;
  onClick: (sermon: Sermon) => void;
}

export const SermonCard: React.FC<SermonCardProps> = ({ sermon, isBookmarked, onToggleBookmark, onPlay, onClick }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sermon.audioUrl) {
      downloadFile(sermon.audioUrl, sermon.title);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark?.();
  };

  return (
    <div 
      onClick={() => onClick(sermon)}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] cursor-pointer dark:bg-stone-900 dark:border dark:border-white/5"
    >
      <div className="relative aspect-square sm:aspect-[16/9] overflow-hidden">
        <img
          src={sermon.imageUrl}
          alt={sermon.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="absolute top-2 right-2 flex gap-1.5">
          {sermon.audioUrl && (
            <button
              onClick={handleDownload}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/40 active:scale-90"
              title="Download Sermon"
            >
              <Download size={14} />
            </button>
          )}
          <button
            onClick={handleBookmark}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 ${
              isBookmarked ? 'bg-brand text-white' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
            title={isBookmarked ? "Remove from Bookmarks" : "Add to Bookmarks"}
          >
            <Heart size={14} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>

        {sermon.audioUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(sermon);
            }}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-110 active:scale-90"
          >
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col p-3 sm:p-5">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {sermon.categories.slice(0, 1).map((cat) => (
            <span key={cat} className="rounded-full bg-stone-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              {cat}
            </span>
          ))}
        </div>
        
        <h3 
          className="mb-2 line-clamp-2 font-serif text-sm sm:text-lg font-medium leading-tight text-stone-900 dark:text-white"
          dangerouslySetInnerHTML={{ __html: sermon.title }}
        />
        
        <div className="mt-auto flex items-center gap-3 text-[10px] text-stone-400">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{format(new Date(sermon.date), 'MMM d')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
