import React, { useState, useEffect } from 'react';
import { Book } from '../types/library';
import { Book3D } from './Book3D';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface FeaturedCarouselProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  getExpectedReturnDate: (bookId: string) => string | null;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  books,
  onSelectBook,
  getExpectedReturnDate,
}) => {
  // Select top 5 featured books
  const featuredBooks = books.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto rotation every 6 seconds if not paused
  useEffect(() => {
    if (isPaused || featuredBooks.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredBooks.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, featuredBooks.length]);

  if (featuredBooks.length === 0) return null;

  const currentBook = featuredBooks[currentIndex];
  const isAvailable = currentBook.availableCopies > 0;
  const returnDate = !isAvailable ? getExpectedReturnDate(currentBook.id) : null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredBooks.length) % featuredBooks.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredBooks.length);
  };

  const badges = [
    'Obra do Mês · Seleção da Curadoria',
    'Mais Solicitado do Acervo',
    'Clássico Universal Obrigatório',
    'Destaque de Ficção & Filosofia',
    'Tesouro do Acervo Raro',
  ];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative rounded-2xl bg-gradient-to-br from-[#380E14] via-[#4A121A] to-[#1F070A] border border-[#6B1E29]/60 shadow-2xl overflow-hidden text-white transition-all"
    >
      {/* Decorative Warm Lighting Spotlight Behind Book */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#C99757]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#681A24]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Main Content Showcase Layout */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Book Details & Synopsis (7 columns) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Top Curatorial Badge */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#C99757]/20 border border-[#C99757]/40 text-[#E5B869] text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#E5B869]" />
                <span>{badges[currentIndex % badges.length]}</span>
              </span>
              <span className="text-xs font-mono text-stone-300">
                {currentBook.genre}
              </span>
            </div>

            {/* Title & Author */}
            <div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                {currentBook.title}
              </h2>
              <p className="text-base sm:text-lg text-[#E5B869] font-serif italic mt-1.5">
                por {currentBook.author} · {currentBook.publishedYear}
              </p>
            </div>

            {/* Synopsis */}
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-xl line-clamp-3 sm:line-clamp-4 font-sans">
              {currentBook.synopsis || 'Obra fundamental de nosso acervo físico com encadernação nobre disponível para pesquisa e empréstimo.'}
            </p>

            {/* Metadata Badges Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-lg">
                <span className="text-stone-300 text-[10px] block">Localização</span>
                <strong className="text-white text-xs truncate block">{currentBook.location}</strong>
              </div>
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-lg">
                <span className="text-stone-300 text-[10px] block">Exemplares</span>
                <strong className={isAvailable ? 'text-emerald-400 text-xs' : 'text-rose-300 text-xs'}>
                  {isAvailable ? `${currentBook.availableCopies} de ${currentBook.totalCopies} livres` : '0 disponíveis'}
                </strong>
              </div>
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-lg col-span-2 sm:col-span-1">
                <span className="text-stone-300 text-[10px] block">Páginas / ISBN</span>
                <strong className="text-white text-xs">{currentBook.pages} págs</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onSelectBook(currentBook)}
                className="px-5 py-3 rounded-xl bg-[#C99757] hover:bg-[#DFB275] text-[#24080D] font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 group"
              >
                <span>{isAvailable ? 'Solicitar Empréstimo' : 'Entrar na Fila de Reserva'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onSelectBook(currentBook)}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-colors"
              >
                Ver Ficha Completa
              </button>

              {!isAvailable && returnDate && (
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Previsão de devolução: {new Date(returnDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Prominent 3D Book Presentation (5 columns) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative py-4">
              {/* Highlight Aura */}
              <div className="absolute inset-0 bg-[#C99757]/20 rounded-full blur-2xl transform scale-90 pointer-events-none" />

              {/* 3D Book with larger prominence */}
              <Book3D
                book={currentBook}
                size="lg"
                isAvailable={isAvailable}
                expectedReturnDate={returnDate}
                onClick={() => onSelectBook(currentBook)}
                className="transform transition-transform hover:scale-105 duration-300"
              />

              <div className="text-center mt-3 text-[11px] font-mono text-[#E5B869]/80">
                Toque na capa para abrir detalhes
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Footer: Controls and Pagination */}
        <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between gap-4">
          
          {/* Left: Indicator Counter */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#E5B869] font-bold">
              0{currentIndex + 1} <span className="text-stone-400">/ 0{featuredBooks.length}</span>
            </span>
            <div className="hidden sm:flex items-center gap-1.5">
              {featuredBooks.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-6 bg-[#C99757]'
                      : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Ir para obra ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Previous / Next Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              title="Obra anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              title="Próxima obra"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
