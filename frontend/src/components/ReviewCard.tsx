import { Link } from 'react-router-dom'
import type { Review } from '../types/review'
import BookCover from './BookCover'
import UserAvatar from './UserAvatar'
import StarRating from './StarRating'

interface Props {
  review: Review
}

export default function ReviewCard({ review }: Props) {
  const date = new Date(review.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex gap-4">
        <Link to={`/libro/${review.book.id}`}>
          <BookCover bookId={review.book.id} title={review.book.title} className="w-12 h-16 rounded-xl hover:opacity-80 transition" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link to={`/libro/${review.book.id}`} className="text-xs text-gray-400 dark:text-gray-500 truncate hover:text-[#f97316] transition-colors">
              {review.book.title} &middot; {review.book.author}
            </Link>
            {review.book.genre && (
              <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-[#f97316] px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800 font-medium shrink-0">
                {review.book.genre.name}
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-2">
            <Link to={`/resena/${review.id}`}>
              <h2 className="font-bold text-gray-900 dark:text-white hover:text-[#f97316] transition-colors leading-snug">
                {review.title}
              </h2>
            </Link>
            {review.rating && <StarRating rating={review.rating} size="sm" />}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{review.content}</p>

          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
            <Link to={`/usuario/${review.user.username}`} className="flex items-center gap-1.5 hover:opacity-80 transition">
              <UserAvatar username={review.user.username} className="w-5 h-5" />
              <span className="text-gray-700 dark:text-gray-300 font-semibold hover:text-[#f97316] transition-colors">
                {review.user.username}
              </span>
            </Link>
            <span>&middot;</span>
            <span>{date}</span>
            <span>&middot;</span>
            <span className={`font-bold ${review.score > 0 ? 'text-[#f97316]' : 'text-gray-400 dark:text-gray-500'}`}>
              {review.score > 0 ? '+' : ''}{review.score} pts
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
