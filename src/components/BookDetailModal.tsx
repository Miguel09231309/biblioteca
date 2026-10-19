import React, { useState } from 'react';
import { Book } from '../types/library';
import { useLibrary } from '../context/LibraryContext';
import {
  X,
  Calendar,
  BookOpen,
  MapPin,
  CheckCircle2,
  Clock,
  BookmarkCheck,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Book3D } from './Book3D';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose, onOpenAuth }) => {
  const {
    currentUser,
    getExpectedReturnDate,
    requestLoan,
    reserveBook,
    loans,
    reservations,
    settings,
  } = useLibrary();

  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!book) return null;

  const isAvailable = book.availableCopies > 0;
  const expectedReturnDate = getExpectedReturnDate(book.id);

  const userActiveLoan = currentUser
    ? loans.find(
        (l) => l.bookId === book.id && l.userId === currentUser.id && (l.status === 'aprovado' || l.status === 'pendente')
      )
    : null;

  const userActiveReservation = currentUser
    ? reservations.find(
        (r) => r.bookId === book.id && r.userId === currentUser.id && (r.status === 'ativa' || r.status === 'disponivel_retirada')
      )
    : null;

  const handleBorrowRequest = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const res = requestLoan(book.id, notes);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setNotes('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleReservation = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const res = reserveBook(book.id);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E6DFC4] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E6DFC4] flex items-center justify-between bg-[#F4EFE6]">
          <div className="flex items-center gap-2 text-xs font-sans text-stone-600">
            <span className="font-semibold text-[#8C531B]">{book.genre}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">ISBN: {book.isbn}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* 3D Book Display */}
            <div className="w-full sm:w-52 shrink-0">
              <Book3D
                book={book}
                size="lg"
                isAvailable={isAvailable}
                expectedReturnDate={expectedReturnDate}
              />

              <div className="mt-4 p-3 rounded-lg bg-[#EFE8DC]/70 border border-[#D5CCBE] text-xs text-stone-700 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#8C531B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-[#1E1612]">Localização física:</span>
                  <span>{book.location}</span>
                </div>
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1612] leading-tight">
                  {book.title}
                </h2>
                <p className="text-sm font-medium text-stone-600 mt-1">
                  Autor(a): <span className="text-[#1E1612] font-semibold">{book.author}</span>
                </p>
              </div>

              {/* Availability Box */}
              <div
                className={`p-4 rounded-xl border ${
                  isAvailable
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {isAvailable ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Exemplar disponível para retirada imediata</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Exemplar indisponível no momento</span>
                    </>
                  )}
                </div>

                <div className="mt-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Total no acervo:</span>
                    <span className="font-semibold">{book.totalCopies} cópias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Disponíveis na estante:</span>
                    <span className="font-bold font-mono text-[#1E1612]">{book.availableCopies}</span>
                  </div>

                  {!isAvailable && expectedReturnDate && (
                    <div className="pt-2 mt-2 border-t border-amber-200 flex items-center justify-between text-amber-950 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-800" />
                        Previsão de Devolução:
                      </span>
                      <strong className="font-mono bg-amber-200 px-2 py-0.5 rounded-sm">
                        {new Date(expectedReturnDate).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata definition list */}
              <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                <div className="p-2.5 rounded-lg bg-white border border-[#E6DFC4]">
                  <span className="text-stone-500 block text-[10px] uppercase">Publicação</span>
                  <span className="font-bold text-[#1E1612]">{book.publishedYear}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#E6DFC4]">
                  <span className="text-stone-500 block text-[10px] uppercase">Editora</span>
                  <span className="font-bold text-[#1E1612] truncate block">{book.publisher}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#E6DFC4]">
                  <span className="text-stone-500 block text-[10px] uppercase">Páginas</span>
                  <span className="font-bold text-[#1E1612]">{book.pages} páginas</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#E6DFC4]">
                  <span className="text-stone-500 block text-[10px] uppercase">Prazo Padrão</span>
                  <span className="font-bold text-[#1E1612]">{settings.standardLoanDays} dias</span>
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  Sinopse Curatorial
                </h4>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-white p-3.5 rounded-lg border border-[#E6DFC4]">
                  {book.synopsis}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium'
                  : 'bg-rose-50 border border-rose-300 text-rose-950 font-medium'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Action Area */}
          <div className="pt-4 border-t border-[#E6DFC4]">
            {!currentUser ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#EFE8DC] rounded-xl border border-[#D5CCBE]">
                <p className="text-xs text-stone-800">
                  Para solicitar o empréstimo deste livro ou entrar na fila de reservas, identifique-se como aluno.
                </p>
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-lg bg-[#2C1D11] hover:bg-[#3D2918] text-white font-medium text-xs shrink-0"
                >
                  Entrar / Cadastrar
                </button>
              </div>
            ) : currentUser.role === 'bibliotecaria' ? (
              <div className="p-3 bg-stone-100 rounded-lg text-xs text-stone-600">
                Visualizando como <strong>Bibliotecária</strong>. Use o Painel Administrativo para alterar exemplares físicos ou emitir empréstimos de balcão.
              </div>
            ) : userActiveLoan ? (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Você já possui esta obra em andamento!
                </p>
                <p className="mt-1 text-blue-800">
                  Status: <strong>{userActiveLoan.status.toUpperCase()}</strong>. Vencimento: {new Date(userActiveLoan.dueDate).toLocaleDateString('pt-BR')}.
                </p>
              </div>
            ) : userActiveReservation ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-amber-700" />
                  Você já reservou esta obra!
                </p>
                <p className="mt-1 text-amber-800">
                  Status: <strong>{userActiveReservation.status === 'disponivel_retirada' ? 'DISPONÍVEL PARA RETIRADA NO BALCÃO' : `Posição ${userActiveReservation.queuePosition} na fila`}</strong>.
                </p>
              </div>
            ) : isAvailable ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observação opcional para a bibliotecária..."
                  className="w-full px-3 py-2 text-xs border border-[#D5CCBE] bg-white rounded-lg focus:outline-hidden focus:border-[#8C531B]"
                />
                <button
                  onClick={handleBorrowRequest}
                  className="w-full py-3 px-4 rounded-lg bg-[#2C1D11] hover:bg-[#3D2918] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Solicitar Empréstimo ({settings.standardLoanDays} dias de prazo)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  Todos os exemplares estão emprestados. Você pode fazer a <strong>Reserva Online</strong>. Assim que for devolvido por outro aluno, guardamos por 48h para você no balcão e emitimos um alerta automático.
                </div>
                <button
                  onClick={handleReservation}
                  className="w-full py-3 px-4 rounded-lg bg-[#8C531B] hover:bg-[#724114] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Reservar Obra na Fila Online</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
