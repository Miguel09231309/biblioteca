import React, { useState } from 'react';
import { Book } from '../types/library';
import { BookOpen } from 'lucide-react';

interface Book3DProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isAvailable: boolean;
  expectedReturnDate?: string | null;
  className?: string;
  onClick?: () => void;
}

export const Book3D: React.FC<Book3DProps> = ({
  book,
  size = 'md',
  isAvailable,
  expectedReturnDate,
  className = '',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  // Size dimensions
  const sizeClasses = {
    sm: 'w-24 h-36',
    md: 'w-full aspect-[2/3]',
    lg: 'w-48 sm:w-56 aspect-[2/3]',
    xl: 'w-60 sm:w-72 aspect-[2/3]',
  }[size];

  // Wine / Bordeaux & Noble themes for fallback procedural covers
  const genreAccents: Record<string, { bg: string; border: string; goldText: string }> = {
    'Literatura Brasileira': { bg: 'from-[#4A121A] via-[#5C1620] to-[#2D0B10]', border: 'border-[#C99757]', goldText: 'text-[#E5B869]' },
    'Ficção Científica': { bg: 'from-[#2D142C] via-[#3E163B] to-[#1A0A19]', border: 'border-[#C99757]', goldText: 'text-[#E5B869]' },
    'Romance': { bg: 'from-[#541212] via-[#661616] to-[#360808]', border: 'border-[#E0A96D]', goldText: 'text-[#F3CCA0]' },
    'Fantasia': { bg: 'from-[#3A141A] via-[#4D1A22] to-[#240A0F]', border: 'border-[#C99757]', goldText: 'text-[#E5B869]' },
    'Tecnologia & Computação': { bg: 'from-[#1B1B2F] via-[#24243E] to-[#121220]', border: 'border-[#9FA8DA]', goldText: 'text-[#C5CAE9]' },
    'História & Filosofia': { bg: 'from-[#3E1D13] via-[#4F2518] to-[#26100A]', border: 'border-[#D4AF37]', goldText: 'text-[#F4D06F]' },
    'Ciências & Biologia': { bg: 'from-[#1B3022] via-[#24422E] to-[#101D14]', border: 'border-[#A3C9A8]', goldText: 'text-[#C8E6C9]' },
    'HQ & Mangá': { bg: 'from-[#3D1326] via-[#4E1831] to-[#260A17]', border: 'border-[#FFB7B2]', goldText: 'text-[#FFDAC1]' },
    'Poesia & Teatro': { bg: 'from-[#4A1525] via-[#5A1B2E] to-[#2C0A15]', border: 'border-[#E5B869]', goldText: 'text-[#FDE2B8]' },
    'Autoajuda & Negócios': { bg: 'from-[#1A2634] via-[#223245] to-[#101821]', border: 'border-[#B0BEC5]', goldText: 'text-[#ECEFF1]' },
  };

  const accent = genreAccents[book.genre] || {
    bg: 'from-[#4A121A] via-[#5C1620] to-[#2D0B10]',
    border: 'border-[#C99757]',
    goldText: 'text-[#E5B869]',
  };

  return (
    <div
      onClick={onClick}
      className={`relative group perspective-1000 cursor-pointer ${className}`}
    >
      {/* 3D Physical Book Container with perspective */}
      <div
        className={`relative ${sizeClasses} rounded-r-md rounded-l-xs overflow-hidden transition-all duration-300 ease-out transform group-hover:-translate-y-1.5 group-hover:rotate-y-[-6deg] shadow-lg group-hover:shadow-2xl`}
        style={{
          boxShadow: '4px 8px 24px -2px rgba(45, 11, 16, 0.35), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Book Spine Crease Effect (left side shadow) */}
        <div className="absolute left-0 top-0 bottom-0 w-3 z-20 pointer-events-none bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
        <div className="absolute left-2.5 top-0 bottom-0 w-px z-20 pointer-events-none bg-white/25" />

        {/* Paper Page Edge Layers (right & bottom side realistic 3D paper thickness) */}
        <div className="absolute right-0 top-1 bottom-1 w-1.5 z-10 bg-gradient-to-l from-[#FAF7F0] via-[#EAE1D2] to-[#D5C7B4] border-l border-black/15 shadow-inner" />
        <div className="absolute left-1 right-0 bottom-0 h-1 z-10 bg-gradient-to-t from-[#E2D4BF] to-[#F5EFE4] border-t border-black/10" />

        {/* Cover Image OR Ornate Procedural Cover Fallback */}
        {!imageError && book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none"
            loading="lazy"
          />
        ) : (
          /* Procedural Classical Book Cover (Zero broken images guaranteed) */
          <div
            className={`w-full h-full bg-gradient-to-br ${accent.bg} p-3.5 sm:p-4 flex flex-col justify-between text-white relative select-none`}
          >
            {/* Double Ornamental Filigree Border */}
            <div className={`border-2 ${accent.border}/60 p-2.5 h-full flex flex-col justify-between rounded-xs relative`}>
              {/* Corner Ornaments */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#C99757]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#C99757]" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#C99757]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#C99757]" />

              {/* Genre Banner */}
              <div className="text-center pt-1">
                <span className={`text-[9px] uppercase tracking-widest font-mono font-bold ${accent.goldText} block truncate px-1`}>
                  {book.genre}
                </span>
                <div className="w-8 h-px bg-[#C99757]/40 mx-auto mt-1" />
              </div>

              {/* Title & Author */}
              <div className="text-center my-auto px-1">
                <BookOpen className={`w-5 h-5 ${accent.goldText} mx-auto mb-2 opacity-80`} />
                <h4 className="font-serif font-bold text-xs sm:text-sm leading-snug text-white drop-shadow-md line-clamp-3">
                  {book.title}
                </h4>
                <div className="w-6 h-px bg-[#C99757]/40 mx-auto my-1.5" />
                <p className={`text-[10px] sm:text-[11px] font-sans font-medium text-stone-200 line-clamp-1`}>
                  {book.author}
                </p>
              </div>

              {/* Publication Info Footnote */}
              <div className="text-center border-t border-white/10 pt-1.5 text-[8px] font-mono text-stone-300">
                {book.publishedYear} · {book.publisher || 'Edição Acadêmica'}
              </div>
            </div>
          </div>
        )}

        {/* Subtle cloth lighting sheen overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/15 pointer-events-none z-10" />

        {/* Availability Status Ribbon (Top Right) */}
        {size !== 'sm' && (
          <div className="absolute top-0 right-2.5 z-30 pointer-events-none">
            {isAvailable ? (
              <div className="bg-emerald-800 text-emerald-100 text-[9px] font-sans font-bold px-2 py-0.5 shadow-md rounded-b-xs border-b border-x border-emerald-950 flex items-center gap-1">
                <span>Disponível</span>
                <span className="opacity-90 font-mono">({book.availableCopies})</span>
              </div>
            ) : (
              <div className="bg-[#6B1724] text-rose-100 text-[9px] font-sans font-bold px-2 py-0.5 shadow-md rounded-b-xs border-b border-x border-[#4A101A] flex flex-col items-center">
                <span>Emprestado</span>
                {expectedReturnDate && (
                  <span className="text-[7.5px] font-normal text-rose-200 font-mono">
                    {new Date(expectedReturnDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
