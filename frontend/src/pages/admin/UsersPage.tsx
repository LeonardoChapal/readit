import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { User } from '../../types/auth'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<User[]>('/api/v1/admin/users')
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  async function changeRole(userId: number, role: string) {
    const updated = await api.patch<User>(`/api/v1/admin/users/${userId}/role`, { role })
    setUsers(prev => prev.map(u => u.id === userId ? updated : u))
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuarios</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Usuario', 'Email', 'Rol', 'Registro'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(u.created_at).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
