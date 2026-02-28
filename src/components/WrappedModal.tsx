import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music, Disc, Clock, Trophy, Share2, Sparkles, Flame, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface WrappedData {
  totalHours: number;
  totalMinutes: number;
  streakCount: number;
  topSermon: string;
  topAlbum: string;
  topMusic: string;
}

interface WrappedModalProps {
  onClose: () => void;
}

export const WrappedModal: React.FC<WrappedModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (user) {
      fetch(`/api/user/${user.id}/wrapped`)
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/90 p-4 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-brand p-8 text-white shadow-2xl hide-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
        >
          <X size={20} />
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">CFI Moments</h2>
            <p className="text-xs font-medium opacity-70 uppercase tracking-widest">{currentYear}</p>
          </div>
        </div>

        {!user ? (
          <div className="py-20 text-center">
            <p className="text-lg font-bold">Sign in to see your moments!</p>
            <p className="mt-2 text-sm opacity-70">We need an account to track your faith journey across devices.</p>
          </div>
        ) : loading ? (
          <div className="flex py-20 justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/10 p-5">
                <Clock size={18} className="mb-3 text-white/60" />
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Time Spent</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{data.totalMinutes}</span>
                  <span className="text-xs opacity-60">mins</span>
                </div>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <Flame size={18} className="mb-3 text-white/60" />
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Streak</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{data.streakCount}</span>
                  <span className="text-xs opacity-60">days</span>
                </div>
              </div>
            </div>

            {/* Top Items */}
            <div className="space-y-4">
              <div className="rounded-3xl bg-white/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Disc size={18} className="text-white/60" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Most Listened Sermon</h3>
                </div>
                <p className="text-lg font-bold leading-tight" dangerouslySetInnerHTML={{ __html: data.topSermon }} />
              </div>

              <div className="rounded-3xl bg-white/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Music size={18} className="text-white/60" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Most Listened Music</h3>
                </div>
                <p className="text-lg font-bold leading-tight" dangerouslySetInnerHTML={{ __html: data.topMusic }} />
              </div>

              <div className="rounded-3xl bg-white/10 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Library size={18} className="text-white/60" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-60">Most Listened Album/Series</h3>
                </div>
                <p className="text-lg font-bold leading-tight">{data.topAlbum}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-3xl bg-brand-dark/30 p-6">
              <div className="flex items-center gap-3">
                <Trophy size={24} className="text-yellow-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Status</p>
                  <p className="text-lg font-bold">Faithful Disciple</p>
                </div>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="opacity-70">Start listening to see your moments!</p>
          </div>
        )}

        <button 
          onClick={onClose}
          className="mt-8 w-full rounded-2xl bg-white py-4 font-bold text-brand shadow-lg shadow-black/10 transition-transform active:scale-95"
        >
          Keep Growing
        </button>
      </motion.div>
    </motion.div>
  );
};
