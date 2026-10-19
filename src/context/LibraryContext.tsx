import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Book,
  Loan,
  Reservation,
  User,
  SystemSettings,
  LibraryNotification,
  BookGenre,
  SqlQueryResult,
} from '../types/library';
import {
  SEED_BOOKS,
  SEED_USERS,
  SEED_LOANS,
  SEED_RESERVATIONS,
  SEED_NOTIFICATIONS,
  INITIAL_SETTINGS,
  addDays,
} from '../data/seedData';
import { SqlDatabaseEngine } from '../db/sqlEngine';

const STORAGE_KEY = 'bibliosaber_db_v1';

interface LibraryContextType {
  // State
  currentUser: User | null;
  users: User[];
  books: Book[];
  loans: Loan[];
  reservations: Reservation[];
  notifications: LibraryNotification[];
  settings: SystemSettings;

  // Auth & User Actions
  setCurrentUser: (user: User | null) => void;
  registerStudent: (data: Omit<User, 'id' | 'role' | 'createdAt' | 'isBlocked'>) => { success: boolean; message: string; user?: User };
  registerLibrarian: (data: Omit<User, 'id' | 'role' | 'createdAt' | 'isBlocked'>, code: string) => { success: boolean; message: string; user?: User };
  loginUser: (emailOrReg: string) => { success: boolean; message: string; user?: User };
  toggleBlockUser: (userId: string) => void;

  // Book & Inventory Actions
  addBook: (bookData: Omit<Book, 'id' | 'createdAt' | 'availableCopies'>) => void;
  updateBook: (id: string, bookData: Partial<Book>) => void;
  deleteBook: (id: string) => { success: boolean; message: string };
  getExpectedReturnDate: (bookId: string) => string | null;

  // Loans & Circulation
  requestLoan: (bookId: string, notes?: string) => { success: boolean; message: string };
  approveLoan: (loanId: string) => { success: boolean; message: string };
  rejectLoan: (loanId: string, reason?: string) => { success: boolean; message: string };
  returnBook: (loanId: string, finePaid?: boolean, notes?: string) => { success: boolean; message: string };
  renewLoan: (loanId: string) => { success: boolean; message: string };
  payFine: (loanId: string) => void;
  directIssueLoan: (bookId: string, studentId: string) => { success: boolean; message: string };

