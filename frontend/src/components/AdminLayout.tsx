import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/admin',            label: 'Dashboard',    end: true },
  { to: '/admin/usuarios',   label: 'Usuarios' },
  { to: '/admin/libros',     label: 'Libros' },
  { to: '/admin/resenas',    label: 'Reseñas' },
  { to: '/admin/comentarios',label: 'Comentarios' },
  { to: '/admin/generos',    label: 'Géneros' },
]

export default function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link to="/" className="text-lg font-bold text-[#f97316]">Readit</Link>
          <p className="text-xs text-gray-400 mt-0.5">Panel de admin</p>
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
                  ? 'bg-orange-50 text-[#f97316]'
                  : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate">{user?.username}</p>
          <Link to="/" className="text-xs text-[#f97316] hover:underline mt-0.5 block">
            Volver al sitio
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
