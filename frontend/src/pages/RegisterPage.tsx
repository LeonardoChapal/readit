import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    try {
      await register(username, email, password)
      navigate('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition"

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 hero-animated flex-col items-center justify-center p-14 text-white relative overflow-hidden">
        <div className="absolute top-16 left-10 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 opacity-10 float">
          <svg width="70" height="94" viewBox="0 0 70 94" fill="white">
            <rect x="4" y="4" width="62" height="86" rx="4" />
            <rect x="12" y="16" width="46" height="5" rx="2" />
            <rect x="12" y="28" width="34" height="3" rx="2" />
          </svg>
        </div>
        <div className="relative text-center">
          <h1 className="text-5xl font-black mb-3 tracking-tight">Readit</h1>
          <p className="text-orange-100 text-lg leading-relaxed max-w-xs">
            Únete a miles de lectores que ya comparten sus reseñas.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link to="/" className="text-2xl font-black text-[#f97316] lg:hidden block mb-6">Readit</Link>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crea tu cuenta</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Es gratis y tarda menos de un minuto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre de usuario</label>
              <input type="text" required minLength={3} maxLength={50} value={username} onChange={e => setUsername(e.target.value)} className={inputClass} placeholder="lector42" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Correo electrónico</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contraseña</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar contraseña</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClass} placeholder="••••••••" />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold py-3 rounded-xl transition shadow hover:shadow-md hover:-translate-y-0.5 transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#f97316] hover:underline font-semibold">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
