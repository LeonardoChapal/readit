import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import type { Genre } from '../types/book'
import type { Tag } from '../types/recommendation'

interface OnboardingOptions {
  genres: Genre[]
  tags: Tag[]
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [options, setOptions] = useState<OnboardingOptions>({ genres: [], tags: [] })
  const [selectedGenres, setSelectedGenres] = useState<Set<number>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'genres' | 'tags'>('genres')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.onboarding_completed) { navigate('/'); return }
    api.get<OnboardingOptions>('/api/v1/onboarding/options').then(setOptions)
  }, [user, navigate])

  function toggleGenre(id: number) {
    setSelectedGenres(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTag(id: number) {
    setSelectedTags(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleComplete() {
    if (selectedGenres.size === 0) return
    setLoading(true)
    try {
      await api.post('/api/v1/onboarding/complete', {
        genre_ids: Array.from(selectedGenres),
        tag_ids: Array.from(selectedTags),
      })
      await refreshUser()
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  function skip() {
    api.post('/api/v1/onboarding/complete', { genre_ids: [], tag_ids: [] }).catch(() => {})
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
              : 'Elige etiquetas temáticas para afinar aún más tus recomendaciones'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1.5 w-16 rounded-full bg-[#f97316]" />
            <div className={`h-1.5 w-16 rounded-full transition-colors ${step === 'tags' ? 'bg-[#f97316]' : 'bg-gray-200 dark:bg-gray-700'}`} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          {step === 'genres' ? (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Géneros ({selectedGenres.size} seleccionados)
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {options.genres.map(g => (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                      selectedGenres.has(g.id)
                        ? 'bg-[#f97316] text-white border-[#f97316]'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#f97316] hover:text-[#f97316]'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                  Omitir por ahora
                </button>
                <button
                  onClick={() => options.tags.length > 0 ? setStep('tags') : handleComplete()}
                  disabled={selectedGenres.size === 0}
                  className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold px-6 py-2.5 rounded-full transition disabled:opacity-50"
                >
                  {options.tags.length > 0 ? 'Siguiente →' : 'Empezar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Etiquetas ({selectedTags.size} seleccionadas) — opcional
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {options.tags.map(t => (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                      selectedTags.has(t.id)
                        ? 'bg-[#f97316] text-white border-[#f97316]'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#f97316] hover:text-[#f97316]'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
                {options.tags.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No hay etiquetas disponibles aún.</p>
                )}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setStep('genres')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
                  ← Volver
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold px-6 py-2.5 rounded-full transition disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Empezar a leer'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
