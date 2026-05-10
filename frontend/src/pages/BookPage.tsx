import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BookCover from '../components/BookCover'
import ReviewCard from '../components/ReviewCard'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import StarRating from '../components/StarRating'
import type { BookDetail } from '../types/book'
import type { Review } from '../types/review'

const LIMIT = 20

export default function BookPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [book, setBook] = useState<BookDetail | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.get<Book>(`/api/v1/books/${id}`),
      api.get<Review[]>(`/api/v1/books/${id}/reviews?skip=0&limit=${LIMIT}`),
    ])
      .then(([b, r]) => {
        setBook(b as BookDetail)
        setReviews(r)
        setHasMore(r.length === LIMIT)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  async function loadMore() {
    if (!id) return
    setLoadingMore(true)
    try {
      const data = await api.get<Review[]>(`/api/v1/books/${id}/reviews?skip=${reviews.length}&limit=${LIMIT}`)
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

            {book.avg_rating && (
              <div className="flex items-center gap-2 mt-3">
                <StarRating rating={Math.round(book.avg_rating)} size="md" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{book.avg_rating}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">({book.rating_count} {book.rating_count === 1 ? 'calificación' : 'calificaciones'})</span>
              </div>
            )}

            <div className="mt-5">
              {user ? (
                <Link
                  to={`/nueva-resena?libro=${book.id}`}
                  className="inline-block bg-[#f97316] hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                >
                  Escribir reseña
                </Link>
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800 dark:text-gray-100">
            Reseñas{reviews.length > 0 ? ` (${reviews.length}${hasMore ? '+' : ''})` : ''}
          </h2>
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
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
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
      </main>
    </div>
  )
}
