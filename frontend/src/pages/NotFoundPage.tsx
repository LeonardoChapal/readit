import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex flex-col items-center justify-center pt-32 px-4 text-center">
        <p className="text-8xl font-black text-gray-100 dark:text-gray-800 select-none">404</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2 mb-2">
          Página no encontrada
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-8 max-w-xs">
          La página que buscas no existe o fue movida.
        </p>
        <div className="flex gap-3">
          <Link
            to="/"
            className="bg-[#f97316] hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Ir al inicio
          </Link>
          <Link
            to="/explorar"
            className="border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#f97316] hover:text-[#f97316] text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Explorar libros
          </Link>
        </div>
      </div>
    </div>
  )
}
