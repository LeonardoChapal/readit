import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import BookCover from './BookCover'
import type { SearchResults } from '../types/review'

export default function SearchBar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ books: [], reviews: [] })
  const [busy, setBusy] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults({ books: [], reviews: [] }); return }
    const timer = setTimeout(async () => {
      setBusy(true)
      try {
        const res = await api.get<SearchResults>(`/api/v1/search?q=${encodeURIComponent(q)}`)
        setResults({ books: res.books.slice(0, 3), reviews: res.reviews.slice(0, 3) })
      } finally {
        setBusy(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function close() {
    setOpen(false)
    setQuery('')
    setResults({ books: [], reviews: [] })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'Enter' && query.trim().length >= 2) {
      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`)
      close()
    }
  }

  const hasResults = results.books.length > 0 || results.reviews.length > 0
  const showDropdown = open && query.trim().length >= 2

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar reseñas, libros, autores..."
            className="w-56 sm:w-72 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition"
          />
          <button onClick={close} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition p-1"
          aria-label="Buscar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {busy && <p className="text-xs text-gray-400 dark:text-gray-500 px-4 py-3">Buscando...</p>}

          {!busy && !hasResults && (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-4 py-3">Sin resultados para "{query.trim()}"</p>
          )}

          {!busy && results.books.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-4 pt-3 pb-1">Libros</p>
              {results.books.map(b => (
                <Link
                  key={b.id}
                  to={`/libro/${b.id}`}
                  onClick={close}
                  className="flex gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 last:border-0 items-center"
                >
                  <BookCover bookId={b.id} title={b.title} className="w-8 h-11 rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{b.author}</p>
                  </div>
                </Link>
              ))}
            </>
          )}

          {!busy && results.reviews.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-4 pt-3 pb-1">Reseñas</p>
              {results.reviews.map(r => (
                <Link
                  key={r.id}
                  to={`/resena/${r.id}`}
                  onClick={close}
                  className="flex gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 last:border-0 items-center"
                >
                  <BookCover bookId={r.book.id} title={r.book.title} className="w-8 h-11 rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {r.book.title} &middot; {r.user.username}
                    </p>
                  </div>
                </Link>
              ))}
            </>
          )}

          {!busy && hasResults && (
            <Link
              to={`/buscar?q=${encodeURIComponent(query.trim())}`}
              onClick={close}
              className="flex items-center justify-center px-4 py-2.5 text-sm text-[#f97316] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition font-semibold border-t border-gray-100 dark:border-gray-700"
            >
              Ver todos los resultados →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
