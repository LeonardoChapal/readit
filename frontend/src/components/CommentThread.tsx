import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Comment, CommentNode } from '../types/comment'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import UserAvatar from './UserAvatar'

function buildTree(flat: Comment[]): CommentNode[] {
  const map: Record<number, CommentNode> = {}
  const roots: CommentNode[] = []
  flat.forEach(c => { map[c.id] = { ...c, replies: [] } })
  flat.forEach(c => {
    if (c.parent_comment_id && map[c.parent_comment_id]) {
      map[c.parent_comment_id].replies.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })
  return roots
}

interface CommentItemProps {
  comment: CommentNode
  reviewId: number
  onAdd: (c: Comment) => void
  onEdit: (id: number, content: string) => void
  onDelete: (id: number) => void
  depth: number
}

function CommentItem({ comment, reviewId, onAdd, onEdit, onDelete, depth }: CommentItemProps) {
  const { user } = useAuth()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [editBusy, setEditBusy] = useState(false)

  const isAuthor = user?.id === comment.user.id
  const isDeleted = comment.status === 'deleted'

  const date = new Date(comment.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  async function submitReply() {
    if (!replyText.trim()) return
    setReplyBusy(true)
    try {
      const c = await api.post<Comment>(`/api/v1/reviews/${reviewId}/comments`, {
        content: replyText.trim(),
        parent_comment_id: comment.id,
      })
      onAdd(c)
      setReplyText('')
      setReplyOpen(false)
    } finally {
      setReplyBusy(false)
    }
  }

  function startEdit() {
    setEditText(comment.content)
    setEditing(true)
  }

  async function saveEdit() {
    if (!editText.trim() || editBusy) return
    setEditBusy(true)
    try {
      await api.patch(`/api/v1/comments/${comment.id}`, { content: editText.trim() })
      onEdit(comment.id, editText.trim())
      setEditing(false)
    } finally {
      setEditBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar este comentario?')) return
    await api.delete(`/api/v1/comments/${comment.id}`)
    onDelete(comment.id)
  }

  return (
    <div className={depth > 0 ? 'ml-5 border-l-2 border-gray-100 dark:border-gray-700 pl-4' : ''}>
      <div className="py-3">
        {isDeleted ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Comentario eliminado.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/usuario/${comment.user.username}`} className="flex items-center gap-1.5 hover:opacity-80 transition">
                <UserAvatar username={comment.user.username} className="w-5 h-5" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-[#f97316] transition-colors">
                  {comment.user.username}
                </span>
              </Link>
              <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
              {isAuthor && !editing && (
                <span className="flex items-center gap-1.5 ml-auto">
                  <button onClick={startEdit} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition">
                    Editar
                  </button>
                  <span className="text-gray-200 dark:text-gray-600">|</span>
                  <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 transition">
                    Eliminar
                  </button>
                </span>
              )}
            </div>

            {editing ? (
              <div className="mt-1 flex flex-col gap-2">
                <textarea
                  rows={2}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={editBusy || !editText.trim()}
                    className="text-xs bg-[#f97316] text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {editBusy ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>
            )}

            {user && depth < 4 && !editing && (
              <button
                onClick={() => setReplyOpen(v => !v)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#f97316] mt-2 transition"
              >
                {replyOpen ? 'Cancelar' : 'Responder'}
              </button>
            )}
            {replyOpen && (
              <div className="mt-2 flex gap-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] resize-none"
                  placeholder="Tu respuesta..."
                />
                <button
                  onClick={submitReply}
                  disabled={replyBusy || !replyText.trim()}
                  className="self-end bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-medium px-3 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {replyBusy ? '...' : 'Enviar'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {comment.replies.map(r => (
        <CommentItem key={r.id} comment={r} reviewId={reviewId} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />
      ))}
    </div>
  )
}

interface Props {
  initialComments: Comment[]
  reviewId: number
}

export default function CommentThread({ initialComments, reviewId }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  function handleAdd(c: Comment) {
    setComments(prev => [...prev, c])
  }

  function handleEdit(id: number, content: string) {
    setComments(prev => prev.map(c => c.id === id ? { ...c, content } : c))
  }

  function handleDelete(id: number) {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'deleted' } : c))
  }

  async function submit() {
    if (!text.trim()) return
    setBusy(true)
    try {
      const c = await api.post<Comment>(`/api/v1/reviews/${reviewId}/comments`, {
        content: text.trim(),
      })
      handleAdd(c)
      setText('')
    } finally {
      setBusy(false)
    }
  }

  const tree = buildTree(comments)

  return (
    <div>
      <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
        {comments.filter(c => c.status === 'active').length} {comments.filter(c => c.status === 'active').length === 1 ? 'comentario' : 'comentarios'}
      </h2>

      {user ? (
        <div className="mb-6 flex gap-3">
          <textarea
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] resize-none"
            placeholder="Añade un comentario..."
          />
          <button
            onClick={submit}
            disabled={busy || !text.trim()}
            className="self-end bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {busy ? '...' : 'Comentar'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
          <Link to="/login" className="text-[#f97316] hover:underline">Inicia sesión</Link>{' '}
          para comentar.
        </p>
      )}

      {tree.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">Sé el primero en comentar.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {tree.map(c => (
            <CommentItem key={c.id} comment={c} reviewId={reviewId} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} depth={0} />
          ))}
        </div>
      )}
    </div>
  )
}
