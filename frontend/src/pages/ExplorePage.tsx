import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import { api } from '../lib/api'
import type { Review } from '../types/review'
import type { Genre } from '../types/book'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
}

const LIMIT = 20

export default function ExplorePage() {
  const { genero } = useParams<{ genero?: string }>()
  const navigate = useNavigate()

  const [genres, setGenres] = useState<Genre[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const activeGenre = genres.find(g => slugify(g.name) === genero) ?? null

  useEffect(() => {
    api.get<Genre[]>('/api/v1/genres').then(setGenres)
  }, [])

  useEffect(() => {
    setLoading(true)
    setHasMore(true)
    const base = activeGenre
      ? `/api/v1/reviews?genre_id=${activeGenre.id}`
      : '/api/v1/reviews'
    api.get<Review[]>(`${base}&skip=0&limit=${LIMIT}`)
      .then(data => {
        setReviews(data)
        setHasMore(data.length === LIMIT)
      })
      .finally(() => setLoading(false))
  }, [activeGenre])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const base = activeGenre
        ? `/api/v1/reviews?genre_id=${activeGenre.id}`
        : '/api/v1/reviews'
      const data = await api.get<Review[]>(`${base}&skip=${reviews.length}&limit=${LIMIT}`)
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
        <div className="max-w-4xl mx-auto px-4 py-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Explorar por género</h1>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => selectGenre(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition
                ${!activeGenre
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
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition
                  ${activeGenre?.id === g.id
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
        {loading ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">Cargando...</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {activeGenre
                ? `No hay reseñas de ${activeGenre.name} todavía.`
                : 'No hay reseñas publicadas aún.'}
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
        )}
      </main>
    </div>
  )
}
