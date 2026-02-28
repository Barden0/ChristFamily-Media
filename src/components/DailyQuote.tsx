import React from 'react';
import { Quote as QuoteIcon } from 'lucide-react';
import { Quote } from '../types';

interface DailyQuoteProps {
  quote: Quote;
}

export const DailyQuote: React.FC<DailyQuoteProps> = ({ quote }) => {
  return (
    <div className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-stone-900 p-8 text-white shadow-2xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-brand/5 blur-3xl" />
      
      <div className="relative z-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <QuoteIcon size={24} className="text-brand" fill="currentColor" />
        </div>
        
        <blockquote className="mb-8">
          <p className="font-serif text-2xl font-medium italic leading-relaxed text-stone-100">
            "{quote.content}"
          </p>
        </blockquote>
        
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
            Daily Inspiration
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>
    </div>
  );
};
