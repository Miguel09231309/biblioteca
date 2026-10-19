import React, { useState, useMemo } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book, BookGenre, Loan, Reservation } from '../types/library';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookmarkCheck,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  UserCheck,
  X,
  BookOpen,
} from 'lucide-react';
import { Book3D } from './Book3D';

interface StudentPortalProps {
  onSelectBook: (book: Book) => void;
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onSelectBook,
  onOpenAuth,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    books,
    loans,
    reservations,
    getExpectedReturnDate,
    renewLoan,
    cancelReservation,
    settings,
  } = useLibrary();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('todos');
  const [availabilityFilter, setAvailabilityFilter] = useState<'todos' | 'disponiveis' | 'indisponiveis'>('todos');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year'>('title');

  // Feedback toast
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string; isError?: boolean } | null>(null);

  const genres: BookGenre[] = [
    'Literatura Brasileira',
    'Ficção Científica',
    'Romance',
    'Fantasia',
    'Tecnologia & Computação',
    'História & Filosofia',
    'Ciências & Biologia',
    'Autoajuda & Negócios',
    'HQ & Mangá',
    'Poesia & Teatro',
  ];

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          book.title.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term) ||
          book.genre.toLowerCase().includes(term) ||
          book.isbn.toLowerCase().includes(term);

        const matchesGenre = selectedGenre === 'todos' || book.genre === selectedGenre;

        const matchesAvailability =
          availabilityFilter === 'todos' ||
          (availabilityFilter === 'disponiveis' && book.availableCopies > 0) ||
          (availabilityFilter === 'indisponiveis' && book.availableCopies === 0);

        return matchesSearch && matchesGenre && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'author') return a.author.localeCompare(b.author);
        return b.publishedYear - a.publishedYear;
      });
  }, [books, searchTerm, selectedGenre, availabilityFilter, sortBy]);

  // Current user's loans and reservations
  const userLoans = useMemo(() => {
    if (!currentUser) return [];
    return loans.filter((l) => l.userId === currentUser.id);
  }, [loans, currentUser]);

  const activeLoans = userLoans.filter((l) => l.status === 'aprovado');
  const pendingLoans = userLoans.filter((l) => l.status === 'pendente');
  const returnedLoans = userLoans.filter((l) => l.status === 'devolvido');

  const userReservations = useMemo(() => {
    if (!currentUser) return [];
    return reservations.filter((r) => r.userId === currentUser.id && r.status !== 'cancelada');
  }, [reservations, currentUser]);

  const handleRenew = (loanId: string) => {
    const res = renewLoan(loanId);
    setActionFeedback({ id: loanId, message: res.message, isError: !res.success });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const getLoanStatusInfo = (loan: Loan) => {
    if (loan.status === 'pendente') {
      return {
        label: 'Aguardando Aprovação',
        textClass: 'text-amber-800',
        icon: <Clock className="w-4 h-4 text-amber-700" />,
        description: 'Solicitação em análise na circulação.',
      };
    }

    if (loan.status === 'devolvido') {
      return {
        label: 'Devolvido',
        textClass: 'text-stone-600',
        icon: <CheckCircle2 className="w-4 h-4 text-stone-500" />,
        description: loan.returnDate
          ? `Devolvido em ${new Date(loan.returnDate).toLocaleDateString('pt-BR')}`
          : 'Devolução registrada',
      };
    }

    const now = new Date();
    const due = new Date(loan.dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        label: `Em atraso (${overdueDays} dias)`,
        textClass: 'text-rose-800 font-bold',
        icon: <AlertTriangle className="w-4 h-4 text-rose-700" />,
        description: `Prazo expirado em ${due.toLocaleDateString('pt-BR')}. Multa: R$ ${loan.fineAmount.toFixed(2)}`,
        isOverdue: true,
      };
    }

    if (diffDays <= 2) {
      return {
        label: diffDays === 0 ? 'Vence hoje!' : `Vence em ${diffDays} dia(s)`,
        textClass: 'text-amber-800 font-semibold',
        icon: <AlertTriangle className="w-4 h-4 text-amber-700" />,
        description: `Vencimento próximo: devolver até ${due.toLocaleDateString('pt-BR')}`,
        isUrgent: true,
      };
    }

    return {
      label: `Em dia (${diffDays} dias restantes)`,
      textClass: 'text-emerald-800 font-medium',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />,
      description: `Devolver até ${due.toLocaleDateString('pt-BR')}`,
    };
  };

  return (
    <div className="space-y-10 pb-20">
      
      {/* Editorial Curatorial Marquee Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-[#231810] text-[#FAF8F5] p-8 sm:p-12 border border-[#3B291C] shadow-lg">
        <div className="max-w-3xl space-y-4">
          <div className="text-xs uppercase tracking-widest text-[#C89B65] font-sans">
            Catálogo & Acervo Literário · Ano Acadêmico 2026
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#FAF8F5] leading-tight tracking-tight text-balance">
            O silêncio fecundo da leitura e a nobreza do saber.
          </h1>

          <p className="text-[#D4C5B3] text-sm sm:text-base leading-relaxed max-w-2xl">
            Consulte a disponibilidade em tempo real das obras físicas, acompanhe as previsões exatas de retorno de volumes emprestados e reserve títulos disputados para retirada rápida.
          </p>

          {currentUser && (
            <div className="pt-3 flex flex-wrap items-center gap-3 text-xs text-stone-300 border-t border-white/10">
              <span>Aluno: <strong className="text-white font-serif">{currentUser.name}</strong></span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{currentUser.registrationNumber}</span>
              <span aria-hidden="true">·</span>
              <span>Empréstimos: <strong>{activeLoans.length} de {settings.maxBooksPerStudent}</strong></span>
              {userLoans.some((l) => l.fineAmount > 0 && !l.finePaid) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-400 font-bold">Multa pendente ativa</span>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tab Navigation: Acervo vs Meus Empréstimos */}
      <div className="flex border-b border-[#E6DFC4] gap-8 text-sm font-medium">
        <button
          onClick={() => setActiveTab('acervo')}
          className={`pb-3 transition-colors relative whitespace-nowrap ${
            activeTab === 'acervo'
              ? 'text-[#1E1612] font-serif font-bold text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Explorar Acervo de Livros ({books.length})
        </button>

        <button
          onClick={() => setActiveTab('meus-emprestimos')}
          className={`pb-3 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'meus-emprestimos'
              ? 'text-[#1E1612] font-serif font-bold text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Meus Empréstimos & Reservas</span>
          {currentUser && (activeLoans.length > 0 || pendingLoans.length > 0 || userReservations.length > 0) && (
            <span className="font-mono text-xs px-1.5 py-0.2 bg-[#EFE8DC] text-[#8C531B] rounded-sm font-bold">
              {activeLoans.length + pendingLoans.length + userReservations.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: EXPLORAR ACERVO DE LIVROS */}
      {/* ========================================================= */}
      {activeTab === 'acervo' && (
        <div className="space-y-8">
          
          {/* Controls: Search, Sort and Interactive Segmented Filters */}
          <div className="bg-[#FAF8F5] p-6 rounded-xl border border-[#E6DFC4] shadow-xs space-y-5">
            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por título, autor, gênero ou código ISBN..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D5CCBE] bg-white text-sm text-[#1E1612] placeholder:text-stone-400 focus:outline-hidden focus:border-[#8C531B] focus:ring-1 focus:ring-[#8C531B]/30"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-stone-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2.5 rounded-lg border border-[#D5CCBE] bg-white text-xs sm:text-sm text-stone-700 focus:outline-hidden focus:border-[#8C531B]"
                >
                  <option value="title">Ordem Alfabética (Título A-Z)</option>
                  <option value="author">Ordenar por Autor</option>
                  <option value="year">Ano de Publicação</option>
                </select>
              </div>
            </div>

            {/* Availability Filter (Interactive Segmented Control) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E6DFC4]">
              <div className="flex items-center gap-1 p-1 bg-[#EFE8DC] rounded-lg text-xs font-medium">
                <button
                  onClick={() => setAvailabilityFilter('todos')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    availabilityFilter === 'todos'
                      ? 'bg-white text-[#1E1612] shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Todos os Livros ({books.length})
                </button>
                <button
                  onClick={() => setAvailabilityFilter('disponiveis')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    availabilityFilter === 'disponiveis'
                      ? 'bg-emerald-900 text-white shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-emerald-900'
                  }`}
                >
                  Disponíveis ({books.filter((b) => b.availableCopies > 0).length})
                </button>
                <button
                  onClick={() => setAvailabilityFilter('indisponiveis')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    availabilityFilter === 'indisponiveis'
                      ? 'bg-[#8C2424] text-white shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-rose-900'
                  }`}
                >
                  Indisponíveis c/ Previsão ({books.filter((b) => b.availableCopies === 0).length})
                </button>
              </div>

              <div className="text-xs text-stone-500 font-sans">
                Exibindo <strong>{filteredBooks.length}</strong> obras catalogadas
              </div>
            </div>

            {/* Genre Filter (Clean unboxed buttons) */}
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-sans block mb-2">
                Filtrar por Gênero ou Seção:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setSelectedGenre('todos')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    selectedGenre === 'todos'
                      ? 'bg-[#2C1D11] text-white font-medium'
                      : 'bg-white border border-[#D5CCBE] text-stone-700 hover:bg-[#EFE8DC]'
                  }`}
                >
                  Todos os Gêneros
                </button>
                {genres.map((g) => {
                  const count = books.filter((b) => b.genre === g).length;
                  return (
                    <button
                      key={g}
                      onClick={() => setSelectedGenre(g)}
                      className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                        selectedGenre === g
                          ? 'bg-[#2C1D11] text-white font-medium'
                          : 'bg-white border border-[#D5CCBE] text-stone-700 hover:bg-[#EFE8DC]'
                      }`}
                    >
                      <span>{g}</span>
                      <span className="opacity-70 font-mono text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Book Catalog Grid: Featuring the Book3D Component */}
          {filteredBooks.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E6DFC4] p-12 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-[#1E1612]">
                Nenhum título localizado
              </h3>
              <p className="text-xs text-stone-500">
                Ajuste os termos de busca ou clique abaixo para redefinir os filtros.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGenre('todos');
                  setAvailabilityFilter('todos');
                }}
                className="px-4 py-2 rounded-lg bg-[#2C1D11] text-white text-xs font-medium hover:bg-[#3D2918]"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredBooks.map((book) => {
                const isAvailable = book.availableCopies > 0;
                const expectedDate = getExpectedReturnDate(book.id);

                return (
                  <article
                    key={book.id}
                    onClick={() => onSelectBook(book)}
                    className="group bg-white rounded-xl border border-[#E6DFC4] p-4 flex flex-col justify-between hover:border-[#8C531B]/50 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
                  >
                    {/* 3D Realistic Book Display */}
                    <div className="mb-4">
                      <Book3D
                        book={book}
                        size="md"
                        isAvailable={isAvailable}
                        expectedReturnDate={expectedDate}
                      />
                    </div>

                    {/* Book Metadata & Title (Zero-Pill Discipline) */}
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Unboxed Metadata Line with typographic separators */}
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-sans">
                          <span className="text-[#8C531B] font-medium">{book.genre}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{book.publishedYear}</span>
                          <span aria-hidden="true">·</span>
                          <span>{book.pages} pág.</span>
                        </div>

                        <h3 className="font-serif font-bold text-lg text-[#1E1612] group-hover:text-[#8C531B] transition-colors line-clamp-1 mt-1">
                          {book.title}
                        </h3>

                        <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                          {book.author}
                        </p>
                      </div>

                      {/* Availability & Return Date Details */}
                      <div className="pt-3 border-t border-[#F0EAE1] text-xs">
                        {isAvailable ? (
                          <div className="flex items-center justify-between text-emerald-900 font-medium">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{book.availableCopies} exemplares na estante</span>
                            </span>
                            <span className="text-[#8C531B] group-hover:translate-x-1 transition-transform">
                              Detalhes &rarr;
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[#8C2424] font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-rose-700" />
                                <span>100% Emprestado</span>
                              </span>
                              <span className="text-stone-500 group-hover:text-[#8C531B] transition-colors">
                                Reservar &rarr;
                              </span>
                            </div>
                            {expectedDate && (
                              <p className="text-[11px] text-stone-600 font-sans">
                                Previsão de devolução:{' '}
                                <strong className="text-[#1E1612] font-mono">
                                  {new Date(expectedDate).toLocaleDateString('pt-BR')}
                                </strong>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: MEUS EMPRÉSTIMOS & RESERVAS */}
      {/* ========================================================= */}
      {activeTab === 'meus-emprestimos' && (
        <div className="space-y-8">
          {!currentUser ? (
            <div className="bg-white rounded-xl border border-[#E6DFC4] p-10 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <UserCheck className="w-10 h-10 text-[#8C531B] mx-auto" />
              <h2 className="font-serif font-bold text-xl text-[#1E1612]">
                Identifique-se como Aluno
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                Faça login com sua matrícula para acompanhar seus prazos de devolução, renovar livros online e ver a fila de suas reservas.
              </p>
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-lg bg-[#2C1D11] hover:bg-[#3D2918] text-white font-medium text-xs shadow-xs"
              >
                Entrar ou Cadastrar Aluno
              </button>
            </div>
          ) : (
            <>
              {/* Profile Card Header */}
              <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-14 h-14 rounded-full object-cover border border-[#D5CCBE]"
                  />
                  <div>
                    <h2 className="font-serif font-bold text-xl text-[#1E1612]">
                      {currentUser.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-stone-600 mt-0.5">
                      <span className="font-mono text-[#8C531B] font-semibold">{currentUser.registrationNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{currentUser.courseOrDepartment}</span>
                      <span aria-hidden="true">·</span>
                      <span>{currentUser.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-stone-700">
                  <div>
                    <span className="block text-[11px] text-stone-500 uppercase tracking-wider font-sans">Empréstimos</span>
                    <span className="font-serif font-bold text-lg text-[#1E1612] tabular-nums">
                      {activeLoans.length} / {settings.maxBooksPerStudent}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-stone-500 uppercase tracking-wider font-sans">Reservas</span>
                    <span className="font-serif font-bold text-lg text-[#8C531B] tabular-nums">
                      {userReservations.length}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-stone-500 uppercase tracking-wider font-sans">Multas Pendentes</span>
                    <span className="font-serif font-bold text-lg text-rose-700 tabular-nums">
                      R$ {userLoans.filter((l) => !l.finePaid).reduce((acc, l) => acc + l.fineAmount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback toast */}
              {actionFeedback && (
                <div
                  className={`p-3.5 rounded-lg text-xs flex items-center justify-between ${
                    actionFeedback.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="font-medium">{actionFeedback.message}</span>
                  <button onClick={() => setActionFeedback(null)} className="underline text-xs">
                    Fechar
                  </button>
                </div>
              )}

              {/* Active Loans Section */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#1E1612]">
                  Livros em Posse Ativa ({activeLoans.length})
                </h3>

                {activeLoans.length === 0 ? (
                  <div className="p-8 rounded-xl bg-white border border-[#E6DFC4] text-center text-xs text-stone-500">
                    Nenhum livro retirado no momento. Navegue pelo acervo e solicite sua próxima leitura.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLoans.map((loan) => {
                      const statusInfo = getLoanStatusInfo(loan);
                      return (
                        <div
                          key={loan.id}
                          className="bg-white rounded-xl border border-[#E6DFC4] p-4 flex gap-4 hover:border-[#8C531B]/40 transition-colors shadow-xs"
                        >
                          <div className="w-20 shrink-0">
                            <img
                              src={loan.bookCover}
                              alt={loan.bookTitle}
                              className="w-full aspect-[2/3] object-cover rounded-md border border-stone-200 shadow-xs"
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-serif font-bold text-base text-[#1E1612] leading-snug">
                                  {loan.bookTitle}
                                </h4>
                              </div>

                              <div className="mt-1 flex items-center gap-1.5 text-xs">
                                {statusInfo.icon}
                                <span className={statusInfo.textClass}>{statusInfo.label}</span>
                              </div>

                              <p className="text-xs text-stone-600 mt-1">
                                {statusInfo.description}
                              </p>

                              <div className="mt-2 text-[11px] text-stone-500 font-sans space-y-0.5">
                                <div>Retirado em: {new Date(loan.requestDate).toLocaleDateString('pt-BR')}</div>
                                <div>Renovações: {loan.renewalsCount} de {settings.maxRenewalsAllowed} utilizadas</div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                              {loan.fineAmount > 0 && !loan.finePaid ? (
                                <span className="text-xs font-bold text-rose-700">
                                  Multa: R$ {loan.fineAmount.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-[11px] text-emerald-800 font-medium">
                                  Sem multas
                                </span>
                              )}

                              <button
                                onClick={() => handleRenew(loan.id)}
                                disabled={loan.renewalsCount >= settings.maxRenewalsAllowed}
                                className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D5CCBE] hover:bg-[#EFE8DC] text-[#1E1612] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Renovar Empréstimo</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pending Approvals */}
              {pendingLoans.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-base text-[#1E1612]">
                    Solicitações Aguardando Aprovação no Balcão ({pendingLoans.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingLoans.map((loan) => (
                      <div
                        key={loan.id}
                        className="bg-[#FAF8F5] rounded-xl border border-amber-300 p-4 flex gap-4 items-center"
                      >
                        <img
                          src={loan.bookCover}
                          alt={loan.bookTitle}
                          className="w-14 h-20 object-cover rounded-md border border-stone-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-bold text-sm text-[#1E1612] truncate">
                            {loan.bookTitle}
                          </h4>
                          <span className="text-xs text-amber-900 font-medium block mt-0.5">
                            Em análise pela bibliotecária
                          </span>
                          <span className="text-[11px] text-stone-500 font-sans block mt-1">
                            Solicitado em {new Date(loan.requestDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Reservations */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#1E1612]">
                  Reservas Online em Fila de Espera ({userReservations.length})
                </h3>

                {userReservations.length === 0 ? (
                  <div className="p-6 rounded-xl bg-white border border-[#E6DFC4] text-center text-xs text-stone-500">
                    Você não possui reservas no momento. Se um livro estiver emprestado, use o botão "Reservar" na página da obra.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userReservations.map((res) => (
                      <div
                        key={res.id}
                        className={`rounded-xl border p-4 flex gap-4 ${
                          res.status === 'disponivel_retirada'
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-white border-[#E6DFC4]'
                        }`}
                      >
                        <img
                          src={res.bookCover}
                          alt={res.bookTitle}
                          className="w-16 h-24 object-cover rounded-md border border-stone-200"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-serif font-bold text-sm text-[#1E1612]">
                              {res.bookTitle}
                            </h4>

                            {res.status === 'disponivel_retirada' ? (
                              <div className="mt-2 text-xs text-emerald-900 font-semibold">
                                ✓ LIVRO DISPONÍVEL NO BALCÃO!
                                <span className="block text-[11px] font-normal text-emerald-800">
                                  Retire até {res.availableUntil ? new Date(res.availableUntil).toLocaleDateString('pt-BR') : '48 horas'}
                                </span>
                              </div>
                            ) : (
                              <div className="mt-1 text-xs text-stone-600 space-y-0.5">
                                <p>Posição na fila: <strong className="text-[#8C531B]">{res.queuePosition}º lugar</strong></p>
                                <p>Previsão: {new Date(res.expectedAvailableDate).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => cancelReservation(res.id)}
                              className="text-xs text-rose-700 hover:underline font-medium"
                            >
                              Cancelar Reserva
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History */}
              {returnedLoans.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#E6DFC4]">
                  <h3 className="font-serif font-bold text-base text-[#1E1612]">
                    Histórico de Leituras Concluídas
                  </h3>
                  <div className="divide-y divide-[#E6DFC4]/50 bg-white rounded-xl border border-[#E6DFC4] overflow-hidden text-xs">
                    {returnedLoans.map((l) => (
                      <div key={l.id} className="p-3.5 flex items-center justify-between hover:bg-stone-50">
                        <div>
                          <p className="font-serif font-bold text-[#1E1612] text-sm">{l.bookTitle}</p>
                          <span className="text-[11px] text-stone-500">
                            Entregue em {l.returnDate ? new Date(l.returnDate).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                        <span className="text-emerald-800 font-medium text-xs">
                          Devolução Concluída
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
