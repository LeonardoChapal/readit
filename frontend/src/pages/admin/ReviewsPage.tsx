import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { Review } from '../../types/review'

const STATUS_LABELS: Record<string, string> = {
  active:  'Activa',
  hidden:  'Oculta',
  deleted: 'Eliminada',
}

const STATUS_COLORS: Record<string, string> = {
  active:  'bg-green-50 text-green-700',
  hidden:  'bg-yellow-50 text-yellow-700',
  deleted: 'bg-red-50 text-red-600',
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Review[]>('/api/v1/admin/reviews')
      .then(setReviews)
      .finally(() => setLoading(false))
  }, [])

  async function changeStatus(id: number, status: string) {
    const updated = await api.patch<Review>(`/api/v1/admin/reviews/${id}/status`, { status })
    setReviews(prev => prev.map(r => r.id === id ? updated : r))
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reseñas</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Título', 'Libro', 'Autor', 'Estado', 'Puntos', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviews.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 max-w-xs">
                  <Link to={`/resena/${r.id}`} className="font-medium text-gray-900 hover:text-[#f97316] line-clamp-1 transition">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{r.book.title}</td>
                <td className="px-4 py-3 text-gray-500">{r.user.username}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{r.score}</td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={e => changeStatus(r.id, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  >
                    <option value="active">Activa</option>
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
