import React, { useState, useMemo } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book, Loan, User, SqlQueryResult } from '../types/library';
import {
  BookPlus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  FileText,
  DollarSign,
  Users,
  Settings as SettingsIcon,
  Download,
  Upload,
  RefreshCw,
  Edit,
  Trash2,
  PieChart,
  TrendingUp,
  Inbox,
  Layers,
  Archive,
  Database,
  Terminal,
  Play,
  Copy,
  Check,
} from 'lucide-react';
import { BookFormModal } from './BookFormModal';
import { DirectLoanModal } from './DirectLoanModal';
import { Book3D } from './Book3D';
import { MySqlConsole } from './MySqlConsole';

interface LibrarianPortalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBookDetail: (book: Book) => void;
}

export const LibrarianPortal: React.FC<LibrarianPortalProps> = ({
  activeTab,
  setActiveTab,
  onOpenBookDetail,
}) => {
  const {
    books,
    loans,
    users,
    settings,
    approveLoan,
    rejectLoan,
    returnBook,
    deleteBook,
    toggleBlockUser,
    updateSettings,
    resetToDefaultData,
    exportDatabaseJson,
    importDatabaseJson,
    exportSqlDump,
    executeSql,
    getNeverBorrowedBooks,
    getMonthlyStats,
    getExpectedReturnDate,
  } = useLibrary();

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [isDirectLoanModalOpen, setIsDirectLoanModalOpen] = useState(false);

  // Filters
  const [invSearch, setInvSearch] = useState('');
  const [invAvailability, setInvAvailability] = useState<'todos' | 'disponiveis' | 'indisponiveis'>('todos');
  const [invGenre, setInvGenre] = useState<string>('todos');
  const [circSearch, setCircSearch] = useState('');

  // Return modal
  const [returningLoan, setReturningLoan] = useState<Loan | null>(null);
  const [returnFinePaid, setReturnFinePaid] = useState(true);
  const [returnNotes, setReturnNotes] = useState('');

  // Reject modal
  const [rejectingLoan, setRejectingLoan] = useState<Loan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Exemplar em manutenção ou reservado para aula magna');

  // Config local
  const [tempSettings, setTempSettings] = useState(settings);

  // SQL Console State
  const [sqlQueryInput, setSqlQueryInput] = useState('SELECT * FROM books WHERE available_copies > 0;');
  const [sqlResult, setSqlResult] = useState<SqlQueryResult | null>(() =>
    executeSql('SELECT * FROM books WHERE available_copies > 0;')
  );
  const [copiedDump, setCopiedDump] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return books.filter((b) => {
      const term = invSearch.toLowerCase();
      const matchSearch =
        !term ||
        b.title.toLowerCase().includes(term) ||
        b.author.toLowerCase().includes(term) ||
        b.isbn.toLowerCase().includes(term) ||
        b.location.toLowerCase().includes(term);

      const matchAvail =
        invAvailability === 'todos' ||
        (invAvailability === 'disponiveis' && b.availableCopies > 0) ||
        (invAvailability === 'indisponiveis' && b.availableCopies === 0);

      const matchGenre = invGenre === 'todos' || b.genre === invGenre;

      return matchSearch && matchAvail && matchGenre;
    });
  }, [books, invSearch, invAvailability, invGenre]);

  const pendingLoans = loans.filter((l) => l.status === 'pendente');
  const activeLoans = loans.filter((l) => l.status === 'aprovado');
  const overdueLoans = activeLoans.filter((l) => new Date(l.dueDate).getTime() < new Date().getTime());

  const filteredActiveLoans = useMemo(() => {
    return activeLoans.filter((l) => {
      const term = circSearch.toLowerCase();
      return (
        !term ||
        l.bookTitle.toLowerCase().includes(term) ||
        l.userName.toLowerCase().includes(term) ||
        l.userRegistration.toLowerCase().includes(term)
      );
    });
  }, [activeLoans, circSearch]);

  const monthlyStats = getMonthlyStats();
  const neverBorrowedBooks = getNeverBorrowedBooks();

  // Handlers
  const handleApprove = (id: string) => {
    const res = approveLoan(id);
    showToast(res.message, !res.success);
  };

  const handleConfirmReturn = () => {
    if (!returningLoan) return;
    const res = returnBook(returningLoan.id, returnFinePaid, returnNotes);
    showToast(res.message, !res.success);
    setReturningLoan(null);
    setReturnNotes('');
  };

  const handleConfirmReject = () => {
    if (!rejectingLoan) return;
    const res = rejectLoan(rejectingLoan.id, rejectionReason);
    showToast(res.message, !res.success);
    setRejectingLoan(null);
  };

  const handleDeleteBook = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta obra do catálogo?')) {
      const res = deleteBook(id);
      showToast(res.message, !res.success);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(tempSettings);
    showToast('Parâmetros da biblioteca atualizados com sucesso!');
  };

  const handleExportSqlDump = () => {
    const dump = exportSqlDump();
    const blob = new Blob([dump], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bibliosaber_mysql_dump_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    showToast('Arquivo bibliosaber_mysql_dump.sql gerado para download!');
  };

  const handleRunSql = () => {
    const res = executeSql(sqlQueryInput);
    setSqlResult(res);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
            toast.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.isError ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Editorial Administrative Header Banner */}
      <section className="bg-[#241A12] rounded-2xl text-[#FAF8F5] p-8 border border-[#3E2B1E] shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#C89B65] font-sans block">
              Gabinete da Bibliotecária & Gestão de Acervo
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Circulação, Inventário & Banco Relacional SQL
            </h1>
            <p className="text-xs sm:text-sm text-[#D4C5B3] max-w-2xl leading-relaxed">
              Supervisão de exemplares físicos, aprovação de empréstimos, controle de devoluções com multas diárias configuráveis e consultas SQL em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setBookToEdit(null);
                setIsBookModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-lg bg-[#8C531B] hover:bg-[#724114] text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-2"
            >
              <BookPlus className="w-4 h-4" />
              <span>Cadastrar Novo Livro</span>
            </button>
            <button
              onClick={() => setIsDirectLoanModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/15 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-[#C89B65]" />
              <span>Empréstimo Rápido Balcão</span>
            </button>
          </div>
        </div>

        {/* Analytical KPI Counters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-8 pt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-stone-400 block text-[11px] font-sans">Títulos no Catálogo</span>
            <span className="text-2xl font-serif font-bold text-white tabular-nums">{books.length}</span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px] font-sans">Exemplares Físicos</span>
            <span className="text-2xl font-serif font-bold text-white tabular-nums">
              {books.reduce((acc, b) => acc + b.totalCopies, 0)}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px] font-sans">Empréstimos Ativos</span>
            <span className="text-2xl font-serif font-bold text-emerald-400 tabular-nums">
              {activeLoans.length}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px] font-sans">Pedidos Pendentes</span>
            <span className="text-2xl font-serif font-bold text-amber-300 tabular-nums">
              {pendingLoans.length}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px] font-sans">Livros em Atraso</span>
            <span className={`text-2xl font-serif font-bold tabular-nums ${overdueLoans.length > 0 ? 'text-rose-400' : 'text-stone-300'}`}>
              {overdueLoans.length}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-[11px] font-sans">Multas Pendentes</span>
            <span className="text-2xl font-serif font-bold text-rose-300 tabular-nums">
              R$ {loans.filter((l) => !l.finePaid).reduce((acc, l) => acc + l.fineAmount, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E6DFC4] gap-6 text-sm font-medium overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('circulacao')}
          className={`pb-3 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'circulacao'
              ? 'text-[#1E1612] font-serif font-bold text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-[#8C531B]" />
          <span>Circulação & Balcão</span>
          {pendingLoans.length > 0 && (
            <span className="font-mono text-xs px-1.5 py-0.2 bg-[#8C2424] text-white rounded-full font-bold">
              {pendingLoans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventario')}
          className={`pb-3 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'inventario'
              ? 'text-[#1E1612] font-serif font-bold text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4 text-[#8C531B]" />
          <span>Inventário do Acervo ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('relatorios')}
          className={`pb-3 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'relatorios'
              ? 'text-[#1E1612] font-serif font-bold text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <PieChart className="w-4 h-4 text-[#8C531B]" />
          <span>Relatórios Analíticos</span>
        </button>

        <button
          onClick={() => setActiveTab('sql-database')}
          className={`pb-3 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'sql-database'
              ? 'text-[#1E1612] font-serif font-bold text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Database className="w-4 h-4 text-[#8C531B]" />
          <span>Banco de Dados SQL (MySQL)</span>
        </button>

        <button
          onClick={() => setActiveTab('alunos')}
          className={`pb-3 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'alunos'
              ? 'text-[#1E1612] font-serif font-bold text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4 text-[#8C531B]" />
          <span>Alunos ({users.filter((u) => u.role === 'aluno').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('configuracoes')}
          className={`pb-3 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'configuracoes'
              ? 'text-[#1E1612] font-serif font-bold text-base after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <SettingsIcon className="w-4 h-4 text-[#8C531B]" />
          <span>Políticas & Multas</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CIRCULAÇÃO & BALCÃO */}
      {/* ========================================================= */}
      {activeTab === 'circulacao' && (
        <div className="space-y-8">
          {/* Pendentes */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1E1612] flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#8C531B]" />
              <span>Solicitações de Empréstimo Pendentes ({pendingLoans.length})</span>
            </h3>

            {pendingLoans.length === 0 ? (
              <div className="p-6 rounded-xl bg-white border border-[#E6DFC4] text-center text-xs text-stone-500">
                Nenhum pedido de empréstimo pendente no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingLoans.map((loan) => {
                  const book = books.find((b) => b.id === loan.bookId);
                  const hasCopies = (book?.availableCopies || 0) > 0;

                  return (
                    <div
                      key={loan.id}
                      className="bg-white rounded-xl border border-amber-300 p-4 shadow-xs flex gap-4"
                    >
                      <img
                        src={loan.bookCover}
                        alt={loan.bookTitle}
                        className="w-18 h-26 object-cover rounded-md border border-stone-200 shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-base text-[#1E1612]">
                            {loan.bookTitle}
                          </h4>
                          <div className="text-xs text-stone-600 mt-1 space-y-0.5">
                            <p>Aluno: <strong>{loan.userName}</strong> ({loan.userRegistration})</p>
                            <p>Data: {new Date(loan.requestDate).toLocaleDateString('pt-BR')}</p>
                            {loan.notes && <p className="italic text-stone-500">"{loan.notes}"</p>}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                          <span className={`text-xs font-semibold ${hasCopies ? 'text-emerald-800' : 'text-rose-700'}`}>
                            {hasCopies ? `✓ ${book?.availableCopies} disponíveis` : 'Sem estoque'}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setRejectingLoan(loan)}
                              className="px-3 py-1.5 rounded-md border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100"
                            >
                              Recusar
                            </button>
                            <button
                              onClick={() => handleApprove(loan.id)}
                              disabled={!hasCopies}
                              className="px-3 py-1.5 rounded-md bg-[#2C1D11] hover:bg-[#3D2918] disabled:bg-stone-300 text-white text-xs font-semibold"
                            >
                              Aprovar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Loans & Return Registration */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1E1612] flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#8C531B]" />
                  <span>Livros em Posse dos Alunos ({activeLoans.length})</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Pesquise por aluno, matrícula ou obra para registrar a devolução com cálculo de multa
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={circSearch}
                  onChange={(e) => setCircSearch(e.target.value)}
                  placeholder="Buscar aluno ou título..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#D5CCBE] bg-white text-xs focus:outline-hidden focus:border-[#8C531B]"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E6DFC4] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E6DFC4] font-semibold text-stone-700">
                    <tr>
                      <th className="p-3.5">Obra Literária</th>
                      <th className="p-3.5">Aluno & Matrícula</th>
                      <th className="p-3.5">Data Retirada</th>
                      <th className="p-3.5">Prazo Devolução</th>
                      <th className="p-3.5">Status & Multa</th>
                      <th className="p-3.5 text-right">Ação Balcão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFC4]/50">
                    {filteredActiveLoans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-500">
                          Nenhum empréstimo ativo correspondente.
                        </td>
                      </tr>
                    ) : (
                      filteredActiveLoans.map((l) => {
                        const now = new Date();
                        const due = new Date(l.dueDate);
                        const isOverdue = now > due;
                        const diffDays = Math.ceil(Math.abs(due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                        return (
                          <tr key={l.id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={l.bookCover}
                                  alt={l.bookTitle}
                                  className="w-9 h-12 object-cover rounded-sm border border-stone-200"
                                />
                                <div>
                                  <p className="font-serif font-bold text-sm text-[#1E1612]">{l.bookTitle}</p>
                                  <span className="text-[10px] text-stone-500 font-mono">ID: {l.id}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <p className="font-semibold text-[#1E1612]">{l.userName}</p>
                              <p className="text-[11px] font-mono text-[#8C531B]">{l.userRegistration}</p>
                            </td>

                            <td className="p-3.5 text-stone-600 font-mono">
                              {new Date(l.requestDate).toLocaleDateString('pt-BR')}
                            </td>

                            <td className="p-3.5 font-mono">
                              <span className="font-bold text-[#1E1612]">{due.toLocaleDateString('pt-BR')}</span>
                              <span className="block text-[10px] text-stone-500">
                                {isOverdue ? `${diffDays}d atrasado` : `${diffDays}d restantes`}
                              </span>
                            </td>

                            <td className="p-3.5">
                              {isOverdue ? (
                                <span className="font-bold text-rose-700 font-mono block">
                                  Atrasado · Multa: R$ {l.fineAmount.toFixed(2)}
                                </span>
                              ) : diffDays <= 2 ? (
                                <span className="text-amber-800 font-medium">Vence em breve</span>
                              ) : (
                                <span className="text-emerald-800 font-medium">No prazo</span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setReturningLoan(l);
                                  setReturnFinePaid(true);
                                  setReturnNotes('');
                                }}
                                className="px-3 py-1.5 rounded-md bg-[#2C1D11] hover:bg-[#3D2918] text-white text-xs font-medium"
                              >
                                Registrar Devolução
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INVENTÁRIO DO ACERVO */}
      {/* ========================================================= */}
      {activeTab === 'inventario' && (
        <div className="space-y-6">
          <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#E6DFC4] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="Pesquisar por título, autor, ISBN ou estante..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-[#D5CCBE] bg-white text-xs sm:text-sm"
                />
              </div>

              <button
                onClick={() => {
                  setBookToEdit(null);
                  setIsBookModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#2C1D11] hover:bg-[#3D2918] text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <BookPlus className="w-4 h-4" />
                <span>Adicionar Obra ao Acervo</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6DFC4] text-xs">
              <div className="flex items-center gap-1 p-1 bg-[#EFE8DC] rounded-lg">
                <button
                  onClick={() => setInvAvailability('todos')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    invAvailability === 'todos' ? 'bg-white text-[#1E1612] font-semibold' : 'text-stone-600'
                  }`}
                >
                  Todos ({books.length})
                </button>
                <button
                  onClick={() => setInvAvailability('disponiveis')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    invAvailability === 'disponiveis' ? 'bg-emerald-900 text-white font-semibold' : 'text-stone-600'
                  }`}
                >
                  Disponíveis ({books.filter((b) => b.availableCopies > 0).length})
                </button>
                <button
                  onClick={() => setInvAvailability('indisponiveis')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    invAvailability === 'indisponiveis' ? 'bg-[#8C2424] text-white font-semibold' : 'text-stone-600'
                  }`}
                >
                  100% Emprestados ({books.filter((b) => b.availableCopies === 0).length})
                </button>
              </div>

              <select
                value={invGenre}
                onChange={(e) => setInvGenre(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#D5CCBE] bg-white text-xs"
              >
                <option value="todos">Todos os Gêneros</option>
                <option value="Literatura Brasileira">Literatura Brasileira</option>
                <option value="Ficção Científica">Ficção Científica</option>
                <option value="Romance">Romance</option>
                <option value="Fantasia">Fantasia</option>
                <option value="Tecnologia & Computação">Tecnologia & Computação</option>
                <option value="História & Filosofia">História & Filosofia</option>
                <option value="Ciências & Biologia">Ciências & Biologia</option>
                <option value="HQ & Mangá">HQ & Mangá</option>
                <option value="Poesia & Teatro">Poesia & Teatro</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E6DFC4] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E6DFC4] font-semibold text-stone-700">
                  <tr>
                    <th className="p-3.5">Título & Autor</th>
                    <th className="p-3.5">Gênero & ISBN</th>
                    <th className="p-3.5">Localização Física</th>
                    <th className="p-3.5">Estoque</th>
                    <th className="p-3.5">Status de Disponibilidade</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFC4]/50">
                  {filteredInventory.map((book) => {
                    const isAvail = book.availableCopies > 0;
                    const expectedReturn = getExpectedReturnDate(book.id);

                    return (
                      <tr key={book.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-10 h-14 object-cover rounded-sm border border-stone-200 cursor-pointer"
                              onClick={() => onOpenBookDetail(book)}
                            />
                            <div>
                              <p
                                className="font-serif font-bold text-sm text-[#1E1612] hover:text-[#8C531B] cursor-pointer"
                                onClick={() => onOpenBookDetail(book)}
                              >
                                {book.title}
                              </p>
                              <p className="text-xs text-stone-600">{book.author}</p>
                              <p className="text-[10px] text-stone-400 font-sans">{book.publisher} · {book.publishedYear}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="text-[#8C531B] font-medium block">{book.genre}</span>
                          <span className="text-[10px] font-mono text-stone-500">{book.isbn}</span>
                        </td>

                        <td className="p-3.5 text-stone-700 font-medium">
                          {book.location}
                        </td>

                        <td className="p-3.5 font-mono">
                          <strong className="text-[#1E1612]">{book.availableCopies}</strong> de {book.totalCopies}
                        </td>

                        <td className="p-3.5">
                          {isAvail ? (
                            <span className="text-emerald-800 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>DISPONÍVEL ({book.availableCopies} na estante)</span>
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[#8C2424] font-semibold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                                <span>INDISPONÍVEL (100% Emprestado)</span>
                              </span>
                              {expectedReturn && (
                                <span className="text-[11px] text-stone-600 block">
                                  Retorno previsto: <strong className="font-mono text-[#1E1612]">{new Date(expectedReturn).toLocaleDateString('pt-BR')}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setBookToEdit(book);
                                setIsBookModalOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600"
                              title="Editar obra"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="p-1.5 rounded-md hover:bg-rose-100 text-rose-700"
                              title="Excluir obra"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BANCO DE DADOS RELACIONAL SQL (MYSQL / POSTGRES) */}
      {/* ========================================================= */}
      {activeTab === 'sql-database' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1E1612] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#8C531B]" />
                <span>Console SQL Relacional & Exportador MySQL / PostgreSQL</span>
              </h2>
              <p className="text-xs text-stone-500">
                Execute queries SQL interativas, inspecione esquemas normalizados e exporte scripts .sql prontos para importação.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleExportSqlDump}
                className="px-4 py-2 rounded-lg bg-[#2C1D11] hover:bg-[#3D2918] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Script MySQL (.sql)</span>
              </button>
            </div>
          </div>

          {/* Interactive SQL Query Console */}
          <div className="bg-[#1C1612] rounded-2xl p-6 text-white border border-[#3E2B1E] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#C89B65]">
                <Terminal className="w-4 h-4" />
                <span>mysql&gt; bibliosaber_db</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const sample = 'SELECT * FROM books WHERE available_copies > 0;';
                    setSqlQueryInput(sample);
                    setSqlResult(executeSql(sample));
                  }}
                  className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/15 text-[11px] font-mono text-stone-300"
                >
                  Livros Disponíveis
                </button>
                <button
                  onClick={() => {
                    const sample = "SELECT * FROM loans WHERE status = 'aprovado';";
                    setSqlQueryInput(sample);
                    setSqlResult(executeSql(sample));
                  }}
                  className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/15 text-[11px] font-mono text-stone-300"
                >
                  Empréstimos Ativos
                </button>
                <button
                  onClick={() => {
                    const sample = 'SHOW TABLES;';
                    setSqlQueryInput(sample);
                    setSqlResult(executeSql(sample));
                  }}
                  className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/15 text-[11px] font-mono text-stone-300"
                >
                  SHOW TABLES;
                </button>
              </div>
            </div>

            {/* SQL Input Area */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-stone-400">
                Digite seu comando SQL (SELECT, SHOW TABLES, DESCRIBE):
              </label>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={sqlQueryInput}
                  onChange={(e) => setSqlQueryInput(e.target.value)}
                  className="w-full bg-[#120E0B] rounded-lg p-3 text-xs font-mono text-emerald-400 border border-white/10 focus:outline-hidden focus:border-[#C89B65]"
                />
                <button
                  onClick={handleRunSql}
                  className="px-5 rounded-lg bg-[#8C531B] hover:bg-[#724114] text-white text-xs font-bold flex flex-col items-center justify-center gap-1 shrink-0"
                >
                  <Play className="w-4 h-4" />
                  <span>Executar</span>
                </button>
              </div>
            </div>

            {/* Results Output */}
            {sqlResult && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-2">
                  <span>
                    {sqlResult.rowCount} linha(s) retornada(s) em {sqlResult.executionTimeMs} ms
                  </span>
                  {sqlResult.error && (
                    <span className="text-rose-400 font-bold">{sqlResult.error}</span>
                  )}
                </div>

                <div className="max-h-72 overflow-x-auto rounded-lg border border-white/10 bg-[#120E0B]">
                  <table className="w-full text-left text-xs font-mono text-stone-300">
                    <thead className="bg-white/5 border-b border-white/10 text-[#C89B65]">
                      <tr>
                        {sqlResult.columns.map((col) => (
                          <th key={col} className="p-2.5 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sqlResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          {sqlResult.columns.map((col) => (
                            <td key={col} className="p-2.5 whitespace-nowrap text-stone-200">
                              {String(row[col] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Relational Schema Architecture Reference */}
          <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1E1612]">
              Estrutura das Tabelas Relacionais do Banco de Dados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFC4] space-y-2">
                <h4 className="font-mono font-bold text-[#8C531B]">books</h4>
                <p className="text-stone-600 text-[11px]">Acervo catalogado, ISBN, localização e contagem de exemplares.</p>
                <div className="text-[10px] font-mono text-stone-500 space-y-0.5">
                  <div>PK: id (VARCHAR)</div>
                  <div>available_copies (INT)</div>
                  <div>isbn (VARCHAR UNIQUE)</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFC4] space-y-2">
                <h4 className="font-mono font-bold text-[#8C531B]">users</h4>
                <p className="text-stone-600 text-[11px]">Alunos e bibliotecárias, matrículas e status de bloqueio.</p>
                <div className="text-[10px] font-mono text-stone-500 space-y-0.5">
                  <div>PK: id (VARCHAR)</div>
                  <div>role (ENUM)</div>
                  <div>is_blocked (BOOLEAN)</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFC4] space-y-2">
                <h4 className="font-mono font-bold text-[#8C531B]">loans</h4>
                <p className="text-stone-600 text-[11px]">Relação N:1 entre usuário e livro, com prazo e multas.</p>
                <div className="text-[10px] font-mono text-stone-500 space-y-0.5">
                  <div>FK: book_id → books(id)</div>
                  <div>FK: user_id → users(id)</div>
                  <div>fine_amount (DECIMAL)</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFC4] space-y-2">
                <h4 className="font-mono font-bold text-[#8C531B]">reservations</h4>
                <p className="text-stone-600 text-[11px]">Fila ordenada de espera para obras 100% emprestadas.</p>
                <div className="text-[10px] font-mono text-stone-500 space-y-0.5">
                  <div>FK: book_id → books(id)</div>
                  <div>queue_position (INT)</div>
                  <div>status (ENUM)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: RELATÓRIOS ANALÍTICOS (MENSAL & NUNCA EMPRESTADOS) */}
      {/* ========================================================= */}
      {activeTab === 'relatorios' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1E1612]">
                Relatórios Gerenciais de Atividades & Circulação
              </h2>
              <p className="text-xs text-stone-500">
                Estatísticas mensais de pontualidade, ranking de alunos leitores e levantamento de acervo sem giro.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg border border-[#D5CCBE] hover:bg-stone-100 text-stone-800 text-xs font-medium flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Imprimir Relatório</span>
            </button>
          </div>

          {/* Relatório Mensal */}
          <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs space-y-6">
            <div className="border-b border-[#E6DFC4] pb-4">
              <span className="text-[11px] font-mono text-[#8C531B] uppercase tracking-wider block">
                Relatório 01 · Atividades dos Usuários
              </span>
              <h3 className="font-serif font-bold text-lg text-[#1E1612]">
                Movimentação do Mês ({new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFC4]">
                <span className="text-xs text-stone-600 block">Empréstimos no Mês</span>
                <span className="text-2xl font-serif font-bold text-[#1E1612] mt-1 block tabular-nums">
                  {monthlyStats.totalLoansThisMonth}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs text-emerald-900 block">Devoluções no Prazo</span>
                <span className="text-2xl font-serif font-bold text-emerald-950 mt-1 block tabular-nums">
                  {monthlyStats.returnedOnTimeCount}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-rose-50/70 border border-rose-200">
                <span className="text-xs text-rose-900 block">Devoluções c/ Atraso</span>
                <span className="text-2xl font-serif font-bold text-rose-950 mt-1 block tabular-nums">
                  {monthlyStats.returnedLateCount}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200">
                <span className="text-xs text-amber-900 block">Multas Quitadas</span>
                <span className="text-2xl font-serif font-bold text-amber-950 mt-1 block tabular-nums">
                  R$ {monthlyStats.totalFinesCollected.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E6DFC4]">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#1E1612] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#8C531B]" />
                  <span>Ranking de Alunos com Mais Empréstimos</span>
                </h4>
                <div className="space-y-2">
                  {monthlyStats.topReaders.map((item, idx) => (
                    <div
                      key={item.user.id}
                      className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6DFC4] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#EFE8DC] text-[#1E1612] font-serif font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-[#1E1612]">{item.user.name}</p>
                          <span className="text-[10px] text-stone-500 font-sans">{item.user.courseOrDepartment}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#8C531B]">
                        {item.count} livros
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-serif font-bold text-sm text-[#1E1612] mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#8C531B]" />
                  <span>Distribuição por Gênero mais Procurado</span>
                </h4>
                <div className="space-y-2.5">
                  {monthlyStats.genreDistribution.map((item) => (
                    <div key={item.genre} className="space-y-1">
                      <div className="flex justify-between text-xs text-stone-700">
                        <span>{item.genre}</span>
                        <span className="font-mono font-bold">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className="h-full bg-[#8C531B] rounded-full"
                          style={{
                            width: `${Math.min(100, (item.count / (loans.length || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Relatório de Livros que NUNCA Foram Pegos */}
          <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs space-y-4">
            <div className="border-b border-[#E6DFC4] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-rose-800 uppercase tracking-wider block">
                  Relatório 02 · Diagnóstico de Acervo Parado
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1E1612] flex items-center gap-2">
                  <Archive className="w-5 h-5 text-[#8C531B]" />
                  <span>Livros que NUNCA Foram Pegos pelos Alunos</span>
                </h3>
              </div>

              <div className="font-mono text-xs text-rose-800 font-bold bg-rose-50 px-3 py-1 rounded-md border border-rose-200">
                {neverBorrowedBooks.length} obras sem giro
              </div>
            </div>

            {neverBorrowedBooks.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                Todo o acervo cadastrado já possui registro histórico de empréstimo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#E6DFC4]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E6DFC4] font-semibold text-stone-700">
                    <tr>
                      <th className="p-3.5">Título & Autor</th>
                      <th className="p-3.5">Gênero</th>
                      <th className="p-3.5">Exemplares Parados</th>
                      <th className="p-3.5">Localização Física</th>
                      <th className="p-3.5 text-right">Ação Curatorial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFC4]/50">
                    {neverBorrowedBooks.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50">
                        <td className="p-3.5">
                          <p className="font-serif font-bold text-[#1E1612] text-sm">{b.title}</p>
                          <p className="text-xs text-stone-500">{b.author}</p>
                        </td>
                        <td className="p-3.5 text-[#8C531B]">{b.genre}</td>
                        <td className="p-3.5 font-mono font-bold text-[#1E1612]">{b.totalCopies} cópias</td>
                        <td className="p-3.5 font-mono text-stone-600">{b.location}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => showToast(`Livro "${b.title}" promovido para a mesa de destaque!`)}
                            className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D5CCBE] text-[#1E1612] text-xs font-medium hover:bg-[#EFE8DC]"
                          >
                            Colocar em Vitrine
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: BANCO DE DADOS RELACIONAL MYSQL */}
      {/* ========================================================= */}
      {activeTab === 'sql-database' && (
        <MySqlConsole />
      )}

      {/* ========================================================= */}
      {/* TAB 5: ALUNOS */}
      {/* ========================================================= */}
      {activeTab === 'alunos' && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-[#1E1612] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8C531B]" />
            <span>Membros & Alunos Registrados</span>
          </h2>

          <div className="bg-white rounded-xl border border-[#E6DFC4] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E6DFC4] font-semibold text-stone-700">
                  <tr>
                    <th className="p-3.5">Aluno</th>
                    <th className="p-3.5">Matrícula & Curso</th>
                    <th className="p-3.5">Contato</th>
                    <th className="p-3.5">Empréstimos</th>
                    <th className="p-3.5">Multas</th>
                    <th className="p-3.5">Situação</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFC4]/50">
                  {users
                    .filter((u) => u.role === 'aluno')
                    .map((st) => {
                      const count = loans.filter((l) => l.userId === st.id && l.status === 'aprovado').length;
                      const fines = loans
                        .filter((l) => l.userId === st.id && !l.finePaid)
                        .reduce((acc, l) => acc + l.fineAmount, 0);

                      return (
                        <tr key={st.id} className="hover:bg-stone-50">
                          <td className="p-3.5 flex items-center gap-3">
                            <img src={st.avatarUrl} alt={st.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className="font-bold text-[#1E1612]">{st.name}</p>
                              <span className="text-[10px] text-stone-500 font-sans">{st.email}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-[#8C531B] block">{st.registrationNumber}</span>
                            <span className="text-stone-500">{st.courseOrDepartment}</span>
                          </td>
                          <td className="p-3.5 text-stone-600 font-mono">{st.phone}</td>
                          <td className="p-3.5 font-mono font-bold text-[#1E1612]">{count} obras</td>
                          <td className="p-3.5 font-mono">
                            {fines > 0 ? (
                              <span className="text-rose-700 font-bold">R$ {fines.toFixed(2)}</span>
                            ) : (
                              <span className="text-emerald-800">Sem débitos</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {st.isBlocked ? (
                              <span className="text-rose-700 font-bold">Bloqueado</span>
                            ) : (
                              <span className="text-emerald-800 font-medium">Regular</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                toggleBlockUser(st.id);
                                showToast(`Situação do aluno ${st.name} alterada.`);
                              }}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                                st.isBlocked
                                  ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                              }`}
                            >
                              {st.isBlocked ? 'Desbloquear' : 'Bloquear'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: CONFIGURAÇÕES & MULTAS */}
      {/* ========================================================= */}
      {activeTab === 'configuracoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1E1612] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#8C531B]" />
              <span>Políticas de Multas por Atraso & Empréstimos</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Multa Diária por Atraso (R$ por dia corrido) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={tempSettings.dailyFineAmount}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, dailyFineAmount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE] font-bold font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Prazo Padrão (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={tempSettings.standardLoanDays}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, standardLoanDays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Carência (Dias)</label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={tempSettings.gracePeriodDays}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, gracePeriodDays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Máx. Livros Simultâneos</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tempSettings.maxBooksPerStudent}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, maxBooksPerStudent: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Máx. de Renovações</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={tempSettings.maxRenewalsAllowed}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, maxRenewalsAllowed: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Código Institucional da Bibliotecária</label>
                <input
                  type="text"
                  value={tempSettings.librarianAccessCode}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, librarianAccessCode: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#2C1D11] hover:bg-[#3D2918] text-white font-semibold text-xs transition-colors"
              >
                Salvar Configurações
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1E1612] flex items-center gap-2">
              <Archive className="w-5 h-5 text-[#8C531B]" />
              <span>Backups & Restauração</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFC4]">
                <h4 className="font-bold text-[#1E1612]">Backup em SQL (MySQL Dump)</h4>
                <p className="text-stone-500 text-[11px] mt-0.5">Arquivo com tabelas e inserts relacionais completos.</p>
                <button
                  onClick={handleExportSqlDump}
                  className="mt-2 px-3 py-1.5 rounded-md bg-[#2C1D11] text-white font-medium text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .sql</span>
                </button>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E6DFC4]">
                <h4 className="font-bold text-[#1E1612]">Backup em JSON</h4>
                <p className="text-stone-500 text-[11px] mt-0.5">Ideal para transferência e restauração na nuvem.</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      const str = exportDatabaseJson();
                      const blob = new Blob([str], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `backup_bibliosaber_${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      showToast('Backup JSON exportado!');
                    }}
                    className="px-3 py-1.5 rounded-md bg-stone-200 text-stone-800 font-medium text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar JSON</span>
                  </button>
                  <label className="cursor-pointer px-3 py-1.5 rounded-md border border-stone-300 text-stone-700 font-medium text-xs flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const res = importDatabaseJson(event.target?.result as string);
                          showToast(res.message, !res.success);
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                <h4 className="font-bold text-rose-900">Restaurar Acervo de Demonstração</h4>
                <p className="text-rose-700 text-[11px] mt-0.5">Recarrega as obras clássicas brasileiras e mundiais.</p>
                <button
                  onClick={() => {
                    if (confirm('Restaurar os dados originais?')) {
                      resetToDefaultData();
                      showToast('Dados restaurados!');
                    }
                  }}
                  className="mt-2 px-3 py-1.5 rounded-md bg-rose-700 text-white font-medium text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Base Padrão</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Devolução */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E6DFC4] w-full max-w-md overflow-hidden">
            <div className="p-5 bg-[#2C1D11] text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg">Registrar Devolução</h3>
              <button onClick={() => setReturningLoan(null)} className="text-stone-300 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <p className="font-serif font-bold text-base text-[#1E1612]">{returningLoan.bookTitle}</p>
                <p className="text-stone-600">Aluno: {returningLoan.userName} ({returningLoan.userRegistration})</p>
              </div>

              {new Date().getTime() > new Date(returningLoan.dueDate).getTime() ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>Empréstimo com atraso detectado!</span>
                  </div>
                  <p>Multa calculada: <strong className="font-mono text-base">R$ {returningLoan.fineAmount.toFixed(2)}</strong></p>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={returnFinePaid}
                      onChange={(e) => setReturnFinePaid(e.target.checked)}
                      className="rounded-sm"
                    />
                    <span>Multa quitada no balcão</span>
                  </label>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-medium">
                  ✓ Entregue dentro do prazo regular.
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Estado de conservação</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Ex: Exemplar em perfeito estado"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE] bg-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setReturningLoan(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 rounded-lg bg-[#2C1D11] text-white font-bold"
                >
                  Confirmar Devolução
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recusa */}
      {rejectingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E6DFC4] w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="font-serif font-bold text-base text-[#1E1612]">Recusar Solicitação</h3>
            <p className="text-stone-600">
              Informe a justificativa para <strong>{rejectingLoan.userName}</strong>:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#D5CCBE] bg-white text-xs"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectingLoan(null)} className="px-3 py-1.5 border rounded-md">
                Voltar
              </button>
              <button onClick={handleConfirmReject} className="px-4 py-1.5 bg-[#8C2424] text-white rounded-md font-bold">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <BookFormModal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setBookToEdit(null);
        }}
        bookToEdit={bookToEdit}
      />

      <DirectLoanModal
        isOpen={isDirectLoanModalOpen}
        onClose={() => setIsDirectLoanModalOpen(false)}
      />
    </div>
  );
};
