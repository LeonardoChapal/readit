import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

interface TopReview {
  id: number
  title: string
  score: number
  book_title: string
  username: string
}

interface TopUser {
  username: string
  review_count: number
}

interface RecentReview {
  id: number
  title: string
  book_title: string
  username: string
  created_at: string
}

interface Stats {
  users: number
  books: number
  reviews: number
  comments: number
  genres: number
  new_users_month: number
  new_reviews_month: number
  top_reviews: TopReview[]
  top_users: TopUser[]
  recent_reviews: RecentReview[]
}

const STAT_CARDS = [
  { key: 'users',    label: 'Usuarios',      to: '/admin/usuarios',    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'books',    label: 'Libros',         to: '/admin/libros',      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { key: 'reviews',  label: 'Reseñas',        to: '/admin/resenas',     icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { key: 'comments', label: 'Comentarios',    to: '/admin/comentarios', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { key: 'genres',   label: 'Géneros',        to: '/admin/generos',     icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
] as const

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Stats>('/api/v1/admin/stats')
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n.toLocaleString('es-ES')

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map(({ key, label, to, icon }) => (
          <Link
            key={key}
            to={to}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-orange-200 transition group"
          >
            <div className="flex items-start justify-between mb-3">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#f97316] transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats ? fmt(stats[key]) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Este mes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-[#f97316] uppercase tracking-wide mb-1">Este mes</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? fmt(stats.new_users_month) : '—'}</p>
          <p className="text-sm text-gray-500 mt-0.5">Nuevos usuarios</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-[#f97316] uppercase tracking-wide mb-1">Este mes</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? fmt(stats.new_reviews_month) : '—'}</p>
          <p className="text-sm text-gray-500 mt-0.5">Nuevas reseñas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top reseñas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Reseñas más votadas</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
            ) : stats?.top_reviews.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos aún.</p>
            ) : (
              stats?.top_reviews.map((r, i) => (
                <Link
                  key={r.id}
                  to={`/resena/${r.id}`}
                  target="_blank"
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-bold text-gray-300 w-4 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 truncate">{r.book_title} · {r.username}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${r.score > 0 ? 'text-[#f97316]' : 'text-gray-400'}`}>
                    {r.score > 0 ? '+' : ''}{r.score}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top usuarios */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Usuarios más activos</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
            ) : stats?.top_users.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos aún.</p>
            ) : (
              stats?.top_users.map((u, i) => (
                <Link
                  key={u.username}
                  to={`/usuario/${u.username}`}
                  target="_blank"
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-bold text-gray-300 w-4 text-center">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-[#f97316] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {u.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800 flex-1 truncate">{u.username}</span>
                  <span className="text-xs text-gray-400 shrink-0">{u.review_count} reseñas</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Actividad reciente</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
          ) : stats?.recent_reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin actividad aún.</p>
          ) : (
            stats?.recent_reviews.map(r => {
              const date = new Date(r.created_at).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
              return (
                <Link
                  key={r.id}
                  to={`/resena/${r.id}`}
                  target="_blank"
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 truncate">{r.book_title} · por {r.username}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{date}</span>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
