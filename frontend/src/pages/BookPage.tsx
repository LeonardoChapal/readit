import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BookCover from '../components/BookCover'
import ReviewCard from '../components/ReviewCard'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useActivity } from '../hooks/useActivity'
import StarRating from '../components/StarRating'
import type { BookDetail, Book } from '../types/book'
import type { Review } from '../types/review'
import type { ReadingListEntry, ReadingStatus } from '../types/reading_list'

const LIMIT = 20
type Sort = 'top' | 'recent' | 'rating'

const STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: 'Quiero leer',
  reading: 'Leyendo',
  read: 'Ya leí',
}

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'top', label: 'Más votadas' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'rating', label: 'Mejor valoradas' },
]

export default function BookPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { track } = useActivity()

  const [book, setBook] = useState<BookDetail | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sort, setSort] = useState<Sort>('top')

  const [similarBooks, setSimilarBooks] = useState<Book[]>([])

  const [rlEntry, setRlEntry] = useState<ReadingListEntry | null>(null)
  const [rlLoading, setRlLoading] = useState(false)
  const [rlOpen, setRlOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<BookDetail>(`/api/v1/books/${id}`)
      .then(b => {
        setBook(b as BookDetail)
        track({ activity_type: 'view_book', entity_type: 'book', entity_id: Number(id) })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || loading) return
    api.get<Review[]>(`/api/v1/books/${id}/reviews?sort=${sort}&skip=0&limit=${LIMIT}`)
      .then(r => {
        setReviews(r)
        setHasMore(r.length === LIMIT)
      })
  }, [id, sort, loading])

  useEffect(() => {
    if (!book?.genre?.id || !id) return
    api.get<Book[]>(`/api/v1/books?genre_id=${book.genre.id}`)
      .then(data => setSimilarBooks(data.filter(b => b.id !== Number(id)).slice(0, 6)))
      .catch(() => {})
  }, [book, id])

  useEffect(() => {
    if (!user || !id) return
    api.get<ReadingListEntry | null>(`/api/v1/reading-list/${id}`)
      .then(data => setRlEntry(data))
      .catch(() => {})
  }, [user, id])

  async function setStatus(status: ReadingStatus) {
    if (!id) return
    setRlLoading(true)
    setRlOpen(false)
    try {
      const data = await api.put<ReadingListEntry>(`/api/v1/reading-list/${id}`, { status })
      setRlEntry(data)
      track({
        activity_type: rlEntry ? 'change_list_status' : 'add_to_list',
        entity_type: 'book',
        entity_id: Number(id),
        metadata: { status },
      })
    } finally {
      setRlLoading(false)
    }
  }

  async function removeFromList() {
    if (!id) return
    setRlLoading(true)
    setRlOpen(false)
    try {
      await api.delete(`/api/v1/reading-list/${id}`)
      setRlEntry(null)
      track({ activity_type: 'change_list_status', entity_type: 'book', entity_id: Number(id), metadata: { status: null } })
    } finally {
      setRlLoading(false)
    }
  }

  async function loadMore() {
    if (!id) return
    setLoadingMore(true)
    try {
      const data = await api.get<Review[]>(`/api/v1/books/${id}/reviews?sort=${sort}&skip=${reviews.length}&limit=${LIMIT}`)
      setReviews(prev => [...prev, ...data])
      setHasMore(data.length === LIMIT)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm pt-24">Cargando...</p>
      </div>
    )
  }

  if (notFound || !book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="text-center pt-24">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Libro no encontrado.</p>
          <Link to="/" className="text-[#f97316] hover:underline text-sm">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  const ownReview = user ? reviews.find(r => r.user.username === user.username) : null
  const otherReviews = ownReview ? reviews.filter(r => r.id !== ownReview.id) : reviews

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition flex items-center gap-1 mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        {/* Cabecera del libro */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 flex gap-6">
          <BookCover bookId={book.id} title={book.title} className="w-24 h-36 rounded-xl flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{book.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{book.author}</p>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {book.genre && (
                <span className="bg-orange-50 dark:bg-orange-900/30 text-[#f97316] text-xs font-medium px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-800">
                  {book.genre.name}
                </span>
              )}
              {book.year && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{book.year}</span>
              )}
            </div>

            {book.tags && book.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {book.tags.map(tag => (
                  <span key={tag.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {book.avg_rating && (
              <div className="flex items-center gap-2 mt-3">
                <StarRating rating={Math.round(book.avg_rating)} size="md" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{book.avg_rating}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">({book.rating_count} {book.rating_count === 1 ? 'calificación' : 'calificaciones'})</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {user ? (
                <>
                  {!ownReview && (
                    <Link
                      to={`/nueva-resena?libro=${book.id}`}
                      className="inline-block bg-[#f97316] hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                    >
                      Escribir reseña
                    </Link>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setRlOpen(o => !o)}
                      disabled={rlLoading}
                      className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg border transition disabled:opacity-50 ${
                        rlEntry
                          ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-[#f97316]'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#f97316] hover:text-[#f97316]'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      {rlEntry ? STATUS_LABELS[rlEntry.status as ReadingStatus] : 'Agregar a lista'}
                    </button>

                    {rlOpen && (
                      <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10">
                        {(Object.entries(STATUS_LABELS) as [ReadingStatus, string][]).map(([status, label]) => (
                          <button
                            key={status}
                            onClick={() => setStatus(status)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              rlEntry?.status === status ? 'text-[#f97316] font-semibold' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                        {rlEntry && (
                          <button
                            onClick={removeFromList}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-t border-gray-100 dark:border-gray-700"
                          >
                            Quitar de lista
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-block bg-[#f97316] hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                >
                  Inicia sesión para reseñar
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Reseñas */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="font-bold text-gray-800 dark:text-gray-100">
            Reseñas{reviews.length > 0 ? ` (${reviews.length}${hasMore ? '+' : ''})` : ''}
          </h2>
          {reviews.length > 1 && (
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    sort === opt.value
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Aún no hay reseñas para este libro.</p>
            {user && (
              <Link
                to={`/nueva-resena?libro=${book.id}`}
                className="inline-block bg-[#f97316] hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              >
                Sé el primero en reseñar
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Reseña propia destacada */}
              {ownReview && (
                <div className="ring-2 ring-[#f97316] ring-offset-2 dark:ring-offset-gray-900 rounded-2xl">
                  <div className="relative">
                    <span className="absolute -top-2.5 left-4 bg-[#f97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                      Tu reseña
                    </span>
                    <ReviewCard review={ownReview} />
                  </div>
                </div>
              )}
              {otherReviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-[#f97316] hover:text-[#f97316] transition disabled:opacity-50"
                >
                  {loadingMore ? 'Cargando…' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
        {/* Libros similares */}
        {similarBooks.length > 0 && (
          <div className="mt-10">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
              Más de {book.genre?.name}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {similarBooks.map(b => (
                <Link key={b.id} to={`/libro/${b.id}`} className="group flex flex-col">
                  <BookCover
                    bookId={b.id}
                    title={b.title}
                    className="w-full aspect-[2/3] rounded-lg object-cover group-hover:opacity-80 transition"
                  />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1.5 line-clamp-2 group-hover:text-[#f97316] transition-colors leading-tight">
                    {b.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
