import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import {
  X,
  GraduationCap,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  BookOpen,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types/library';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultRole = 'aluno' }) => {
  const { registerStudent, registerLibrarian, loginUser, users, setCurrentUser, settings } = useLibrary();

  const [activeRole, setActiveRole] = useState<UserRole>(defaultRole);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    courseOrDepartment: '',
    phone: '',
    password: '',
  });

  // Librarian Form State
  const [librarianForm, setLibrarianForm] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    courseOrDepartment: 'Coordenação Bibliotecária & Gestão de Acervo',
    phone: '',
    accessCode: 'BIBLIO2026',
    password: '',
  });

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');

  if (!isOpen) return null;

  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!studentForm.name || !studentForm.email || !studentForm.registrationNumber) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const res = registerStudent({
      name: studentForm.name,
      email: studentForm.email,
      registrationNumber: studentForm.registrationNumber,
      courseOrDepartment: studentForm.courseOrDepartment || 'Geral',
      phone: studentForm.phone || '(11) 99999-0000',
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLibrarianRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!librarianForm.name || !librarianForm.email || !librarianForm.registrationNumber) {
      setErrorMsg('Por favor, preencha os dados da bibliotecária.');
      return;
    }

    const res = registerLibrarian(
      {
        name: librarianForm.name,
        email: librarianForm.email,
        registrationNumber: librarianForm.registrationNumber,
        courseOrDepartment: librarianForm.courseOrDepartment,
        phone: librarianForm.phone || '(11) 98888-0000',
      },
      librarianForm.accessCode
    );

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Informe seu e-mail ou número de matrícula.');
      return;
    }

    const res = loginUser(loginIdentifier);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const quickLoginAs = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E6DFC4] w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#2C1D11] text-[#FAF8F5] relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-sans text-[#C89B65]">
              Controle de Acesso Institucional
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Portal da Biblioteca
          </h3>
          <p className="text-xs text-stone-300 mt-1">
            Acesso e cadastros separados para o corpo discente e coordenação bibliotecária.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex border-b border-[#E6DFC4] bg-[#F2EDE4] p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveRole('aluno');
              setErrorMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeRole === 'aluno'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Cadastro do Aluno</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('bibliotecaria');
              setErrorMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeRole === 'bibliotecaria'
                ? 'bg-white text-amber-900 shadow-xs border border-amber-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Área da Bibliotecária</span>
          </button>
        </div>

        {/* Sub-modes: Novo Cadastro vs Já sou cadastrado */}
        <div className="px-6 pt-4 flex gap-4 text-xs font-medium border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`pb-1 transition-colors ${
              authMode === 'register'
                ? 'text-amber-800 border-b-2 border-amber-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Novo Cadastro
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`pb-1 transition-colors ${
              authMode === 'login'
                ? 'text-amber-800 border-b-2 border-amber-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Já possuo conta (Entrar)
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {authMode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail institucional ou Matrícula
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="ex: lucas.silveira@aluno... ou 2024-ENG-0412"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    defaultValue="123456"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-md transition-colors"
              >
                Entrar no Sistema
              </button>
            </form>
          ) : activeRole === 'aluno' ? (
            /* Student Registration Form */
            <form onSubmit={handleStudentRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo do Aluno *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="Ex: Beatriz Lima"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nº Matrícula / RA *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.registrationNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, registrationNumber: e.target.value })}
                    placeholder="Ex: 2026-LET-0199"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Curso / Turma
                  </label>
                  <input
                    type="text"
                    value={studentForm.courseOrDepartment}
                    onChange={(e) => setStudentForm({ ...studentForm, courseOrDepartment: e.target.value })}
                    placeholder="Ex: Letras (2º Ano)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Institucional *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      placeholder="aluno@escola.edu.br"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition-colors"
              >
                Concluir Cadastro do Aluno
              </button>
            </form>
          ) : (
            /* Librarian Registration Form */
            <form onSubmit={handleLibrarianRegister} className="space-y-3.5">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Atenção:</strong> O cadastro da bibliotecária concede privilégios administrativos totais para gerenciar inventário, aprovar empréstimos e registrar devoluções. É necessário o código institucional.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Bibliotecária *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={librarianForm.name}
                    onChange={(e) => setLibrarianForm({ ...librarianForm, name: e.target.value })}
                    placeholder="Ex: Profa. Mariana Albuquerque"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nº Registro Profissional (CRB / ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={librarianForm.registrationNumber}
                    onChange={(e) => setLibrarianForm({ ...librarianForm, registrationNumber: e.target.value })}
                    placeholder="Ex: BIB-9921"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Acesso Institucional *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-amber-700 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={librarianForm.accessCode}
                      onChange={(e) => setLibrarianForm({ ...librarianForm, accessCode: e.target.value })}
                      placeholder="BIBLIO2026"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs sm:text-sm font-mono font-bold text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                  <span className="text-[10px] text-slate-700 mt-0.5 block">
                    Padrão de demonstração: <code>BIBLIO2026</code>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Institucional *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={librarianForm.email}
                    onChange={(e) => setLibrarianForm({ ...librarianForm, email: e.target.value })}
                    placeholder="biblioteca@saberviva.edu.br"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm shadow-md transition-colors"
              >
                Cadastrar Bibliotecária
              </button>
            </form>
          )}

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <p className="text-xs font-semibold text-slate-700">
                Acesso Rápido de Teste (Sem digitar):
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAs('user-student-1')}
                className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-left transition-colors"
              >
                <p className="text-xs font-bold text-emerald-900">Lucas Silveira</p>
                <p className="text-[10px] text-emerald-800">Aluno (Engenharia)</p>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('user-lib-1')}
                className="p-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-left transition-colors"
              >
                <p className="text-xs font-bold text-amber-900">Dra. Helena Martins</p>
                <p className="text-[10px] text-amber-800">Bibliotecária-Chefe</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
