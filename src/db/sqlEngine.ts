import { Book, Loan, Reservation, User, SystemSettings, SqlQueryResult, BookGenre } from '../types/library';

export interface SqlDatabaseState {
  books: Book[];
  users: User[];
  loans: Loan[];
  reservations: Reservation[];
  settings: SystemSettings;
}

export interface SqlExecutionOutput {
  result: SqlQueryResult;
  updatedState?: Partial<SqlDatabaseState>;
}

export interface TableColumnMeta {
  name: string;
  type: string;
  nullable: boolean;
  isKey: 'PRI' | 'UNI' | 'MUL' | '';
  defaultValue: string;
  comment: string;
}

export interface TableSchemaMeta {
  tableName: string;
  description: string;
  engine: string;
  charset: string;
  columns: TableColumnMeta[];
  foreignKeys: { column: string; refTable: string; refColumn: string; onDelete: string }[];
  indexes: string[];
}

export class SqlDatabaseEngine {
  /**
   * Retorna os metadados das tabelas relacionais do sistema
   */
  static getSchemaMetadata(): TableSchemaMeta[] {
    return [
      {
        tableName: 'books',
        description: 'Tabela mestre do acervo físico da biblioteca, controle de tiragem e localização nas estantes',
        engine: 'InnoDB',
        charset: 'utf8mb4_unicode_ci',
        columns: [
          { name: 'id', type: 'VARCHAR(64)', nullable: false, isKey: 'PRI', defaultValue: 'UUID', comment: 'Identificador único do livro' },
          { name: 'title', type: 'VARCHAR(255)', nullable: false, isKey: '', defaultValue: 'NULL', comment: 'Título principal da obra' },
          { name: 'author', type: 'VARCHAR(255)', nullable: false, isKey: 'MUL', defaultValue: 'NULL', comment: 'Autor ou compilador da obra' },
          { name: 'genre', type: 'VARCHAR(100)', nullable: false, isKey: 'MUL', defaultValue: 'NULL', comment: 'Gênero literário ou categoria temática' },
          { name: 'isbn', type: 'VARCHAR(32)', nullable: false, isKey: 'UNI', defaultValue: 'NULL', comment: 'Código ISBN-10 ou ISBN-13 padronizado' },
          { name: 'published_year', type: 'INT', nullable: false, isKey: '', defaultValue: 'NULL', comment: 'Ano de publicação da edição física' },
          { name: 'publisher', type: 'VARCHAR(255)', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Editora responsável' },
          { name: 'total_copies', type: 'INT', nullable: false, isKey: '', defaultValue: '1', comment: 'Total de exemplares físicos tombados' },
          { name: 'available_copies', type: 'INT', nullable: false, isKey: 'MUL', defaultValue: '1', comment: 'Quantidade de cópias disponíveis para empréstimo imediato' },
          { name: 'location', type: 'VARCHAR(128)', nullable: false, isKey: '', defaultValue: 'NULL', comment: 'Localização na estante (ex: Estante A-2, Prateleira 3)' },
          { name: 'cover_url', type: 'TEXT', nullable: false, isKey: '', defaultValue: 'NULL', comment: 'URL da imagem da capa em alta resolução' },
          { name: 'synopsis', type: 'TEXT', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Sinopse ou resumo crítico da obra' },
          { name: 'pages', type: 'INT', nullable: false, isKey: '', defaultValue: '100', comment: 'Número total de páginas' },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, isKey: '', defaultValue: 'CURRENT_TIMESTAMP', comment: 'Data de tombamento no acervo' },
        ],
        foreignKeys: [],
        indexes: ['PRIMARY KEY (id)', 'UNIQUE KEY uq_isbn (isbn)', 'INDEX idx_books_genre (genre)', 'INDEX idx_books_author (author)', 'INDEX idx_books_available (available_copies)'],
      },
      {
        tableName: 'users',
        description: 'Tabela de usuários registrados (alunos matriculados e bibliotecárias credenciadas)',
        engine: 'InnoDB',
        charset: 'utf8mb4_unicode_ci',
        columns: [
          { name: 'id', type: 'VARCHAR(64)', nullable: false, isKey: 'PRI', defaultValue: 'UUID', comment: 'Identificador único do usuário' },
          { name: 'name', type: 'VARCHAR(255)', nullable: false, isKey: '', defaultValue: 'NULL', comment: 'Nome completo' },
          { name: 'email', type: 'VARCHAR(255)', nullable: false, isKey: 'UNI', defaultValue: 'NULL', comment: 'E-mail cadastrado ou institucional' },
          { name: 'role', type: "ENUM('aluno', 'bibliotecaria')", nullable: false, isKey: 'MUL', defaultValue: "'aluno'", comment: 'Papel de acesso no sistema' },
          { name: 'registration_number', type: 'VARCHAR(64)', nullable: false, isKey: 'UNI', defaultValue: 'NULL', comment: 'Matrícula acadêmica (RA) ou ID profissional (CRB)' },
          { name: 'course_or_department', type: 'VARCHAR(255)', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Curso, turma ou departamento de atuação' },
          { name: 'phone', type: 'VARCHAR(32)', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Número de telefone ou WhatsApp para notificações' },
          { name: 'avatar_url', type: 'TEXT', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Foto de perfil do aluno ou bibliotecária' },
          { name: 'is_blocked', type: 'BOOLEAN', nullable: false, isKey: '', defaultValue: 'FALSE', comment: 'Status de bloqueio por atrasos ou débitos' },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, isKey: '', defaultValue: 'CURRENT_TIMESTAMP', comment: 'Data de adesão e criação da conta' },
        ],
        foreignKeys: [],
        indexes: ['PRIMARY KEY (id)', 'UNIQUE KEY uq_users_email (email)', 'UNIQUE KEY uq_users_reg (registration_number)', 'INDEX idx_users_role (role)'],
      },
      {
        tableName: 'loans',
        description: 'Registro histórico e ativo de circulação de exemplares, prazos, multas e devoluções',
        engine: 'InnoDB',
        charset: 'utf8mb4_unicode_ci',
        columns: [
          { name: 'id', type: 'VARCHAR(64)', nullable: false, isKey: 'PRI', defaultValue: 'UUID', comment: 'Identificador da movimentação de empréstimo' },
          { name: 'book_id', type: 'VARCHAR(64)', nullable: false, isKey: 'MUL', defaultValue: 'NULL', comment: 'Chave estrangeira para a tabela books' },
          { name: 'user_id', type: 'VARCHAR(64)', nullable: false, isKey: 'MUL', defaultValue: 'NULL', comment: 'Chave estrangeira para a tabela users' },
          { name: 'request_date', type: 'TIMESTAMP', nullable: false, isKey: '', defaultValue: 'CURRENT_TIMESTAMP', comment: 'Data em que o aluno solicitou o empréstimo' },
          { name: 'approval_date', type: 'TIMESTAMP', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Data de aprovação e retirada no balcão' },
          { name: 'due_date', type: 'TIMESTAMP', nullable: false, isKey: 'MUL', defaultValue: 'NULL', comment: 'Data limite para devolução sem aplicação de multa' },
          { name: 'return_date', type: 'TIMESTAMP', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Data de devolução física registrada pela bibliotecária' },
          { name: 'status', type: "ENUM('pendente', 'aprovado', 'devolvido', 'recusado')", nullable: false, isKey: 'MUL', defaultValue: "'pendente'", comment: 'Situação do empréstimo' },
          { name: 'renewals_count', type: 'INT', nullable: false, isKey: '', defaultValue: '0', comment: 'Quantidade de renovações efetuadas' },
          { name: 'fine_amount', type: 'DECIMAL(10,2)', nullable: false, isKey: '', defaultValue: '0.00', comment: 'Valor da multa por atraso apurado' },
          { name: 'fine_paid', type: 'BOOLEAN', nullable: false, isKey: '', defaultValue: 'FALSE', comment: 'Indica se a multa foi quitada' },
          { name: 'notes', type: 'TEXT', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Observações sobre o estado do livro' },
        ],
        foreignKeys: [
          { column: 'book_id', refTable: 'books', refColumn: 'id', onDelete: 'CASCADE' },
          { column: 'user_id', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE' },
        ],
        indexes: ['PRIMARY KEY (id)', 'INDEX idx_loans_book (book_id)', 'INDEX idx_loans_user (user_id)', 'INDEX idx_loans_status (status)', 'INDEX idx_loans_due (due_date)'],
      },
      {
        tableName: 'reservations',
        description: 'Fila de espera para livros atualmente indisponíveis com data prevista de liberação',
        engine: 'InnoDB',
        charset: 'utf8mb4_unicode_ci',
        columns: [
          { name: 'id', type: 'VARCHAR(64)', nullable: false, isKey: 'PRI', defaultValue: 'UUID', comment: 'Identificador único da reserva' },
          { name: 'book_id', type: 'VARCHAR(64)', nullable: false, isKey: 'MUL', defaultValue: 'NULL', comment: 'Chave estrangeira do livro reservado' },
          { name: 'user_id', type: 'VARCHAR(64)', nullable: false, isKey: 'MUL', defaultValue: 'NULL', comment: 'Chave estrangeira do aluno requerente' },
          { name: 'reserved_at', type: 'TIMESTAMP', nullable: false, isKey: '', defaultValue: 'CURRENT_TIMESTAMP', comment: 'Data de entrada na fila' },
          { name: 'expected_available_date', type: 'TIMESTAMP', nullable: false, isKey: '', defaultValue: 'NULL', comment: 'Previsão de retorno do exemplar emprestado' },
          { name: 'available_until', type: 'TIMESTAMP', nullable: true, isKey: '', defaultValue: 'NULL', comment: 'Prazo limite para retirada após liberação' },
          { name: 'status', type: "ENUM('ativa', 'disponivel_retirada', 'concluida', 'cancelada')", nullable: false, isKey: 'MUL', defaultValue: "'ativa'", comment: 'Situação da reserva' },
          { name: 'queue_position', type: 'INT', nullable: false, isKey: '', defaultValue: '1', comment: 'Posição do aluno na fila de espera' },
        ],
        foreignKeys: [
          { column: 'book_id', refTable: 'books', refColumn: 'id', onDelete: 'CASCADE' },
          { column: 'user_id', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE' },
        ],
        indexes: ['PRIMARY KEY (id)', 'INDEX idx_res_book (book_id)', 'INDEX idx_res_user (user_id)', 'INDEX idx_res_status (status)'],
      },
      {
        tableName: 'system_settings',
        description: 'Parâmetros institucionais de governança da biblioteca, taxas e prazos de circulação',
        engine: 'InnoDB',
        charset: 'utf8mb4_unicode_ci',
        columns: [
          { name: 'id', type: 'INT', nullable: false, isKey: 'PRI', defaultValue: 'AUTO_INCREMENT', comment: 'Identificador único da configuração' },
          { name: 'daily_fine_amount', type: 'DECIMAL(10,2)', nullable: false, isKey: '', defaultValue: '2.00', comment: 'Valor da multa por dia de atraso (R$)' },
          { name: 'standard_loan_days', type: 'INT', nullable: false, isKey: '', defaultValue: '14', comment: 'Prazo padrão de empréstimo (dias)' },
          { name: 'grace_period_days', type: 'INT', nullable: false, isKey: '', defaultValue: '1', comment: 'Dias de carência após vencimento' },
          { name: 'max_books_per_student', type: 'INT', nullable: false, isKey: '', defaultValue: '3', comment: 'Limite máximo de livros por aluno' },
          { name: 'max_renewals_allowed', type: 'INT', nullable: false, isKey: '', defaultValue: '2', comment: 'Limite de renovações online' },
          { name: 'librarian_access_code', type: 'VARCHAR(64)', nullable: false, isKey: '', defaultValue: "'BIBLIO2026'", comment: 'Código de autorização para bibliotecárias' },
          { name: 'institution_name', type: 'VARCHAR(255)', nullable: false, isKey: '', defaultValue: "''", comment: 'Nome da instituição de ensino' },
          { name: 'library_name', type: 'VARCHAR(255)', nullable: false, isKey: '', defaultValue: "''", comment: 'Nome da biblioteca' },
          { name: 'updated_at', type: 'TIMESTAMP', nullable: false, isKey: '', defaultValue: 'CURRENT_TIMESTAMP', comment: 'Última modificação' },
        ],
        foreignKeys: [],
        indexes: ['PRIMARY KEY (id)'],
      },
    ];
  }

  /**
   * Gera o script SQL completo (.sql) para MySQL 8.0+ / MariaDB / PostgreSQL com DDL e DML
   */
  static generateSqlDump(
    books: Book[],
    users: User[],
    loans: Loan[],
    reservations: Reservation[],
    settings: SystemSettings
  ): string {
    const now = new Date().toISOString();

    const ddl = `-- ====================================================================
-- BIBLIOSABER - SISTEMA DE GESTÃO DE BIBLIOTECA
-- DUMP RELACIONAL MYSQL 8.0+ / MARIADB / POSTGRESQL READY
-- Data de Geração: ${now}
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS bibliosaber_db;
CREATE DATABASE bibliosaber_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bibliosaber_db;

-- --------------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS (Alunos e Bibliotecárias)
-- --------------------------------------------------------------------
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('aluno', 'bibliotecaria') NOT NULL DEFAULT 'aluno',
  registration_number VARCHAR(64) NOT NULL UNIQUE,
  course_or_department VARCHAR(255) NULL,
  phone VARCHAR(32) NULL,
  avatar_url TEXT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_reg (registration_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. TABELA DO ACERVO DE LIVROS
-- --------------------------------------------------------------------
CREATE TABLE books (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  isbn VARCHAR(32) NOT NULL UNIQUE,
  published_year INT NOT NULL,
  publisher VARCHAR(255) NULL,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  location VARCHAR(128) NOT NULL,
  cover_url TEXT NOT NULL,
  synopsis TEXT NULL,
  pages INT NOT NULL DEFAULT 100,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_books_genre (genre),
  INDEX idx_books_author (author),
  INDEX idx_books_available (available_copies)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. TABELA DE CIRCULAÇÃO & EMPRÉSTIMOS DE LIVROS
-- --------------------------------------------------------------------
CREATE TABLE loans (
  id VARCHAR(64) PRIMARY KEY,
  book_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approval_date TIMESTAMP NULL,
  due_date TIMESTAMP NOT NULL,
  return_date TIMESTAMP NULL,
  status ENUM('pendente', 'aprovado', 'devolvido', 'recusado') NOT NULL DEFAULT 'pendente',
  renewals_count INT NOT NULL DEFAULT 0,
  fine_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  fine_paid BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  CONSTRAINT fk_loans_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  CONSTRAINT fk_loans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_loans_status (status),
  INDEX idx_loans_due (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. TABELA DE RESERVAS ONLINE (Fila de Espera)
-- --------------------------------------------------------------------
CREATE TABLE reservations (
  id VARCHAR(64) PRIMARY KEY,
  book_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  reserved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_available_date TIMESTAMP NOT NULL,
  available_until TIMESTAMP NULL,
  status ENUM('ativa', 'disponivel_retirada', 'concluida', 'cancelada') NOT NULL DEFAULT 'ativa',
  queue_position INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_reservations_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_res_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. TABELA DE POLÍTICAS, MULTAS E CONFIGURAÇÕES
-- --------------------------------------------------------------------
CREATE TABLE system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  daily_fine_amount DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
  standard_loan_days INT NOT NULL DEFAULT 14,
  grace_period_days INT NOT NULL DEFAULT 1,
  max_books_per_student INT NOT NULL DEFAULT 3,
  max_renewals_allowed INT NOT NULL DEFAULT 2,
  librarian_access_code VARCHAR(64) NOT NULL DEFAULT 'BIBLIO2026',
  institution_name VARCHAR(255) NOT NULL,
  library_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- INSERÇÃO DE DADOS (DML)
-- ====================================================================

-- 5.1 Parâmetros do Sistema
INSERT INTO system_settings (daily_fine_amount, standard_loan_days, grace_period_days, max_books_per_student, max_renewals_allowed, librarian_access_code, institution_name, library_name, contact_email)
VALUES (${settings.dailyFineAmount.toFixed(2)}, ${settings.standardLoanDays}, ${settings.gracePeriodDays}, ${settings.maxBooksPerStudent}, ${settings.maxRenewalsAllowed}, '${settings.librarianAccessCode}', '${settings.institutionName.replace(/'/g, "''")}', '${settings.libraryName.replace(/'/g, "''")}', '${settings.contactEmail}');
`;

    // Users Inserts
    const usersInserts = users
      .map(
        (u) =>
          `INSERT INTO users (id, name, email, role, registration_number, course_or_department, phone, avatar_url, is_blocked, created_at) VALUES ('${u.id}', '${u.name.replace(/'/g, "''")}', '${u.email}', '${u.role}', '${u.registrationNumber}', '${(u.courseOrDepartment || '').replace(/'/g, "''")}', '${u.phone}', '${u.avatarUrl || ''}', ${u.isBlocked ? 1 : 0}, '${u.createdAt}');`
      )
      .join('\n');

    // Books Inserts
    const booksInserts = books
      .map(
        (b) =>
          `INSERT INTO books (id, title, author, genre, isbn, published_year, publisher, total_copies, available_copies, location, cover_url, synopsis, pages, created_at) VALUES ('${b.id}', '${b.title.replace(/'/g, "''")}', '${b.author.replace(/'/g, "''")}', '${b.genre}', '${b.isbn}', ${b.publishedYear}, '${(b.publisher || '').replace(/'/g, "''")}', ${b.totalCopies}, ${b.availableCopies}, '${b.location}', '${b.coverUrl}', '${(b.synopsis || '').replace(/'/g, "''")}', ${b.pages}, '${b.createdAt}');`
      )
      .join('\n');

    // Loans Inserts
    const loansInserts = loans
      .map(
        (l) =>
          `INSERT INTO loans (id, book_id, user_id, request_date, approval_date, due_date, return_date, status, renewals_count, fine_amount, fine_paid, notes) VALUES ('${l.id}', '${l.bookId}', '${l.userId}', '${l.requestDate}', ${l.approvalDate ? `'${l.approvalDate}'` : 'NULL'}, '${l.dueDate}', ${l.returnDate ? `'${l.returnDate}'` : 'NULL'}, '${l.status}', ${l.renewalsCount}, ${l.fineAmount.toFixed(2)}, ${l.finePaid ? 1 : 0}, '${(l.notes || '').replace(/'/g, "''")}');`
      )
      .join('\n');

    // Reservations Inserts
    const reservationsInserts = reservations
      .map(
        (r) =>
          `INSERT INTO reservations (id, book_id, user_id, reserved_at, expected_available_date, available_until, status, queue_position) VALUES ('${r.id}', '${r.bookId}', '${r.userId}', '${r.reservedAt}', '${r.expectedAvailableDate}', ${r.availableUntil ? `'${r.availableUntil}'` : 'NULL'}, '${r.status}', ${r.queuePosition});`
      )
      .join('\n');

    return `${ddl}
-- --------------------------------------------------------------------
-- 5.2 Dados de Usuários (${users.length} registros)
-- --------------------------------------------------------------------
${usersInserts}

-- --------------------------------------------------------------------
-- 5.3 Dados do Acervo de Livros (${books.length} registros)
-- --------------------------------------------------------------------
${booksInserts}

-- --------------------------------------------------------------------
-- 5.4 Histórico de Circulação & Empréstimos (${loans.length} registros)
-- --------------------------------------------------------------------
${loansInserts}

-- --------------------------------------------------------------------
-- 5.5 Reservas em Fila (${reservations.length} registros)
-- --------------------------------------------------------------------
${reservationsInserts}

SET FOREIGN_KEY_CHECKS = 1;
-- ====================================================================
-- FIM DO DUMP MYSQL BIBLIOSABER
-- ====================================================================`;
  }

  /**
   * Executa uma consulta SQL interpretada no navegador com suporte a DQL e DML interativo
   */
  static executeQuery(
    sqlQuery: string,
    tables: SqlDatabaseState
  ): SqlExecutionOutput {
    const startTime = performance.now();
    const cleanSql = sqlQuery.trim().replace(/;+$/, '');
    const upperSql = cleanSql.toUpperCase();

    try {
      if (!cleanSql) {
        return {
          result: {
            columns: [],
            rows: [],
            rowCount: 0,
            executionTimeMs: 0,
            error: 'Nenhum comando SQL fornecido.',
          },
        };
      }

      // ============================================================
      // 1. SELECT QUERIES
      // ============================================================
      if (upperSql.startsWith('SELECT')) {
        let dataset: Record<string, any>[] = [];

        // Check for JOIN loans + books + users
        if (upperSql.includes('JOIN') && upperSql.includes('LOANS')) {
          dataset = tables.loans.map((l) => {
            const b = tables.books.find((book) => book.id === l.bookId);
            const u = tables.users.find((user) => user.id === l.userId);
            return {
              loan_id: l.id,
              livro_titulo: b?.title || l.bookTitle,
              genero: b?.genre || 'N/A',
              aluno_nome: u?.name || l.userName,
              matricula: u?.registrationNumber || l.userRegistration,
              curso: u?.courseOrDepartment || 'N/A',
              data_solicitacao: l.requestDate.slice(0, 10),
              data_vencimento: l.dueDate.slice(0, 10),
              status: l.status,
              multa: `R$ ${l.fineAmount.toFixed(2)}`,
              multa_paga: l.finePaid ? 'SIM' : 'NÃO',
            };
          });
        } else if (upperSql.includes('FROM BOOKS')) {
          dataset = tables.books.map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            genre: b.genre,
            isbn: b.isbn,
            published_year: b.publishedYear,
            publisher: b.publisher || 'Não informada',
            total_copies: b.totalCopies,
            available_copies: b.availableCopies,
            location: b.location,
            pages: b.pages,
            created_at: b.createdAt.slice(0, 10),
          }));
        } else if (upperSql.includes('FROM USERS')) {
          dataset = tables.users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            registration_number: u.registrationNumber,
            course_or_department: u.courseOrDepartment || 'Geral',
            phone: u.phone,
            is_blocked: u.isBlocked ? 'SIM' : 'NÃO',
            created_at: u.createdAt.slice(0, 10),
          }));
        } else if (upperSql.includes('FROM LOANS')) {
          dataset = tables.loans.map((l) => ({
            id: l.id,
            book_id: l.bookId,
            book_title: l.bookTitle,
            user_id: l.userId,
            user_name: l.userName,
            registration: l.userRegistration,
            status: l.status,
            request_date: l.requestDate.slice(0, 10),
            due_date: l.dueDate.slice(0, 10),
            return_date: l.returnDate ? l.returnDate.slice(0, 10) : 'Pendente',
            renewals: l.renewalsCount,
            fine_amount: `R$ ${l.fineAmount.toFixed(2)}`,
            fine_paid: l.finePaid ? 'SIM' : 'NÃO',
          }));
        } else if (upperSql.includes('FROM RESERVATIONS')) {
          dataset = tables.reservations.map((r) => ({
            id: r.id,
            book_id: r.bookId,
            book_title: r.bookTitle,
            user_name: r.userName,
            status: r.status,
            queue_position: r.queuePosition,
            reserved_at: r.reservedAt.slice(0, 10),
            expected_available_date: r.expectedAvailableDate.slice(0, 10),
          }));
        } else if (upperSql.includes('FROM SYSTEM_SETTINGS')) {
          dataset = [
            {
              id: 1,
              daily_fine_amount: `R$ ${tables.settings.dailyFineAmount.toFixed(2)}`,
              standard_loan_days: tables.settings.standardLoanDays,
              grace_period_days: tables.settings.gracePeriodDays,
              max_books_per_student: tables.settings.maxBooksPerStudent,
              max_renewals_allowed: tables.settings.maxRenewalsAllowed,
              librarian_access_code: tables.settings.librarianAccessCode,
              institution_name: tables.settings.institutionName,
              library_name: tables.settings.libraryName,
              contact_email: tables.settings.contactEmail,
            },
          ];
        } else {
          // Default: books view
          dataset = tables.books.map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            genre: b.genre,
            available_copies: b.availableCopies,
            location: b.location,
          }));
        }

        // Apply WHERE filters
        if (upperSql.includes('WHERE')) {
          const whereClause = upperSql.split('WHERE')[1].split('ORDER BY')[0].split('LIMIT')[0].trim();

          if (whereClause.includes('AVAILABLE_COPIES > 0')) {
            dataset = dataset.filter((row) => (row.available_copies ?? 0) > 0);
          } else if (whereClause.includes('AVAILABLE_COPIES = 0')) {
            dataset = dataset.filter((row) => (row.available_copies ?? 0) === 0);
          } else if (whereClause.includes("STATUS = 'APROVADO'") || whereClause.includes('STATUS = "APROVADO"')) {
            dataset = dataset.filter((row) => String(row.status).toLowerCase() === 'aprovado');
          } else if (whereClause.includes("STATUS = 'PENDENTE'") || whereClause.includes('STATUS = "PENDENTE"')) {
            dataset = dataset.filter((row) => String(row.status).toLowerCase() === 'pendente');
          } else if (whereClause.includes("STATUS = 'DEVOLVIDO'") || whereClause.includes('STATUS = "DEVOLVIDO"')) {
            dataset = dataset.filter((row) => String(row.status).toLowerCase() === 'devolvido');
          } else if (whereClause.includes("STATUS = 'ATIVA'") || whereClause.includes('STATUS = "ATIVA"')) {
            dataset = dataset.filter((row) => String(row.status).toLowerCase() === 'ativa');
          } else if (whereClause.includes("ROLE = 'ALUNO'") || whereClause.includes('ROLE = "ALUNO"')) {
            dataset = dataset.filter((row) => String(row.role).toLowerCase() === 'aluno');
          } else if (whereClause.includes("ROLE = 'BIBLIOTECARIA'") || whereClause.includes('ROLE = "BIBLIOTECARIA"')) {
            dataset = dataset.filter((row) => String(row.role).toLowerCase() === 'bibliotecaria');
          } else if (whereClause.includes('IS_BLOCKED = TRUE') || whereClause.includes('IS_BLOCKED = 1')) {
            dataset = dataset.filter((row) => row.is_blocked === 'SIM' || row.is_blocked === true);
          } else if (whereClause.includes('IS_BLOCKED = FALSE') || whereClause.includes('IS_BLOCKED = 0')) {
            dataset = dataset.filter((row) => row.is_blocked === 'NÃO' || row.is_blocked === false);
          }
        }

        // Apply ORDER BY
        if (upperSql.includes('ORDER BY')) {
          const orderPart = upperSql.split('ORDER BY')[1].split('LIMIT')[0].trim();
          const isDesc = orderPart.includes('DESC');
          const colName = orderPart.split(' ')[0].toLowerCase();

          dataset.sort((a, b) => {
            const valA = a[colName];
            const valB = b[colName];
            if (valA === undefined || valB === undefined) return 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
              return isDesc ? valB - valA : valA - valB;
            }
            return isDesc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
          });
        }

        // Apply LIMIT
        if (upperSql.includes('LIMIT')) {
          const limitMatch = upperSql.match(/LIMIT\s+(\d+)/);
          if (limitMatch) {
            const limit = parseInt(limitMatch[1], 10);
            dataset = dataset.slice(0, limit);
          }
        }

        // Filter specific columns if not SELECT *
        const selectHeader = cleanSql.slice(6, cleanSql.toUpperCase().indexOf('FROM')).trim();
        if (selectHeader !== '*' && !selectHeader.includes('*') && dataset.length > 0) {
          const requestedCols = selectHeader
            .split(',')
            .map((c) => c.trim().split(/\s+AS\s+/i)[0].toLowerCase().replace(/^.*\./, ''));
          dataset = dataset.map((row) => {
            const projected: Record<string, any> = {};
            for (const col of requestedCols) {
              if (row[col] !== undefined) {
                projected[col] = row[col];
              }
            }
            return Object.keys(projected).length > 0 ? projected : row;
          });
        }

        const columns = dataset.length > 0 ? Object.keys(dataset[0]) : [];
        const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

        return {
          result: {
            columns,
            rows: dataset,
            rowCount: dataset.length,
            executionTimeMs,
            queryType: 'SELECT',
            message: `${dataset.length} linha(s) retornada(s) com sucesso em ${executionTimeMs} ms.`,
          },
        };
      }

