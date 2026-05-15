import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { Comment } from '../../types/comment'

const STATUS_COLORS: Record<string, string> = {
  active:  'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  hidden:  'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  deleted: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Comment[]>('/api/v1/admin/comments').then(setComments).finally(() => setLoading(false))
  }, [])

  async function changeStatus(id: number, status: string) {
    const updated = await api.patch<Comment>(`/api/v1/admin/comments/${id}/status`, { status })
    setComments(prev => prev.map(c => c.id === id ? updated : c))
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comentarios</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {['Contenido', 'Usuario', 'Reseña', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {comments.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 max-w-xs text-gray-700 dark:text-gray-300 line-clamp-2">{c.content}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.user.username}</td>
                <td className="px-4 py-3">
                  <Link to={`/resena/${c.review_id}`} className="text-[#f97316] hover:underline text-xs">
                    Ver reseña
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={c.status}
                    onChange={e => changeStatus(c.id, e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  >
                    <option value="active">Activo</option>
                    <option value="hidden">Ocultar</option>
                    <option value="deleted">Eliminar</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
