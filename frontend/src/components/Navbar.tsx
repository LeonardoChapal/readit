import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { api } from '../lib/api'
import SearchBar from './SearchBar'
import UserAvatar from './UserAvatar'
import type { Notification } from '../types/review'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    api.get<{ count: number }>('/api/v1/notifications/unread-count')
      .then(r => setUnread(r.count))
      .catch(() => {})
  }, [user])

  async function openNotifications() {
    setNotifOpen(o => !o)
    if (!notifOpen) {
      const data = await api.get<Notification[]>('/api/v1/notifications').catch(() => [])
      setNotifications(data)
      if (unread > 0) {
        api.patch('/api/v1/notifications/read-all', {}).then(() => setUnread(0)).catch(() => {})
      }
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold text-[#f97316] shrink-0">Readit</Link>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <Link to="/explorar" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition hidden sm:block shrink-0">
            Explorar
          </Link>

          <SearchBar />

          {user?.role === 'admin' && (
            <Link to="/admin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition hidden sm:block shrink-0">
              Admin
            </Link>
          )}

          {/* Notificaciones */}
          {user && (
            <div className="relative shrink-0" ref={notifRef}>
              <button onClick={openNotifications} className="relative text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#f97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notificaciones</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Sin notificaciones</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${!n.read ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}
                        >
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <Link to={`/usuario/${n.actor_username}`} className="font-semibold hover:text-[#f97316]" onClick={() => setNotifOpen(false)}>
                              {n.actor_username}
                            </Link>
                            {n.type === 'comment' && ' comentó tu reseña'}
                            {n.type === 'vote' && ' votó tu reseña'}
                            {n.type === 'follow' && ' empezó a seguirte'}
                            {n.review_title && (
                              <Link to={`/resena/${n.review_id}`} className="text-[#f97316] hover:underline" onClick={() => setNotifOpen(false)}>
                                {' '}"{n.review_title}"
                              </Link>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toggle modo oscuro */}
          <button
            onClick={toggle}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition p-1 shrink-0"
            aria-label="Cambiar tema"
          >
            {dark ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              <Link
                to="/nueva-resena"
                className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-4 py-1.5 rounded-full transition shrink-0 hidden sm:block"
              >
                Nueva reseña
              </Link>
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
                >
                  <UserAvatar username={user.username} className="w-7 h-7" />
                  <span className="hidden sm:block">{user.username}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
                    <Link
                      to={`/usuario/${user.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Ver perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition shrink-0">
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-4 py-1.5 rounded-full transition shrink-0"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
