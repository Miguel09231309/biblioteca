import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { X, BookCheck, User as UserIcon, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

interface DirectLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBookId?: string;
}

export const DirectLoanModal: React.FC<DirectLoanModalProps> = ({
  isOpen,
  onClose,
  preselectedBookId,
}) => {
  const { users, books, directIssueLoan, settings } = useLibrary();

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(preselectedBookId || '');
  const [feedback, setFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const students = users.filter((u) => u.role === 'aluno');
  const availableBooks = books.filter((b) => b.availableCopies > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedStudentId || !selectedBookId) {
      setFeedback({ isError: true, message: 'Selecione o aluno e o livro.' });
      return;
    }

    const res = directIssueLoan(selectedBookId, selectedStudentId);
    if (res.success) {
      setFeedback({ isError: false, message: res.message });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setFeedback({ isError: true, message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E6DFC4] w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6DFC4] bg-[#2C1D11] text-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookCheck className="w-5 h-5 text-[#C89B65]" />
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Empréstimo Rápido de Balcão</h3>
              <p className="text-xs text-stone-300">
                Registrar retirada física presencial para um aluno cadastrado
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {feedback && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 ${
                feedback.isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {feedback.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Selecionar Aluno Cadastrado *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Selecione o aluno...</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id} disabled={st.isBlocked}>
                    {st.name} ({st.registrationNumber}) {st.isBlocked ? ' - [BLOQUEADO]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Selecionar Livro do Acervo *
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
              <select
                required
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Selecione o livro...</option>
                {availableBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} - {b.author} ({b.availableCopies} disponíveis)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            Prazo configurado: <strong>{settings.standardLoanDays} dias corridos</strong> para a devolução.
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-md transition-colors"
            >
              Emitir Empréstimo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
