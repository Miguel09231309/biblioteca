export type UserRole = 'aluno' | 'bibliotecaria';

export type BookGenre =
  | 'Literatura Brasileira'
  | 'Ficção Científica'
  | 'Romance'
  | 'Fantasia'
  | 'Tecnologia & Computação'
  | 'História & Filosofia'
  | 'Ciências & Biologia'
  | 'Autoajuda & Negócios'
  | 'HQ & Mangá'
  | 'Poesia & Teatro';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: BookGenre;
  isbn: string;
  publishedYear: number;
  publisher: string;
  totalCopies: number;
  availableCopies: number;
  location: string; // Ex: "Estante A1 - Prateleira 2"
  coverUrl: string;
  synopsis: string;
  pages: number;
  spineColor?: string; // Para personalização 3D da lombada
  createdAt: string; // ISO string
}

export type LoanStatus = 'pendente' | 'aprovado' | 'devolvido' | 'recusado';

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRegistration: string; // Matrícula
  requestDate: string; // ISO
  approvalDate?: string;
  dueDate: string; // ISO (Data prevista para devolução)
  returnDate?: string; // ISO
  status: LoanStatus;
  renewalsCount: number;
  fineAmount: number; // R$
  finePaid: boolean;
  notes?: string;
}

export type ReservationStatus = 'ativa' | 'disponivel_retirada' | 'concluida' | 'cancelada';

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRegistration: string;
  reservedAt: string;
  expectedAvailableDate: string;
  availableUntil?: string; // Validade de 48h para retirada
  status: ReservationStatus;
  queuePosition: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  registrationNumber: string; // Matrícula escolar/acadêmica ou ID bibliotecária
  courseOrDepartment?: string;
  phone: string;
  avatarUrl?: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface LibraryNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  createdAt: string;
  read: boolean;
  relatedBookId?: string;
  relatedLoanId?: string;
}

export interface SystemSettings {
  dailyFineAmount: number; // ex: 2.00
  standardLoanDays: number; // ex: 14 dias
  gracePeriodDays: number; // ex: 1 dia
  maxBooksPerStudent: number; // ex: 3 livros
  maxRenewalsAllowed: number; // ex: 2 renovações
  librarianAccessCode: string;
  libraryName: string;
  institutionName: string;
  contactEmail: string;
}

export interface SqlQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  affectedRows?: number;
  queryType?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'SHOW' | 'DESCRIBE' | 'OTHER';
  message?: string;
  error?: string;
}
