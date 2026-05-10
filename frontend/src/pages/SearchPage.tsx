import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BookCover from '../components/BookCover'
import UserAvatar from '../components/UserAvatar'
import StarRating from '../components/StarRating'
import Highlight from '../components/Highlight'
import { api } from '../lib/api'
import type { SearchResults } from '../types/review'
import type { Genre } from '../types/book'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const [results, setResults] = useState<SearchResults>({ books: [], reviews: [] })
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreId, setGenreId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<Genre[]>('/api/v1/genres').then(setGenres)
  }, [])

  useEffect(() => {
    if (q.trim().length < 2) { setResults({ books: [], reviews: [] }); return }
    setLoading(true)
    const url = `/api/v1/search?q=${encodeURIComponent(q.trim())}${genreId ? `&genre_id=${genreId}` : ''}`
    api.get<SearchResults>(url)
      .then(setResults)
      .finally(() => setLoading(false))
  }, [q, genreId])

  const total = results.books.length + results.reviews.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabecera */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Resultados para <span className="text-[#f97316]">"{q}"</span>
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {loading ? 'Buscando...' : `${total} resultado${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filtro por género */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setGenreId(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition
                ${genreId === null ? 'bg-[#f97316] text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#f97316] hover:text-[#f97316]'}`}
            >
              Todos los géneros
            </button>
            {genres.map(g => (
              <button
                key={g.id}
                onClick={() => setGenreId(genreId === g.id ? null : g.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition
                  ${genreId === g.id ? 'bg-[#f97316] text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#f97316] hover:text-[#f97316]'}`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && total === 0 && q.trim().length >= 2 && (
          <div className="text-center py-20">
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
              No encontramos resultados para "{q}"{genreId ? ' en este género' : ''}.
            </p>
            <Link to="/" className="text-[#f97316] hover:underline text-sm font-medium">
              Volver al inicio
            </Link>
          </div>
        )}

        {/* Sección libros */}
        {!loading && results.books.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Libros ({results.books.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.books.map(b => (
                <Link
                  key={b.id}
                  to={`/libro/${b.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-3 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition"
                >
                  <BookCover bookId={b.id} title={b.title} className="w-12 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white leading-snug">
                      <Highlight text={b.title} query={q} />
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      <Highlight text={b.author} query={q} />
                    </p>
                    {b.genre && (
                      <span className="inline-block mt-1.5 text-xs bg-orange-50 dark:bg-orange-900/30 text-[#f97316] px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800">
                        {b.genre.name}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sección reseñas */}
        {!loading && results.reviews.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Reseñas ({results.reviews.length})
            </h2>
            <div className="space-y-3">
              {results.reviews.map(r => {
                const date = new Date(r.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition">
                    <div className="flex gap-3">
                      <Link to={`/libro/${r.book.id}`}>
                        <BookCover bookId={r.book.id} title={r.book.title} className="w-10 h-14 rounded-lg flex-shrink-0 hover:opacity-80 transition" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                          <Highlight text={r.book.title} query={q} /> &middot; <Highlight text={r.book.author} query={q} />
                        </p>
                        <Link to={`/resena/${r.id}`}>
                          <h3 className="font-semibold text-gray-900 dark:text-white hover:text-[#f97316] transition-colors leading-snug">
                            <Highlight text={r.title} query={q} />
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          <Highlight text={r.content} query={q} />
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Link to={`/usuario/${r.user.username}`} className="flex items-center gap-1 hover:opacity-80 transition">
                            <UserAvatar username={r.user.username} className="w-4 h-4" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{r.user.username}</span>
                          </Link>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
                          {r.rating && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">·</span>
                              <StarRating rating={r.rating} size="sm" />
                            </>
                          )}
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className={`text-xs font-bold ${r.score > 0 ? 'text-[#f97316]' : 'text-gray-400 dark:text-gray-500'}`}>
                            {r.score > 0 ? '+' : ''}{r.score} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
