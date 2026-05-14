import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CommentThread from '../components/CommentThread'
import BookCover from '../components/BookCover'
import UserAvatar from '../components/UserAvatar'
import StarRating from '../components/StarRating'
import StarPicker from '../components/StarPicker'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import type { Review } from '../types/review'
import type { Comment } from '../types/comment'

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [review, setReview] = useState<Review | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userVote, setUserVote] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [voting, setVoting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editRating, setEditRating] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Review>(`/api/v1/reviews/${id}`),
      api.get<Comment[]>(`/api/v1/reviews/${id}/comments`),
    ])
      .then(([r, c]) => {
        setReview(r)
        setScore(r.score)
        setComments(c)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    api.get<{ value: number | null }>(`/api/v1/reviews/${id}/my-vote`)
      .then(res => setUserVote(res.value))
      .catch(() => {})
  }, [user, id])

  async function handleVote(value: 1 | -1) {
    if (!user) { navigate('/login'); return }
    if (voting) return
    setVoting(true)
    try {
      const res = await api.post<{ score: number; user_vote: number | null }>(
        `/api/v1/reviews/${id}/vote`,
        { value },
      )
      setScore(res.score)
      setUserVote(res.user_vote)
    } finally {
      setVoting(false)
    }
  }

  function startEdit() {
    if (!review) return
    setEditTitle(review.title)
    setEditContent(review.content)
    setEditRating(review.rating)
    setEditing(true)
  }

  async function saveEdit() {
    if (!review || saving) return
    setSaving(true)
    try {
      const updated = await api.patch<Review>(`/api/v1/reviews/${review.id}`, {
        title: editTitle,
        content: editContent,
        rating: editRating,
      })
      setReview(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!review) return
    if (!window.confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return
    await api.delete(`/api/v1/reviews/${review.id}`)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm pt-24">Cargando...</p>
      </div>
    )
  }

  if (notFound || !review) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="text-center pt-24">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Reseña no encontrada.</p>
          <Link to="/" className="text-[#f97316] hover:underline text-sm">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  const isAuthor = user?.id === review.user.id
  const date = new Date(review.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition flex items-center gap-1 mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>

        {/* Libro */}
        <Link to={`/libro/${review.book.id}`} className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4 flex items-start gap-4 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
          <BookCover bookId={review.book.id} title={review.book.title} className="w-14 h-20 rounded-lg" />
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight hover:text-[#f97316] transition-colors">{review.book.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{review.book.author}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {review.book.genre && (
                <span className="bg-orange-50 dark:bg-orange-900/30 text-[#f97316] text-xs font-medium px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-800">
                  {review.book.genre.name}
                </span>
              )}
              {review.book.year && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{review.book.year}</span>
              )}
            </div>
          </div>
        </Link>

        {/* Reseña */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
          {editing ? (
            /* Modo edición */
            <div className="space-y-3">
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full text-2xl font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Calificación</p>
                <StarPicker value={editRating} onChange={setEditRating} />
              </div>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={10}
                className="w-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f97316] resize-none leading-relaxed"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveEdit}
                  disabled={saving || !editTitle.trim() || !editContent.trim()}
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
          ) : (
            /* Modo lectura */
            <>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{review.title}</h1>
                  {review.rating && <StarRating rating={review.rating} size="md" />}
                </div>
                {isAuthor && (
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <button
                      onClick={startEdit}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition font-medium"
                    >
                      Editar
                    </button>
                    <span className="text-gray-200 dark:text-gray-600">|</span>
                    <button
                      onClick={handleDelete}
                      className="text-xs text-red-400 hover:text-red-600 transition font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <Link to={`/usuario/${review.user.username}`} className="flex items-center gap-1.5 hover:opacity-80 transition">
                    <UserAvatar username={review.user.username} className="w-6 h-6" />
                    <span className="text-gray-700 dark:text-gray-300 font-semibold hover:text-[#f97316] transition-colors">
                      {review.user.username}
                    </span>
                  </Link>
                  <span>&middot;</span>
                  {date}
                </div>

                {/* Compartir */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {copied ? '¡Copiado!' : 'Compartir'}
                </button>

                {/* Votos */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVote(1)}
                    disabled={voting}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition
                      ${userVote === 1
                        ? 'bg-[#f97316] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-50 hover:text-[#f97316]'
                      } disabled:opacity-50`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Útil
                  </button>

                  <span className={`text-sm font-bold px-2 min-w-[2rem] text-center
                    ${score > 0 ? 'text-[#f97316]' : score < 0 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {score}
                  </span>

                  <button
                    onClick={() => handleVote(-1)}
                    disabled={voting}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition
                      ${userVote === -1
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      } disabled:opacity-50`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    No útil
                  </button>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {review.content}
              </div>
            </>
          )}
        </div>

        {/* Comentarios */}
        {!editing && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <CommentThread initialComments={comments} reviewId={Number(id)} />
          </div>
        )}
      </main>
    </div>
  )
}
