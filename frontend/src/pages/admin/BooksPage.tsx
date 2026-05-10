import { useEffect, useState, useRef } from 'react'
import { api, uploadBookCover } from '../../lib/api'
import BookCover from '../../components/BookCover'
import type { Book, Genre } from '../../types/book'

interface BookForm {
  title: string
  author: string
  year: string
  genre_id: string
}

const EMPTY: BookForm = { title: '', author: '', year: '', genre_id: '' }

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<BookForm>(EMPTY)
  const [coverBusts, setCoverBusts] = useState<Record<number, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingId, setUploadingId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<Book[]>('/api/v1/admin/books'),
      api.get<Genre[]>('/api/v1/genres'),
    ]).then(([b, g]) => { setBooks(b); setGenres(g) })
      .finally(() => setLoading(false))
  }, [])

  function startEdit(book: Book) {
    setEditId(book.id)
    setForm({
      title:    book.title,
      author:   book.author,
      year:     book.year?.toString() ?? '',
      genre_id: book.genre?.id.toString() ?? '',
    })
  }

  async function saveEdit() {
    if (!editId) return
    const updated = await api.put<Book>(`/api/v1/admin/books/${editId}`, {
      title:    form.title,
      author:   form.author,
      year:     form.year ? parseInt(form.year) : null,
      genre_id: form.genre_id ? parseInt(form.genre_id) : null,
    })
    setBooks(prev => prev.map(b => b.id === editId ? updated : b))
    setEditId(null)
  }

  async function deleteBook(id: number) {
    if (!window.confirm('¿Eliminar este libro? Se eliminarán también sus reseñas.')) return
    await api.delete(`/api/v1/admin/books/${id}`)
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!uploadingId || !e.target.files?.[0]) return
    const file = e.target.files[0]
    await uploadBookCover(uploadingId, file)
    setCoverBusts(prev => ({ ...prev, [uploadingId]: Date.now() }))
    setUploadingId(null)
    e.target.value = ''
  }

  function triggerUpload(bookId: number) {
    setUploadingId(bookId)
    fileInputRef.current?.click()
  }

  const f = (k: keyof BookForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  if (loading) return <p className="text-gray-400 text-sm">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Libros</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverUpload}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Portada', 'Título', 'Autor', 'Género', 'Año', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {books.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                {editId === b.id ? (
                  <>
                    <td className="px-4 py-2">
                      <BookCover bookId={b.id} title={b.title} className="w-8 h-10 rounded" bust={coverBusts[b.id]} />
                    </td>
                    <td className="px-4 py-2">
                      <input value={form.title} onChange={f('title')} className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316]" />
                    </td>
                    <td className="px-4 py-2">
                      <input value={form.author} onChange={f('author')} className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316]" />
                    </td>
                    <td className="px-4 py-2">
                      <select value={form.genre_id} onChange={f('genre_id')} className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316]">
                        <option value="">Sin género</option>
                        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={form.year} onChange={f('year')} className="w-20 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316]" />
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={saveEdit} className="text-xs text-[#f97316] font-medium hover:underline">Guardar</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <button onClick={() => triggerUpload(b.id)} title="Subir portada">
                        <BookCover bookId={b.id} title={b.title} className="w-8 h-10 rounded hover:opacity-75 transition" bust={coverBusts[b.id]} />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.title}</td>
                    <td className="px-4 py-3 text-gray-500">{b.author}</td>
                    <td className="px-4 py-3 text-gray-400">{b.genre?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{b.year ?? '—'}</td>
                    <td className="px-4 py-3 flex gap-3">
                      <button onClick={() => startEdit(b)} className="text-xs text-gray-500 hover:text-gray-800 transition">Editar</button>
                      <button onClick={() => deleteBook(b.id)} className="text-xs text-red-400 hover:text-red-600 transition">Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
