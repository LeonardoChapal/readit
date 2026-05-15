import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

const NAV = [
  { to: '/admin',             label: 'Dashboard',   end: true },
  { to: '/admin/usuarios',    label: 'Usuarios' },
  { to: '/admin/libros',      label: 'Libros' },
  { to: '/admin/resenas',     label: 'Reseñas' },
  { to: '/admin/comentarios', label: 'Comentarios' },
  { to: '/admin/generos',     label: 'Géneros' },
  { to: '/admin/etiquetas',   label: 'Etiquetas' },
]

export default function AdminLayout() {
  const { user } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-700">
          <Link to="/" className="text-lg font-bold text-[#f97316]">Readit</Link>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Panel de admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition
                ${isActive
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-[#f97316]'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <button
            onClick={toggle}
            className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition w-full"
          >
            {dark ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                Modo claro
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Modo oscuro
              </>
            )}
          </button>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.username}</p>
            <Link to="/" className="text-xs text-[#f97316] hover:underline mt-0.5 block">
              Volver al sitio
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
