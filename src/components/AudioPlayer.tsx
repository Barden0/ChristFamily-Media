import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X, RotateCcw, RotateCw, Repeat, Shuffle, ListMusic, ChevronUp, Download, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sermon, Playlist } from '../types';
import { downloadFile } from '../utils/download';
import { reportListening } from '../services/syncService';

interface AudioPlayerProps {
  currentSermon: Sermon | null;
  playlistContext?: Playlist | null;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onClose: () => void;
  onPlaySermon?: (sermon: Sermon) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ currentSermon, playlistContext, isBookmarked, onToggleBookmark, onClose, onPlaySermon }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const totalPlayedSecondsRef = useRef<number>(0);
  const lastReportedTimeRef = useRef<number>(0);

  // Report listening every 30 seconds of actual play time
  useEffect(() => {
    if (!currentSermon) return;

    const reportInterval = setInterval(() => {
      if (isPlaying && totalPlayedSecondsRef.current - lastReportedTimeRef.current >= 30) {
        const secondsToReport = totalPlayedSecondsRef.current - lastReportedTimeRef.current;
        reportListening('user@example.com', { // In a real app, use the logged-in user's email
          sermonId: currentSermon.id,
          sermonTitle: currentSermon.title,
          albumTitle: playlistContext?.title,
          durationSeconds: Math.floor(secondsToReport)
        });
        lastReportedTimeRef.current = totalPlayedSecondsRef.current;
      }
    }, 5000);

    return () => clearInterval(reportInterval);
  }, [isPlaying, currentSermon, playlistContext]);

  // Track actual play time
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      playStartTimeRef.current = Date.now();
      interval = setInterval(() => {
        if (playStartTimeRef.current) {
          const now = Date.now();
          const delta = (now - playStartTimeRef.current) / 1000;
          totalPlayedSecondsRef.current += delta;
          playStartTimeRef.current = now;
        }
      }, 1000);
    } else {
      playStartTimeRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Reset tracking when sermon changes
  useEffect(() => {
    totalPlayedSecondsRef.current = 0;
    lastReportedTimeRef.current = 0;
  }, [currentSermon]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSermon) {
      downloadFile(currentSermon.audioUrl, currentSermon.title);
    }
  };

  useEffect(() => {
    if (currentSermon && audioRef.current) {
      audioRef.current.src = currentSermon.audioUrl;
      audioRef.current.play().catch(e => console.warn('Autoplay blocked or failed', e));
      setIsPlaying(true);
    }
  }, [currentSermon]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      if (total) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (isRepeating && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      // Logic for next track could go here if we have playlist context
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSermon || !currentSermon.audioUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-0 right-0 z-[70] px-4"
      >
        {/* Playlist Overlay */}
        <AnimatePresence>
          {isPlaylistOpen && playlistContext && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-2 max-w-lg mx-auto overflow-hidden rounded-3xl bg-brand-dark/95 text-white shadow-2xl backdrop-blur-xl border border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h4 className="font-bold text-sm">Up Next: {playlistContext.title}</h4>
                <button onClick={() => setIsPlaylistOpen(false)} className="text-stone-400">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto p-2">
                {playlistContext.tracks.map((track, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (onPlaySermon) {
                        onPlaySermon({
                          ...currentSermon,
                          title: track.title,
                          audioUrl: track.url,
                        });
                      }
                      setIsPlaylistOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                      currentSermon.audioUrl === track.url ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="flex-1 truncate text-xs font-medium">{track.title}</span>
                    {currentSermon.audioUrl === track.url && (
                      <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini Player */}
        <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-brand-dark/95 p-3 text-white shadow-2xl backdrop-blur-xl">
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => playlistContext && setIsPlaylistOpen(!isPlaylistOpen)}
              className="relative group"
            >
              <img
                src={currentSermon.imageUrl}
                alt={currentSermon.title}
                className="h-12 w-12 rounded-xl object-cover shadow-lg transition-transform group-hover:scale-105"
              />
              {playlistContext && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <ListMusic size={16} />
                </div>
              )}
            </button>
            
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-bold text-xs" dangerouslySetInnerHTML={{ __html: currentSermon.title }} />
                {playlistContext && <ChevronUp size={12} className={`text-stone-500 transition-transform ${isPlaylistOpen ? 'rotate-180' : ''}`} />}
              </div>
              <p className="truncate text-[10px] text-stone-400">
                {currentSermon.categories.join(', ')}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsShuffling(!isShuffling)}
                className={`p-1.5 transition-colors ${isShuffling ? 'text-brand' : 'text-stone-500'}`}
              >
                <Shuffle size={14} />
              </button>
              <button onClick={() => skip(-10)} className="p-1.5 text-stone-300 hover:text-white transition-colors">
                <RotateCcw size={16} />
              </button>
              <button
                onClick={togglePlay}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-900 transition-transform active:scale-90 shadow-lg"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
              </button>
              <button onClick={() => skip(10)} className="p-1.5 text-stone-300 hover:text-white transition-colors">
                <RotateCw size={16} />
              </button>
              <button 
                onClick={() => setIsRepeating(!isRepeating)}
                className={`p-1.5 transition-colors ${isRepeating ? 'text-brand' : 'text-stone-500'}`}
              >
                <Repeat size={14} />
              </button>
              <button 
                onClick={onToggleBookmark}
                className={`p-1.5 transition-colors ${isBookmarked ? 'text-brand' : 'text-stone-500 hover:text-white'}`}
                title={isBookmarked ? "Remove from Bookmarks" : "Add to Bookmarks"}
              >
                <Heart size={14} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={handleDownload}
                className="p-1.5 text-stone-500 hover:text-white transition-colors"
                title="Download current track"
              >
                <Download size={14} />
              </button>
              <button onClick={onClose} className="ml-1 p-1.5 text-stone-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-2 px-1">
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute left-0 top-0 h-full bg-brand"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[9px] font-mono text-stone-500">
              <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
              <span>{formatTime(duration || 0)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
