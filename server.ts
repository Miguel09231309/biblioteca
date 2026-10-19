import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to create a connection/pool dynamically or from env
function getMysqlConfig(custom?: any) {
  return {
    host: custom?.host || process.env.MYSQL_HOST || 'localhost',
    port: parseInt(custom?.port || process.env.MYSQL_PORT || '3306', 10),
    user: custom?.user || process.env.MYSQL_USER || 'root',
    password: custom?.password !== undefined ? custom.password : (process.env.MYSQL_PASSWORD || ''),
    database: custom?.database || process.env.MYSQL_DATABASE || 'bibliosaber_db',
    connectTimeout: 8000,
    ssl: (custom?.ssl === true || process.env.MYSQL_SSL === 'true') ? { rejectUnauthorized: false } : undefined,
  };
}

// ==========================================
// API MYSQL ROUTES
// ==========================================

// 1. Status do MySQL
app.get('/api/mysql/status', async (req: Request, res: Response) => {
  const config = getMysqlConfig();
  let connected = false;
  let message = 'Servidor MySQL não conectado. Configure as credenciais ou teste a conexão.';
  let pingMs = 0;

  try {
    const start = Date.now();
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: 3000,
      ssl: config.ssl,
    });
    await conn.ping();
    pingMs = Date.now() - start;
    await conn.end();
    connected = true;
    message = `Conexão bem-sucedida com MySQL em ${config.host}:${config.port} (${pingMs}ms)!`;
  } catch (err: any) {
    message = err?.message || 'Falha ao conectar no host MySQL configurado.';
  }

  res.json({
    configured: Boolean(process.env.MYSQL_HOST),
    connected,
    pingMs,
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    message,
  });
});

// 2. Testar Conexão e Inicializar Tabelas
app.post('/api/mysql/test-connection', async (req: Request, res: Response) => {
  const { host, port, user, password, database, ssl, initializeSchema } = req.body;
  const config = getMysqlConfig({ host, port, user, password, database, ssl });

  try {
    const start = Date.now();
    // Connect without database first to ensure it exists
    const adminConn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: 5000,
      ssl: config.ssl,
    });

    await adminConn.ping();

    // Create database if requested
    await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await adminConn.end();

    // Connect to the specific database
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 5000,
      ssl: config.ssl,
    });

    if (initializeSchema) {
      // Create tables
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          role ENUM('aluno', 'bibliotecaria') NOT NULL DEFAULT 'aluno',
          registration_number VARCHAR(64) NOT NULL UNIQUE,
          course_or_department VARCHAR(255) NULL,
          phone VARCHAR(32) NULL,
          avatar_url TEXT NULL,
          is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS books (
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
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS loans (
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
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS reservations (
          id VARCHAR(64) PRIMARY KEY,
          book_id VARCHAR(64) NOT NULL,
          user_id VARCHAR(64) NOT NULL,
          reserved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expected_available_date TIMESTAMP NOT NULL,
          available_until TIMESTAMP NULL,
          status ENUM('ativa', 'disponivel_retirada', 'concluida', 'cancelada') NOT NULL DEFAULT 'ativa',
          queue_position INT NOT NULL DEFAULT 1,
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          daily_fine_amount DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
          standard_loan_days INT NOT NULL DEFAULT 14,
          grace_period_days INT NOT NULL DEFAULT 1,
          max_books_per_student INT NOT NULL DEFAULT 3,
          max_renewals_allowed INT NOT NULL DEFAULT 2,
          librarian_access_code VARCHAR(64) NOT NULL DEFAULT 'BIBLIO2026',
          institution_name VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    }

    const pingMs = Date.now() - start;
    await conn.end();

    res.json({
      success: true,
      pingMs,
      message: `Conexão bem-sucedida ao banco de dados MySQL "${config.database}" em ${config.host}:${config.port} (${pingMs}ms)!`,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: `Falha na conexão MySQL: ${err?.message || 'Erro desconhecido'}`,
      code: err?.code,
    });
  }
});

