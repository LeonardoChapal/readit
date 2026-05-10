import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StarPicker from '../components/StarPicker'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import type { Book, Genre } from '../types/book'
import type { Review } from '../types/review'

export default function CreateReviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [books, setBooks] = useState<Book[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [showNewBook, setShowNewBook] = useState(false)

  const preselectedId = searchParams.get('libro') ? parseInt(searchParams.get('libro')!) : null
  const [bookId, setBookId] = useState<number | ''>(preselectedId ?? '')
  const [newBook, setNewBook] = useState({ title: '', author: '', year: '', genre_id: '' })
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewContent, setReviewContent] = useState('')
  const [reviewRating, setReviewRating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get<Book[]>('/api/v1/books').then(setBooks)
    api.get<Genre[]>('/api/v1/genres').then(setGenres)
  }, [user, navigate])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)

    if (!reviewTitle.trim() || !reviewContent.trim()) {
      setError('El título y el contenido de la reseña son obligatorios')
      return
    }

    setLoading(true)
    try {
      let finalBookId = bookId

      if (showNewBook) {
        if (!newBook.title.trim() || !newBook.author.trim()) {
          setError('El título y el autor del libro son obligatorios')
          setLoading(false)
          return
        }
        const created = await api.post<Book>('/api/v1/books', {
          title: newBook.title.trim(),
          author: newBook.author.trim(),
          year: newBook.year ? parseInt(newBook.year) : undefined,
          genre_id: newBook.genre_id ? parseInt(newBook.genre_id) : undefined,
        })
        finalBookId = created.id
      }

      if (!finalBookId) {
        setError('Selecciona o crea un libro')
        setLoading(false)
        return
      }

      const review = await api.post<Review>('/api/v1/reviews', {
        book_id: finalBookId,
        title: reviewTitle.trim(),
        content: reviewContent.trim(),
        rating: reviewRating,
      })

      navigate(`/resena/${review.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar la reseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Nueva reseña</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Libro</h2>

            {!showNewBook ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selecciona un libro
                  </label>
                  <select
                    value={bookId}
                    onChange={e => setBookId(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  >
                    <option value="">-- Elige un libro --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} — {b.author}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowNewBook(true); setBookId('') }}
                  className="text-sm text-[#f97316] hover:underline"
                >
                  + El libro no está en la lista, agregarlo
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del libro</label>
                    <input
                      type="text"
                      required
                      value={newBook.title}
                      onChange={e => setNewBook(b => ({ ...b, title: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="Ej. Cien años de soledad"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Autor</label>
                    <input
                      type="text"
                      required
                      value={newBook.author}
                      onChange={e => setNewBook(b => ({ ...b, author: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="Ej. Gabriel García Márquez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año (opcional)</label>
                    <input
                      type="number"
                      min="1000"
                      max="2099"
                      value={newBook.year}
                      onChange={e => setNewBook(b => ({ ...b, year: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="1967"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Género (opcional)</label>
                    <select
                      value={newBook.genre_id}
                      onChange={e => setNewBook(b => ({ ...b, genre_id: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    >
                      <option value="">-- Sin género --</option>
                      {genres.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewBook(false)}
                  className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Volver a seleccionar libro existente
                </button>
              </>
            )}
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Tu reseña</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Calificación <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
              </label>
              <StarPicker value={reviewRating} onChange={setReviewRating} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
              <input
                type="text"
                required
                value={reviewTitle}
                onChange={e => setReviewTitle(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                placeholder="Ej. Una obra maestra del realismo mágico"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido</label>
              <textarea
                required
                rows={8}
                value={reviewContent}
                onChange={e => setReviewContent(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent resize-y"
                placeholder="Escribe tu reseña aquí..."
              />
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Publicando...' : 'Publicar reseña'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
