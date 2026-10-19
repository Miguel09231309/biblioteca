import React, { useState } from 'react';
import { Book } from '../types/library';
import { BookOpen } from 'lucide-react';

interface Book3DProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
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
  }[size];

  // Colors according to book genre
  const genreAccents: Record<string, { spine: string; bookmark: string; texture: string }> = {
    'Literatura Brasileira': { spine: 'bg-emerald-950', bookmark: 'bg-emerald-700', texture: 'from-emerald-900 to-amber-950' },
    'Ficção Científica': { spine: 'bg-slate-950', bookmark: 'bg-indigo-700', texture: 'from-indigo-950 to-slate-950' },
    'Romance': { spine: 'bg-rose-950', bookmark: 'bg-rose-700', texture: 'from-rose-950 to-stone-900' },
    'Fantasia': { spine: 'bg-amber-950', bookmark: 'bg-amber-700', texture: 'from-amber-950 to-stone-900' },
    'Tecnologia & Computação': { spine: 'bg-cyan-950', bookmark: 'bg-cyan-700', texture: 'from-cyan-950 to-slate-900' },
    'História & Filosofia': { spine: 'bg-stone-900', bookmark: 'bg-stone-700', texture: 'from-stone-900 to-amber-950' },
    'Ciências & Biologia': { spine: 'bg-teal-950', bookmark: 'bg-teal-700', texture: 'from-teal-950 to-emerald-950' },
    'HQ & Mangá': { spine: 'bg-violet-950', bookmark: 'bg-violet-700', texture: 'from-violet-950 to-stone-900' },
    'Poesia & Teatro': { spine: 'bg-amber-900', bookmark: 'bg-amber-600', texture: 'from-amber-900 to-stone-950' },
    'Autoajuda & Negócios': { spine: 'bg-blue-950', bookmark: 'bg-blue-700', texture: 'from-blue-950 to-slate-900' },
  };

  const accent = genreAccents[book.genre] || {
    spine: 'bg-stone-900',
    bookmark: 'bg-amber-700',
    texture: 'from-stone-900 to-amber-950',
  };

  return (
    <div
      onClick={onClick}
      className={`relative group perspective-1000 cursor-pointer ${className}`}
    >
      {/* Container with 3D hover tilt */}
      <div
        className={`relative ${sizeClasses} rounded-r-lg rounded-l-xs overflow-hidden transition-all duration-300 ease-out transform group-hover:-translate-y-1.5 group-hover:rotate-y-[-6deg] shadow-lg group-hover:shadow-2xl`}
        style={{
          boxShadow: '4px 8px 20px -3px rgba(28, 22, 18, 0.28), 0 2px 6px -1px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Book Spine Crease Effect (left side shading) */}
        <div className="absolute left-0 top-0 bottom-0 w-3 z-20 pointer-events-none bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
        <div className="absolute left-2.5 top-0 bottom-0 w-px z-20 pointer-events-none bg-white/20" />

        {/* Paper Page Edge Layers (right & bottom side realistic 3D physical book paper thickness) */}
        <div className="absolute right-0 top-1 bottom-1 w-1.5 z-10 bg-gradient-to-l from-[#FAF7F0] via-[#E8E1D5] to-[#D5CCBE] border-l border-black/15 shadow-inner" />
        <div className="absolute left-1 right-0 bottom-0 h-1 z-10 bg-gradient-to-t from-[#E2D8C7] to-[#F5EFE4] border-t border-black/10" />

        {/* Cover Image or Styled Fallback */}
        {!imageError ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${accent.texture} p-4 flex flex-col justify-between text-white relative`}
          >
            <div className="border border-white/20 p-3 h-full flex flex-col justify-between rounded-sm">
              <span className="text-[10px] uppercase tracking-widest text-amber-200 font-sans block text-center">
                {book.genre}
              </span>

              <div className="text-center my-auto">
                <BookOpen className="w-6 h-6 text-amber-300/80 mx-auto mb-2" />
                <h4 className="font-serif font-bold text-sm leading-tight text-white drop-shadow-sm line-clamp-3">
                  {book.title}
                </h4>
                <p className="text-[11px] text-stone-300 font-medium mt-1">
                  {book.author}
                </p>
              </div>

              <div className="text-center border-t border-white/10 pt-2 text-[9px] text-stone-400 font-mono">
                {book.publisher}
              </div>
            </div>
          </div>
        )}

        {/* Subtle cloth texture lighting sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/15 pointer-events-none z-10" />

        {/* Availability Seal / Status Ribbon (Physical bookmark feel) */}
        {size !== 'sm' && (
          <div className="absolute top-0 right-3 z-30 pointer-events-none">
            {isAvailable ? (
              <div className="bg-emerald-800 text-emerald-100 text-[10px] font-sans font-bold px-2 py-1 shadow-md rounded-b-xs border-b border-x border-emerald-950 flex items-center gap-1">
                <span>Disponível</span>
                <span className="opacity-90 font-mono">({book.availableCopies})</span>
              </div>
            ) : (
              <div className="bg-[#8C2424] text-rose-100 text-[10px] font-sans font-bold px-2 py-1 shadow-md rounded-b-xs border-b border-x border-rose-950 flex flex-col items-center">
                <span>Emprestado</span>
                {expectedReturnDate && (
                  <span className="text-[8px] font-normal text-rose-200 mt-0.2">
                    Retorno {new Date(expectedReturnDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