// 3. Executar Query SQL Real no MySQL
app.post('/api/mysql/execute', async (req: Request, res: Response) => {
  const { query, credentials } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Parâmetro query é obrigatório' });
  }

  const config = getMysqlConfig(credentials);

  try {
    const start = Date.now();
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 5000,
      ssl: config.ssl,
    });

    const [results, fields] = await conn.query(query);
    const executionTimeMs = Date.now() - start;
    await conn.end();

    const rows = Array.isArray(results) ? results : [results];
    const columns = Array.isArray(fields) ? fields.map((f: any) => f.name) : (rows.length > 0 && typeof rows[0] === 'object' ? Object.keys(rows[0]) : ['Resultado']);

    res.json({
      success: true,
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err?.message || 'Erro ao executar consulta SQL',
      code: err?.code,
    });
  }
});

// 4. Sincronizar dados da biblioteca diretamente para o MySQL
app.post('/api/mysql/sync', async (req: Request, res: Response) => {
  const { books, users, loans, reservations, settings, credentials } = req.body;
  const config = getMysqlConfig(credentials);

  try {
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 8000,
      ssl: config.ssl,
    });

    // Upsert Books
    if (Array.isArray(books)) {
      for (const b of books) {
        await conn.query(
          `INSERT INTO books (id, title, author, genre, isbn, published_year, publisher, total_copies, available_copies, location, cover_url, synopsis, pages)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title), author = VALUES(author), genre = VALUES(genre), total_copies = VALUES(total_copies), available_copies = VALUES(available_copies), location = VALUES(location);`,
          [b.id, b.title, b.author, b.genre, b.isbn, b.publishedYear, b.publisher || '', b.totalCopies, b.availableCopies, b.location, b.coverUrl, b.synopsis || '', b.pages || 100]
        );
      }
    }

    // Upsert Users
    if (Array.isArray(users)) {
      for (const u of users) {
        await conn.query(
          `INSERT INTO users (id, name, email, role, registration_number, course_or_department, phone, avatar_url, is_blocked)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name), email = VALUES(email), role = VALUES(role), is_blocked = VALUES(is_blocked);`,
          [u.id, u.name, u.email, u.role, u.registrationNumber, u.courseOrDepartment || '', u.phone || '', u.avatarUrl || '', u.isBlocked ? 1 : 0]
        );
      }
    }

    // Upsert Loans
    if (Array.isArray(loans)) {
      for (const l of loans) {
        await conn.query(
          `INSERT INTO loans (id, book_id, user_id, request_date, approval_date, due_date, return_date, status, renewals_count, fine_amount, fine_paid, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             status = VALUES(status), due_date = VALUES(due_date), return_date = VALUES(return_date), fine_amount = VALUES(fine_amount), fine_paid = VALUES(fine_paid);`,
          [l.id, l.bookId, l.userId, l.requestDate.slice(0, 19).replace('T', ' '), l.approvalDate ? l.approvalDate.slice(0, 19).replace('T', ' ') : null, l.dueDate.slice(0, 19).replace('T', ' '), l.returnDate ? l.returnDate.slice(0, 19).replace('T', ' ') : null, l.status, l.renewalsCount || 0, l.fineAmount || 0, l.finePaid ? 1 : 0, l.notes || '']
        );
      }
    }

    await conn.end();

    res.json({
      success: true,
      message: `Sincronização concluída com sucesso no MySQL! ${books?.length || 0} livros e ${users?.length || 0} usuários gravados.`,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: `Erro na sincronização com MySQL: ${err?.message}`,
    });
  }
});

// Servir e Baixar Versão Autônoma em Arquivo Único (index.html)
app.get('/standalone', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'standalone.html'));
});

app.get('/api/download-standalone', (req: Request, res: Response) => {
  res.download(path.resolve(__dirname, 'standalone.html'), 'index.html');
});

// ==========================================
// VITE / STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BiblioSaber Server] Rodando na porta ${PORT}`);
  });
}

startServer();
