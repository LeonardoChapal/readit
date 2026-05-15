import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Genre } from '../../types/book'

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Genre[]>('/api/v1/genres').then(setGenres).finally(() => setLoading(false))
  }, [])

  async function addGenre() {
    if (!newName.trim()) return
    const g = await api.post<Genre>('/api/v1/admin/genres', { name: newName.trim() })
    setGenres(prev => [...prev, g].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return
    const g = await api.put<Genre>(`/api/v1/admin/genres/${id}`, { name: editName.trim() })
    setGenres(prev => prev.map(x => x.id === id ? g : x))
    setEditId(null)
  }

  async function deleteGenre(id: number) {
    if (!window.confirm('¿Eliminar este género?')) return
    await api.delete(`/api/v1/admin/genres/${id}`)
    setGenres(prev => prev.filter(g => g.id !== id))
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando...</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Géneros</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGenre()}
          placeholder="Nuevo género..."
          className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
        />
        <button
          onClick={addGenre}
          className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Agregar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {genres.map(g => (
          <div key={g.id} className="flex items-center gap-3 px-4 py-3">
            {editId === g.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(g.id)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
                <button onClick={() => saveEdit(g.id)} className="text-xs text-[#f97316] font-medium hover:underline">Guardar</button>
                <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{g.name}</span>
                <button onClick={() => { setEditId(g.id); setEditName(g.name) }} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">Editar</button>
                <button onClick={() => deleteGenre(g.id)} className="text-xs text-red-400 hover:text-red-600 transition">Eliminar</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
