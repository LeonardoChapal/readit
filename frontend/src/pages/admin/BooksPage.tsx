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

interface OLDoc {
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  key: string
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

  // Open Library import
  const [olQuery, setOlQuery] = useState('')
  const [olResults, setOlResults] = useState<OLDoc[]>([])
  const [olLoading, setOlLoading] = useState(false)
  const [olGenres, setOlGenres] = useState<Record<string, string>>({})
  const [importedKeys, setImportedKeys] = useState<Set<string>>(new Set())
  const [importingKey, setImportingKey] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<Book[]>('/api/v1/admin/books'),
      api.get<Genre[]>('/api/v1/genres'),
    ]).then(([b, g]) => { setBooks(b); setGenres(g) })
      .finally(() => setLoading(false))
  }, [])

  async function searchOpenLibrary() {
    if (!olQuery.trim()) return
    setOlLoading(true)
    setOlResults([])
    try {
      const params = new URLSearchParams({
        q: olQuery,
        limit: '8',
        fields: 'title,author_name,first_publish_year,cover_i,key',
      })
      const res = await fetch(`https://openlibrary.org/search.json?${params}`)
      const data = await res.json()
      setOlResults(data.docs ?? [])
    } finally {
      setOlLoading(false)
    }
  }

  async function importBook(doc: OLDoc) {
    setImportingKey(doc.key)
    try {
      const created = await api.post<Book>('/api/v1/admin/books', {
        title: doc.title,
        author: doc.author_name?.[0] ?? 'Desconocido',
        year: doc.first_publish_year ?? null,
        genre_id: olGenres[doc.key] ? parseInt(olGenres[doc.key]) : null,
      })
      setBooks(prev => [created, ...prev])
      setImportedKeys(prev => new Set([...prev, doc.key]))
    } finally {
      setImportingKey(null)
    }
  }

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Libros</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverUpload}
      />

      {/* Importar desde Open Library */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Importar desde Open Library
        </h2>

        <div className="flex gap-2 mb-4">
          <input
            value={olQuery}
            onChange={e => setOlQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchOpenLibrary()}
            placeholder="Buscar título o autor…"
            className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
          <button
            onClick={searchOpenLibrary}
            disabled={olLoading}
            className="bg-[#f97316] hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {olLoading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {olResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {olResults.map(doc => {
              const imported = importedKeys.has(doc.key)
              const importing = importingKey === doc.key
              const coverUrl = doc.cover_i
                ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                : null

              return (
                <div
                  key={doc.key}
                  className="flex gap-3 border border-gray-100 dark:border-gray-700 rounded-xl p-3 items-start"
                >
                  {coverUrl ? (
                    <img src={coverUrl} alt={doc.title} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 bg-orange-50 dark:bg-orange-900/30 rounded-md flex-shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#f97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {doc.author_name?.[0] ?? 'Autor desconocido'}
                      {doc.first_publish_year ? ` · ${doc.first_publish_year}` : ''}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <select
                        value={olGenres[doc.key] ?? ''}
                        onChange={e => setOlGenres(p => ({ ...p, [doc.key]: e.target.value }))}
                        className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                      >
                        <option value="">Sin género</option>
                        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>

                      <button
                        onClick={() => importBook(doc)}
                        disabled={imported || importing}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg transition flex-shrink-0 ${
                          imported
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
                            : 'bg-[#f97316] hover:bg-orange-600 text-white disabled:opacity-50'
                        }`}
                      >
                        {imported ? '✓ Importado' : importing ? 'Importando…' : 'Importar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabla de libros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              {['Portada', 'Título', 'Autor', 'Género', 'Año', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {books.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editId === b.id ? (
                  <>
                    <td className="px-4 py-2">
                      <BookCover bookId={b.id} title={b.title} className="w-8 h-10 rounded" bust={coverBusts[b.id]} />
                    </td>
                    <td className="px-4 py-2">
                      <input value={form.title} onChange={f('title')} className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316] dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input value={form.author} onChange={f('author')} className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316] dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <select value={form.genre_id} onChange={f('genre_id')} className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316] dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="">Sin género</option>
                        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={form.year} onChange={f('year')} className="w-20 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#f97316] dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
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
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{b.title}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{b.author}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{b.genre?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{b.year ?? '—'}</td>
                    <td className="px-4 py-3 flex gap-3">
                      <button onClick={() => startEdit(b)} className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition">Editar</button>
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
