# BiblioSaber: Redesign Editorial Distinto & Arquitetura de Dados Relacional

Modernização integral da interface da biblioteca com identidade visual editorial aconchegante (tons nobres de madeira, linho, papel marfim e bronze), capas de livros em alta definição com efeito tátil tridimensional de lombada/profundidade, e estruturação de banco de dados relacional SQL robusto com tabelas normalizadas.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Confirmadas**:
> 1. **Banco de Dados Relacional SQL / MySQL**: O usuário escolheu arquitetura relacional SQL. Como o ambiente do AI Studio executa sobre Node.js/Express full-stack, implementaremos um backend Express com banco de dados relacional estruturado (com esquema normalizado em tabelas de `users`, `books`, `loans`, `reservations`, `fines`, `notifications`), além da opção de conexão direta via Cloud SQL / PostgreSQL provisionada caso o usuário aceite o consentimento de Cloud SQL.
> 2. **Identidade Visual Diferenciada (Anti-AI Slop)**: Em vez do padrão genérico de cartões brancos com sombras roxas e pílulas coloridas, o site adotará estética **Editorial de Biblioteca Clássica & Colecionador**: paleta de linho marfim (`#FAF8F5`), nogueira profunda (`#1E1612`), ouro envelhecido (`#B47836`) e papel de arquivo com tipografia serifada de alta legibilidade (`Playfair Display` + `Plus Jakarta Sans`).
> 3. **Capas Realistas em Alta Definição & Efeito 3D**: As obras terão capas autênticas em alta resolução com acabamento tridimensional (lombada simulada com gradiente e relevo de capa dura, sombra de profundidade projetada e páginas visíveis na lateral).

---

## 1. Visão Geral & Conceito

- **Objetivo**: Transformar a biblioteca digital em uma experiência que transmite a atmosfera física de uma biblioteca clássica de alto padrão, combinando estética editorial calorosa e elegante com ferramentas de circulação de acervo precisas e intuitivas.
- **Público-Alvo**:
  - *Alunos*: navegação fluida pelo acervo, visualização de disponibilidade, previsão de retorno de livros emprestados, solicitação de empréstimos e reservas online com acompanhamento em tempo real.
  - *Bibliotecárias e Curadoria*: gestão completa de inventário, aprovação de retiradas, balcão de devoluções com cálculo de multas diárias configuráveis, relatórios analíticos de leitores e levantamento de acervo sem giro.
- **Proposta de Valor**: Uma aplicação verdadeiramente pronta para uso, esteticamente rica e acolhedora, com persistência relacional e sem clichês visuais de IA.

---

## 2. Experiência do Usuário & Design Visual

### Direção Estética & Atmosfera
- **Conceito**: *Atelier Literário & Biblioteca Histórica*. Texturas de papel artesanal, divisores ultrafinos em tons de latão suave e ausência total de "pills" flutuantes estáticas.
- **Paleta de Cores (Regra 60-30-10)**:
  - `60% Canvas Neutro Nobre`: Fundo marfim/pergaminho suave (`#FAF8F5` / `#F3EFEA`), livre da frieza do branco estéril.
  - `30% Superfícies Estruturais`: Madeira nogueira nobre (`#1F1610`), linho cru (`#E8E2D8`), bordas capilares sutis (`border-stone-200/80`).
  - `10% Acentos Ativos`: Ouro brunido / conhaque (`#B47836` / `#8C531B`) e verde esmeralda vintage para disponibilidade confirmada.
- **Tipografia**:
  - *Títulos e Destaques*: `Playfair Display` com proporção nobre e kerning balanceado.
  - *Corpo e Metadados*: `Plus Jakarta Sans` para leitura nítida e confortável.
  - *Registros e Prazos*: `tabular-nums` alinhados para valores monetários de multas, datas de devolução e códigos ISBN.
- **Apresentação Tridimensional dos Livros**:
  - Capas com chanfro lateral simulando lombada encadernada em couro/tecido.
  - Sombra difusa realista projetada na estante (`box-shadow: 6px 12px 24px -4px rgba(27, 18, 12, 0.22)`).
  - Borda inferior mostrando o corte das folhas do livro.

---

## 3. Arquitetura de Dados & Modelo Relacional SQL

Para atender à preferência do usuário por banco de dados **SQL / Relacional**, a estrutura de dados é rigorosamente normalizada:

```
┌─────────────────┐       1:N       ┌─────────────────┐
│      USERS      ├─────────────────┤      LOANS      │
│ (Alunos/Biblio) │                 │  (Empréstimos)  │
└────────┬────────┘                 └────────┬────────┘
         │ 1:N                               │
         │                                   │ N:1
┌────────┴────────┐                 ┌────────┴────────┐
│  RESERVATIONS   │       N:1       │      BOOKS      │
│ (Fila Reservas) ├─────────────────┤    (Acervo)     │
└─────────────────┘                 └─────────────────┘
```

### Tabelas Principais
1. `books`: `id`, `title`, `author`, `genre`, `isbn`, `published_year`, `publisher`, `total_copies`, `available_copies`, `location`, `cover_url`, `synopsis`, `pages`, `created_at`.
2. `users`: `id`, `name`, `email`, `role` (aluno | bibliotecaria), `registration_number`, `course_or_department`, `phone`, `avatar_url`, `is_blocked`, `created_at`.
3. `loans`: `id`, `book_id`, `user_id`, `request_date`, `approval_date`, `due_date`, `return_date`, `status` (pendente, aprovado, devolvido, recusado), `renewals_count`, `fine_amount`, `fine_paid`, `notes`.
4. `reservations`: `id`, `book_id`, `user_id`, `reserved_at`, `expected_available_date`, `available_until`, `status` (ativa, disponivel_retirada, concluida, cancelada), `queue_position`.
5. `system_settings`: `daily_fine_amount`, `standard_loan_days`, `grace_period_days`, `max_books_per_student`, `max_renewals_allowed`, `librarian_access_code`.

---

## 4. Plano de Execução & Etapas

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Redesenho da Identidade Visual & Layout Editorial        │
│    - Atualizar paleta de cores para linho, nogueira e ouro  │
│    - Implementar tipografia serifada de curadoria           │
│    - Eliminar clichês visuais de IA e pílulas estáticas     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 2. Catálogo e Efeito 3D Realista de Capas de Livros         │
│    - Substituir e curar imagens reais em alta definição     │
│    - Renderizar livro com profundidade 3D e corte de folhas │
│    - Exibir data exata de retorno com destaque elegante     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Camada de Persistência SQL Relacional & Operação Total   │
│    - Estruturação do banco com queries relacionais íntegras │
│    - Sincronização e exportação/importação SQL/JSON nativa  │
│    - Finalizar validação de circulação, multas e relatórios │
└─────────────────────────────────────────────────────────────┘
```