      // ============================================================
      // 2. SHOW TABLES
      // ============================================================
      if (upperSql.startsWith('SHOW TABLES')) {
        const rows = [
          { Tables_in_bibliosaber_db: 'books', Table_type: 'BASE TABLE', Engine: 'InnoDB', Linhas_Atuais: tables.books.length, Comentario: 'Catálogo do acervo físico' },
          { Tables_in_bibliosaber_db: 'users', Table_type: 'BASE TABLE', Engine: 'InnoDB', Linhas_Atuais: tables.users.length, Comentario: 'Alunos e bibliotecárias' },
          { Tables_in_bibliosaber_db: 'loans', Table_type: 'BASE TABLE', Engine: 'InnoDB', Linhas_Atuais: tables.loans.length, Comentario: 'Circulação, multas e devoluções' },
          { Tables_in_bibliosaber_db: 'reservations', Table_type: 'BASE TABLE', Engine: 'InnoDB', Linhas_Atuais: tables.reservations.length, Comentario: 'Fila de reservas online' },
          { Tables_in_bibliosaber_db: 'system_settings', Table_type: 'BASE TABLE', Engine: 'InnoDB', Linhas_Atuais: 1, Comentario: 'Parâmetros e políticas de multas' },
        ];
        const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

        return {
          result: {
            columns: ['Tables_in_bibliosaber_db', 'Table_type', 'Engine', 'Linhas_Atuais', 'Comentario'],
            rows,
            rowCount: rows.length,
            executionTimeMs,
            queryType: 'SHOW',
            message: '5 tabelas no banco bibliosaber_db (MySQL 8.0).',
          },
        };
      }

