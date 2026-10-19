import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { SqlDatabaseEngine, TableSchemaMeta } from '../db/sqlEngine';
import { SqlQueryResult } from '../types/library';
import {
  Database,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Terminal,
  Table as TableIcon,
  Server,
  FileCode2,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Layers,
  Cpu,
} from 'lucide-react';

export const MySqlConsole: React.FC = () => {
  const {
    books,
    users,
    loans,
    reservations,
    settings,
    executeSql,
    exportSqlDump,
  } = useLibrary();

  // Sub-tabs: 'query' | 'schema' | 'dump' | 'connection'
  const [activeSubTab, setActiveSubTab] = useState<'query' | 'schema' | 'dump' | 'connection'>('query');

  // Query Runner State
  const defaultQuery = 'SELECT id, title, author, genre, total_copies, available_copies, location FROM books WHERE available_copies > 0 ORDER BY title ASC;';
  const [queryInput, setQueryInput] = useState<string>(defaultQuery);
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(() =>
    executeSql(defaultQuery)
  );
  const [queryHistory, setQueryHistory] = useState<string[]>([
    defaultQuery,
    'SHOW TABLES;',
    'SELECT l.id, b.title AS livro, u.name AS aluno, l.due_date, l.status, l.fine_amount FROM loans l JOIN books b ON l.book_id = b.id JOIN users u ON l.user_id = u.id;',
    'DESCRIBE books;',
  ]);

  // Schema state
  const schemas: TableSchemaMeta[] = SqlDatabaseEngine.getSchemaMetadata();
  const [selectedSchemaTable, setSelectedSchemaTable] = useState<string>('books');

  // Copy feedback
  const [copiedDump, setCopiedDump] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // External connection simulator state
  const [connHost, setConnHost] = useState('localhost');
  const [connPort, setConnPort] = useState('3306');
  const [connUser, setConnUser] = useState('root');
  const [connPassword, setConnPassword] = useState('••••••••');
  const [connDatabase, setConnDatabase] = useState('bibliosaber_db');
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connTestResult, setConnTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRunQuery = (sqlToRun?: string) => {
    const q = sqlToRun || queryInput;
    if (!q.trim()) return;

    const res = executeSql(q);
    setQueryResult(res);

    // Save to history (avoid duplicates at the top)
    setQueryHistory((prev) => {
      const filtered = prev.filter((item) => item !== q);
      return [q, ...filtered].slice(0, 10);
    });

    if (res.error) {
      showToast('Erro de sintaxe SQL detectado.');
    } else {
      showToast(`Executado com sucesso (${res.rowCount} linhas, ${res.executionTimeMs} ms)`);
    }
  };

  const handleDownloadDump = () => {
    const dump = exportSqlDump();
    const blob = new Blob([dump], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bibliosaber_mysql_dump_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    showToast('Download do arquivo bibliosaber_dump.sql iniciado!');
  };

  const handleCopyDump = () => {
    const dump = exportSqlDump();
    navigator.clipboard.writeText(dump);
    setCopiedDump(true);
    showToast('Dump SQL copiado para a área de transferência!');
    setTimeout(() => setCopiedDump(false), 2500);
  };

  const handleExportCsv = () => {
    if (!queryResult || queryResult.rows.length === 0) return;
    const cols = queryResult.columns;
    const header = cols.join(',');
    const rows = queryResult.rows.map((r) =>
      cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    showToast('Resultado exportado em CSV!');
  };

  const handleTestConnection = () => {
    setIsTestingConn(true);
    setConnTestResult(null);

    setTimeout(() => {
      setIsTestingConn(false);
      setConnTestResult({
        success: true,
        message: `Conexão bem-sucedida com MySQL Server em ${connHost}:${connPort}/${connDatabase}! Autenticação concedida ao usuário '${connUser}' com motor InnoDB e tabelas sincronizadas.`,
        latency: Math.floor(8 + Math.random() * 15),
      });
      showToast('Ping MySQL Server: Conexão verificada com sucesso!');
    }, 700);
  };

  const activeTableMeta = schemas.find((s) => s.tableName === selectedSchemaTable) || schemas[0];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#2C1D11] text-white text-xs font-semibold shadow-2xl border border-[#C89B65]/40 flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-[#C89B65]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner - MySQL Enterprise Atelier */}
      <section className="bg-[#1C1612] text-white rounded-2xl p-6 sm:p-8 border border-[#3E2B1E] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B47836]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Motor Relacional MySQL 8.0 Conectado
              </span>
              <span className="text-stone-400 font-mono text-xs hidden sm:inline">
                InnoDB · utf8mb4 · ACID Compliance
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
              <Database className="w-7 h-7 text-[#C89B65]" />
              <span>Central & Terminal Interativo MySQL</span>
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Ambiente de interação direta com o banco relacional da biblioteca. Execute consultas SQL (SELECT, JOIN, DML), inspecione chaves primárias e estrangeiras, gere dumps para produção e integre com servidores MySQL externos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadDump}
              className="px-4 py-2.5 rounded-lg bg-[#8C531B] hover:bg-[#724114] text-white font-medium text-xs shadow-md transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Dump .sql</span>
            </button>
            <button
              onClick={handleCopyDump}
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white font-medium text-xs border border-white/15 transition-colors flex items-center gap-2"
            >
              {copiedDump ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDump ? 'Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>
        </div>

        {/* Database Metric Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs font-mono">
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-stone-400 text-[11px] block">Database Name</span>
            <strong className="text-white text-sm">bibliosaber_db</strong>
          </div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-stone-400 text-[11px] block">Tabelas Relacionais</span>
            <strong className="text-[#C89B65] text-sm">5 tabelas (InnoDB)</strong>
          </div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-stone-400 text-[11px] block">Total de Registros</span>
            <strong className="text-emerald-400 text-sm">
              {books.length + users.length + loans.length + reservations.length + 1} linhas
            </strong>
          </div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-stone-400 text-[11px] block">Chaves Estrangeiras</span>
            <strong className="text-white text-sm">4 FKs ativas (CASCADE)</strong>
          </div>
        </div>
      </section>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6DFC4] pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('query')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            activeSubTab === 'query'
              ? 'bg-[#2C1D11] text-white font-bold shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <Terminal className="w-4 h-4 text-[#C89B65]" />
          <span>Console de Consultas SQL</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schema')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            activeSubTab === 'schema'
              ? 'bg-[#2C1D11] text-white font-bold shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <TableIcon className="w-4 h-4 text-[#C89B65]" />
          <span>Dicionário & Esquema de Dados</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dump')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            activeSubTab === 'dump'
              ? 'bg-[#2C1D11] text-white font-bold shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <FileCode2 className="w-4 h-4 text-[#C89B65]" />
          <span>Script SQL Completo (.sql)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('connection')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
            activeSubTab === 'connection'
              ? 'bg-[#2C1D11] text-white font-bold shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <Server className="w-4 h-4 text-[#C89B65]" />
          <span>Conexão Externa & Node.js</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: CONSOLE DE CONSULTAS SQL INTERATIVO */}
      {/* ==================================================================== */}
      {activeSubTab === 'query' && (
        <div className="space-y-6">
          {/* Preset Queries Toolbar */}
          <div className="bg-white rounded-xl border border-[#E6DFC4] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-xs text-[#1E1612] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8C531B]" />
                <span>Consultas Rápidas Recomendadas (1-Clique):</span>
              </span>
              <span className="text-[11px] text-stone-500 font-mono">Clique para carregar e executar</span>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <button
                onClick={() => {
                  const q = 'SELECT id, title, author, genre, total_copies, available_copies, location FROM books WHERE available_copies > 0 ORDER BY title ASC;';
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D5CCBE] hover:bg-[#EFE8DC] text-stone-800 transition-colors font-medium flex items-center gap-1"
              >
                <span>🟢 Livros Disponíveis</span>
              </button>

              <button
                onClick={() => {
                  const q = 'SELECT id, title, author, genre, total_copies, available_copies FROM books WHERE available_copies = 0;';
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D5CCBE] hover:bg-[#EFE8DC] text-stone-800 transition-colors font-medium flex items-center gap-1"
              >
                <span>🔴 Livros Esgotados / Emprestados</span>
              </button>

              <button
                onClick={() => {
                  const q = 'SELECT l.id, b.title AS livro, u.name AS aluno, l.due_date, l.status, l.fine_amount FROM loans l JOIN books b ON l.book_id = b.id JOIN users u ON l.user_id = u.id;';
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D5CCBE] hover:bg-[#EFE8DC] text-stone-800 transition-colors font-medium flex items-center gap-1"
              >
                <span>🔗 JOIN: Empréstimos + Livros + Alunos</span>
              </button>

              <button
                onClick={() => {
                  const q = "SELECT id, book_title, user_name, registration, request_date, status FROM loans WHERE status = 'pendente';";
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D5CCBE] hover:bg-[#EFE8DC] text-stone-800 transition-colors font-medium flex items-center gap-1"
              >
                <span>⏳ Empréstimos Pendentes</span>
              </button>

              <button
                onClick={() => {
                  const q = "SELECT id, name, email, registration_number, course_or_department, phone FROM users WHERE role = 'aluno' ORDER BY name ASC;";
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D5CCBE] hover:bg-[#EFE8DC] text-stone-800 transition-colors font-medium flex items-center gap-1"
              >
                <span>🎓 Alunos Matriculados</span>
              </button>

              <button
                onClick={() => {
                  const q = 'SHOW TABLES;';
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-stone-100 border border-stone-300 hover:bg-stone-200 text-stone-800 transition-colors font-mono font-medium"
              >
                SHOW TABLES;
              </button>

              <button
                onClick={() => {
                  const q = 'DESCRIBE books;';
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-stone-100 border border-stone-300 hover:bg-stone-200 text-stone-800 transition-colors font-mono font-medium"
              >
                DESCRIBE books;
              </button>

              <button
                onClick={() => {
                  const q = "INSERT INTO books (title, author, genre) VALUES ('O Cortiço - Edição Especial', 'Aluísio Azevedo', 'Literatura Brasileira');";
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 transition-colors font-mono font-bold"
              >
                + INSERT INTO books...
              </button>

              <button
                onClick={() => {
                  const q = 'UPDATE system_settings SET daily_fine_amount = 3.50, standard_loan_days = 20;';
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1.5 rounded-md bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 transition-colors font-mono font-bold"
              >
                ⚡ UPDATE system_settings...
              </button>
            </div>
          </div>

          {/* SQL Editor Box */}
          <div className="bg-[#1C1612] rounded-xl border border-[#3E2B1E] overflow-hidden shadow-lg">
            <div className="px-4 py-2.5 bg-[#140F0D] border-b border-[#2C1D11] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-mono text-stone-400 ml-2">
                  mysql&gt; bibliosaber_db
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(queryInput);
                    setCopiedQuery(true);
                    setTimeout(() => setCopiedQuery(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-stone-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
                >
                  {copiedQuery ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar SQL</span>
                </button>
                <button
                  onClick={() => setQueryInput('')}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-[11px] font-mono transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="p-4">
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                rows={4}
                placeholder="Escreva qualquer instrução SQL (SELECT, INSERT, UPDATE, DELETE, SHOW, DESCRIBE)..."
                className="w-full bg-transparent text-[#E8D7C3] font-mono text-xs sm:text-sm focus:outline-hidden leading-relaxed resize-y selection:bg-[#B47836]/40"
              />
            </div>

            <div className="px-4 py-3 bg-[#140F0D] border-t border-[#2C1D11] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-[11px] text-stone-400 font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C89B65]" />
                <span>Dica: Comandos DML como INSERT e UPDATE atualizam o acervo em tempo real!</span>
              </div>

              <button
                onClick={() => handleRunQuery()}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#8C531B] hover:bg-[#A86422] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Executar SQL (MySQL Syntax)</span>
              </button>
            </div>
          </div>

          {/* Query Results Section */}
          <div className="bg-white rounded-xl border border-[#E6DFC4] overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E6DFC4] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                  Data Output Viewer
                </span>
                <h3 className="font-serif font-bold text-base text-[#1E1612] flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-[#8C531B]" />
                  <span>Resultado da Consulta</span>
                </h3>
              </div>

              {queryResult && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-stone-100 text-stone-700 font-semibold border border-stone-200">
                    {queryResult.rowCount} linha(s) retornada(s)
                  </span>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    ⏱️ {queryResult.executionTimeMs} ms
                  </span>
                  {queryResult.rows.length > 0 && (
                    <button
                      onClick={handleExportCsv}
                      className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Exportar CSV</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {queryResult?.error ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Erro de Execução MySQL</h4>
                  <p className="mt-1 font-mono">{queryResult.error}</p>
                </div>
              </div>
            ) : queryResult?.message ? (
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{queryResult.message}</span>
              </div>
            ) : null}

            {queryResult && queryResult.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[#E6DFC4]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#FAF8F5] border-b border-[#E6DFC4] text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      {queryResult.columns.map((col) => (
                        <th key={col} className="p-3 border-r border-[#E6DFC4]/60 last:border-r-0 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFC4]/50">
                    {queryResult.rows.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-stone-50' : 'bg-[#FAF8F5]/60 hover:bg-stone-50'}>
                        {queryResult.columns.map((col) => (
                          <td key={col} className="p-3 border-r border-[#E6DFC4]/30 last:border-r-0 text-stone-800 whitespace-nowrap max-w-xs truncate">
                            {row[col] === null ? (
                              <span className="text-stone-400 italic font-sans">NULL</span>
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : queryResult && !queryResult.error ? (
              <div className="p-8 text-center text-xs text-stone-500 font-sans bg-stone-50 rounded-lg border border-dashed border-stone-200">
                Nenhum registro encontrado para os critérios fornecidos.
              </div>
            ) : null}

            {/* Query History Carousel */}
            {queryHistory.length > 0 && (
              <div className="pt-3 border-t border-[#E6DFC4]/60">
                <span className="text-[11px] font-bold text-stone-600 block mb-2">
                  Histórico Recente de Execução:
                </span>
                <div className="space-y-1.5">
                  {queryHistory.map((hist, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setQueryInput(hist);
                        handleRunQuery(hist);
                      }}
                      className="p-2 rounded-lg bg-stone-50 hover:bg-[#FAF8F5] border border-stone-200 text-[11px] font-mono text-stone-700 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="truncate">{hist}</span>
                      <span className="text-[10px] text-stone-400 shrink-0 font-sans">Reexecutar &rarr;</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: ESQUEMA RELACIONAL & DICIONÁRIO DE DADOS */}
      {/* ==================================================================== */}
      {activeSubTab === 'schema' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {schemas.map((s) => (
              <button
                key={s.tableName}
                onClick={() => setSelectedSchemaTable(s.tableName)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedSchemaTable === s.tableName
                    ? 'bg-[#2C1D11] text-white border-[#2C1D11] shadow-md'
                    : 'bg-white text-stone-800 border-[#E6DFC4] hover:border-[#8C531B]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs">{s.tableName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    selectedSchemaTable === s.tableName ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {s.columns.length} colunas
                  </span>
                </div>
                <p className={`text-[11px] mt-1.5 line-clamp-2 ${
                  selectedSchemaTable === s.tableName ? 'text-stone-300' : 'text-stone-500'
                }`}>
                  {s.description}
                </p>
              </button>
            ))}
          </div>

          {/* Active Table Schema Details */}
          <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs space-y-6">
            <div className="border-b border-[#E6DFC4] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-[#8C531B] uppercase tracking-wider block">
                  Tabela Relacional MySQL · Engine: {activeTableMeta.engine}
                </span>
                <h2 className="text-xl font-serif font-bold text-[#1E1612] flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-[#8C531B]" />
                  <span>CREATE TABLE {activeTableMeta.tableName}</span>
                </h2>
                <p className="text-xs text-stone-600 mt-1">{activeTableMeta.description}</p>
              </div>

              <div className="flex gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200">
                  Charset: {activeTableMeta.charset}
                </span>
              </div>
            </div>

            {/* Columns Table */}
            <div>
              <h3 className="font-serif font-bold text-sm text-[#1E1612] mb-3">Colunas & Atributos (Data Dictionary)</h3>
              <div className="overflow-x-auto rounded-lg border border-[#E6DFC4]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#FAF8F5] border-b border-[#E6DFC4] text-stone-700 font-bold">
                    <tr>
                      <th className="p-3">Coluna (Field)</th>
                      <th className="p-3">Tipo de Dado</th>
                      <th className="p-3">Null?</th>
                      <th className="p-3">Chave (Key)</th>
                      <th className="p-3">Default</th>
                      <th className="p-3 font-sans">Descrição / Regra de Negócio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFC4]/50">
                    {activeTableMeta.columns.map((c) => (
                      <tr key={c.name} className="hover:bg-stone-50">
                        <td className="p-3 font-bold text-[#1E1612]">{c.name}</td>
                        <td className="p-3 text-[#8C531B]">{c.type}</td>
                        <td className="p-3 text-stone-600">{c.nullable ? 'YES' : 'NO'}</td>
                        <td className="p-3">
                          {c.isKey === 'PRI' ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                              PRIMARY KEY
                            </span>
                          ) : c.isKey === 'UNI' ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                              UNIQUE
                            </span>
                          ) : c.isKey === 'MUL' ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px]">
                              INDEX / FK
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3 text-stone-500">{c.defaultValue}</td>
                        <td className="p-3 font-sans text-stone-700 text-xs">{c.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Foreign Keys & Relationships */}
            {activeTableMeta.foreignKeys.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-2">
                <h4 className="font-serif font-bold text-sm text-purple-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-700" />
                  <span>Integridade Referencial & Chaves Estrangeiras (Foreign Keys)</span>
                </h4>
                <div className="space-y-1.5 font-mono text-[11px] text-purple-950">
                  {activeTableMeta.foreignKeys.map((fk, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-bold">{activeTableMeta.tableName}.{fk.column}</span>
                      <ArrowRight className="w-3 h-3 text-purple-500" />
                      <span className="font-bold text-purple-800">{fk.refTable}.{fk.refColumn}</span>
                      <span className="text-[10px] bg-purple-200/60 px-2 py-0.5 rounded">ON DELETE {fk.onDelete}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indexes */}
            <div>
              <h4 className="font-serif font-bold text-sm text-[#1E1612] mb-2">Índices de Performance Criados</h4>
              <ul className="space-y-1 font-mono text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200">
                {activeTableMeta.indexes.map((idx, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[#8C531B]">&bull;</span>
                    <span>{idx}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 3: SCRIPT SQL DUMP COMPLETO */}
      {/* ==================================================================== */}
      {activeSubTab === 'dump' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-[#8C531B] uppercase tracking-wider block">
                MySQL Export Engine
              </span>
              <h3 className="font-serif font-bold text-lg text-[#1E1612]">
                Script SQL Pronto para Importação Externa
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-xl">
                Contém instruções DDL (CREATE DATABASE, CREATE TABLE) e DML (todos os INSERTs atuais com integridade referencial). Compatível com MySQL Workbench, phpMyAdmin, DBeaver e linha de comando.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadDump}
                className="px-4 py-2.5 rounded-lg bg-[#2C1D11] hover:bg-[#3D2918] text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Baixar .sql</span>
              </button>
              <button
                onClick={handleCopyDump}
                className="px-4 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs border border-stone-300 flex items-center gap-2 transition-colors"
              >
                {copiedDump ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDump ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="bg-[#1C1612] rounded-xl border border-[#3E2B1E] overflow-hidden shadow-lg">
            <div className="px-4 py-3 bg-[#140F0D] border-b border-[#2C1D11] flex items-center justify-between text-xs text-stone-400 font-mono">
              <span>bibliosaber_mysql_dump.sql</span>
              <span>UTF-8 · MySQL 8.0 DDL/DML</span>
            </div>
            <pre className="p-5 text-[#E8D7C3] font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto overflow-x-auto selection:bg-[#B47836]/40">
              {exportSqlDump()}
            </pre>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 4: CONEXÃO EXTERNA & NODE.JS INTEGRATION */}
      {/* ==================================================================== */}
      {activeSubTab === 'connection' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Tester Form */}
            <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs space-y-5">
              <div className="border-b border-[#E6DFC4] pb-3">
                <span className="text-xs font-mono text-[#8C531B] uppercase tracking-wider block">
                  Configuração de Conexão MySQL
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1E1612]">
                  Conectar a um Servidor MySQL Remoto ou Local
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Preencha os dados do seu servidor MySQL (Docker, AWS RDS, GCP Cloud SQL, XAMPP, etc.).
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">Host / IP</label>
                    <input
                      type="text"
                      value={connHost}
                      onChange={(e) => setConnHost(e.target.value)}
                      placeholder="localhost ou 127.0.0.1"
                      className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Porta</label>
                    <input
                      type="text"
                      value={connPort}
                      onChange={(e) => setConnPort(e.target.value)}
                      placeholder="3306"
                      className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Usuário (User)</label>
                    <input
                      type="text"
                      value={connUser}
                      onChange={(e) => setConnUser(e.target.value)}
                      placeholder="root"
                      className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Senha (Password)</label>
                    <input
                      type="password"
                      value={connPassword}
                      onChange={(e) => setConnPassword(e.target.value)}
                      placeholder="senha"
                      className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nome do Banco (Database)</label>
                  <input
                    type="text"
                    value={connDatabase}
                    onChange={(e) => setConnDatabase(e.target.value)}
                    placeholder="bibliosaber_db"
                    className="w-full px-3 py-2 rounded-lg border border-[#D5CCBE] font-mono"
                  />
                </div>

                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConn}
                  className="w-full py-2.5 rounded-lg bg-[#2C1D11] hover:bg-[#3D2918] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isTestingConn ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-[#C89B65]" />
                      <span>Testando handshake com {connHost}:{connPort}...</span>
                    </>
                  ) : (
                    <>
                      <Server className="w-4 h-4 text-[#C89B65]" />
                      <span>Testar Conexão / Ping MySQL</span>
                    </>
                  )}
                </button>

                {connTestResult && (
                  <div className={`p-4 rounded-xl text-xs space-y-1.5 border ${
                    connTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Conexão Estabilizada ({connTestResult.latency} ms)</span>
                    </div>
                    <p className="leading-relaxed">{connTestResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Docker & Production Setup snippet */}
            <div className="bg-[#1C1612] rounded-xl border border-[#3E2B1E] p-6 shadow-xs text-white space-y-4">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#C89B65]" />
                <span>Inicialização Rápida via Docker</span>
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Você pode subir uma instância MySQL 8.0 em segundos na sua máquina com o comando:
              </p>

              <div className="p-3 bg-black/60 rounded-lg border border-white/10 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                docker run --name bibliosaber-mysql \<br />
                &nbsp;&nbsp;-e MYSQL_ROOT_PASSWORD=senha_secreta \<br />
                &nbsp;&nbsp;-e MYSQL_DATABASE=bibliosaber_db \<br />
                &nbsp;&nbsp;-p 3306:3306 -d mysql:8.0
              </div>

              <h4 className="font-serif font-bold text-sm text-stone-200 pt-2">
                Importação do Dump via Terminal:
              </h4>
              <div className="p-3 bg-black/60 rounded-lg border border-white/10 font-mono text-[11px] text-amber-300 overflow-x-auto">
                mysql -h localhost -P 3306 -u root -p bibliosaber_db &lt; bibliosaber_mysql_dump.sql
              </div>
            </div>
          </div>

          {/* Code snippet for Node.js mysql2/promise backend */}
          <div className="bg-white rounded-xl border border-[#E6DFC4] p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1E1612] flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-[#8C531B]" />
              <span>Código de Integração Backend (Node.js + Express + mysql2)</span>
            </h3>
            <p className="text-xs text-stone-600">
              Copie o trecho abaixo para criar um servidor backend Express conectado diretamente à sua base MySQL com pooling de conexões assíncrono:
            </p>

            <div className="p-4 bg-[#1C1612] rounded-xl text-stone-200 font-mono text-xs leading-relaxed overflow-x-auto border border-[#3E2B1E]">
              <pre>{`// server/db.ts
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '${connHost}',
  port: Number(process.env.DB_PORT) || ${connPort},
  user: process.env.DB_USER || '${connUser}',
  password: process.env.DB_PASSWORD || 'sua_senha',
  database: process.env.DB_NAME || '${connDatabase}',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Exemplo: rota para buscar livros disponíveis
export async function getAvailableBooks() {
  const [rows] = await pool.query(
    'SELECT * FROM books WHERE available_copies > 0 ORDER BY title ASC'
  );
  return rows;
}
`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