  // Reservations
  reserveBook: (bookId: string) => { success: boolean; message: string };
  cancelReservation: (reservationId: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;

  // Settings & DB
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetToDefaultData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => { success: boolean; message: string };
  exportSqlDump: () => string;
  executeSql: (query: string) => SqlQueryResult;

  // Reports Helpers
  getNeverBorrowedBooks: () => Book[];
  getMonthlyStats: () => {
    totalLoansThisMonth: number;
    activeLoansCount: number;
    overdueLoansCount: number;
    returnedOnTimeCount: number;
    returnedLateCount: number;
    totalFinesCollected: number;
    totalFinesPending: number;
    topReaders: { user: User; count: number }[];
    genreDistribution: { genre: BookGenre; count: number }[];
  };
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state or fallback to seed
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_current_user`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return SEED_USERS[1]; // Lucas Silveira (Student) default
      }
    }
    return SEED_USERS[1];
  });

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_books`);
    return saved ? JSON.parse(saved) : SEED_BOOKS;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_loans`);
    return saved ? JSON.parse(saved) : SEED_LOANS;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reservations`);
    return saved ? JSON.parse(saved) : SEED_RESERVATIONS;
  });

  const [notifications, setNotifications] = useState<LibraryNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_current_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_books`, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_loans`, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_reservations`, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  // Automated notification and fine recalculation on loan deadlines
  useEffect(() => {
    const now = new Date();
    let hasFineChanges = false;
    const newNotifications: LibraryNotification[] = [];

    const updatedLoans = loans.map((loan) => {
      if (loan.status !== 'aprovado') return loan;

      const due = new Date(loan.dueDate);
      const diffTime = now.getTime() - due.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Overdue check
      if (diffDays > settings.gracePeriodDays) {
        const calculatedFine = Number(((diffDays - settings.gracePeriodDays) * settings.dailyFineAmount).toFixed(2));
        if (loan.fineAmount !== calculatedFine && !loan.finePaid) {
          hasFineChanges = true;
          // Check if notification already exists
          const existingNotif = notifications.find(
            (n) => n.relatedLoanId === loan.id && n.type === 'danger'
          );
          if (!existingNotif) {
            newNotifications.push({
              id: `notif-overdue-${loan.id}-${Date.now()}`,
              userId: loan.userId,
              title: `Empréstimo em Atraso (${diffDays} dias)`,
              message: `O livro "${loan.bookTitle}" está atrasado. Multa atual: R$ ${calculatedFine.toFixed(2)}. Regularize sua situação com a biblioteca.`,
              type: 'danger',
              createdAt: now.toISOString(),
              read: false,
              relatedBookId: loan.bookId,
              relatedLoanId: loan.id,
            });
          }
          return { ...loan, fineAmount: calculatedFine };
        }
      } else if (diffDays <= 0 && diffDays >= -2) {
        // Approaching deadline in 48 hours
        const daysLeft = Math.abs(diffDays);
        const existingWarning = notifications.find(
          (n) => n.relatedLoanId === loan.id && n.type === 'warning'
        );
        if (!existingWarning) {
          newNotifications.push({
            id: `notif-warning-${loan.id}-${Date.now()}`,
            userId: loan.userId,
            title: `Prazo de Devolução Próximo (${daysLeft === 0 ? 'Hoje' : `${daysLeft} dia(s)`})`,
            message: `O livro "${loan.bookTitle}" vence ${daysLeft === 0 ? 'hoje' : `em ${daysLeft} dia(s)`}. Devolva ou solicite renovação para evitar multas de R$ ${settings.dailyFineAmount.toFixed(2)}/dia.`,
            type: 'warning',
            createdAt: now.toISOString(),
            read: false,
            relatedBookId: loan.bookId,
            relatedLoanId: loan.id,
          });
        }
      }

      return loan;
    });

    if (hasFineChanges) {
      setLoans(updatedLoans);
    }
    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev]);
    }
  }, [settings.dailyFineAmount, settings.gracePeriodDays]);

  // Helper: Find earliest expected return date for unavailable books
  const getExpectedReturnDate = (bookId: string): string | null => {
    const book = books.find((b) => b.id === bookId);
    if (!book || book.availableCopies > 0) return null;

    const activeLoans = loans
      .filter((l) => l.bookId === bookId && l.status === 'aprovado')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (activeLoans.length > 0) {
      return activeLoans[0].dueDate;
    }
    return null;
  };

  // User Registration: Student
  const registerStudent = (data: Omit<User, 'id' | 'role' | 'createdAt' | 'isBlocked'>) => {
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === data.email.toLowerCase() ||
        u.registrationNumber.toLowerCase() === data.registrationNumber.toLowerCase()
    );
    if (existing) {
      return { success: false, message: 'Já existe um cadastro com este E-mail ou Matrícula!' };
    }

    const newUser: User = {
      ...data,
      id: `user-student-${Date.now()}`,
      role: 'aluno',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    // Welcome notification
    setNotifications((prev) => [
      {
        id: `notif-welcome-${newUser.id}`,
        userId: newUser.id,
        title: 'Bem-vindo ao BiblioSaber!',
        message: 'Seu cadastro de aluno foi realizado com sucesso. Explore o acervo e aproveite para reservar e emprestar livros.',
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return { success: true, message: 'Cadastro de aluno criado com sucesso!', user: newUser };
  };

  // User Registration: Librarian
  const registerLibrarian = (data: Omit<User, 'id' | 'role' | 'createdAt' | 'isBlocked'>, code: string) => {
    if (code.trim() !== settings.librarianAccessCode.trim()) {
      return {
        success: false,
        message: 'Código de autorização institucional incorreto! Solicite o código da coordenação.',
      };
    }

    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return { success: false, message: 'Já existe um usuário com este e-mail!' };
    }

    const newLib: User = {
      ...data,
      id: `user-lib-${Date.now()}`,
      role: 'bibliotecaria',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    };

    setUsers((prev) => [...prev, newLib]);
    setCurrentUser(newLib);

    return { success: true, message: 'Perfil de Bibliotecária cadastrado com sucesso!', user: newLib };
  };

  // Login
  const loginUser = (emailOrReg: string) => {
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === emailOrReg.trim().toLowerCase() ||
        u.registrationNumber.toLowerCase() === emailOrReg.trim().toLowerCase()
    );

    if (!found) {
      return { success: false, message: 'Usuário não encontrado. Verifique seu e-mail ou matrícula.' };
    }

    if (found.isBlocked) {
      return {
        success: false,
        message: 'Acesso bloqueado temporariamente por pendências/multas em atraso na biblioteca. Contate a bibliotecária.',
      };
    }

    setCurrentUser(found);
    return { success: true, message: `Bem-vindo de volta, ${found.name}!`, user: found };
  };

  const toggleBlockUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u))
    );
  };

  // Add Book
  const addBook = (bookData: Omit<Book, 'id' | 'createdAt' | 'availableCopies'>) => {
    const newBook: Book = {
      ...bookData,
      id: `book-${Date.now()}`,
      availableCopies: bookData.totalCopies,
      createdAt: new Date().toISOString(),
      coverUrl:
        bookData.coverUrl ||
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
    };

    setBooks((prev) => [newBook, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-newbook-${Date.now()}`,
        title: 'Novo Livro no Acervo!',
        message: `O livro "${newBook.title}" de ${newBook.author} foi adicionado à biblioteca com ${newBook.totalCopies} exemplares.`,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false,
        relatedBookId: newBook.id,
      },
      ...prev,
    ]);
  };

  // Update Book
  const updateBook = (id: string, bookData: Partial<Book>) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, ...bookData };
        // adjust available copies if total copies changed
        if (bookData.totalCopies !== undefined) {
          const borrowedCount = b.totalCopies - b.availableCopies;
          updated.availableCopies = Math.max(0, bookData.totalCopies - borrowedCount);
        }
        return updated;
      })
    );
  };

  // Delete Book
  const deleteBook = (id: string) => {
    const activeLoan = loans.find(
      (l) => l.bookId === id && (l.status === 'aprovado' || l.status === 'pendente')
    );
    if (activeLoan) {
      return {
        success: false,
        message: 'Não é possível excluir este livro pois existem exemplares emprestados ou com solicitação pendente!',
      };
    }

    setBooks((prev) => prev.filter((b) => b.id !== id));
    return { success: true, message: 'Livro removido do catálogo com sucesso.' };
  };

  // Request Loan (Student)
  const requestLoan = (bookId: string, notes?: string) => {
    if (!currentUser) {
      return { success: false, message: 'Faça login para solicitar um empréstimo.' };
    }
    if (currentUser.role !== 'aluno') {
      return { success: false, message: 'Apenas alunos podem solicitar empréstimos.' };
    }
    if (currentUser.isBlocked) {
      return { success: false, message: 'Seu cadastro está bloqueado devido a pendências de multas ou atrasos.' };
    }

    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, message: 'Livro não encontrado.' };

    if (book.availableCopies <= 0) {
      return {
        success: false,
        message: 'Todos os exemplares deste livro estão emprestados. Você pode fazer uma reserva online!',
      };
    }

    // Check active loans limit
    const activeStudentLoans = loans.filter(
      (l) => l.userId === currentUser.id && (l.status === 'aprovado' || l.status === 'pendente')
    );
    if (activeStudentLoans.length >= settings.maxBooksPerStudent) {
      return {
        success: false,
        message: `Você já atingiu o limite máximo de ${settings.maxBooksPerStudent} livros emprestados simultaneamente.`,
      };
    }

    // Check if already requested this specific book
    const alreadyHasThisBook = activeStudentLoans.some((l) => l.bookId === bookId);
    if (alreadyHasThisBook) {
      return {
        success: false,
        message: 'Você já possui uma solicitação ou empréstimo ativo deste mesmo livro.',
      };
    }

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverUrl,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRegistration: currentUser.registrationNumber,
      requestDate: new Date().toISOString(),
      dueDate: addDays(new Date(), settings.standardLoanDays),
      status: 'pendente',
      renewalsCount: 0,
      fineAmount: 0,
      finePaid: false,
      notes: notes || 'Solicitação online via portal do aluno',
    };

    setLoans((prev) => [newLoan, ...prev]);

    // Notify librarian
    setNotifications((prev) => [
      {
        id: `notif-req-${Date.now()}`,
        title: 'Nova Solicitação de Empréstimo',
        message: `${currentUser.name} (${currentUser.registrationNumber}) solicitou o livro "${book.title}".`,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false,
        relatedBookId: book.id,
        relatedLoanId: newLoan.id,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Solicitação do livro "${book.title}" enviada! Aguarde a aprovação da bibliotecária.`,
    };
  };

  // Direct Issue Loan (Librarian issues book to student at desk)
  const directIssueLoan = (bookId: string, studentId: string) => {
    const student = users.find((u) => u.id === studentId);
    if (!student) return { success: false, message: 'Aluno não encontrado.' };
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, message: 'Livro não encontrado.' };
    if (book.availableCopies <= 0) return { success: false, message: 'Não há exemplares disponíveis.' };

    const activeStudentLoans = loans.filter(
      (l) => l.userId === student.id && (l.status === 'aprovado' || l.status === 'pendente')
    );
    if (activeStudentLoans.length >= settings.maxBooksPerStudent) {
      return { success: false, message: `Aluno já atingiu o limite de ${settings.maxBooksPerStudent} livros.` };
    }

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverUrl,
      userId: student.id,
      userName: student.name,
      userEmail: student.email,
      userRegistration: student.registrationNumber,
      requestDate: new Date().toISOString(),
      approvalDate: new Date().toISOString(),
      dueDate: addDays(new Date(), settings.standardLoanDays),
      status: 'aprovado',
      renewalsCount: 0,
      fineAmount: 0,
      finePaid: false,
      notes: 'Empréstimo direto emitido no balcão pela bibliotecária.',
    };

    setLoans((prev) => [newLoan, ...prev]);
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );

    // Notify student
    setNotifications((prev) => [
      {
        id: `notif-direct-${Date.now()}`,
        userId: student.id,
        title: 'Empréstimo Emitido no Balcão!',
        message: `O livro "${book.title}" foi retirado. Data prevista para devolução: ${new Date(newLoan.dueDate).toLocaleDateString('pt-BR')}.`,
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false,
        relatedBookId: book.id,
        relatedLoanId: newLoan.id,
      },
      ...prev,
    ]);

    return { success: true, message: `Empréstimo de "${book.title}" emitido com sucesso para ${student.name}!` };
  };

  // Approve Loan (Librarian)
  const approveLoan = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, message: 'Empréstimo não encontrado.' };

    const book = books.find((b) => b.id === loan.bookId);
    if (!book) return { success: false, message: 'Livro associado não encontrado.' };

    if (book.availableCopies <= 0) {
      return { success: false, message: 'Sem exemplares disponíveis no momento para aprovar este empréstimo.' };
    }

    const now = new Date();
    const dueDate = addDays(now, settings.standardLoanDays);

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'aprovado',
              approvalDate: now.toISOString(),
              dueDate,
            }
          : l
      )
    );

    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );

    // Notify student
    setNotifications((prev) => [
      {
        id: `notif-appr-${Date.now()}`,
        userId: loan.userId,
        title: 'Empréstimo Aprovado!',
        message: `Sua solicitação do livro "${loan.bookTitle}" foi aprovada! Retire no balcão da biblioteca. Prazo para devolução: ${new Date(dueDate).toLocaleDateString('pt-BR')}.`,
        type: 'success',
        createdAt: now.toISOString(),
        read: false,
        relatedBookId: loan.bookId,
        relatedLoanId: loan.id,
      },
      ...prev,
    ]);

    return { success: true, message: `Empréstimo de "${loan.bookTitle}" aprovado com sucesso!` };
  };

  // Reject Loan (Librarian)
  const rejectLoan = (loanId: string, reason?: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, message: 'Empréstimo não encontrado.' };

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'recusado', notes: reason || 'Recusado pela bibliotecária.' } : l))
    );

    setNotifications((prev) => [
      {
        id: `notif-rej-${Date.now()}`,
        userId: loan.userId,
        title: 'Solicitação de Empréstimo Recusada',
        message: `Sua solicitação de "${loan.bookTitle}" não pôde ser atendida: ${reason || 'Contate a bibliotecária para esclarecimentos.'}`,
        type: 'danger',
        createdAt: new Date().toISOString(),
        read: false,
        relatedBookId: loan.bookId,
      },
      ...prev,
    ]);

    return { success: true, message: 'Solicitação recusada.' };
  };

  // Return Book (Librarian)
  const returnBook = (loanId: string, finePaid: boolean = true, notes?: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, message: 'Empréstimo não encontrado.' };
    if (loan.status === 'devolvido') return { success: false, message: 'Este livro já foi devolvido.' };

    const now = new Date();
    const due = new Date(loan.dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let finalFine = loan.fineAmount;
    if (diffDays > settings.gracePeriodDays && !loan.finePaid) {
      finalFine = Number(((diffDays - settings.gracePeriodDays) * settings.dailyFineAmount).toFixed(2));
    }

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'devolvido',
              returnDate: now.toISOString(),
              fineAmount: finalFine,
              finePaid: finePaid || finalFine === 0,
              notes: notes || l.notes || 'Devolução registrada no sistema.',
            }
          : l
      )
    );

    // Increment book available copies
    setBooks((prev) =>
      prev.map((b) => (b.id === loan.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b))
    );

    // Check if there is an active reservation waiting for this book
    const nextReservation = reservations.find(
      (r) => r.bookId === loan.bookId && r.status === 'ativa'
    );

    if (nextReservation) {
      const pickupUntil = addDays(now, 2); // 48h to pick up
      setReservations((prev) =>
        prev.map((r) =>
          r.id === nextReservation.id
            ? { ...r, status: 'disponivel_retirada', availableUntil: pickupUntil }
            : r
        )
      );

      // Automated notification to student holding the reservation
      setNotifications((prev) => [
        {
          id: `notif-res-ready-${Date.now()}`,
          userId: nextReservation.userId,
          title: 'Livro Reservado Disponível para Retirada!',
          message: `O livro "${nextReservation.bookTitle}" foi devolvido e está reservado para você no balcão até ${new Date(pickupUntil).toLocaleDateString('pt-BR')}.`,
          type: 'success',
          createdAt: now.toISOString(),
          read: false,
          relatedBookId: nextReservation.bookId,
        },
        ...prev,
      ]);
    }

    // Notify student about successful return
    setNotifications((prev) => [
      {
        id: `notif-ret-${Date.now()}`,
        userId: loan.userId,
        title: 'Devolução Confirmada',
        message: `O livro "${loan.bookTitle}" foi devolvido com sucesso. ${finalFine > 0 ? (finePaid ? 'Multa quitada no ato.' : `Multa pendente: R$ ${finalFine.toFixed(2)}.`) : 'Sem pendências.'}`,
        type: finalFine > 0 && !finePaid ? 'danger' : 'info',
        createdAt: now.toISOString(),
        read: false,
        relatedBookId: loan.bookId,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Devolução de "${loan.bookTitle}" registrada! ${finalFine > 0 ? `(Multa: R$ ${finalFine.toFixed(2)})` : ''}`,
    };
  };

  // Renew Loan (Student or Librarian)
  const renewLoan = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, message: 'Empréstimo não encontrado.' };
    if (loan.status !== 'aprovado') return { success: false, message: 'Apenas empréstimos ativos podem ser renovados.' };

    if (loan.renewalsCount >= settings.maxRenewalsAllowed) {
      return {
        success: false,
        message: `Você já atingiu o limite de ${settings.maxRenewalsAllowed} renovações para este livro.`,
      };
    }

    // Check if book has reservations from other users
    const hasReservation = reservations.some(
      (r) => r.bookId === loan.bookId && r.status === 'ativa' && r.userId !== loan.userId
    );
    if (hasReservation) {
      return {
        success: false,
        message: 'Não é possível renovar: existem outros alunos na fila de reserva deste livro!',
      };
    }

    // Check if currently overdue
    const now = new Date();
    const due = new Date(loan.dueDate);
    if (now > due) {
      return {
        success: false,
        message: 'Livro em atraso não pode ser renovado online. Compareça ao balcão da biblioteca.',
      };
    }

    const newDueDate = addDays(due, settings.standardLoanDays);

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              dueDate: newDueDate,
              renewalsCount: l.renewalsCount + 1,
            }
          : l
      )
    );

    setNotifications((prev) => [
      {
        id: `notif-ren-${Date.now()}`,
        userId: loan.userId,
        title: 'Empréstimo Renovado!',
        message: `O prazo de "${loan.bookTitle}" foi estendido até ${new Date(newDueDate).toLocaleDateString('pt-BR')}. (${loan.renewalsCount + 1}/${settings.maxRenewalsAllowed} renovações)`,
        type: 'success',
        createdAt: now.toISOString(),
        read: false,
        relatedBookId: loan.bookId,
        relatedLoanId: loan.id,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Renovado com sucesso! Nova data de devolução: ${new Date(newDueDate).toLocaleDateString('pt-BR')}`,
    };
  };

  // Pay Fine
  const payFine = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, finePaid: true } : l))
    );
  };

  // Reserve Book (Student)
  const reserveBook = (bookId: string) => {
    if (!currentUser) return { success: false, message: 'Faça login para reservar um livro.' };
    if (currentUser.role !== 'aluno') return { success: false, message: 'Apenas alunos podem fazer reservas.' };
    if (currentUser.isBlocked) return { success: false, message: 'Cadastro bloqueado por pendências de multas.' };

    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, message: 'Livro não encontrado.' };

    // Check if user already reserved or holds this book
    const alreadyReserved = reservations.some(
      (r) => r.bookId === bookId && r.userId === currentUser.id && (r.status === 'ativa' || r.status === 'disponivel_retirada')
    );
    if (alreadyReserved) {
      return { success: false, message: 'Você já possui uma reserva ativa para este livro.' };
    }

    const alreadyBorrowed = loans.some(
      (l) => l.bookId === bookId && l.userId === currentUser.id && (l.status === 'aprovado' || l.status === 'pendente')
    );
    if (alreadyBorrowed) {
      return { success: false, message: 'Você já possui um empréstimo ou solicitação deste livro em andamento.' };
    }

    const existingQueue = reservations.filter((r) => r.bookId === bookId && r.status === 'ativa');
    const queuePosition = existingQueue.length + 1;
    const expectedDate = getExpectedReturnDate(bookId) || addDays(new Date(), settings.standardLoanDays);

    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverUrl,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRegistration: currentUser.registrationNumber,
      reservedAt: new Date().toISOString(),
      expectedAvailableDate: expectedDate,
      status: 'ativa',
      queuePosition,
    };

    setReservations((prev) => [...prev, newReservation]);

    setNotifications((prev) => [
      {
        id: `notif-res-placed-${Date.now()}`,
        userId: currentUser.id,
        title: 'Reserva Confirmada!',
        message: `Sua reserva para "${book.title}" foi registrada (Posição ${queuePosition} na fila). Você será notificado assim que o livro for devolvido.`,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false,
        relatedBookId: book.id,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Reserva de "${book.title}" efetuada! Posição na fila: ${queuePosition}.`,
    };
  };

  const cancelReservation = (reservationId: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelada' } : r))
    );
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => {
        if (!n.userId || n.userId === currentUser.id) {
          return { ...n, read: true };
        }
        return n;
      })
    );
  };

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return notifications.filter(
      (n) => !n.read && (!n.userId || n.userId === currentUser.id)
    ).length;
  }, [notifications, currentUser]);

  // Settings
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDefaultData = () => {
    setUsers(SEED_USERS);
    setCurrentUser(SEED_USERS[1]);
    setBooks(SEED_BOOKS);
    setLoans(SEED_LOANS);
    setReservations(SEED_RESERVATIONS);
    setNotifications(SEED_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
  };

  const exportDatabaseJson = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users,
      books,
      loans,
      reservations,
      notifications,
      settings,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJson = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.books || !data.users || !data.loans) {
        return { success: false, message: 'Arquivo JSON inválido para a base da biblioteca.' };
      }
      setUsers(data.users || SEED_USERS);
      setBooks(data.books || SEED_BOOKS);
      setLoans(data.loans || SEED_LOANS);
      setReservations(data.reservations || []);
      setNotifications(data.notifications || []);
      setSettings(data.settings || INITIAL_SETTINGS);
      return { success: true, message: 'Base de dados importada com sucesso!' };
    } catch {
      return { success: false, message: 'Erro ao analisar arquivo JSON.' };
    }
  };

  const exportSqlDump = () => {
    return SqlDatabaseEngine.generateSqlDump(books, users, loans, reservations, settings);
  };

  const executeSql = (query: string): SqlQueryResult => {
    const { result, updatedState } = SqlDatabaseEngine.executeQuery(query, {
      books,
      users,
      loans,
      reservations,
      settings,
    });

    if (updatedState) {
      if (updatedState.books) setBooks(updatedState.books);
      if (updatedState.users) setUsers(updatedState.users);
      if (updatedState.loans) setLoans(updatedState.loans);
      if (updatedState.reservations) setReservations(updatedState.reservations);
      if (updatedState.settings) setSettings(updatedState.settings as SystemSettings);
    }

    return result;
  };

  // Helper: Books that have NEVER been borrowed
  const getNeverBorrowedBooks = (): Book[] => {
    const borrowedBookIds = new Set(loans.map((l) => l.bookId));
    return books.filter((b) => !borrowedBookIds.has(b.id));
  };

  // Helper: Monthly activities report
  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const loansThisMonth = loans.filter((l) => {
      const date = new Date(l.requestDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const activeLoans = loans.filter((l) => l.status === 'aprovado');

    const overdueLoans = activeLoans.filter((l) => {
      const due = new Date(l.dueDate);
      return now.getTime() > due.getTime();
    });

    const completedReturns = loans.filter((l) => l.status === 'devolvido');
    let returnedOnTimeCount = 0;
    let returnedLateCount = 0;

    completedReturns.forEach((l) => {
      if (!l.returnDate) return;
      const ret = new Date(l.returnDate);
      const due = new Date(l.dueDate);
      if (ret <= due) {
        returnedOnTimeCount++;
      } else {
        returnedLateCount++;
      }
    });

    const totalFinesCollected = loans
      .filter((l) => l.finePaid && l.fineAmount > 0)
      .reduce((sum, l) => sum + l.fineAmount, 0);

    const totalFinesPending = loans
      .filter((l) => !l.finePaid && l.fineAmount > 0)
      .reduce((sum, l) => sum + l.fineAmount, 0);

    // Top Readers
    const readerCounts: Record<string, number> = {};
    loans.forEach((l) => {
      readerCounts[l.userId] = (readerCounts[l.userId] || 0) + 1;
    });

    const topReaders = Object.entries(readerCounts)
      .map(([userId, count]) => {
        const user = users.find((u) => u.id === userId);
        return user ? { user, count } : null;
      })
      .filter((item): item is { user: User; count: number } => item !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Genre Distribution
    const genreCounts: Record<string, number> = {};
    loans.forEach((l) => {
      const book = books.find((b) => b.id === l.bookId);
      if (book) {
        genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
      }
    });

    const genreDistribution = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre: genre as BookGenre, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLoansThisMonth: loansThisMonth.length,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      returnedOnTimeCount,
      returnedLateCount,
      totalFinesCollected,
      totalFinesPending,
      topReaders,
      genreDistribution,
    };
  };

  return (
    <LibraryContext.Provider
      value={{
        currentUser,
        users,
        books,
        loans,
        reservations,
        notifications,
        settings,
        setCurrentUser,
        registerStudent,
        registerLibrarian,
        loginUser,
        toggleBlockUser,
        addBook,
        updateBook,
        deleteBook,
        getExpectedReturnDate,
        requestLoan,
        approveLoan,
        rejectLoan,
        returnBook,
        renewLoan,
        payFine,
        directIssueLoan,
        reserveBook,
        cancelReservation,
        markNotificationAsRead,
        clearNotifications,
        unreadCount,
        updateSettings,
        resetToDefaultData,
        exportDatabaseJson,
        importDatabaseJson,
        exportSqlDump,
        executeSql,
        getNeverBorrowedBooks,
        getMonthlyStats,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary deve ser utilizado dentro de um LibraryProvider');
  }
  return context;
};
