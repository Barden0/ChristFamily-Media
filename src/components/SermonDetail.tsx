import React from 'react';
import { X, Play, Calendar, Share2, ArrowLeft, Download, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Sermon } from '../types';
import { downloadFile } from '../utils/download';
import { shareContent } from '../utils/share';

interface SermonDetailProps {
  sermon: Sermon;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onClose: () => void;
  onPlay: (sermon: Sermon) => void;
}

export const SermonDetail: React.FC<SermonDetailProps> = ({ sermon, isBookmarked, onToggleBookmark, onClose, onPlay }) => {
  const handleShare = async () => {
    await shareContent(
      sermon.title,
      `Listen to this sermon: ${sermon.title}`,
      window.location.href
    );
  };

  const handleBookmark = () => {
    onToggleBookmark?.();
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sermon.audioUrl) {
      downloadFile(sermon.audioUrl, sermon.title);
    }
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
          <button 
            onClick={handleBookmark} 
            className={`rounded-full p-2 transition-colors ${
              isBookmarked ? 'bg-brand text-white' : 'bg-stone-200/50 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
            }`}
          >
            <Heart size={20} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
          <button onClick={handleShare} className="rounded-full bg-stone-200/50 p-2 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
            <Share2 size={20} />
          </button>
          <button onClick={onClose} className="rounded-full bg-stone-200/50 p-2 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative aspect-[4/3] w-full">
          <img
            src={sermon.imageUrl}
            alt={sermon.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-transparent dark:from-stone-950" />
        </div>

        <div className="relative -mt-12 px-6 pb-48">
          <div className="mb-4 flex flex-wrap gap-2">
            {sermon.categories.map((cat) => (
              <span key={cat} className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                {cat}
              </span>
            ))}
          </div>

          <h1 
            className="mb-4 font-serif text-3xl font-bold leading-tight text-stone-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: sermon.title }}
          />

          <div className="mb-8 flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{format(new Date(sermon.date), 'MMMM d, yyyy')}</span>
            </div>
          </div>

          {sermon.audioUrl && (
            <div className="mb-8 flex gap-3">
              <button
                onClick={() => onPlay(sermon)}
                className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-brand py-4 font-semibold text-white shadow-xl shadow-brand/20 transition-transform active:scale-[0.98]"
              >
                <Play size={24} fill="currentColor" />
                Listen to Sermon
              </button>
              <button
                onClick={handleDownload}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-900 shadow-sm transition-transform active:scale-95 dark:bg-stone-800 dark:text-white"
                title="Download Sermon"
              >
                <Download size={24} />
              </button>
            </div>
          )}

          <div 
            className="prose prose-stone max-w-none text-stone-700 leading-relaxed dark:prose-invert dark:text-stone-300"
            dangerouslySetInnerHTML={{ __html: sermon.content }}
          />
        </div>
      </div>
    </motion.div>
  );
};
