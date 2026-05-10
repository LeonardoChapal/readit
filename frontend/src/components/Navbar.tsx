import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import SearchBar from './SearchBar'
import UserAvatar from './UserAvatar'

export default function Navbar() {
  const { user } = useAuth()
  const { dark, toggle } = useTheme()

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
              <Link
                to={`/usuario/${user.username}`}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition shrink-0"
              >
                <UserAvatar username={user.username} className="w-7 h-7" />
                <span className="hidden sm:block">{user.username}</span>
              </Link>
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