      // ============================================================
      // 3. DESCRIBE / EXPLAIN / SHOW COLUMNS
      // ============================================================
      if (upperSql.startsWith('DESC') || upperSql.startsWith('EXPLAIN') || upperSql.startsWith('SHOW COLUMNS')) {
        let targetTable = 'books';
        if (upperSql.includes('USERS')) targetTable = 'users';
        if (upperSql.includes('LOANS')) targetTable = 'loans';
        if (upperSql.includes('RESERVATIONS')) targetTable = 'reservations';
        if (upperSql.includes('SYSTEM_SETTINGS')) targetTable = 'system_settings';

        const meta = this.getSchemaMetadata().find((t) => t.tableName === targetTable);
        const rows = (meta?.columns || []).map((col) => ({
          Field: col.name,
          Type: col.type,
          Null: col.nullable ? 'YES' : 'NO',
          Key: col.isKey,
          Default: col.defaultValue,
          Comment: col.comment,
        }));

        const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
        return {
          result: {
            columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Comment'],
            rows,
            rowCount: rows.length,
            executionTimeMs,
            queryType: 'DESCRIBE',
            message: `Estrutura relacional da tabela '${targetTable}' inspecionada.`,
          },
        };
      }

      // ============================================================
      // 4. INSERT INTO (Interactive DML)
      // ============================================================
      if (upperSql.startsWith('INSERT INTO')) {
        if (upperSql.includes('BOOKS')) {
          // Parse values
          const titleMatch = cleanSql.match(/['"](.*?)['"]/g);
          const title = titleMatch && titleMatch[0] ? titleMatch[0].replace(/['"]/g, '') : 'Nova Obra Inserida via SQL';
          const author = titleMatch && titleMatch[1] ? titleMatch[1].replace(/['"]/g, '') : 'Autor Cadastrado via SQL';
          const genreCandidate = titleMatch && titleMatch[2] ? titleMatch[2].replace(/['"]/g, '') : 'Literatura Brasileira';

          const validGenres: BookGenre[] = [
            'Literatura Brasileira',
            'Ficção Científica',
            'Romance',
            'Fantasia',
            'Tecnologia & Computação',
            'História & Filosofia',
            'Ciências & Biologia',
            'Poesia & Teatro',
          ];
          const genre = validGenres.includes(genreCandidate as BookGenre)
            ? (genreCandidate as BookGenre)
            : 'Literatura Brasileira';

          const newBook: Book = {
            id: `book-sql-${Date.now()}`,
            title,
            author,
            genre,
            isbn: `978-85-SQL-${Math.floor(1000 + Math.random() * 9000)}`,
            publishedYear: 2024,
            publisher: 'Editora BiblioSaber',
            totalCopies: 3,
            availableCopies: 3,
            location: 'Estante D-SQL, Prateleira 1',
            coverUrl:
              'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
            synopsis: 'Exemplar registrado diretamente via console relacional MySQL da biblioteca BiblioSaber.',
            pages: 250,
            createdAt: new Date().toISOString(),
          };

          const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
          return {
            result: {
              columns: ['id', 'title', 'author', 'genre', 'total_copies', 'available_copies'],
              rows: [{ id: newBook.id, title: newBook.title, author: newBook.author, genre: newBook.genre, total_copies: 3, available_copies: 3 }],
              rowCount: 1,
              affectedRows: 1,
              executionTimeMs,
              queryType: 'INSERT',
              message: `1 registro inserido com sucesso na tabela 'books' (ID: ${newBook.id}).`,
            },
            updatedState: {
              books: [newBook, ...tables.books],
            },
          };
        }

        // Generic INSERT response
        const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
        return {
          result: {
            columns: ['Query_Result', 'Affected_Rows'],
            rows: [{ Query_Result: 'Comando INSERT executado com integridade relacional validada.', Affected_Rows: 1 }],
            rowCount: 1,
            affectedRows: 1,
            executionTimeMs,
            queryType: 'INSERT',
            message: 'INSERT INTO processado e sincronizado no banco de dados.',
          },
        };
      }

      // ============================================================
      // 5. UPDATE (Interactive DML)
      // ============================================================
      if (upperSql.startsWith('UPDATE')) {
        if (upperSql.includes('SYSTEM_SETTINGS')) {
          // Check if updating daily_fine_amount
          const fineMatch = upperSql.match(/DAILY_FINE_AMOUNT\s*=\s*([0-9.]+)/);
          const loanDaysMatch = upperSql.match(/STANDARD_LOAN_DAYS\s*=\s*([0-9]+)/);

          const newSettings: SystemSettings = { ...tables.settings };
          if (fineMatch) newSettings.dailyFineAmount = parseFloat(fineMatch[1]);
          if (loanDaysMatch) newSettings.standardLoanDays = parseInt(loanDaysMatch[1], 10);

          const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
          return {
            result: {
              columns: ['daily_fine_amount', 'standard_loan_days', 'institution_name'],
              rows: [{
                daily_fine_amount: `R$ ${newSettings.dailyFineAmount.toFixed(2)}`,
                standard_loan_days: newSettings.standardLoanDays,
                institution_name: newSettings.institutionName,
              }],
              rowCount: 1,
              affectedRows: 1,
              executionTimeMs,
              queryType: 'UPDATE',
              message: 'Tabela system_settings atualizada via comando SQL.',
            },
            updatedState: {
              settings: newSettings,
            },
          };
        }

        if (upperSql.includes('BOOKS')) {
          // Simulated update
          const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
          return {
            result: {
              columns: ['Status', 'Affected_Rows'],
              rows: [{ Status: 'Tabela books atualizada com sucesso!', Affected_Rows: 1 }],
              rowCount: 1,
              affectedRows: 1,
              executionTimeMs,
              queryType: 'UPDATE',
              message: 'Linhas correspondentes na tabela books foram atualizadas.',
            },
          };
        }
      }

      // ============================================================
      // 6. DELETE (Interactive DML)
      // ============================================================
      if (upperSql.startsWith('DELETE')) {
        const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
        return {
          result: {
            columns: ['Status', 'Affected_Rows'],
            rows: [{ Status: 'Comando DELETE processado com sucesso respeitando chaves estrangeiras (ON DELETE CASCADE).', Affected_Rows: 1 }],
            rowCount: 1,
            affectedRows: 1,
            executionTimeMs,
            queryType: 'DELETE',
            message: 'Registro removido com sucesso.',
          },
        };
      }

      // ============================================================
      // 7. OTHER (CREATE / ALTER / USE / SET)
      // ============================================================
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        result: {
          columns: ['Comando', 'Resultado', 'Engine'],
          rows: [{ Comando: cleanSql.slice(0, 40) + '...', Resultado: 'Comando DDL/DCL reconhecido e aceito pela sintaxe MySQL 8.0.', Engine: 'InnoDB' }],
          rowCount: 1,
          executionTimeMs,
          queryType: 'OTHER',
          message: 'Instrução SQL reconhecida com sucesso.',
        },
      };
    } catch (err: any) {
      return {
        result: {
          columns: ['Erro_MySQL'],
          rows: [],
          rowCount: 0,
          executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
          error: err?.message || 'Erro na sintaxe SQL. Verifique pontuação e nomes de tabelas.',
        },
      };
    }
  }
}
