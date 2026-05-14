import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import BookCover from '../components/BookCover'
import UserAvatar from '../components/UserAvatar'
import { api, uploadAvatar } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import type { UserProfile, UserStats } from '../types/user'
import type { Review } from '../types/review'
import type { User } from '../types/auth'
import type { ReadingListEntry, ReadingStatus } from '../types/reading_list'

const STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: 'Quiero leer',
  reading: 'Leyendo',
  read: 'Ya leí',
}

interface EditForm {
  username: string
  email: string
  current_password: string
  new_password: string
  confirm_password: string
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const LIMIT = 20

  const [readingList, setReadingList] = useState<ReadingListEntry[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const [avatarBust, setAvatarBust] = useState<number | undefined>(undefined)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditForm>({ username: '', email: '', current_password: '', new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setHasMore(true)
    Promise.all([
      api.get<UserProfile>(`/api/v1/users/${username}`),
      api.get<Review[]>(`/api/v1/users/${username}/reviews?skip=0&limit=${LIMIT}`),
    ])
      .then(([p, r]) => {
        setProfile(p)
        setReviews(r)
        setHasMore(r.length === LIMIT)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [username])

  const loadMore = useCallback(async () => {
    if (!username) return
    setLoadingMore(true)
    try {
      const data = await api.get<Review[]>(`/api/v1/users/${username}/reviews?skip=${reviews.length}&limit=${LIMIT}`)
      setReviews(prev => [...prev, ...data])
      setHasMore(data.length === LIMIT)
    } finally {
      setLoadingMore(false)
    }
  }, [username, reviews.length])

  const isOwner = user?.username === username

  useEffect(() => {
    if (!isOwner) return
    api.get<ReadingListEntry[]>('/api/v1/reading-list')
      .then(setReadingList)
      .catch(() => {})
  }, [isOwner])

  useEffect(() => {
    if (!username) return
    api.get<UserStats>(`/api/v1/users/${username}/stats`)
      .then(setStats)
      .catch(() => {})
  }, [username])

  useEffect(() => {
    if (!user || isOwner || !username) return
    api.get<{ is_following: boolean }>(`/api/v1/users/${username}/is-following`)
      .then(r => setIsFollowing(r.is_following))
      .catch(() => {})
  }, [user, username, isOwner])

  async function toggleFollow() {
    if (!username) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await api.delete(`/api/v1/users/${username}/follow`)
        setIsFollowing(false)
        setProfile(p => p ? { ...p, follower_count: p.follower_count - 1 } : p)
      } else {
        await api.post(`/api/v1/users/${username}/follow`, {})
        setIsFollowing(true)
        setProfile(p => p ? { ...p, follower_count: p.follower_count + 1 } : p)
      }
    } finally {
      setFollowLoading(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return
    await uploadAvatar(e.target.files[0])
    setAvatarBust(Date.now())
    e.target.value = ''
  }

  function startEdit() {
    if (!profile) return
    setForm({ username: profile.username, email: user?.email ?? '', current_password: '', new_password: '', confirm_password: '' })
    setError('')
    setEditing(true)
  }

  async function saveEdit() {
    if (saving) return
    setError('')

    if (form.new_password && form.new_password !== form.confirm_password) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (form.new_password && form.new_password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (form.username !== profile?.username) body.username = form.username
      if (form.email !== user?.email) body.email = form.email
      if (form.new_password) {
        body.current_password = form.current_password
        body.new_password = form.new_password
      }

      const updated = await api.patch<User>('/api/v1/users/me', body)
      updateUser(updated)

      if (updated.username !== username) {
        navigate(`/usuario/${updated.username}`, { replace: true })
      } else {
        setProfile(prev => prev ? { ...prev, username: updated.username } : prev)
        setEditing(false)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const joinDate = profile
    ? new Date(profile.created_at).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm pt-24">Cargando...</p>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="text-center pt-24">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Usuario no encontrado.</p>
          <Link to="/" className="text-[#f97316] hover:underline text-sm">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Cabecera del perfil */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="relative">
                <UserAvatar username={profile.username} className="w-16 h-16" bust={avatarBust} />
                {isOwner && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    title="Cambiar foto"
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm"
                  >
                    <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
                  {profile.role === 'admin' && (
                    <span className="bg-orange-50 dark:bg-orange-900/30 text-[#f97316] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-800">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Miembro desde {joinDate}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwner && !editing && (
                <button
                  onClick={startEdit}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Editar perfil
                </button>
              )}
              {!isOwner && user && (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition disabled:opacity-50 ${
                    isFollowing
                      ? 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-300 hover:text-red-500'
                      : 'bg-[#f97316] hover:bg-orange-600 text-white'
                  }`}
                >
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-8 mt-6 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.review_count}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Reseñas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.comment_count}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Comentarios</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.follower_count}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.following_count}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Siguiendo</p>
            </div>
            {isOwner && readingList.length > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{readingList.length}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">En lista</p>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          {stats && (stats.avg_rating_given || stats.total_votes_received > 0 || stats.favorite_genre) && (
            <div className="flex gap-4 mt-4 flex-wrap">
              {stats.favorite_genre && (
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                  Género favorito: <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.favorite_genre}</span>
                </span>
              )}
              {stats.avg_rating_given && (
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                  Rating promedio: <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.avg_rating_given} ★</span>
                </span>
              )}
              {stats.total_votes_received > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                  Puntos recibidos: <span className="font-semibold text-[#f97316]">+{stats.total_votes_received}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Formulario de edición */}
        {editing && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="font-bold text-gray-900 dark:text-white mb-5">Editar perfil</h2>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre de usuario</label>
                <input
                  value={form.username}
                  onChange={f('username')}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={f('email')}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Cambiar contraseña <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span></p>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Contraseña actual"
                    value={form.current_password}
                    onChange={f('current_password')}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={form.new_password}
                    onChange={f('new_password')}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={form.confirm_password}
                    onChange={f('confirm_password')}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-[#f97316] text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de lectura */}
        {isOwner && readingList.length > 0 && (
          <div className="mb-10">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-5">Mi lista de lectura</h2>
            {(['want_to_read', 'reading', 'read'] as ReadingStatus[]).map(status => {
              const group = readingList.filter(e => e.status === status)
              if (group.length === 0) return null
              return (
                <div key={status} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    {STATUS_LABELS[status]}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {group.map(entry => (
                      <Link
                        key={entry.id}
                        to={`/libro/${entry.book_id}`}
                        className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 hover:border-[#f97316] hover:shadow-sm transition group"
                      >
                        <BookCover bookId={entry.book_id} title={entry.book.title} className="w-8 h-12 rounded-md flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-[#f97316] transition truncate max-w-[140px]">
                            {entry.book.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]">{entry.book.author}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Reseñas */}
        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-5">
          Reseñas de {profile.username}
        </h2>

        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Este usuario aún no ha publicado reseñas.</p>
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
