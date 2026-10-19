import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import {
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Database,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, activeTab, setActiveTab }) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    unreadCount,
  } = useLibrary();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const userNotifications = notifications.filter(
    (n) => !n.userId || (currentUser && n.userId === currentUser.id)
  );

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'danger':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />;
    }
  };

  const switchDemoUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setShowUserDropdown(false);
      if (target.role === 'bibliotecaria') {
        setActiveTab('circulacao');
      } else {
        setActiveTab('acervo');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E6DFC4]/80 shadow-[0_1px_3px_rgba(30,22,18,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          
          {/* Zone 1: Single text element wordmark in display face */}
          <div
            onClick={() => setActiveTab(currentUser?.role === 'bibliotecaria' ? 'circulacao' : 'acervo')}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-lg bg-[#2C1D11] border border-[#B47836]/30 flex items-center justify-center text-[#E8D7C3] shadow-xs">
              <span className="font-serif font-black text-xl italic tracking-tighter">B</span>
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-[#1E1612] whitespace-nowrap shrink-0">
              Biblio<span className="text-[#8C531B] italic font-normal">Saber</span>
            </span>
          </div>

          {/* Zone 2: 4-5 clean single-line nav links with hover underlines */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-700">
            {currentUser?.role === 'aluno' ? (
              <>
                <button
                  onClick={() => setActiveTab('acervo')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 relative ${
                    activeTab === 'acervo'
                      ? 'text-[#1E1612] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
                      : 'hover:text-[#1E1612]'
                  }`}
                >
                  Acervo Literário
                </button>
                <button
                  onClick={() => setActiveTab('meus-emprestimos')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 relative ${
                    activeTab === 'meus-emprestimos'
                      ? 'text-[#1E1612] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
                      : 'hover:text-[#1E1612]'
                  }`}
                >
                  Meus Empréstimos & Reservas
                </button>
                <button
                  onClick={() => setActiveTab('sql-database')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 relative flex items-center gap-1.5 ${
                    activeTab === 'sql-database'
                      ? 'text-[#1E1612] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
                      : 'hover:text-[#1E1612]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-[#8C531B]" />
                  <span>Terminal MySQL</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('circulacao')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 relative ${
                    activeTab === 'circulacao'
                      ? 'text-[#1E1612] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
                      : 'hover:text-[#1E1612]'
                  }`}
                >
                  Circulação & Balcão
                </button>
                <button
                  onClick={() => setActiveTab('inventario')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 relative ${
                    activeTab === 'inventario'
                      ? 'text-[#1E1612] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
                      : 'hover:text-[#1E1612]'
                  }`}
                >
                  Catálogo do Acervo
                </button>
                <button
                  onClick={() => setActiveTab('relatorios')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 relative ${
                    activeTab === 'relatorios'
                      ? 'text-[#1E1612] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
                      : 'hover:text-[#1E1612]'
                  }`}
                >
                  Relatórios Analíticos
                </button>
                <button
                  onClick={() => setActiveTab('sql-database')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 relative flex items-center gap-1.5 ${
                    activeTab === 'sql-database'
                      ? 'text-[#1E1612] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
                      : 'hover:text-[#1E1612]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-[#8C531B]" />
                  <span>Banco de Dados SQL</span>
                </button>
                <button
                  onClick={() => setActiveTab('configuracoes')}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 relative ${
                    activeTab === 'configuracoes'
                      ? 'text-[#1E1612] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8C531B]'
                      : 'hover:text-[#1E1612]'
                  }`}
                >
                  Configurações
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: 1 primary action area */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2.5 rounded-lg text-stone-700 hover:text-[#1E1612] hover:bg-stone-200/50 transition-colors"
                title="Avisos e prazos de devolução"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#8C2424] text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FAF8F5] rounded-xl shadow-xl border border-[#E6DFC4] py-3 z-50">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-[#E6DFC4]">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#1E1612]">
                        Notificações & Avisos de Prazo
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-[#8C531B] hover:underline font-medium"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E6DFC4]/50 text-xs">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center text-stone-500 font-sans">
                        Nenhum aviso pendente no momento.
                      </div>
                    ) : (
                      userNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={`p-3.5 hover:bg-stone-100/60 transition-colors cursor-pointer flex gap-3 ${
                            !notif.read ? 'bg-amber-50/70' : ''
                          }`}
                        >
                          {getNotifIcon(notif.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`font-semibold text-stone-900 truncate ${!notif.read ? 'font-bold text-[#1E1612]' : ''}`}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8C531B] shrink-0" />
                              )}
                            </div>
                            <p className="text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-stone-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-lg border border-[#E6DFC4] hover:bg-stone-100/70 transition-all text-left"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-stone-300"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-[#1E1612] leading-tight truncate max-w-[130px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-stone-500 font-sans">
                      {currentUser.role === 'bibliotecaria' ? 'Bibliotecária' : 'Aluno'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500 hidden sm:block" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#FAF8F5] rounded-xl shadow-xl border border-[#E6DFC4] py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#E6DFC4]">
                      <span className="text-[10px] uppercase tracking-wider text-stone-500 font-sans block">
                        Usuário Conectado
                      </span>
                      <p className="font-serif font-bold text-sm text-[#1E1612] truncate mt-0.5">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-stone-600 truncate">{currentUser.email}</p>
                      <p className="text-[11px] font-mono text-[#8C531B] mt-1">
                        Matrícula/ID: {currentUser.registrationNumber}
                      </p>
                    </div>

                    <div className="px-3 py-2">
                      <span className="text-[10px] uppercase tracking-wider text-stone-500 font-sans block mb-1 px-1">
                        Alternar Usuário de Teste:
                      </span>
                      <div className="space-y-1">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => switchDemoUser(u.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              currentUser.id === u.id
                                ? 'bg-[#EFE8DC] text-[#1E1612] font-semibold'
                                : 'text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <span className="truncate">{u.name}</span>
                            <span className="text-[10px] text-stone-500 font-sans">
                              {u.role === 'bibliotecaria' ? 'Bibliotecária' : 'Aluno'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-[#E6DFC4] pt-1 px-2">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAuth();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-700 hover:bg-stone-100 rounded-md"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-stone-500" />
                        <span>Novo Cadastro / Trocar Perfil</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setCurrentUser(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-md"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2C1D11] hover:bg-[#3D2918] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                Acessar Portal
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
