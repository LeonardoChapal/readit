import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import BookCover from '../components/BookCover'
import type { Genre } from '../types/book'

const MAX_GENRES = 3
const MAX_BOOKS = 5

interface BookOption {
  id: number
  title: string
  author: string
}

interface OnboardingOptions {
  genres: Genre[]
  books: BookOption[]
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [options, setOptions] = useState<OnboardingOptions>({ genres: [], books: [] })
  const [selectedGenres, setSelectedGenres] = useState<Set<number>>(new Set())
  const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'genres' | 'books'>('genres')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.onboarding_completed) { navigate('/'); return }
    api.get<OnboardingOptions>('/api/v1/onboarding/options').then(setOptions)
  }, [user, navigate])

  function toggleGenre(id: number) {
    setSelectedGenres(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_GENRES) {
        next.add(id)
      }
      return next
    })
  }

  function toggleBook(id: number) {
    setSelectedBooks(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_BOOKS) {
        next.add(id)
      }
      return next
    })
  }

  async function handleComplete() {
    setLoading(true)
    try {
      await api.post('/api/v1/onboarding/complete', {
        genre_ids: Array.from(selectedGenres),
        book_ids: Array.from(selectedBooks),
      })
      await refreshUser()
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  function skip() {
    api.post('/api/v1/onboarding/complete', { genre_ids: [], book_ids: [] }).catch(() => {})
    refreshUser().finally(() => navigate('/'))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#f97316] mb-2">Bienvenido a Readit</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {step === 'genres'
              ? 'Selecciona los géneros que más te gustan para personalizar tu experiencia'
              : '¿Cuáles de estos libros has leído?'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setStep('genres')}
              className={`h-1.5 w-16 rounded-full transition-colors ${step === 'genres' ? 'bg-[#f97316]' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            />
            <button
              onClick={() => selectedGenres.size > 0 && setStep('books')}
              className={`h-1.5 w-16 rounded-full transition-colors ${step === 'books' ? 'bg-[#f97316]' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          {step === 'genres' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Géneros
                </h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  selectedGenres.size === MAX_GENRES
                    ? 'bg-[#f97316] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {selectedGenres.size}/{MAX_GENRES}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {options.genres.map(g => {
                  const selected = selectedGenres.has(g.id)
                  const limitReached = !selected && selectedGenres.size >= MAX_GENRES
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGenre(g.id)}
                      disabled={limitReached}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                        selected
                          ? 'bg-[#f97316] text-white border-[#f97316]'
                          : limitReached
                          ? 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#f97316] hover:text-[#f97316]'
                      }`}
                    >
                      {g.name}
                    </button>
                  )
                })}
              </div>
              {selectedGenres.size === MAX_GENRES && (
                <p className="text-xs text-[#f97316] mb-4">Máximo {MAX_GENRES} géneros. Haz clic en uno para deseleccionarlo.</p>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                  Omitir por ahora
                </button>
                <button
                  onClick={() => setStep('books')}
                  disabled={selectedGenres.size === 0}
                  className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold px-6 py-2.5 rounded-full transition disabled:opacity-50"
                >
                  Siguiente →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Libros leídos — opcional
                </h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  selectedBooks.size === MAX_BOOKS
                    ? 'bg-[#f97316] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {selectedBooks.size}/{MAX_BOOKS}
                </span>
              </div>

              {options.books.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">No hay libros disponibles aún.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4 max-h-72 overflow-y-auto pr-1">
                  {options.books.map(b => {
                    const selected = selectedBooks.has(b.id)
                    const limitReached = !selected && selectedBooks.size >= MAX_BOOKS
                    return (
                      <button
                        key={b.id}
                        onClick={() => toggleBook(b.id)}
                        disabled={limitReached}
                        className={`flex flex-col items-center gap-1.5 group text-left transition-opacity ${limitReached ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className={`relative w-full rounded-lg overflow-hidden ring-2 transition-all ${
                          selected ? 'ring-[#f97316] scale-95' : 'ring-transparent hover:ring-orange-200 dark:hover:ring-orange-800'
                        }`}>
                          <BookCover bookId={b.id} title={b.title} className="w-full aspect-[2/3] object-cover" />
                          {selected && (
                            <div className="absolute inset-0 bg-[#f97316]/30 flex items-center justify-center">
                              <div className="bg-[#f97316] rounded-full p-1">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className={`text-xs text-center line-clamp-2 leading-tight transition-colors ${
                          selected ? 'text-[#f97316] font-medium' : 'text-gray-700 dark:text-gray-300 group-hover:text-[#f97316]'
                        }`}>
                          {b.title}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedBooks.size === MAX_BOOKS && (
                <p className="text-xs text-[#f97316] mb-4">Máximo {MAX_BOOKS} libros. Haz clic en uno para deseleccionarlo.</p>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setStep('genres')}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                >
                  ← Volver
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold px-6 py-2.5 rounded-full transition disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : selectedBooks.size > 0 ? `Empezar (${selectedBooks.size} leídos)` : 'Empezar →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
