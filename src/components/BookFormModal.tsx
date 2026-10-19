import React, { useState, useEffect } from 'react';
import { Book, BookGenre } from '../types/library';
import { useLibrary } from '../context/LibraryContext';
import { X, BookPlus, Edit3, Image, Sparkles } from 'lucide-react';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookToEdit?: Book | null;
}

const GENRES: BookGenre[] = [
  'Literatura Brasileira',
  'Ficção Científica',
  'Romance',
  'Fantasia',
  'Tecnologia & Computação',
  'História & Filosofia',
  'Ciências & Biologia',
  'Autoajuda & Negócios',
  'HQ & Mangá',
  'Poesia & Teatro',
];

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
];

export const BookFormModal: React.FC<BookFormModalProps> = ({ isOpen, onClose, bookToEdit }) => {
  const { addBook, updateBook } = useLibrary();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: 'Literatura Brasileira' as BookGenre,
    isbn: '',
    publishedYear: 2024,
    publisher: '',
    totalCopies: 3,
    location: 'Estante A1 - Prateleira 1',
    coverUrl: SAMPLE_COVERS[0],
    synopsis: '',
    pages: 300,
  });

  useEffect(() => {
    if (bookToEdit) {
      setFormData({
        title: bookToEdit.title,
        author: bookToEdit.author,
        genre: bookToEdit.genre,
        isbn: bookToEdit.isbn,
        publishedYear: bookToEdit.publishedYear,
        publisher: bookToEdit.publisher,
        totalCopies: bookToEdit.totalCopies,
        location: bookToEdit.location,
        coverUrl: bookToEdit.coverUrl,
        synopsis: bookToEdit.synopsis,
        pages: bookToEdit.pages,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        genre: 'Literatura Brasileira',
        isbn: `978-85${Math.floor(10000000 + Math.random() * 90000000)}`,
        publishedYear: 2024,
        publisher: 'Editora Saber Viva',
        totalCopies: 3,
        location: 'Estante A1 - Prateleira 1',
        coverUrl: SAMPLE_COVERS[Math.floor(Math.random() * SAMPLE_COVERS.length)],
        synopsis: '',
        pages: 250,
      });
    }
  }, [bookToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookToEdit) {
      updateBook(bookToEdit.id, formData);
    } else {
      addBook(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E6DFC4] w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E6DFC4] bg-[#2C1D11] text-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {bookToEdit ? <Edit3 className="w-5 h-5 text-[#C89B65]" /> : <BookPlus className="w-5 h-5 text-[#C89B65]" />}
            <div>
              <h3 className="font-serif font-bold text-lg text-white">
                {bookToEdit ? 'Editar Dados da Obra' : 'Cadastrar Nova Obra no Catálogo'}
              </h3>
              <p className="text-xs text-stone-300">
                Preencha os metadados bibliográficos para o catálogo físico da biblioteca
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Título da Obra *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Memórias Póstumas de Brás Cubas"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Autor(a) *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Ex: Machado de Assis"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gênero / Categoria *</label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value as BookGenre })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Código ISBN</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="978-85..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Editora</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                placeholder="Companhia das Letras, Aleph, etc."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ano de Publicação</label>
              <input
                type="number"
                value={formData.publishedYear}
                onChange={(e) => setFormData({ ...formData, publishedYear: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Número de Páginas</label>
              <input
                type="number"
                value={formData.pages}
                onChange={(e) => setFormData({ ...formData, pages: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Exemplares no Acervo *</label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-amber-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Localização Física / Estante *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Estante B2 - Prateleira 3"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">URL da Imagem da Capa</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const random = SAMPLE_COVERS[Math.floor(Math.random() * SAMPLE_COVERS.length)];
                    setFormData({ ...formData, coverUrl: random });
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0"
                >
                  Capa Sugerida
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Sinopse da Obra</label>
              <textarea
                rows={3}
                value={formData.synopsis}
                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                placeholder="Breve resumo da história ou tema do livro..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-md transition-colors"
            >
              {bookToEdit ? 'Salvar Alterações' : 'Cadastrar no Acervo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
