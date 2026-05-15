import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Tag } from '../../types/recommendation'

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Tag[]>('/api/v1/tags').then(setTags)
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTag.trim()) return
    setError(null)
    setLoading(true)
    try {
      const tag = await api.post<Tag>('/api/v1/tags', { name: newTag.trim() })
      setTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTag('')
    } catch {
      setError('Ya existe una etiqueta con ese nombre o hubo un error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Etiquetas</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Nueva etiqueta</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            placeholder="ej. realismo mágico"
            className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
          <button
            type="submit"
            disabled={loading || !newTag.trim()}
            className="bg-[#f97316] hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear'}
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{tags.length} etiqueta{tags.length !== 1 ? 's' : ''}</p>
        </div>
        {tags.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No hay etiquetas aún.</p>
        ) : (
          <div className="p-5 flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t.id} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                #{t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">¿Cómo asignar etiquetas a libros?</p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Ve a <strong>Libros</strong> en el menú lateral y usa el botón <strong>Etiquetas</strong> en cada libro.
        </p>
      </div>
    </div>
  )
}
