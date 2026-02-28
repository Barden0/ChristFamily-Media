import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Clock, Disc, Music, Flame } from 'lucide-react';
import { ListeningStats } from '../services/syncService';

interface StatsModalProps {
  stats: ListeningStats;
  onClose: () => void;
  streak: number;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose, streak }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative h-[80vh] w-full max-w-md overflow-hidden rounded-[40px] bg-brand-dark text-white shadow-2xl"
      >
        {/* Background Decorative Elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -left-20 bottom-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-transform active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="flex h-full flex-col p-8 pt-16">
          <div className="mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-light/60">Your Journey ({new Date().getFullYear()})</span>
            <h2 className="font-serif text-4xl font-bold leading-tight">CFI <br />Moments</h2>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
            {/* Streak Card */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-500">
                  <Flame size={20} fill="currentColor" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">Current Streak</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{streak}</span>
                <span className="text-xl font-medium text-white/40">Days</span>
              </div>
              <p className="mt-2 text-xs text-white/40">You're on fire! Keep the momentum going.</p>
            </motion.div>

            {/* Hours Card */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/20 text-brand">
                  <Clock size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">Time Spent</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{stats.totalHours}</span>
                <span className="text-xl font-medium text-white/40">Hours</span>
              </div>
              <p className="mt-2 text-xs text-white/40">That's a lot of spiritual growth!</p>
            </motion.div>

            {/* Top Sermon */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
                  <Disc size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">Most Listened Sermon</h3>
              </div>
              {stats.topSermon ? (
                <div>
                  <p className="text-xl font-bold leading-tight">{stats.topSermon.title}</p>
                  <p className="mt-1 text-xs text-white/40">Played {stats.topSermon.count} times</p>
                </div>
              ) : (
                <p className="text-white/40 italic">Start listening to see your top sermon!</p>
              )}
            </motion.div>

            {/* Top Album */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="rounded-3xl bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-500">
                  <Music size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">Favorite Series</h3>
              </div>
              {stats.topAlbum ? (
                <div>
                  <p className="text-xl font-bold leading-tight">{stats.topAlbum.title}</p>
                  <p className="mt-1 text-xs text-white/40">Your go-to collection</p>
                </div>
              ) : (
                <p className="text-white/40 italic">Explore series to find your favorite!</p>
              )}
            </motion.div>
          </div>

          <div className="mt-6">
            <button 
              onClick={onClose}
              className="w-full rounded-2xl bg-white py-4 font-bold text-brand-dark transition-transform active:scale-95"
            >
              Keep Growing
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
