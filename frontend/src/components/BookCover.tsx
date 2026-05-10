import { useState } from 'react'
import { bookCoverUrl } from '../lib/api'

interface Props {
  bookId: number
  title: string
  className?: string
  bust?: number
}

const Placeholder = ({ className }: { className: string }) => (
  <div className={`${className} bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 flex items-center justify-center flex-shrink-0`}>
    <svg className="w-5 h-5 text-[#f97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  </div>
)

export default function BookCover({ bookId, title, className = 'w-12 h-16 rounded-xl', bust }: Props) {
  const [error, setError] = useState(false)

  if (error) return <Placeholder className={className} />

  return (
    <img
      src={bookCoverUrl(bookId, bust)}
      alt={title}
      className={`${className} object-cover flex-shrink-0`}
      onError={() => setError(true)}
    />
  )
}
