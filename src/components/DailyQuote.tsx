import React, { useState } from 'react';
import { Quote as QuoteIcon, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from '../types';

interface DailyQuoteProps {
  quote: Quote;
}

export const DailyQuote: React.FC<DailyQuoteProps> = ({ quote }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150;
  const isLong = quote.content.length > maxLength;
  const displayContent = isLong ? `${quote.content.substring(0, maxLength)}...` : quote.content;

  return (
    <>
      <div 
        onClick={() => isLong && setIsExpanded(true)}
        className={`relative mb-10 overflow-hidden rounded-[2.5rem] bg-[#142832] p-8 text-white shadow-2xl transition-all duration-500 active:scale-[0.98] ${isLong ? 'cursor-pointer' : ''}`}
      >
        {/* Modern Background Design */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#142832] via-[#1a3a4a] to-[#142832]" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-[80px] animate-pulse" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-brand-light/10 blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        
        <div className="relative z-10">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-brand-light shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-light">
                Daily Quote
              </span>
            </div>
            {isLong && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white/60 backdrop-blur-md border border-white/5">
                <Maximize2 size={10} />
                <span>Expand</span>
              </div>
            )}
          </div>
          
          <blockquote className="mb-8">
            <p className="font-quote text-xl font-medium leading-relaxed text-stone-100 sm:text-2xl">
              "{displayContent}"
            </p>
          </blockquote>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand/40 to-brand-light/20 flex items-center justify-center text-brand-light text-sm font-bold border border-white/10">
              PK
            </div>
            <div>
              <p className="text-sm font-bold text-brand-light">Prophet Pascal Kakraba</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Pastor</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[3rem] bg-[#142832] p-10 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#142832] via-[#1a3a4a] to-[#142832]" />
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-[80px]" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-brand-light/10 blur-[80px]" />
              
              <div className="relative z-10">
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-transform active:scale-90 backdrop-blur-md border border-white/10"
                >
                  <X size={20} />
                </button>

                <div className="mb-10 flex items-center gap-3">
                  <div className="h-1 w-10 rounded-full bg-brand-light shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-[0.4em] text-brand-light">
                    Daily Quote
                  </span>
                </div>

                <blockquote className="mb-10">
                  <p className="font-quote text-2xl font-medium leading-relaxed text-stone-100 sm:text-3xl">
                    "{quote.content}"
                  </p>
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-brand/40 to-brand-light/20 flex items-center justify-center text-brand-light border border-white/10">
                    <span className="font-serif text-2xl font-bold">PK</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-brand-light leading-tight">Prophet Pascal Kakraba</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30">Pastor</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
