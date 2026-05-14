import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import BookCover from '../components/BookCover'
import { api } from '../lib/api'
import type { Review } from '../types/review'
import type { Book, Genre } from '../types/book'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
}

const LIMIT = 20
type Sort = 'top' | 'recent' | 'rating'
type Tab = 'books' | 'reviews'

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'top', label: 'Más votadas' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'rating', label: 'Mejor valoradas' },
]

export default function ExplorePage() {
  const { genero } = useParams<{ genero?: string }>()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('books')
  const [genres, setGenres] = useState<Genre[]>([])

  const [books, setBooks] = useState<Book[]>([])
  const [booksLoading, setBooksLoading] = useState(true)

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState<Sort>('top')

  const activeGenre = genres.find(g => slugify(g.name) === genero) ?? null

  useEffect(() => {
    api.get<Genre[]>('/api/v1/genres').then(setGenres)
  }, [])

  // Cargar libros al cambiar género o tab
  useEffect(() => {
    if (tab !== 'books') return
    setBooksLoading(true)
    const url = activeGenre
      ? `/api/v1/books?genre_id=${activeGenre.id}`
      : '/api/v1/books'
    api.get<Book[]>(url)
      .then(setBooks)
      .finally(() => setBooksLoading(false))
  }, [activeGenre, tab])

  // Cargar reseñas al cambiar género, sort o tab
  useEffect(() => {
    if (tab !== 'reviews') return
    setReviewsLoading(true)
    setReviews([])
    setHasMore(true)
    const params = new URLSearchParams({ sort, skip: '0', limit: String(LIMIT) })
    if (activeGenre) params.set('genre_id', String(activeGenre.id))
    api.get<Review[]>(`/api/v1/reviews?${params}`)
      .then(data => {
        setReviews(data)
        setHasMore(data.length === LIMIT)
      })
      .finally(() => setReviewsLoading(false))
  }, [activeGenre, sort, tab])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({ sort, skip: String(reviews.length), limit: String(LIMIT) })
      if (activeGenre) params.set('genre_id', String(activeGenre.id))
      const data = await api.get<Review[]>(`/api/v1/reviews?${params}`)
      setReviews(prev => [...prev, ...data])
      setHasMore(data.length === LIMIT)
    } finally {
      setLoadingMore(false)
    }
  }

  function selectGenre(genre: Genre | null) {
    if (!genre) navigate('/explorar')
    else navigate(`/explorar/${slugify(genre.name)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Explorar</h1>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 -mb-px">
            {([['books', 'Libros'], ['reviews', 'Reseñas']] as [Tab, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition ${
                  tab === value
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
          {/* Sort (solo en reseñas) */}
          {tab === 'reviews' && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-full p-1 gap-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    sort === opt.value
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Géneros */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => selectGenre(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                !activeGenre
                  ? 'bg-[#f97316] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            {genres.map(g => (
              <button
                key={g.id}
                onClick={() => selectGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeGenre?.id === g.id
                    ? 'bg-[#f97316] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab: Libros */}
        {tab === 'books' && (
          booksLoading ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">Cargando...</p>
          ) : books.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {activeGenre ? `No hay libros de ${activeGenre.name}.` : 'No hay libros todavía.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {books.map(book => (
                <Link
                  key={book.id}
                  to={`/libro/${book.id}`}
                  className="group flex flex-col"
                >
                  <div className="relative overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-200">
                    <BookCover
                      bookId={book.id}
                      title={book.title}
                      className="w-full aspect-[2/3] rounded-xl object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-2 px-0.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-[#f97316] transition-colors">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{book.author}</p>
                    {book.genre && (
                      <span className="inline-block mt-1 text-[10px] font-medium text-[#f97316] bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full">
                        {book.genre.name}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Tab: Reseñas */}
        {tab === 'reviews' && (
          reviewsLoading ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">Cargando...</p>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {activeGenre ? `No hay reseñas de ${activeGenre.name} todavía.` : 'No hay reseñas publicadas aún.'}
              </p>
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
          )
        )}
      </main>
    </div>
  )
}
