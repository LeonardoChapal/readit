import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import type { Review } from '../types/review'

const LIMIT = 20
type Sort = 'top' | 'recent' | 'rating'
type FeedTab = 'global' | 'following'

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'top', label: 'Más votadas' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'rating', label: 'Mejor valoradas' },
]

export default function HomePage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState<Sort>('top')
  const [feedTab, setFeedTab] = useState<FeedTab>('global')
  const [trending, setTrending] = useState<Review[]>([])

  useEffect(() => {
    api.get<Review[]>('/api/v1/reviews/trending?limit=3').then(setTrending).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setReviews([])
    const url = feedTab === 'following'
      ? `/api/v1/feed?skip=0&limit=${LIMIT}`
      : `/api/v1/reviews?sort=${sort}&skip=0&limit=${LIMIT}`
    api.get<Review[]>(url)
      .then(data => {
        setReviews(data)
        setHasMore(data.length === LIMIT)
      })
      .finally(() => setLoading(false))
  }, [sort, feedTab])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const url = feedTab === 'following'
        ? `/api/v1/feed?skip=${reviews.length}&limit=${LIMIT}`
        : `/api/v1/reviews?sort=${sort}&skip=${reviews.length}&limit=${LIMIT}`
      const data = await api.get<Review[]>(url)
      setReviews(prev => [...prev, ...data])
      setHasMore(data.length === LIMIT)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Hero */}
      <section className="hero-animated relative overflow-hidden">
        {/* Decorativos */}
        <div className="absolute top-8 right-16 opacity-10 float">
          <svg width="90" height="120" viewBox="0 0 90 120" fill="white">
            <rect x="5" y="5" width="80" height="110" rx="4" />
            <rect x="15" y="20" width="60" height="6" rx="2" />
            <rect x="15" y="34" width="45" height="4" rx="2" />
            <rect x="15" y="46" width="52" height="4" rx="2" />
          </svg>
        </div>
        <div className="absolute bottom-12 left-12 opacity-10 float-slow">
          <svg width="60" height="80" viewBox="0 0 60 80" fill="white">
            <rect x="4" y="4" width="52" height="72" rx="3" />
            <rect x="12" y="16" width="36" height="4" rx="2" />
            <rect x="12" y="26" width="28" height="3" rx="2" />
          </svg>
        </div>
        <div className="absolute top-1/3 left-1/4 opacity-5 float">
          <div className="w-32 h-32 rounded-full bg-white" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-24 text-center text-white">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4 drop-shadow-sm">
            Readit
          </h1>
          <p className="text-lg md:text-xl text-orange-100 mb-10 max-w-lg mx-auto leading-relaxed">
            Descubre, comenta y vota reseñas literarias escritas por la comunidad.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/explorar"
              className="bg-white text-orange-600 font-bold px-7 py-3 rounded-full hover:bg-orange-50 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
            >
              Explorar libros
            </Link>
            {user ? (
              <Link
                to="/nueva-resena"
                className="border-2 border-white text-white font-bold px-7 py-3 rounded-full hover:bg-white/15 transition hover:-translate-y-0.5 transform duration-200"
              >
                Nueva reseña
              </Link>
            ) : (
              <Link
                to="/registro"
                className="border-2 border-white text-white font-bold px-7 py-3 rounded-full hover:bg-white/15 transition hover:-translate-y-0.5 transform duration-200"
              >
                Únete gratis
              </Link>
            )}
          </div>
        </div>

        {/* Ola inferior */}
        <div className="absolute bottom-[-2px] left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 58L1440 58L1440 0Q1080 56 720 32Q360 8 0 40Z" className="fill-gray-50 dark:fill-gray-900" />
          </svg>
        </div>
      </section>

      {/* Trending semanal */}
      {trending.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pt-10 -mt-px">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔥</span>
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Trending esta semana</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {trending.map((review, i) => (
              <Link
                key={review.id}
                to={`/resena/${review.id}`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-gray-100 dark:text-gray-700 select-none">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {review.book.title}
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-[#f97316]">
                      {review.title}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {review.content}
                </p>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{review.user.username}</span>
                  <span className="text-xs font-bold text-[#f97316]">+{review.score} pts</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Feed */}
      <main className={`max-w-4xl mx-auto px-4 pb-10 ${trending.length === 0 ? 'pt-10 -mt-px' : 'pt-0'}`}>
        {/* Tabs feed */}
        {user && (
          <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 mb-6 -mt-2">
            {([['global', 'Para todos'], ['following', 'Siguiendo']] as [FeedTab, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFeedTab(value)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                  feedTab === value
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          {/* Selector sort */}
          {feedTab === 'global' && <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    sort === opt.value
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>}

          <Link to="/explorar" className="text-sm text-[#f97316] hover:underline font-medium ml-auto">
            Por género →
          </Link>
        </div>

        {loading && (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-16">Cargando reseñas...</p>
        )}

        {!loading && reviews.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Aún no hay reseñas publicadas.</p>
            <Link
              to="/nueva-resena"
              className="inline-block bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold px-6 py-3 rounded-full transition shadow hover:shadow-md hover:-translate-y-0.5 transform duration-200"
            >
              Sé el primero en reseñar
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {hasMore && !loading && (
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
      </main>
    </div>
  )
}
