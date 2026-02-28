import React, { useState, useEffect } from 'react';
import { X, Search as SearchIcon, Play, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Sermon } from '../types';
import { searchSermons } from '../services/wordpress';
import { format } from 'date-fns';

interface SearchOverlayProps {
  onClose: () => void;
  onSelectSermon: (sermon: Sermon) => void;
  onPlaySermon: (sermon: Sermon) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose, onSelectSermon, onPlaySermon }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Sermon[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        const searchResults = await searchSermons(query);
        setResults(searchResults);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col bg-white dark:bg-stone-950"
    >
      <div className="flex items-center gap-4 border-b border-stone-100 px-6 py-4 dark:border-white/5">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Search sermons, topics..."
            className="w-full rounded-2xl bg-stone-100 py-3 pl-10 pr-4 text-stone-900 outline-none focus:ring-2 focus:ring-stone-200 dark:bg-stone-900 dark:text-white dark:focus:ring-stone-800"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button onClick={onClose} className="text-sm font-bold text-stone-500">
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isSearching ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((sermon) => (
              <div
                key={sermon.id}
                onClick={() => onSelectSermon(sermon)}
                className="flex items-center gap-4 rounded-2xl border border-stone-100 p-3 transition-colors active:bg-stone-50 dark:border-white/5 dark:active:bg-white/5"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
                  <img src={sermon.imageUrl} alt={sermon.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="line-clamp-1 font-bold text-stone-900 dark:text-white" dangerouslySetInnerHTML={{ __html: sermon.title }} />
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400">
                    <Calendar size={12} />
                    <span>{format(new Date(sermon.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySermon(sermon);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-white"
                >
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        ) : query.trim().length > 2 ? (
          <div className="py-20 text-center text-stone-400">
            <p>No results found for "{query}"</p>
          </div>
        ) : (
          <div className="py-20 text-center text-stone-400">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>Search for sermons by title or topic</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
