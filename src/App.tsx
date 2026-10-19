/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { LibrarianPortal } from './components/LibrarianPortal';
import { BookDetailModal } from './components/BookDetailModal';
import { AuthModal } from './components/AuthModal';
import { MySqlConsole } from './components/MySqlConsole';
import { Book, UserRole } from './types/library';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  ArrowRightLeft,
  Database,
} from 'lucide-react';

function LibraryAppContent() {
  const { currentUser, setCurrentUser, users, settings } = useLibrary();

  // Active view: 'acervo' | 'meus-emprestimos' | 'circulacao' | 'inventario' | 'relatorios' | 'sql-database' | 'alunos' | 'configuracoes'
  const [activeTab, setActiveTab] = useState<string>('acervo');

  // Modal states
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [defaultAuthRole, setDefaultAuthRole] = useState<UserRole>('aluno');

  const currentRole: UserRole = currentUser?.role || 'aluno';

  // Quick switch role
  const handleToggleRole = () => {
    if (currentRole === 'aluno') {
      const lib = users.find((u) => u.role === 'bibliotecaria');
      if (lib) {
        setCurrentUser(lib);
        setActiveTab('circulacao');
      } else {
        setDefaultAuthRole('bibliotecaria');
        setIsAuthOpen(true);
      }
    } else {
      const student = users.find((u) => u.role === 'aluno');
      if (student) {
        setCurrentUser(student);
        setActiveTab('acervo');
      } else {
        setDefaultAuthRole('aluno');
        setIsAuthOpen(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E1612] flex flex-col font-sans selection:bg-[#B47836]/25 selection:text-[#3B220C]">
      {/* Top Utility & Role Indicator Strip */}
      <div className="bg-[#1C1612] text-[#D4C5B3] text-xs py-2 px-4 border-b border-[#3E2B1E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              Ambiente de Navegação:{' '}
              <strong className="text-white font-serif">
                {currentUser ? `${currentUser.name} (${currentUser.role === 'bibliotecaria' ? 'Bibliotecária' : 'Aluno'})` : 'Visitante'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('sql-database')}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold flex items-center gap-1.5 transition-colors border ${
                activeTab === 'sql-database'
                  ? 'bg-[#B47836] text-white border-[#B47836]'
                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80 shadow-xs'
              }`}
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Console MySQL</span>
            </button>
            <button
              onClick={handleToggleRole}
              className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/15 text-[#C89B65] font-semibold text-[11px] flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>
                Alternar para {currentRole === 'aluno' ? 'Bibliotecária' : 'Aluno'}
              </span>
            </button>
            <button
              onClick={() => {
                setDefaultAuthRole(currentRole === 'aluno' ? 'bibliotecaria' : 'aluno');
                setIsAuthOpen(true);
              }}
              className="text-[11px] text-stone-400 hover:text-white underline"
            >
              Identificação & Cadastros
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'sql-database' ? (
          <MySqlConsole />
        ) : currentRole === 'aluno' ? (
          <StudentPortal
            onSelectBook={(book) => setSelectedBook(book)}
            onOpenAuth={() => setIsAuthOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ) : (
          <LibrarianPortal
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenBookDetail={(book) => setSelectedBook(book)}
          />
        )}
      </main>

      {/* Book Detail & Loan / Reservation Modal */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Authentication & Dual Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultRole={defaultAuthRole}
      />

      {/* Editorial Footer */}
      <footer className="mt-auto bg-[#1C1612] text-[#D4C5B3] border-t border-[#3E2B1E] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[#2C1D11] border border-[#B47836]/30 flex items-center justify-center text-[#E8D7C3]">
                  <span className="font-serif font-bold text-base italic">B</span>
                </div>
                <span className="font-serif font-bold text-lg text-white">
                  Biblio<span className="text-[#C89B65] italic font-normal">Saber</span>
                </span>
              </div>
              <p className="text-stone-400 leading-relaxed text-[11px]">
                Plataforma integrada de curadoria literária, circulação de acervo físico e gestão relacional para comunidades escolares e universitárias.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#C89B65] font-mono">
                <Database className="w-3.5 h-3.5" />
                <span>Motor Relacional SQL Ativo (MySQL / Postgres Ready)</span>
              </div>
            </div>

            <div>
              <h4 className="font-serif font-bold text-white text-sm mb-3">Políticas Institucionais</h4>
              <ul className="space-y-1.5 text-stone-400 text-[11px]">
                <li>&bull; Prazo padrão de leitura: <strong className="text-stone-200">{settings.standardLoanDays} dias corridos</strong></li>
                <li>&bull; Multa por atraso configurada: <strong className="text-stone-200">R$ {settings.dailyFineAmount.toFixed(2)} / dia</strong></li>
                <li>&bull; Tolerância de carência: <strong className="text-stone-200">{settings.gracePeriodDays} dia(s)</strong></li>
                <li>&bull; Máximo simultâneo por aluno: <strong className="text-stone-200">{settings.maxBooksPerStudent} obras</strong></li>
                <li>&bull; Renovações online: <strong className="text-stone-200">{settings.maxRenewalsAllowed} vezes permitidas</strong></li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-bold text-white text-sm mb-3">Portais e Cadastros</h4>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <button
                    onClick={() => {
                      setDefaultAuthRole('aluno');
                      setIsAuthOpen(true);
                    }}
                    className="text-stone-300 hover:text-white flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-[#C89B65]" />
                    <span>Cadastro de Aluno (Matrícula Escolar)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setDefaultAuthRole('bibliotecaria');
                      setIsAuthOpen(true);
                    }}
                    className="text-stone-300 hover:text-white flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Acesso da Bibliotecária (Institucional)</span>
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-bold text-white text-sm mb-3">Atendimento & Informações</h4>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                {settings.institutionName}<br />
                {settings.libraryName}<br />
                Atendimento: <a href={`mailto:${settings.contactEmail}`} className="text-[#C89B65] hover:underline">{settings.contactEmail}</a><br />
                Horário: Segunda a Sexta, das 07h30 às 21h30.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
            <p>&copy; {new Date().getFullYear()} BiblioSaber · Todos os direitos reservados.</p>
            <p>Atelier Biblioteconômico com Arquitetura de Dados Relacional</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <LibraryAppContent />
    </LibraryProvider>
  );
}
